FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

RUN npm ci --workspace=@school-uniform/admin-web --include-workspace-root \
  && npm cache clean --force

COPY apps/admin-web apps/admin-web

ARG VITE_QR_PUBLIC_BASE_URL
ENV VITE_QR_PUBLIC_BASE_URL=${VITE_QR_PUBLIC_BASE_URL}

RUN npm run build --workspace=@school-uniform/admin-web

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html

EXPOSE 80
