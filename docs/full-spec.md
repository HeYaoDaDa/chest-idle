# 产品与系统需求文档

目录
- 概要
- 术语与核心概念
- 核心玩法与玩家循环
- 行动系统（ActionTarget / Action / ActionQueue）
  - 队列约束与行为
  - 行动结算与启动检查
  - 中断、重排与插首规则
  - 批量与无限行为
- 宝箱能量（Chest Energy）系统
- 资源体系与生产链（矿/木/采摘 / 冶炼 / 木工 / 工具）
- 生产技能与药水（Potion）系统
- 炼金（Alchemy）与强化（Enhancement）
- 战斗（Combat）系统（确定性仿真）
  - 属性、公式与技能
  - 食物与药水（战斗专用）
  - 仿真流程、结果与页面实时显示
- 装备与工具
- UI / 交互提示与新手引导
- 数据/事件埋点与指标
- 存档 / 离线逻辑与一致性
- 安全 / 服务端权威策略（开箱与战斗）
- 兼容性、扩展点与后续迭代建议
- 附录：需决策与待补充项

---

## 概要
目标制作一款单人 Web 为主的“行动队列 + 确定性仿真”游戏。核心设计原则：
- 行动（采集/制作/战斗）在执行时不包含任何随机性；随机性集中在玩家手动“开箱”时发生（便于服务端权威与减轻持续运算负担）。  
- 支持长时间离线，离线结算使用简单乘除模运算（确定性）。  
- 玩家通过行动队列安排工作，能管理批量与无限任务。  
- 生产技能、药水与装备等养成内容形成长期目标与策略空间。  
- 战斗使用确定性事件驱动仿真：在玩家真正开始战斗前先模拟一次，若仿真失败则禁止开始；若成功则展示耗时与消耗，开始战斗会消耗这些资源。玩家在打开页面时可以实时看到战斗进度（可视回放/状态），因为仿真是确定性的。

---

## 术语与核心概念
- ActionTarget（行动目标）：动作模板，定义“一个行动”的耗时、行动所需材料、行动产出、每行动的 chestEnergy 映射与所需技能等级等。示例：挖矿-铜矿、锻造-铜锭。  
- Action（行动）：队列中的一条记录，指向某个 ActionTarget，并包含数量 amount（1..∞，∞ 表示无限重复）。Action 在队列中按顺序执行。  
- ActionQueue（行动队列）：有序集合，队列第 1 项为 running（正在执行）；总项数（包含正在执行项）上限暂定为 10。  
- ChestEnergy、Chest（宝箱/箱子）：ActionTarget 每行动可产生固定 chestEnergy，对应 Chest；当玩家某 chestEnergy 达到 capacity 时自动生成箱子（放入玩家仓库）。开箱时才产生随机掉落（服务器为权威）。  
- Potion（药水）：三类生产药水（速度、经验、宝箱能量）或战斗药水（攻击速度、战斗经验、宝箱能量），可插槽装备于技能药水槽/战斗药水槽并按时间消耗生效。  
- Skill（技能）：生产技能与战斗技能两类。生产技能用于提高采集/制作效率与解锁配方；战斗技能带 MP 消耗、施放时间与冷却。  
- Enhancement Essence（强化精华）：强化材料，用于确定性提升装备的强化等级。  
- Food（食物）：战斗消耗品，用于即时或分段恢复 HP/MP。可配置触发条件。

---

## 核心玩法与玩家循环
玩家日常循环：
1. 打开游戏 → 系统展示资源、队列、当前运行 Action 的进度、药水槽/食物槽状态、箱子库存、任务/解锁进度等。  
2. 规划与排队：玩家添加 Action（采集/制作/战斗模拟），选择 amount（或无限），可用“插首并开始”或“添加到队列”。  
3. 执行/挂机：系统逐行动执行 Action，行动完成时即时结算（材料消耗、产出、chestEnergy 增加）；玩家可随时重排/取消 queued 条目。  
4. 回归：玩家查看产出、升级技能、制作工具/装备、打开箱子、强化装备或再安排队列。  
5. 长期目标：解锁更高阶资源、合成高阶工具、达到技能里程碑、收集套装与达成成就。

节奏设计：
- 行动时长分层：短（5–15s）、中（30–120s）、长（5–30min）以兼顾短时回合体验与离线长运行目标。  
- 离线结算上限（可配置，后期可用订阅扩展）：当前以 demo 为先可宽松，产品化时建议设定 24–72h 上限。

---

## 行动系统（ActionTarget / Action / ActionQueue）

### 队列约束
- 队列总项数（running + queued） ≤ 10。  
- 只能同时有 1 个 running。  
- amount 支持 1..∞（∞ 表示持续重复，直至取消或资源耗尽）。  
- 入队不预占材料（材料在行动开始/完成时才结算/消耗）。

