# 项目分析

## 1. 项目概览

`vtrader` 是一个基于 `pnpm workspace + turbo` 的 monorepo，面向交易、行情、策略与回测场景。

当前仓库主要由以下部分组成：

- `frontend`：Vue 3 + Vite 前端应用
- `backend`：NestJS 后端服务
- `backend-mock`：Nitro Mock 服务
- `packages`：共享业务能力、UI、请求层、状态管理、样式与多类基础设施包
- `internal`：内部构建、lint、tailwind、vite 配置包
- `scripts`：脚手架和仓库级工具

## 2. 技术栈

### 前端

- Vue 3
- Vite
- Pinia
- Vue Router
- Ant Design Vue
- `@tanstack/vue-query`
- `socket.io-client`
- `klinecharts`

### 后端

- NestJS
- BullMQ
- Socket.IO
- Prisma
- Swagger

### 工程化

- pnpm workspace
- turbo
- ESLint / Prettier
- Vitest
- Playwright

## 3. 当前运行拓扑

开发环境下的入口如下：

- 前端：`http://localhost:8000/`
- 后端 Swagger：`http://localhost:3000/api`
- 前端内置 Mock API：`http://localhost:5320/api`

当前前端开发代理的默认行为是：

- 浏览器请求 `/api`
- Vite 将 `/api` 代理到 `http://localhost:5320/api`
- 因此前端默认优先命中 Mock，而不是 Nest 后端

这意味着本项目在开发时存在两套后端来源：

- Mock API：用于页面联调和通用认证/菜单能力
- Nest API：用于交易、行情、回测、WebSocket 等真实业务逻辑

## 4. 架构观察

### 4.1 前端层次

前端结构比较清晰，主要分为：

- `src/api`：请求封装与接口定义
- `src/router`：基础路由、守卫、动态权限路由
- `src/store`：认证和业务状态
- `src/views`：页面视图
- `src/components`：业务组件

其中，认证和鉴权主要依赖：

- `src/api/request.ts`
- `src/store/auth.ts`
- `src/router/guard.ts`

### 4.2 后端层次

后端以模块化 Nest 结构为主，核心模块包括：

- `strategy`：策略定义与管理
- `market-data`：合约、K 线、批量下载等行情能力
- `broker-manager`：券商/交易所适配与统一抽象
- `backtesting`：回测任务、BullMQ 队列与 worker 执行
- `ws`：实时行情订阅
- `notification`：通知相关能力

### 4.3 回测与异步任务

回测能力不是简单同步请求，而是：

- 通过 BullMQ 注册 `backtesting` 队列
- 使用独立 processor 执行任务
- 默认依赖 Redis
- 并发度由 `BACKTEST_WORKERS` 或 CPU 核数推导

这说明项目已经具备一定计算型任务架构，而不是纯 CRUD 系统。

## 5. 现状优点

- monorepo 结构完整，共享包拆分较细
- 前后端职责划分明确
- 前端已具备统一请求层、路由守卫和权限生成机制
- 后端已具备 Swagger、WebSocket、队列任务等基础能力
- 已存在 Mock 服务，便于前端独立开发

## 6. 现状风险

### 6.1 开发流量入口不一致

前端默认代理到 Mock，但部分真实交易能力又直接指向 `3000`，容易出现：

- 同一页面混用 Mock 与真实后端
- 登录态、菜单、权限来源不一致
- 调试结果与真实环境不一致

### 6.2 认证边界存在分叉

当前前端请求层对认证失败主要依赖 HTTP `401` 处理，但部分接口或 Mock 可能返回业务错误体而非标准状态码，容易导致：

- 页面停留在异常状态
- 路由守卫和重新登录逻辑不一致
- 用户只看到错误提示，却没有进入统一恢复流程

### 6.3 WebSocket 入口较开放

当前 `/ws` 命名空间允许跨域访问，订阅逻辑偏直接，缺少显式的：

- 连接身份校验
- 订阅参数约束
- 频率限制
- 房间上限控制

对于交易/行情系统，这类接口在生产环境中通常需要更强约束。

### 6.4 回测任务缺少“保护栏”信息

从架构上看回测已是高成本任务，但当前可见代码中缺少显式的：

- 任务幂等策略
- 参数上限校验
- 重复提交抑制
- 队列容量保护
- 资源熔断与降级说明

### 6.5 启动依赖较多

后端依赖 Redis，前端又可能依赖 Mock、真实 API、WebSocket。对于新成员来说，如果缺少清晰边界，容易出现：

- 服务启动了但联调结果不对
- 请求命中了错误目标
- 某个基础设施缺失时失败方式不清楚

## 7. 适合引入 Hardness Engineering 的位置

如果按 “让系统更难误用、更难绕过、更难被无意破坏” 的思路来看，这个项目最值得优先处理的点是：

1. 认证与权限入口统一
2. Mock / Real API 切换显式化
3. WebSocket 与回测入口增加防误用保护
4. 高成本任务增加上限、幂等和失败恢复
5. 启动前检查与运行期健康检查

## 8. 结论

这个项目已经具备较好的业务骨架和工程化基础，但仍处于“能力已经有，保护栏还不够多”的阶段。

如果继续迭代，最有价值的方向不是继续堆功能，而是补齐：

- 统一认证边界
- 显式环境切换
- 高成本操作保护
- 输入校验和限流
- 健康检查与运行诊断

这正是 Hardness Engineering 最适合切入的地方。
