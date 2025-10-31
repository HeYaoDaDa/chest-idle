# 状态与数据模型

本文档列出前端需要维护的数据结构、序列化格式以及与静态资产的关系，确保离线可重建且未来易于与后端同步。

## 1. 静态数据资产

所有静态数据以 JSON 存放，启动时加载。

| 文件夹 | 内容 | 说明 |
|---|---|---|
| `data/skills.json` | 技能定义 | `id`, `type`, `sort`, `category`（生产/战斗）。 |
| `data/states.json` | 状态定义 | 对应各种速度/增益状态。 |
| `data/slots.json` | 装备槽位 | 包含 `id`, `sort`, `category`。 |
| `data/items/*.json` | 物品定义 | 资源、装备、宝箱、消耗品、袋子。 |
| `data/actionTargets/**/*.json` | 行动定义 | 采集 / 配方 / 战斗 / 其他行动。 |
| `data/enemies/*.json` | 敌人定义 | 战斗属性、技能列表、掉落。 |
| `data/buffs/*.json` | 咖啡 / 茶 / 其他增益 | 持续时间、效果类型。 |

> **生成建议**：使用脚本验证数据完整性、排序、引用合法性，可在 `scripts/` 下维护。

## 2. 运行时状态结构

### 2.1 玩家档案 `PlayerProfile`

```ts
interface PlayerProfile {
  id: string
  nickname: string
  createdAt: string
  lastSyncAt: string | null
  preferences: {
    locale: string
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
  }
}
```

### 2.2 技能状态 `SkillState`

```ts
interface SkillState {
  skillId: string
  xp: number
  level: number
  unlockedTabs: string[]
  mastery: Record<string, number> // 对特定行动的熟练度扩展点
}
```

- 等级计算基于 XP 表；`level` 可缓存以减少重复计算。
- `unlockedTabs` 用于解锁战斗/配方标签。

### 2.3 行动队列 `ActionQueueState`

```ts
interface ActionInstance {
  id: string
  targetId: string
  amountPlanned: number // Infinity 使用 -1 约定
  amountCompleted: number
  progressMs: number // 当前行动已累计时间
  createdAt: number
  lastUpdatedAt: number
}

interface ActionQueueState {
  current: ActionInstance | null
  queued: ActionInstance[]
  capacity: number // 默认 10，可通过升级扩展
  lastTickAt: number // 用于离线结算
}
```

### 2.4 仓库与装备 `InventoryState`

```ts
interface InventoryStack {
  itemId: string
  amount: number
}

interface EquipmentSlotState {
  slotId: string
  equippedItemId: string | null
  enhanceLevel: number
  socketedItemIds: string[]
}

interface BagSlotState {
  type: 'coffee' | 'tea' | 'food'
  enabled: boolean
  itemId: string | null
  remainingDurationMs: number
}

interface InventoryState {
  items: Record<string, InventoryStack>
  equipment: Record<string, EquipmentSlotState>
  bagSlots: BagSlotState[]
}
```

### 2.5 宝箱与随机 `ChestState`

```ts
interface ChestState {
  chestId: string
  energy: number
  owned: number
}

interface ChestRecordState {
  byId: Record<string, ChestState>
}
```

- `energy` 累计到 `capacity` 时自动生成宝箱并扣除相应能量。
- 开箱记录需单独存储（用于客户端展示历史或后端校验）。

### 2.6 战斗 `BattleState`

```ts
interface BattlePlan {
  enemyGroupId: string
  simulationHash: string
  predictedDurationMs: number
  resourceUsage: {
    coffee: Record<string, number>
    tea: Record<string, number>
    food: Record<string, number>
  }
  startAt: number | null
}

interface BattleState {
  active: BattlePlan | null
  history: BattlePlan[]
}
```

- `simulationHash` 用于未来与服务端比对仿真结果。
- 正在进行的战斗会根据 `startAt` + `predictedDurationMs` 渲染进度。

## 3. 序列化与持久化

- 使用 `toJSON()`/`fromJSON()` 将上述结构序列化为瘦数据。
- 对版本升级采用 `schemaVersion` + 迁移函数。
- 持久化层默认使用 IndexedDB，降级到 LocalStorage。
- 存档包含：`profile`, `skills`, `queue`, `inventory`, `chests`, `battle` 等。

## 4. 离线结算算法接口

```ts
interface QueueService {
  tick(deltaMs: number): void
  fastForward(elapsedMs: number): OfflineReport
}

interface OfflineReport {
  actionsCompleted: Array<{
    targetId: string
    count: number
    rewards: Array<{ itemId: string; amount: number }>
    xpGain: number
    chestEnergy: Array<{ chestId: string; energy: number; chestsCreated: number }>
  }>
  durationProcessed: number
}
```

- `fastForward` 在离线结算时调用，内部按确定性算法拆分行动次数。
- 离线结果用于刷新仓库、技能、宝箱状态并生成通知。

## 5. 未来后端同步字段

- `lastServerSyncAt`: 最近一次服务器确认时间。
- `serverActionLog`: 用于对账的行动日志（开始/停止时间、执行数量）。
- `randomSeedHistory`: 记录开箱、战斗的随机种子与结果。

## 6. 数据校验

- 对静态数据执行引用完整性检查（行动引用的物品与技能必须存在）。
- 对运行状态在持久化前执行
  - 数值范围（XP ≥0、amount ≥0）。
  - 存量正确性（装备在槽位中则仓库数减少）。
  - 槽位互斥条件（同类咖啡只能配置一个）。

---

保持上述数据结构的一致性是实现离线/在线双模式的基础，所有代码变更需确保相应 store 与序列化层同步调整。