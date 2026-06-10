## 运行项目

### 环境要求

- Node.js >= 20.10.0
- pnpm >= 9.12.0（推荐使用 `pnpm@10.11.1`，与仓库 `packageManager` 保持一致）

### 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 启动开发环境

推荐分别启动前后端（避免交互式选择）：

```bash
pnpm dev:backend
pnpm dev:frontend
```

启动后访问：

- 前端：http://localhost:8000/
- 后端 Swagger：http://localhost:3000/api
- 前端内置 Mock API（Nitro Mock Server）：http://localhost:5320/api

### 一键启动（可选）

```bash
pnpm dev
```

说明：该命令会进入交互式选择，需要在终端里选择要运行的应用。

### 停止服务

在对应终端按 `Ctrl + C`。
