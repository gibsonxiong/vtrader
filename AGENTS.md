# VTrader - AI Agent 开发指南

## 项目概述

VTrader 是一个**加密货币量化交易平台**，基于 Vue Vben Admin (v5.5.7) monorepo 构建。
主要功能：实时市场数据、K 线图、策略回测、机器人交易、投资组合管理。

- **包管理器**: pnpm 10.x (workspace monorepo + Turborepo 2)
- **Node**: >= 20.10.0
- **许可证**: MIT

## Monorepo 结构

```
vtrader/
  frontend/          # Vue 3 + Vite SPA (端口 8000)
  backend/           # NestJS API 服务 (端口 3000)，承载全部 API（含 mock 端点）
  shared/            # 共享类型、接口、Prisma schema
  packages/          # 25+ 前端业务包 (@core, effects, 工具等)
  internal/          # 构建/开发内部包 (lint-configs, vite-config, tsconfig, tailwind-config)
  scripts/           # 仓库工具脚本 (deploy, redis, vsh)
  docs/              # 项目文档
```

## 技术栈

### 前端 (frontend/)
- **Vue 3** (Composition API, `<script setup>`), **Vite 6**, **TypeScript**
- **Pinia 3** + **@tanstack/vue-query** (状态管理)
- **Ant Design Vue 4** (主 UI), Naive UI, Element Plus
- **ECharts 5**, **KlineCharts** (K线图)
- **TailwindCSS 3**, **Less**
- **Socket.IO Client** (实时数据)
- **VeeValidate + Zod** (表单), **VxeTable** (高性能表格)
- **Vue I18n** (中/英双语)
- **Vitest** + **Playwright** (测试)

### 后端 (backend/)
- **NestJS 11**, **TypeScript**
- **Prisma** (MySQL), **BullMQ** (Redis 任务队列)
- **Socket.IO** (WebSocket 实时推送), **JWT** (jsonwebtoken)
- **Swagger** (`/api` 文档), **cookie-parser**
- **technicalindicators**, **apache-arrow**, **parquet-wasm** (数据处理)
- **Jest** + **Supertest** (测试)

后端模块组织：
- `auth/` — 登录/登出/刷新/JWT 认证 Guard（数据写死在 mock-data.ts）
- `user/` — 用户信息接口
- `menu/` — 菜单/权限树接口
- `market-data/` — 合约、K线、数据下载
- `backtesting/` — 回测任务（BullMQ 队列）
- `strategy/` — 策略定义与注册
- `broker-manager/` — 券商/交易所适配层
- `ws/` — WebSocket 实时推送

### 共享层 (shared/)
- 前后端共享类型定义 (`shared/src/modules/`)
- Prisma schema 和生成的 client (`shared/src/prisma/`, `shared/src/generated/`)

## 快速命令

```bash
pnpm install          # 安装所有依赖
pnpm dev:frontend     # 启动前端 (端口 8000)
pnpm dev:backend      # 启动后端 (端口 3000, 需要 Redis)
pnpm dev              # 交互式选择启动
pnpm build            # 构建所有包
pnpm test:unit        # 单元测试
pnpm test:e2e         # E2E 测试
pnpm lint             # ESLint + Stylelint
pnpm format           # 代码格式化 (Prettier)
pnpm check:type       # TypeScript 类型检查
```

## 关键架构约定

### 1. API 路由
- **统一入口**: Vite 将 `/api/*` 代理到 `http://localhost:3000`（NestJS 后端），所有请求（含认证和交易）均走同一后端
- `requestClient` 和 `tradeRequestClient` 均使用 `apiURL`（即 `/api`），通过 Vite 代理到后端
- NestJS 端新增了 `auth`、`user`、`menu` 模块，提供登录认证和权限数据（数据写死在 `backend/src/mock-data.ts`）

### 2. 回测系统
- 回测通过 BullMQ 异步队列执行, **需要 Redis 运行**
- 流程: Controller → Service (create job) → BullMQ Queue → Processor → BacktestingEngine
- 结果持久化到 MySQL (Prisma `Backtesting` 模型)
- 启动 Redis: `docker compose -f scripts/redis/compose.yaml up -d`

### 3. WebSocket 实时数据
- 后端: `backend/src/ws/ws.gateway.ts` (Socket.IO `/ws` 命名空间)
- 客户端订阅 K 线: `subscribeKline` / `unsubscribeKline` 事件
- Broker 每 5 秒广播 tick 数据

### 4. 券商/交易所抽象
- `backend/src/broker-manager/` — Broker 接口抽象层
- 已实现: Binance 永续合约、Binance 测试网、Mock 模拟
- 新增交易所需实现 `Broker` 接口并在 `BrokerManagerService` 注册

### 5. 策略系统
- `backend/src/strategy/` — 策略基类和注册中心
- 已实现: 网格策略 (`grid-strategy.ts`), RSI 策略, 自定义策略模板
- 新增策略: 继承 `Strategy` 基类, 放在 `strategies/` 目录下

### 6. 前端 Monorepo 包组织
- `@core/*` — 基础设施 (无业务逻辑): base, composables, preferences, ui-kit
- `effects/*` — 业务能力层: access, common-ui, hooks, layouts, plugins, request, stores
- `packages/*` — 独立功能包: constants, icons, locales, styles, types, utils

## 代码规范

- **提交**: Conventional Commits (通过 czg/commitizen)
- **格式化**: Prettier (配置在 `internal/lint-configs/prettier-config/`)
- **Lint**: ESLint 9 flat config (配置在 `internal/lint-configs/eslint-config/`)
- **样式**: Stylelint (配置在 `internal/lint-configs/stylelint-config/`)
- **文件命名**: Vue 组件用 PascalCase, 工具用 kebab-case, TypeScript 用 camelCase

## 重要配置文件

| 文件 | 说明 |
|------|------|
| `pnpm-workspace.yaml` | workspace 包定义 |
| `turbo.json` | Turborepo 构建管线 |
| `frontend/vite.config.mts` | 前端构建配置 |
| `backend/tsconfig.json` | 后端 TS 配置 |
| `shared/src/prisma/schema.prisma` | 数据库模型 |
| `docs/project-analysis.md` | 详细项目分析 |
| `docs/hardness-engineering-plan.md` | 系统加固方案 |

## 开发注意事项

- 不要在前端 `packages/@core/` 中引入业务逻辑
- 前端新增页面在 `frontend/src/views/` 下按功能模块组织
- 后端新增功能模块遵循 NestJS 模块模式 (module/controller/service)
- 共享类型定义放在 `shared/src/modules/`, 前后端通过 `@vtrader/shared` 引用
- 后端 `config.ts` 中硬编码了 API 密钥, 生产环境需要迁移到环境变量
- Git 钩子 (lefthook.yml) 当前被注释掉, 手动运行 lint/format
