# AI Agent Server Instruction

## Goal

Deploy and run `nodir_hdd_fixer` on the target server with predictable behavior.

Repository layout:

```text
nodir_hdd_fixer/
├── apps/api        # NestJS API
├── apps/web        # Next.js frontend
├── packages/shared # shared types
├── package.json    # root scripts
└── turbo.json
```

## Important facts

1. Always work from the repository root, not from `apps/`.
2. Root `npm run dev` now uses `scripts/dev.js`.
   It pre-checks port `3004` and kills only stale local API processes from this repo before starting Turbo.
3. Anonymous browser sessions may call `/v1/users/me`.
   A `401 Unauthorized` for an unauthenticated visitor is expected and is not a backend crash.
4. Next.js root warning about lockfiles is already handled by `apps/web/next.config.ts` via `outputFileTracingRoot`.
5. Google OAuth callback base URL now uses `API_BASE_URL` when present.

## Current deployment blocker

At the time of this instruction, `npm run build:web` still fails on an existing frontend issue unrelated to the latest auth/dev fixes:

- repeated React "unique key" warnings during prerender
- prerender failure on `/_global-error`
- error shape: `Cannot read properties of null (reading 'useContext')`

Do not waste time debugging anonymous `401` logs or the removed scroll-behavior warning.
If the task is strict production build deployment, fix the `/_global-error` prerender issue first.

## Development startup

```bash
cd /path/to/nodir_hdd_fixer
npm install
npm run dev
```

Expected services:

- web: `http://localhost:3003`
- api: `http://localhost:3004`
- swagger: `http://localhost:3004/api/docs`
- health: `http://localhost:3004/v1/health`

## Production-style startup

If you are deploying with Docker:

```bash
cd /path/to/nodir_hdd_fixer
cp .env.production.example .env.prod
# fill real secrets in .env.prod
docker compose -f docker-compose.prod.yml up -d --build
```

If you are deploying without Docker, use this order:

```bash
cd /path/to/nodir_hdd_fixer
npm ci
npm run build:api
npm run build:web
```

Only continue to runtime startup if both builds succeed.

## Sanity checks

```bash
curl http://localhost:3004/v1/health
ss -tlnp | grep -E '3003|3004'
ps aux | grep -E 'node|next|nest'
```

## What not to misdiagnose

- `GET /v1/users/me 401` for a logged-out user: expected behavior
- React DevTools suggestion in browser console: irrelevant
- `[HMR] connected`: normal

## If `npm run dev` fails on port 3004

First rerun the root command once:

```bash
cd /path/to/nodir_hdd_fixer
npm run dev
```

The root preflight should clear stale repo-owned API listeners automatically.

If it still fails, inspect the owner:

```bash
lsof -iTCP:3004 -sTCP:LISTEN -n -P
```

If the process is not from this repo, stop that external service or change `APP_PORT`.
