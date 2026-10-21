# Development, Docker, and Testing

This guide documents the repository's existing Docker Compose workflow and the commands that match the current scripts and configuration.

> Verification note: the commands below were checked against `docker-compose.yml`, the Dockerfiles, `package.json` files, Prisma configuration, test configuration, and the GitHub Actions workflow. Docker containers were inspected while already running, but no container, image, or volume was started, stopped, rebuilt, or removed during the documentation review. A clean-clone startup was therefore not executed.

## 1. Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2
- Git
- Ports `5173`, `3000`, and `5432` available on the host

Node.js and npm do not need to be installed on the host for the Docker workflow. The backend and frontend images use Node.js 22 Alpine. CI also uses Node.js 22.

## 2. Services and Ports

| Service | Container command | Host port | Purpose |
|---|---|---|---|
| `frontend` | `npm run dev -- --host 0.0.0.0` | `5173` | Vite development server and `/api` proxy |
| `backend` | `npm run dev` (`tsx watch src/server.ts`) | `3000` | Express API |
| `postgres` | PostgreSQL 16 Alpine | `5432` | Development and test database server |

Compose service names are `frontend`, `backend`, and `postgres`. The volume `postgres_data` keeps database data between normal `docker compose down` and `docker compose up` cycles.

The backend and frontend source directories are bind-mounted into their containers. Anonymous volumes preserve the installed `node_modules` directories from the images.

## 3. Environment Files

Three local files are required for the default Compose workflow. None of them is tracked by Git.

| File | Consumed by | Required contents |
|---|---|---|
| `.env` (repository root) | Docker Compose variable interpolation | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| `backend/.env` | Backend process through `dotenv` | `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` |
| `frontend/.env` | Vite through `env_file` | `VITE_API_BASE_URL` (optional `VITE_API_PROXY_TARGET`) |

Create them from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS or Linux:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Variable reference

| Variable | Used by | Local development requirement |
|---|---|---|
| `POSTGRES_USER` | Compose PostgreSQL service | Required. Must match the user in `backend/.env`'s `DATABASE_URL`. |
| `POSTGRES_PASSWORD` | Compose PostgreSQL service | Required. Must match the password in `backend/.env`'s `DATABASE_URL`. |
| `POSTGRES_DB` | Compose PostgreSQL service | Required. Development database name, `finance_db` in the examples. |
| `PORT` | Backend | Optional; defaults to `3000` in code. The examples set `3000`. |
| `DATABASE_URL` | Backend and Prisma | Required. Inside Compose the host is `postgres`, for example `postgresql://finance_user:finance_password@postgres:5432/finance_db`. |
| `JWT_ACCESS_SECRET` | Backend access-token signing and verification | Required. Use a long random value unique to this environment. |
| `JWT_REFRESH_SECRET` | Backend refresh-token signing and verification | Required. Use a different long random value from the access secret. |
| `ACCESS_TOKEN_EXPIRES_IN` | Backend access-token lifetime | Required. Uses the `jose` duration format, for example `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Backend refresh-token lifetime | Required. Uses the `jose` duration format, for example `7d`. |
| `VITE_API_BASE_URL` | Frontend | Optional; the shared client defaults to `/api`. Keep `/api` for the Docker development proxy. |
| `VITE_API_PROXY_TARGET` | Vite dev proxy | Optional; defaults to `http://backend:3000` inside Docker and `http://localhost:3000` on a host-run dev server. |

The backend validates the required environment variables at startup in `backend/src/config/env.ts` and exits with an error if one is missing.

### JWT secret generation

