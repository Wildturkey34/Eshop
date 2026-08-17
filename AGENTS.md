# AGENTS.md — eshop

## Quick start

```bash
pnpm install
pnpm prisma:generate          # after any schema change
npx nx build <app> && npx nx serve <app>   # build then serve a service
pnpm dev                      # run all services
pnpm user-ui                  # run user frontend + its deps
```

## Architecture

Nx 21 monorepo (pnpm). MongoDB + Prisma ORM (`prisma-client-js` generator). Redis cache. Kafka event bus.

### Services (Express.js, apps/)

| App | Port | Gateway route |
|---|---|---|
| `api-gateway` | 8080 | gateway (rate-limits 100/1000 req/15min) |
| `auth-service` | 6001 | `/` (catch-all) |
| `product-service` | 6002 | `/product` |
| `seller-service` | 6003 | `/seller` |
| `order-service` | 6004 | `/order` |
| `admin-service` | 6005 | `/admin` |
| `chatting-service` | 6006 | `/chatting` (HTTP + WebSocket) |
| `recommendation-service` | 6007 | `/recommendation` |
| `logger-service` | 6008 | WebSocket + Kafka consumer (not proxied) |
| `kafka-service` | — | no port; consumes `users-events` Kafka topic |

### Frontends (Next.js 15, apps/)

| App | Port | Cmd |
|---|---|---|
| `user-ui` | 3000 | `pnpm user-ui` |
| `seller-ui` | 3001 | `pnpm seller-ui` |
| `admin-ui` | 3002 | `pnpm admin-ui` |

### Shared packages (`packages/`)

- `@packages/error-handler` — AppError classes + error middleware
- `@packages/middleware` — auth (JWT), role guards (`isSeller`/`isUser`/`isAdmin`)
- `@packages/utils` — Kafka client, logging; sub-exports `utils/kafka`, `utils/logs`
- `@packages/libs/prisma` — singleton PrismaClient (hot-reload in dev)
- `@packages/libs/redis` — ioredis client
- `@packages/libs/imagekit` — ImageKit CDN client
- `@packages/libs/email` — Nodemailer with EJS templates
- `@packages/components/*` — shared React UI components

Internal imports use `@packages/*` and `@packages/libs/*` (defined in `tsconfig.base.json` paths).

## Key quirks & gotchas

- **No ESLint** — TypeScript strict mode + `noUnusedLocals: true` catches issues. Use `npx nx typecheck <app>`.
- **NX webpack plugin** auto-generates build targets from `webpack.config.js`. **Never** define a `build` target manually in `package.json` (see `NX_WEBPACK_BUILD_FIX.md`). Only `serve` target goes in `package.json`.
- **Multi-service dev** needs `"inspect": false` in `serve` options in `package.json` to avoid port conflicts.
- **Prisma + MongoDB** — uses `prisma-client-js` generator (not `prisma-mongodb`). Schema at `prisma/schema.prisma`. Generated client lands in `generated/prisma/` (gitignored).
- **API docs** — `pnpm auth-docs`, `pnpm product-docs`, `pnpm seller-docs` run swagger-autogen scripts.
- **Prettier** — single quotes only (`.prettierrc`).
- **E2E tests** — only `auth-service-e2e` exists; depends on `auth-service:build` + `auth-service:serve`. Run via `npx nx run auth-service-e2e:e2e`.
- **Utility scripts** in `scripts/` — `check-and-update-admin.ts`, `make-admin.ts`, `clear-analytics.ts`, `import-dataset.sh`, `reset-admin-password.ts`.
- **dotenv** — do not import `dotenv` in utility/shared files; let `main.ts` or environment handle it.

## Startup order (full local dev)

1. MongoDB, Redis, Kafka running
2. `pnpm prisma:generate`
3. `npx nx build <service>` or `pnpm dev` (runs `npx nx run-many --target=serve --all`)
4. Frontends independently via `pnpm user-ui` etc.

Note: `auth-service` handles both `/auth/user/*` and `/auth/seller/*` endpoints behind the catch-all proxy route at the gateway.
