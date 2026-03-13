FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build:shared
RUN npm run build:web

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3003

# Next.js standalone output copies all needed modules, including monorepo workspaces
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3003

# Next.js in standalone mode inside a monorepo outputs server.js to apps/web/server.js
CMD ["node", "apps/web/server.js"]