Generate a separate value for each secret. PowerShell:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 48
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
$rng.Dispose()
```

macOS or Linux:

```bash
openssl rand -base64 48
```

Treat these values as local secrets. Do not commit them, paste them into frontend variables, or reuse them outside local development.

### Frontend variables are public

Vite embeds `VITE_*` values into the client bundle at build time. They must never contain JWT secrets, database credentials, API keys, or other private values. Only browser-facing configuration belongs in `frontend/.env` or `frontend/.env.example`.

### Test environment

`backend/.env.test` is separate from `backend/.env` and is used by the integration test setup. It contains only a `DATABASE_URL` pointing at `finance_test_db`. Start from `backend/.env.test.example`:

```powershell
Copy-Item backend/.env.test.example backend/.env.test
```

The test database is not created automatically by `docker-compose.yml`. See [Backend tests](#8-backend-tests).

## 4. First-Time Startup

Run these commands from the repository root.

1. Build the images:

   ```powershell
   docker compose build
   ```

2. Generate the Prisma client into `backend/src/generated/prisma`:

   ```powershell
   docker compose run --rm --no-deps backend npx prisma generate
   ```

   `backend/src/generated/prisma` is ignored by Git. This step is required after a fresh clone and after Prisma schema changes.

3. Start PostgreSQL and wait for it to accept connections:

   ```powershell
   docker compose up -d postgres
   ```

4. Apply the committed migrations to the development database:

   ```powershell
   docker compose run --rm backend npx prisma migrate deploy
   ```

   If PostgreSQL is still starting, wait a few seconds and rerun the migration command. Check `docker compose logs postgres` if it keeps failing.

5. Start the application:

   ```powershell
   docker compose up
   ```

   Add `-d` to run in the background.

### Access the application

| Target | URL |
|---|---|
| Frontend | <http://localhost:5173> |
| Backend health check | <http://localhost:3000/api/health> |
| API base URL | <http://localhost:3000/api> |

There is no Swagger UI route. Use [OpenAPI.yml](OpenAPI.yml) and [API.md](API.md) to explore the API.

## 5. Everyday Docker Workflow

Start existing services:

```powershell
docker compose up
```

Start in the background:

```powershell
docker compose up -d
```

Show service state:

```powershell
docker compose ps
```

Follow logs:

```powershell
docker compose logs -f backend frontend postgres
```

Stop services without deleting the database volume:

```powershell
docker compose down
```

Rebuild after Dockerfile or dependency changes:

```powershell
docker compose up --build
```

If dependency changes are not picked up, rebuild without using the cache:

```powershell
docker compose build --no-cache
```

Do not treat database-volume deletion as routine troubleshooting. `docker compose down -v` deletes the PostgreSQL volume and all local data in it; use it only when you intentionally want to discard local data. Prefer inspecting logs, migration status, and connectivity first.

## 6. Database Migrations

The schema is in `backend/prisma/schema.prisma`. Migrations are committed in `backend/prisma/migrations/`.

Apply existing migrations (normal development and deployment workflow):

```powershell
docker compose exec backend npx prisma migrate deploy
```

Check migration status:

```powershell
docker compose exec backend npx prisma migrate status
```

Create a new migration while changing the schema:

```powershell
docker compose exec backend npx prisma migrate dev --name <migration-name>
```

Run Prisma schema validation:

```powershell
docker compose exec backend npx prisma validate
```

The Prisma configuration is loaded from `backend/prisma7.config.ts`, which reads `DATABASE_URL` from the backend environment.

## 7. Quality Checks

All commands run inside the containers. The backend and frontend bind mounts make source changes available without rebuilding.

### Linting

```powershell
docker compose exec backend npm run lint
docker compose exec frontend npm run lint
```

### Formatting

The `format` and `format:check` scripts are present in both `package.json` files, but they are not currently reliable in this repository:

- Backend `npm run format:check` reports existing style differences across the current checkout (136 files when last checked). Running `npm run format` would rewrite a large number of files, so do not mix it into an unrelated change.
- Frontend `npm run format:check` fails with `sh: prettier: not found` because `prettier` is not installed in the frontend dependencies.

Formatting is not part of the GitHub Actions workflow. The enforced checks are lint, tests, and builds. Do not describe formatting as passing until the script/dependency issues are fixed.

### Type checking and production builds

There are no standalone type-check scripts. Type checking happens during each build.

```powershell
docker compose exec backend npm run build
docker compose exec frontend npm run build
```

- Backend: `tsc` writes to `backend/dist`.
- Frontend: `tsc -b && vite build` writes to `frontend/dist`.

The Docker images run development servers, not these production outputs.

## 8. Backend Tests

The backend has three relevant test groups:

| Group | Location | Database required |
|---|---|---|
| Unit and API tests | `backend/tests/unit`, `backend/tests/api` | Mostly no, but one repository test uses Prisma and `DATABASE_URL` |
| Integration tests | `backend/tests/integration` | Yes, `finance_test_db` |
| Coverage | All non-integration tests | Depends on the command used; use the test database |

The test database used by the integration setup is `finance_test_db` from `backend/.env.test`. Never point tests at the development database.

### Create and migrate the test database

Create the database once:

```powershell
docker compose exec postgres sh -c 'createdb -U "$POSTGRES_USER" finance_test_db'
```

If it already exists, `createdb` reports an error and changes nothing; you can continue.

Apply migrations to the test database:

```powershell
docker compose exec backend sh -c 'set -a; . ./.env.test; set +a; npx prisma migrate deploy'
```

### Unit and API tests

Run the non-integration suite once with `DATABASE_URL` loaded from `.env.test`, so the database-backed repository test cannot touch the development database:

```powershell
docker compose exec backend sh -c 'set -a; . ./.env.test; set +a; npm test -- --run'
```

`npm test` runs Vitest with `backend/vitest.config.ts`, which includes `tests/**/*.test.ts` and excludes `tests/integration/**/*.test.ts`.

### Integration tests

```powershell
docker compose exec backend npm run test:integration
```

The integration configuration:

- loads `backend/tests/setup.ts`, which reads `.env.test` with `override: true`;
- deletes refresh tokens and users before each test;
- disables file-level parallelism with `fileParallelism: false`, because the tests share one mutable test database.

Do not run multiple integration test processes concurrently against the same test database.

### Coverage

```powershell
docker compose exec backend sh -c 'set -a; . ./.env.test; set +a; npm run test:coverage'
```

Coverage output is written to `backend/coverage`, which is ignored by Git.

## 9. Frontend Tests

```powershell
docker compose exec frontend npm test
```

This is a one-run Vitest command using `jsdom` and the setup file `frontend/src/test/setup.ts`.

Watch mode:

```powershell
docker compose exec frontend npm run test:watch
```

Frontend tests do not require a database or the backend.

## 10. GitHub Actions CI

The workflow is `.github/workflows/ci.yml` and runs on pushes and pull requests to `main` and `develop`.

Backend job:

1. Starts a `postgres:16-alpine` service.
2. Installs backend dependencies with `npm ci`.
3. Generates the Prisma client.
4. Applies migrations to `finance_db`.
5. Creates `finance_test_db` and applies migrations to it.
6. Runs lint, unit/API tests, integration tests, coverage, and the backend build.

Frontend job:

1. Installs frontend dependencies with `npm ci`.
2. Runs lint, tests, and the production build.

CI supplies test-only values for the JWT secrets and expiry variables, and uses the PostgreSQL service credentials for `DATABASE_URL`. The workflow does not read the local `.env` files. These CI values are placeholders for the ephemeral test environment and must not be reused as real secrets.

## 11. Common Problems

| Symptom | Likely cause | Safe check or fix |
|---|---|---|
| Compose reports a missing `env_file` | Root, backend, or frontend `.env` was not created | Create the missing file from its `.env.example` |
| Backend exits with `DATABASE_URL is not defined` or a JWT variable is missing | `backend/.env` is incomplete | Complete the required variables and restart the backend |
| `Cannot find module .../generated/prisma/client.js` | Prisma client was not generated after a fresh clone | `docker compose run --rm --no-deps backend npx prisma generate` |
| `ECONNREFUSED` from the backend to PostgreSQL | PostgreSQL is still starting or the database host is wrong | Check `docker compose ps` and `docker compose logs postgres`; inside Compose the host is `postgres` |
| Migration command cannot connect | PostgreSQL not ready | Wait, check logs, then rerun `prisma migrate deploy` |
| Integration tests fail with a missing database | `finance_test_db` was not created | Follow [Create and migrate the test database](#create-and-migrate-the-test-database) |
| Integration tests fail with missing tables | Test migrations were not applied | Apply migrations using the `.env.test` `DATABASE_URL` shown above |
| Port `5173`, `3000`, or `5432` is already in use | Another process or container is bound to the port | Identify the process with `docker compose ps` and host tools; stop the conflicting process deliberately |
| Frontend shows network errors | Backend is down or the Vite proxy target is wrong | Check `http://localhost:3000/api/health`, backend logs, and `VITE_API_PROXY_TARGET` |
| Requests return `401` | Access token is missing, expired, or invalid | Log in again; the frontend retries once through `/api/auth/refresh` |

Do not reset the database volume to fix an unexplained error. First inspect migration status, service logs, and whether the correct environment file is loaded.
