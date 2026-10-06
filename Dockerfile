FROM node:24-bookworm-slim AS web-build
WORKDIR /project/apps/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM node:24-bookworm-slim AS api-build
WORKDIR /project/apps/api
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /project
COPY --from=api-build /project/apps/api/package.json ./apps/api/package.json
COPY --from=api-build /project/apps/api/node_modules ./apps/api/node_modules
COPY --from=api-build /project/apps/api/dist ./apps/api/dist
COPY --from=web-build /project/apps/web/dist ./apps/web/dist
WORKDIR /project/apps/api
EXPOSE 3000
CMD ["npm", "start"]