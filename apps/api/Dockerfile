FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @bingoblitz/shared && npm run build -w @bingoblitz/api
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=development HOST=0.0.0.0 PORT=3001 BLOB_DIR=/app/.data/blobs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/db ./apps/api/db
COPY scripts ./scripts
RUN mkdir -p /app/.data/blobs && chown -R node:node /app/.data
USER node
EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=4s --start-period=20s --retries=10 CMD node -e "fetch('http://127.0.0.1:3001/api/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]