### 行动结算与启动检查（已扩展）
- 每个 Action 的每个行动完成时：扣除该行动所需材料并发放行动产出，并按 energyYields 增加对应 ChestEnergy（若有）。  
- 在尝试开始每个行动之前做启动检查：计算当前可用材料能支持的最大行动数 maxPossible（按每种材料能支持的行动数取最小值）。  
  - 若 maxPossible >= current remaining amount：继续执行。  
  - 若 0 < maxPossible < amount：自动把该 Action 的 amount 缩减为 maxPossible（并向玩家提示“数量由 X -> Y：材料不足”），随后执行。  
  - 若 maxPossible = 0：该 Action 在尝试开始时直接结束（start-fail），不消耗、不产出，队列推进。  
- 运行中资源耗尽：若在行动运行中所需材料被其他操作消耗不足，该行动终止且 Action 结束（runtime-fail）。当前行动不结算，前序已完成行动保持结算。

### 中断、重排、插首规则
- 当玩家将 queued 项移动到队首或通过插首操作添加项到队首时，原 running 被中断并变为 queued（移入玩家指定位置或队列尾），其当前行动进度被丢弃（该行动不结算）。已完成的前序行动保持结算。  
- 插首（Start Now）：将目标 Action 插入队首并开始。如果队列已满，弹出确认提示“将删除队尾项以腾位”，玩家确认则删除队尾并插首，取消则不执行。  
- 添加到队列（Add to Queue）：把 Action 放在队尾；若队列已满则拒绝并提示。  
- 玩家可任意删除 queued 项；删除 running 项视作中断并按中断规则处理。

### 批量 / 无限行为
- amount > 1：按行动逐个执行并在每行动完成时结算（消耗/产出/energy）。  
- amount = ∞：占用 1 个队列槽，持续重复执行行动直至取消或资源耗尽；在启动检查阶段会按当前材料临时调整可完成行动数，若无法支持任何行动则 start-fail。

---

## 宝箱能量（Chest Energy）系统

目标：将随机性从频繁的行动产出中抽离出来，统一到玩家主动“开箱”时产生随机掉落，从而显著降低持续/离线仿真的复杂度与服务器负载。

设计要点：
- Chest 定义：id、name、capacity（生成 1 箱所需能量）、lootTable（开箱掉落表，服务器权威）、guaranteed（每次必得项，可选）、preview（概率摘要用于 UI）。  
- ActionTarget.energyYields：ActionTarget 可配置为向一个或多个 Chest 增加固定 energyPerUnit。  
- 行动完成时：对每个映射的 Chest，player.chestEnergy[type] += energyPerUnit；若 chestEnergy >= capacity，则生成 createCount = floor(chestEnergy / capacity)，player.chests[type] += createCount，chestEnergy %= capacity（保留余数）。箱子库存无限制。  
- 开箱：玩家手动打开箱子时触发 lootTable 的随机抽样（线上应由服务器执行以防作弊；demo 可客户端模拟）。开箱产生随机掉落并发放物品/资源。  
- 离线结算：单位数计算后，能量累加与箱子生成通过乘/除/模完成（确定性）。

---

## 资源体系与生产链

### 资源阶层（示例）
- 矿（从低到高）：铜 → 铁 → 银 → 金 → 山铜 → 黑铁 → 秘银 → 精金。  
- 木（从低到高）：柳树 → 松树 → 橡树 → 枫树 → 榆树 → 山毛榉 → 红檀 → 黑檀。  
- 采摘（Foraging）：区域（Region）→ 单品（Item）两层结构。区域含多单品，可单采或采整区（整区采产量总体更高，按权重/均分分配）。采摘产物用于缝纫/烹饪/酿造。  

### 加工商序
- 采集（Mining/Logging/Foraging）产出原材料（ore / raw_wood / herbs 等）。  
- 冶炼/锻造（Forging/Smelting）：把 ores 熔成 ingots（例如 3 ore → 1 ingot 为示例）。  
- 木工（Carpentry）：把 raw_wood 做为木板（例如 2 raw_wood → 1 plank）。  
- 工具制造（Tools）：以 ingot + plank + 其它为材料制造工具（镐、斧、镰刀等），提升采集/制作速度与产量。  
- 工具强化（Enhancement）：使用强化精华或配方升级工具属性（见强化章节）。

注意：所有转换都以 ActionTarget 形式出现，遵循队列/行动结算规则与 chestEnergy 映射策略。

---

## 生产技能与药水系统（采集 + 制作）

总体：
- 生产技能（Production Skills）包括 Mining、Logging、Foraging、Forging、Carpentry、Sewing、Cooking、Brewing、Alchemy、Enhancement 等。技能通过执行对应 Action 获得 XP 并升级。  
- 技能效果：每个生产技能影响以下三类（均可叠加）：速度（缩短耗时）、经验加成（提升获得 XP）、宝箱能量加成（提高 energyPerUnit）。  
- 技能超过 ActionTarget 要求等级：每超 1 级增加 speed +1%（即 skillSpeed = (skillLevel - requiredLevel) * 0.01，若低于需求则不可执行该 ActionTarget）。

