# 校服数字身份平台

仅包含 PC 管理后台和 Egg API 服务。

## 技术栈

- Vue 3 + TypeScript
- Vite 7
- UnoCSS
- Ant Design Vue
- Vue Router + Pinia
- Node.js + Egg
- MySQL 8 + Sequelize
- npm workspaces

## 环境要求

- Node.js >= 22.12
- npm >= 10

## 本地启动

复制开发环境模板并启动基础服务：

```bash
cp .env.dev.example .env.dev

docker compose --env-file .env.dev up -d mysql redis minio minio-init

npm run db:migrate:dev --workspace=@school-uniform/api
npm run db:seed:dev --workspace=@school-uniform/api
```

数据库首次初始化后，默认管理员账号为 `admin`，密码为 `admin123`。手机号 `13800000000` 数据库只保存 bcrypt 密码摘要。

常用数据库命令：

```bash
# 开发环境迁移
npm run db:migrate:dev --workspace=@school-uniform/api

# 测试环境迁移
npm run db:migrate:test --workspace=@school-uniform/api

# 开发环境首次写入初始化数据
npm run db:seed:dev --workspace=@school-uniform/api

# 清空并重建开发数据库；该命令会删除数据
npm run db:reset:dev --workspace=@school-uniform/api
```

本地前端默认把 `/api` 请求代理到 `http://111.228.47.54:18080`。启动前端：

```bash
npm run dev:web
```

- 管理端：http://localhost:5174
- 远程 API：http://111.228.47.54:18080/api/v1/health
- MinIO API：http://localhost:9000
- MinIO 控制台：http://localhost:9001
- 本地对象存储 Bucket：`school-uniform-dev`

需要调试本地 API 时，可以把 `.env.dev` 中的 `API_PROXY_TARGET` 改为
`http://127.0.0.1:7001`，然后在另一终端执行：

```bash
npm run dev:api
```

## 测试环境

`111.228.47.54` 是测试服务器。测试环境使用独立数据库、Redis DB、
MinIO Bucket 和 Docker 数据卷，并以生产级进程模式运行：

```bash
cp .env.test.example .env.test
vi .env.test

docker compose --env-file .env.test \
  -f docker-compose.prod.yml build api

docker compose --env-file .env.test \
  -f docker-compose.prod.yml build web

docker compose --env-file .env.test \
  -f docker-compose.prod.yml up -d

docker compose --env-file .env.test \
  -f docker-compose.prod.yml exec api npm run db:migrate:test

# 仅首次初始化执行
docker compose --env-file .env.test \
  -f docker-compose.prod.yml exec api npm run db:seed:test
```

本地测试前端同样把 `/api` 请求代理到 `http://111.228.47.54:18080`。测试服务器
只对公网开放 Web 端口，MySQL、Redis、MinIO 和 API 仅在 Docker 内部访问。

## 测试环境 CI/CD

`main` 分支每次 push 后，GitHub Actions 会依次执行代码检查、构建
`linux/amd64` API 与 Web 镜像、推送到 GHCR，并通过 SSH 更新测试服务器。
数据库迁移会自动执行，初始化 seed 不会自动重复执行。

### 服务器部署用户

不要让 CI 使用 root。首次配置时在测试服务器执行：

```bash
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
chown -R deploy:deploy /opt/school-uniform-platform
```

为 `deploy` 用户配置独立 SSH 公钥后，使用该用户登录服务器并登录 GHCR：

```bash
docker login ghcr.io -u ccc-chan
```

登录密码使用只包含 `read:packages` 权限的 GitHub Personal Access Token
(classic)。该凭据只保存在测试服务器。

服务器 `.env.test` 应包含：

```dotenv
WEB_PORT=18080
API_IMAGE=ghcr.io/ccc-chan/school-uniform-platform-api:test-latest
WEB_IMAGE=ghcr.io/ccc-chan/school-uniform-platform-web:test-latest
VITE_QR_PUBLIC_BASE_URL=http://111.228.47.54:18080
```

### GitHub Environment

在仓库 `Settings → Environments → test` 中配置变量：

```text
TEST_SSH_HOST=111.228.47.54
TEST_SSH_PORT=22
TEST_SSH_USER=deploy
```

配置 Secrets：

```text
TEST_SSH_PRIVATE_KEY
TEST_SSH_KNOWN_HOSTS
```

`TEST_SSH_PRIVATE_KEY` 是专用部署私钥的完整内容。生成密钥：

```bash
ssh-keygen -t ed25519 \
  -f ~/.ssh/school_uniform_test_deploy \
  -C school-uniform-test-deploy
```

获取并验证服务器 Host Key：

```bash
ssh-keyscan -t ecdsa 111.228.47.54 > jdcloud_known_hosts
ssh-keygen -lf jdcloud_known_hosts
```

指纹必须与首次人工 SSH 验证过的值一致：

```text
SHA256:VRxquRdbBtn6IIICZcOhxuh3WkwL5ybosjtFlk1Qzzg
```

确认后，将 `jdcloud_known_hosts` 完整内容保存为
`TEST_SSH_KNOWN_HOSTS`。

### 自动部署与回滚

正常部署只需提交并推送：

```bash
git push origin main
```

每个构建同时保留 commit SHA 镜像标签。需要回滚时，把服务器 `.env.test`
中的镜像标签临时改成对应 SHA，再执行：

```bash
docker compose --env-file .env.test \
  -f docker-compose.prod.yml pull api web

docker compose --env-file .env.test \
  -f docker-compose.prod.yml up -d --no-build
```

## 生产部署

生产环境只对公网暴露 Web 端口。MySQL、Redis、MinIO 和 API 仅允许
Docker 内部网络访问。

```bash
cp .env.prod.example .env.prod
vi .env.prod
```

必须替换 `.env.prod` 中所有 `REPLACE_WITH_` 开头的值，然后执行：

```bash
docker compose --env-file .env.prod \
  -f docker-compose.prod.yml up -d --build

docker compose --env-file .env.prod \
  -f docker-compose.prod.yml exec api npm run db:migrate:prod

# 仅在首次初始化数据库时执行
docker compose --env-file .env.prod \
  -f docker-compose.prod.yml exec api npm run db:seed:prod
```

检查服务：

```bash
docker compose --env-file .env.prod \
  -f docker-compose.prod.yml ps

curl http://127.0.0.1/api/v1/health
```

首次上线地址为 `http://111.228.47.54`。绑定域名后，应将
`VITE_QR_PUBLIC_BASE_URL` 改为 HTTPS 域名并重新构建 Web 镜像。

## PC 功能范围

- 登录与基础页面：5页
- 产品中心：8页
- 二维码中心：11页
- 生产中心：8页
- 检测中心：5页
- 品牌中心：4页
- 数据统计：4页
- 系统管理：5页

合计50页，后续按模块逐步实现。
