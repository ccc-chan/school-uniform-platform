FROM node:22-bookworm-slim

WORKDIR /app

# 先复制依赖清单，提高重复构建时的缓存命中率。
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

# 保留 Sequelize CLI，以便容器内执行生产迁移。
RUN npm ci --workspace=@school-uniform/api --include-workspace-root \
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
