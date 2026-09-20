FROM node:24.20.0-bookworm-slim AS build
WORKDIR /workspace/frontend
COPY . ./
RUN npm ci --ignore-scripts
ENV NEXUS_AXIS_BASE_URL=http://localhost:4100 \
    NEXUS_PLATFORM_BASE_URL=http://localhost:5300 \
    NEXUS_ENTERPRISE_CODE=default \
    NEXUS_DEFAULT_LOCALE=en \
    NEXUS_CHANNEL=web \
    NEXUS_CLIENT_CONTRACT_VERSION=1 \
    NEXUS_REQUEST_TIMEOUT_MS=10000 \
    NEXUS_CORPORATE_HOSTS=localhost,127.0.0.1 \
    NEXUS_CORPORATE_SITE=nexusCorporateSite \
    NEXUS_DEV_HOST=0.0.0.0 \
    NEXUS_DEV_PORT=4200 \
    NEXUS_STRICT_PORT=true \
    NEXUS_BUILD_SOURCEMAP=false
RUN npm run build

FROM nginx:1.29.8-alpine3.23
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run
USER nginx
