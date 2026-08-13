# AGENTS.md

Mundo Motos CRM - monorepo npm workspaces (`packages/frontend`, `packages/backend`), driven by Turbo, all TypeScript. Spanish is used everywhere (docs, comments, error messages, API fields) - match it.

## Install / commands

- PowerShell blocks `npm.ps1` and `npx.ps1`: always run `npm.cmd` / `npx.cmd`, never `npm` / `npx`.
- `npm.cmd install` works now - `dotenv`, `jsonwebtoken`, and `react-leaflet` were pinned to published versions (`^17`, `^9.0.3`, `^4.2.1`) because the registry lacks the declared ones. There is **no lockfile** (`package-lock.json` is gitignored? no - it just doesn't exist yet), so `npm install` re-resolves fresh.
- Root scripts use Turbo, but **there is no `turbo.json`**, so `npm run type-check` / `lint` / `build` / `dev` fail with "Could not find turbo.json". Run package scripts directly instead:
  - Backend type-check/lint: `npx.cmd tsc --noEmit -p packages/backend/tsconfig.json`, `npx.cmd eslint packages/backend/src --ext ts`
  - Dev servers: `npm.cmd run dev --workspace=@mundo-motos/backend` (tsx watch, port 3000) / `--workspace=@mundo-motos/frontend` (Vite, 5173). `tsx watch` fails without a `turbo.json` too.
- **Backend `type-check` passes green** (verified). **Lint is broken repo-wide**: `.eslintrc.json` declares `@typescript-eslint/explicit-function-return-types`, which does not exist in typescript-eslint v7 - every file errors with "Definition for rule ... was not found". Fix the rule name (e.g. `explicit-module-boundary-types`) before relying on lint. Frontend `type-check` still fails for unrelated pre-existing reasons (see below). No test files exist despite `vitest` scripts.

## The docs are aspirational - trust the code

`README.md`, `QUICKSTART.md`, `docs/*.md`, `ESTRUCTURA.txt` describe a finished product (JWT auth, RLS, Supabase/PostgreSQL, migrations, service/repository layers). The actual code is a scaffold:

- `packages/backend/src/index.ts` exposes `/health`, a placeholder `GET /api/v1`, and the **`concesionarios` module wired at `/api/v1/concesionarios`** (the only real endpoints). The `crm`/`ubicaciones` routers in `src/modules/{crm,ubicaciones}/controller.ts` are still **unmounted mocks** with in-memory arrays.
- The `concesionarios` module (`src/modules/concesionarios/concesionario.{model,service,controller,routes}.ts`) is a real Supabase-backed CRUD. `src/config/supabase.ts` (the client it uses) **throws at import time** if `SUPABASE_URL` + (`SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`) are unset - the backend now **requires these in `.env` to boot**.
- `src/config/database.ts` (older Supabase client) is unused and also throws if env vars are unset - don't import it casually.
- `npm run migrate`/`seed` point to `src/database/migrations/run.ts` / `seeds/run.ts`, which don't exist. The only migration is `src/database/migrations/001_concesionarios.sql` (apply manually via Supabase SQL editor). No test files exist despite `vitest` scripts.

## Env loading

- Backend `dotenv.config()` loads `.env` (Vite auto-loads `.env.local`). README's `cp .env.example .env.local` only feeds the frontend - put backend vars in `.env`.
- Frontend dev relies on the Vite proxy: `/api` -> `http://localhost:3000` (see `vite.config.ts`), so the API base URL in browser code is just `/api`.

## Known build/type landmines

- No `vite-env.d.ts` exists, yet `services/api.ts` uses `import.meta.env` - frontend `type-check`/`build` (`tsc && vite build`) need a `vite/client` reference first.
- `vite.config.ts` `manualChunks` references `@radix-ui/react-dialog` and `@radix-ui/react-popover`, which are **not** dependencies - the build can fail.
- `crypto.randomUUID()` in the `crm`/`ubicaciones` mock controllers requires Node 18+ (fine locally). The real `concesionarios` module relies on Postgres `gen_random_uuid()`.

## Conventions

- Path aliases differ per package: backend `@utils/*`, `@types/*`, `@config/*`, `@modules/*`, `@middleware/*`; frontend `@/*`, `@components/*`, `@pages/*`, `@hooks/*`, `@utils/*`, `@types/*`, `@styles/*`, `@services/*`. Note `@types/*` is the shared-types folder, not TS's `types` keyword.
- Prettier: 2-space, single quotes, semicolons, printWidth 100. ESLint root config (`no-console` warn, `eqeqeq`, `curly`).
- Tailwind corporate palette: `mm-black`, `mm-yellow`, `mm-gray-50..900`, plus `mm-success/error/warning/info`.
- Backend modules follow the `concesionarios/` pattern: `concesionario.{model,service,controller,routes}.ts` + `index.ts` re-export. The service talks to Supabase and throws `ApiError` (with `statusCode`) from `@utils/helpers`; controllers delegate and respond via `sendSuccess`/`sendPaginated`. The global error handler reads `err.statusCode || err.status`.
- `@types/*` imports in backend `types/index.ts` trips TS6137 (a folder named `types` under `moduleResolution: node`); use relative imports for that folder.
