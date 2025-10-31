# 前端架构规划

本文件描述 Chest Idle 前端项目的技术架构、目录结构与关键设计决策，目标是支撑完全离线运行，同时为未来与后端的轻量同步接口做准备。

## 1. 技术栈

- **框架**：Vue 3（Composition API）。
- **语言**：TypeScript。
- **状态管理**：Pinia（核心类和组合式 API 用于可序列化状态）。
- **路由**：Vue Router。
- **国际化**：Vue I18n。
- **构建**：Vite。
- **样式**：Sass（模块化变量 + 组件级 scoped 样式）。
- **随机数**：内置 `Math.random()`（仅在纯客户端阶段使用，未来由服务端随机替换）。

## 2. 分层结构

```
src/
 ├── app/               # 通用应用层（App.vue、main.ts）
 ├── router/            # 路由配置
 ├── stores/            # Pinia store（全局状态、模块化子 store）
 ├── composables/       # 组合式逻辑（UI 控制、跨组件逻辑）
 ├── models/            # 纯逻辑类（行动、技能、物品、战斗等）
 ├── services/          # 数据加载、持久化、future API 适配器
 ├── assets/            # 静态资源
 ├── data/              # 生成的静态 JSON（构建时复制到 public/）
 ├── components/        # 可复用视图组件
 ├── pages/             # 路由页面
 ├── styles/            # 全局样式与变量
 └── utils/             # 工具函数（日期、数值、格式化等）
```

## 3. 核心模块

### 3.1 数据层

- **静态资产**：构建时从 `public/data` 或后续数据管线生成，客户端启动时一次性加载。
- **解析流程**：`DataLoaderService` 使用 Axios / Fetch 获取 JSON，交由 `DataAssembler` 构造类型安全的模型实例。
- **持久化**：`PersistenceService` 负责序列化 Pinia store 到 IndexedDB 或 LocalStorage，包含版本化迁移。

### 3.2 领域模型

领域模型以纯 TypeScript 类表达，独立于 Vue，以便未来迁移到服务端重用。

- `Skill`、`ActionTarget`、`Action`、`Queue`、`Chest`、`Inventory`、`Equipment`、`BattleSimulation` 等。
- 所有模型严格无副作用，必要的计算暴露为方法/计算属性，关键状态通过 Pinia store 保持响应式。

### 3.3 状态管理

```
stores/
 ├── game.ts           # 顶层 orchestrator，管理加载状态、时间轴校准
 ├── profile.ts        # 玩家档案（昵称、设置等）
 ├── skills.ts         # 技能 XP / 等级 / 加成计算
 ├── queue.ts          # 行动队列、当前行动、离线结算
 ├── inventory.ts      # 仓库、装备槽、消耗品槽位
 ├── battle.ts         # 战斗敌人、仿真缓存、战斗记录
 └── notifications.ts  # 提示系统
```

- Store 内部仅存储原始数据结构，复杂逻辑由 `models/` 中的函数处理，保持可测试性。
- 所有 store 实现 `toJSON()` / `fromJSON()`，用于持久化与服务端同步。

### 3.4 时间与结算

- 统一使用 `GameClock`（封装 `performance.now` + 可注入伪时间）驱动帧循环。
- 队列系统通过 `tick(deltaMs)` 接口推进，支持：实时运行、后台休眠后追帧、离线补算。
- 离线结算：应用在启动时读取上次同步的服务器时间戳（若有），计算离线时长并批量调用行动结算。

### 3.5 网络适配

- 当前阶段提供 `ApiPort` 空实现，记录需要调用的接口类型与载荷。
- 未来后端可实现同名接口并注入到应用中。
- 关键操作（开始行动、停止、开箱、战斗确认）通过集中 service 调用，便于切换为实际 HTTP 请求。

## 4. 构建与部署

- 使用 Vite 多语言配置 `import.meta.env` 支持。
- 生成静态站点部署到任意 CDN / 静态托管即可运行。
- 后续增加 PWA 支持（Service Worker + 离线缓存资源）。

## 5. 测试策略

- **单元测试**：对模型和 store 编写纯逻辑测试，优先覆盖队列、战斗模拟、离线结算。
- **组件测试**：使用 Vitest + Vue Test Utils，验证关键组件（行动队列、战斗面板）。
- **端到端**：计划使用 Playwright 模拟核心流程（添加行动、离线结算、开箱）。

## 6. 文档与生成

- `docs/` 目录与代码同库维护，新增功能需同步更新文档。
- 可在 CI/CD 中加入自动文档校验（例如 lint、链接检查）。

---

该架构规划在实现时可根据实际复杂度进行微调，所有调整需要同时更新文档与架构图。