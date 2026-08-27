FROM node:22-bookworm-slim

WORKDIR /app

# 先复制依赖清单，提高重复构建时的缓存命中率。
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

# 只安装 API 生产依赖；Sequelize CLI 作为生产依赖保留给迁移命令。
RUN npm ci --workspace=@school-uniform/api --include-workspace-root --omit=dev \
  && npm cache clean --force

COPY --chown=node:node apps/api apps/api

WORKDIR /app/apps/api

RUN mkdir -p storage/uploads logs run \
  && chown -R node:node storage logs run

ENV NODE_ENV=production
ENV EGG_SERVER_ENV=prod
ENV APP_ENV=prod
ENV PORT=7001

USER node

EXPOSE 7001

CMD ["npm", "start"]
