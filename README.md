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
- pnpm workspace

## 环境要求

- Node.js >= 22.12
- pnpm 11

## 本地启动

复制环境变量并启动数据库：

```bash
cp .env.example .env
docker compose up -d mysql
pnpm --dir apps/api db:migrate
pnpm --dir apps/api db:seed
```

数据库首次初始化后，默认管理员账号为 `admin`，密码为 `admin123`。数据库只保存 bcrypt 密码摘要。

常用数据库命令：

```bash
# 执行尚未运行的迁移
pnpm --dir apps/api db:migrate

# 写入初始化数据
pnpm --dir apps/api db:seed

# 回滚全部迁移并重新初始化（会清空数据库）
pnpm --dir apps/api db:reset
```

然后分别启动两个终端：

```bash
pnpm dev:api
pnpm dev:web
```

- 管理端：http://localhost:5173
- API：http://localhost:7001/api/v1/health

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
