# Redis 本地运行与版本升级

本仓库提供了 `Docker Compose` 配置，便于在本地指定 Redis 版本运行，并与后端对接。

## 快速开始
- 复制环境变量示例文件为实际文件：
  - `cp .env.example .env`
- 按需要修改 `.env` 中的变量：
  - `REDIS_VERSION`：希望运行的 Redis 版本（如 `7.2`）
  - `REDIS_PORT`：宿主机映射端口（默认 `6379`）
  - `REDIS_PASSWORD`：Redis 访问密码（请修改）
- 启动服务：
  - `docker compose -f compose.yaml pull`
  - `docker compose -f compose.yaml up -d`
- 验证健康：
  - `docker compose -f compose.yaml ps`
  - `docker logs vtrader-redis --tail=100`
  - `docker exec -it vtrader-redis redis-cli -a <你的密码> INFO server`（检查 `redis_version`）

## 如何升级 Redis 版本
- 停止服务（可选）：
  - `docker compose -f compose.yaml down`
- 备份数据（如需保留数据）：
  - 停止后备份 `scripts/redis/data/` 目录
  - 或运行：`docker exec vtrader-redis redis-cli -a <你的密码> SAVE`
- 修改 `.env` 中的 `REDIS_VERSION` 为目标版本（例如 `7.4`）
- 拉取并启动：
  - `docker compose -f compose.yaml pull`
  - `docker compose -f compose.yaml up -d`
- 再次用 `redis-cli INFO server` 验证版本

## 与后端对接
- 后端读取环境变量：
  - `REDIS_HOST`（默认 `127.0.0.1`）
  - `REDIS_PORT`（与 `.env` 中 `REDIS_PORT` 保持一致）
  - `REDIS_PASSWORD`（与 `.env` 保持一致）
- 先在 `backend` 目录设置环境变量（见 `backend/.env.example`），然后启动后端即可连接。

## 注意事项
- Windows 平台推荐使用 Docker Desktop 或 WSL2 运行 Redis。
- 如果是生产环境或云服务（如 ElastiCache），请参考云服务文档在控制台升级引擎版本，并在后端同步密码与地址即可。
- 本配置默认开启：
  - `appendonly yes`（AOF 持久化）
  - `requirepass`（访问密码）
  - 端口映射为 `REDIS_PORT:6379`
  - 网络为 `vtrader-network`（可根据需要调整）