药水槽机制（生产）：
- 每个生产技能有药水槽（slots），默认 1 槽；口袋装备（pocket）可增加槽数，最高 3。  
- 药水种类：速度药水（speed）、经验药水（xp）、宝箱能量药水（chestEnergy）。每瓶药水默认持续 60s（可配置）。  
- 插槽行为与消耗：
  - 将药水放入槽为“配置/预置”，并不立即从仓库扣除。  
  - 在每个行动开始时，系统判断该槽能否在整个行动期间生效：若槽当前 remainingTime ≥ unitDurationActual，则药水生效并在行动完成后减少 remainingTime；若不足且仓库中有瓶数，系统自动消耗整瓶（或多瓶）补足槽 remainingTime 以满足行动（消耗数量 n = ceil((unitDuration - remainingTime)/potionDuration)）；若仓库不足则该槽不生效并提示“药水耗尽”。  
  - 药水生效后会参与 totalSpeed / totalXPBonus / totalChestBonus 的计算（speed 会影响 unitDurationActual，计算时需先确定哪些药水将被激活，见求解顺序说明）。  
  - 中断逻辑：若行动已生效的药水在行动进行一部分时间后被中断，则槽减少实际已生效的时间（elapsed seconds）。  
- UI 必须显示槽 remainingTime、将被消耗的瓶数（当补足时）、以及“药水未应用/耗尽”提示情况。

速度公式（生产）：
- 单位实际耗时 = baseUnitDuration / (1 + totalSpeed)
- totalSpeed = skillSpeed + sum(potionSpeed) + equipmentSpeed + 其它来源（百分比相加）

---

## 炼金（Alchemy）与强化（Enhancement）

### 炼金（Alchemy）
- 功能：把指定物品按商店价格 × alchemyMultiplier（当前设为 ×3）换为金币（gold）。  
- 作为 ActionTarget 出现：每行动以固定耗时消耗 item 并直接将 gold 增加到玩家余额（无随机）。  
- 启动检查/运行中失败规则同队列系统。  
- UI：Action 卡显示 per-unit gold gain、总预计 gold。

### 强化（Enhancement）
- 目标：通过消耗强化精华等材料提升装备的强化等级（enhanceLevel），从而提升装备属性（按强化公式或百分比）。  
- 强化流程分两步：
  1. 通过 ActionTarget（例如炼制/制作动作）把若干材料加工为 Enhancement Essence（强化精华）。  
  2. 玩家在背包中选择装备并使用对应精华（和可能的额外材料/金币）提升装备强化等级。  
- 强化建议为“确定性”（始终成功，消耗材料与金币，避免玩家挫败），若未来改为概率性必须设计保底与清晰反馈。  
- 强化成本随等级上升（例如 cost = base * growth^currentLevel）。

---

## 战斗系统（确定性仿真）

总体目标：
- 战斗为确定性事件驱动仿真：开始战斗前先模拟一次（快速），确定胜负、所需时间、将消耗的食物/药水与 MP/HP。若仿真失败，则玩家不能开始该战斗。若仿真成功，玩家可选择开始战斗，真正开始会消耗仿真中估算的食物/药水与资源。玩家离线或页面关闭时战斗仍可视化进度（因为仿真是确定性的），玩家回到页面可看到当前进度与预测结算时间。

### 关键属性与公式（按已确认）
- MaxHP = 10 * (10 + 耐力)  
- MaxMP = 10 * (10 + 智力)  
- AttackInterval = BaseAtkInterval / (1 + (Attack / 2000)) / (1 + AtkSpeedBonus)  
- CastTime = BaseCastTime / (1 + (Attack / 2000) + CastSpeed)  
- AbilityCooldownActual = BaseCooldown * 100 / (100 + SkillHaste)  
- Damage = (10 + [近战|远程|魔法|防御相关]) * (1 + DamageBonus)  
- 护甲 = 0.2 * 防御 + 额外加成  
- 受到物理伤害百分比 = 100 / (100 + 护甲) （护甲为负时使用 (100 - 护甲) / 100）  
- 抗性与元素伤害类似计算（Resistance = 0.2 * 防御 + bonus）

其他特殊效果已按你提供的公式收录（荆棘、反伤、重盾钝击、穿透等）。武器类型（斩/刺/钝）与元素系（火/水/自然）之间的相对定位（如攻速/破甲/群攻/治疗特性）作为数值与武器属性表中的字段体现。

