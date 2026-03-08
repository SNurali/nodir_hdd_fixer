FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Also need to copy web package.json so `npm ci` respects the package-lock.json fully without complaining about missing workspace
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build:api

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Re-copy files needed for running the application in a monorepo
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3004

CMD ["node", "apps/api/dist/main.js"]
