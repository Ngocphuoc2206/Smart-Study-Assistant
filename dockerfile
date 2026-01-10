# Base
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

# Build web (Next.js)
FROM base AS builder-web
RUN npm run build

# Build worker (TypeScript -> JS)
FROM base AS builder-worker
RUN npx tsc -p tsconfig.worker.json

# Runtime - Web
FROM node:20-alpine AS runner-web
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder-web /app/package*.json ./
COPY --from=builder-web /app/node_modules ./node_modules
COPY --from=builder-web /app/.next ./.next
COPY --from=builder-web /app/public ./public

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]

# Runtime - Worker/API
FROM node:20-alpine AS runner-worker
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder-worker /app/package*.json ./
COPY --from=builder-worker /app/node_modules ./node_modules
COPY --from=builder-worker /app/dist ./dist

COPY --from=builder-worker /app/worker/config ./dist/worker/worker/config

EXPOSE 4000
CMD ["node", "dist/worker/worker/server.js"]