### 技能触发顺序与目标机制（你已确认）
- 玩家与敌人各自拥有按位排序的技能槽（最多 3 个用于玩家技能触发顺序）；仿真按槽位顺序触发技能。  
- 目标选择：优先攻击对面第一个（队列首位）目标。  
- 技能若处于可用（冷却完、MP 足够）则会按顺序执行；没有可用技能则进行普通自动攻击（按攻击间隔）。

### 食物与药水（战斗）
- 食物槽（最多 3 个）：可以配置触发条件（默认触发条件为“HP 将损失的量 >= 食物恢复量 时触发”）。  
  - 食物类型：instant（立即恢复一定 HP/MP）或 over-time（持续恢复，总量更高）。  
- 药水槽（最多 3 个）：战斗药水按时间消耗并提供 buff（如攻速、战斗经验加成、chestEnergy 增加等），激活/消耗规则与生产药水类似（仿真前计算是否会被消耗并在仿真中生效）。  
- 仿真会估算并返回需要消耗的食物与药水数量，玩家同意后开始战斗时真正消耗。

### 仿真流程概述
- 使用事件驱动方式（跳到下一事件时间，如下一个技能完成、下一次普通攻击、DOT/HOT tick 等）快速计算战斗直到敌人或玩家死亡或时间超过 1800 秒（30 分钟）。  
- 在仿真中记录技能使用日志、伤害汇总、消耗食物/药水。  
- 仿真无随机，结果可被重复验证；玩家在打开页面时可实时查看仿真确定的战斗进度（可直接根据仿真结果渲染进度条/事件时间线）。

---

## 装备与工具
- 装备槽（初期简化为 4 槽）：Weapon / Armor / Tool / Accessory（可扩展到 Head/Body/Legs/TwoAccessories）。  
- 装备字段包含：稀有度（Common/Uncommon/Rare/Epic/Legendary）、等级、基础属性（attack/defense/gatherSpeed/gatherYield/xpBonus 等）、词缀（prefix/suffix）与强化等级（enhanceLevel）。  
- 工具（Pickaxe/Axe/Sickle 等）影响对应采集 Action 的 unitDuration 与 yield（通过 multiplier）、并可给 XP 加成。工具通过制作获得，可强化/升级。

---

## UI / 交互提示与新手引导
- 必须在界面上明确提示核心行为与风险：
  - 入队不保留材料（开始行动时才检测材料并在完成时消耗）。  
  - 移动插首会中断当前行动并丢弃已进行进度（已完成行动保留）。  
  - 药水槽在启动行动时会自动尝试补足并消耗整瓶药水以保证药水生效；若无法补足则显示“药水耗尽/未应用”。  
  - 插首会在队列已满时弹出“将删除队尾项以腾位”确认。  
  - 当自动缩减 amount（材料不足）时显示“数量由 X 自动缩减为 Y：材料不足”。  
- 队列面板：展示 running 的进度条、queued 列表、每项的行动耗时/产出/每行动 chestEnergy 与可选量化说明（预计完成时间）。  
- 药水/食物槽视图：展示槽剩余时间、即将被消耗的瓶数等。  
- 战斗界面：战斗仿真摘要（胜负、预估时长、食物/药水消耗），若玩家进入真实战斗则显示进度（仿真时间线可用于可视化）。新手引导在前 5 分钟内使玩家理解队列、一次完整行动以及开箱机制。

---

## 数据 / 事件埋点与指标（用于分析与调参）
建议埋点事件（示例）：
- action.enqueue / action.start / action.unitComplete / action.complete / action.fail / action.cancel  
- queue.reorder / queue.insertFront / queue.deleteItem  
- chest.created / chest.opened  
- potion.equip / potion.consumed / potion.applied / potion.depleted  
- alchemy.start / alchemy.complete  
- enhancement.craft / enhancement.apply  
- battle.simulate / battle.start / battle.end（包含 success、duration、foodConsumed、potionsConsumed）  
- skill.levelup / recipe.unlock / equipment.craft

关键 KPI：
- D1/D7/D30 留存率、平均每次会话时长、平均队列长度、队列项成功完成率、开箱率、战斗成功率、技能进度分布、付费/订阅转化（若引入）。

---

## 存档、离线与一致性
- 存档：玩家状态（resource counts、inventory、chestEnergy、chests、actionQueue、skill levels、equipment、potion slot timers 等）应保存在 localStorage 并支持导出/导入。后续上线需迁移到服务器持久化。  
- 离线结算：依据当前 actionQueue 与每个 Action 的 unitDuration，计算 unitsCompleted = floor(elapsedSeconds / unitDurationActual)（受 amount 与启动检查影响），累加 chestEnergy、产出、XP 等，并更新剩余时间/进度。离线上限建议产品化调整（24–72h）。  
- 多客户端/多设备场景：当前 demo 为单机优先，入服后需要服务器端权威校验（尤其是开箱、战斗胜利与付费相关操作）。