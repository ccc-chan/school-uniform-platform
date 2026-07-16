# 校服数字身份平台

仅包含 PC 管理后台和 Egg API 服务。

## 技术栈

- Vue 3 + TypeScript
- Vite 7
- UnoCSS
- Ant Design Vue
- Vue Router + Pinia
- Node.js + Egg
- pnpm workspace

## 环境要求

- Node.js >= 22.12
- pnpm 11

## 本地启动

分别启动两个终端：

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
