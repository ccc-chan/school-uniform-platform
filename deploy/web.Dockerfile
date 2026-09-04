FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
COPY apps/school_uniform_info/package.json apps/school_uniform_info/package.json

RUN npm ci \
  --workspace=@school-uniform/admin-web \
  --workspace=@school-uniform/school_uniform_info \
  --include-workspace-root \
  && npm cache clean --force

COPY apps/admin-web apps/admin-web
COPY apps/school_uniform_info apps/school_uniform_info

ARG VITE_QR_PUBLIC_BASE_URL
ARG VITE_QR_ALLOW_HTTP_IN_TEST=false
ENV VITE_QR_PUBLIC_BASE_URL=${VITE_QR_PUBLIC_BASE_URL}
ENV VITE_QR_ALLOW_HTTP_IN_TEST=${VITE_QR_ALLOW_HTTP_IN_TEST}

RUN npm run build --workspace=@school-uniform/admin-web \
  && npm run build --workspace=@school-uniform/school_uniform_info \
  && mv /app/apps/admin-web/dist/label-icons /app/label-icons

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 标签图标单独成层；普通业务代码变化时可直接复用该层。
COPY --from=builder /app/label-icons /usr/share/nginx/html/label-icons

COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html
COPY --from=builder /app/apps/school_uniform_info/dist /usr/share/nginx/html/school_uniform_info

EXPOSE 80
