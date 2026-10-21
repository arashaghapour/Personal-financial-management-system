# Release Readiness

Review date: 2026-10-21

This checklist records what was verified for the Issue #30 documentation and release-readiness review. It is deliberately conservative: a step is marked verified only if it was executed against the current repository or inspected directly. It does not claim that the application is ready for public production use.

## Status Legend

| Status | Meaning |
|---|---|
| **Verified** | Executed successfully during this review, or directly confirmed in the repository. |
| **Reviewed** | Checked against configuration/code but not executed end-to-end. |
| **Not verified** | Could not be executed under the review constraints. |
| **Incomplete** | Known work remains before public deployment. |
| **N/A** | Not applicable to this project or this review. |

## Review Scope and Constraints

- Review performed on Windows.
- Docker services `frontend`, `backend`, and `postgres` were already running and were used for read-only inspection and quality checks.
- No container, image, or volume was started, stopped, rebuilt, or removed as part of this review. No clean-clone startup was performed.
- No dependencies were installed on the host.
- No Git commit, branch, push, or pull request was performed.
- No public deployment exists, so no live deployment was tested.

## Documentation Checklist

| Item | Status | Evidence |
|---|---|---|
| README reviewed and improved | **Verified** | Project overview, features, stack, architecture, structure, Docker quick start, quality checks, API/security notes, and documentation index are present. |
| Setup instructions checked against repository | **Reviewed** | Commands and service names match `docker-compose.yml`, the Dockerfiles, and package scripts. A clean-clone execution was not possible under the no-lifecycle constraint. |
| Environment variables documented | **Verified** | `.env.example`, `backend/.env.example`, `backend/.env.test.example`, README, and [DEVELOPMENT.md](DEVELOPMENT.md) cover every required variable and its consumer. |
| Secrets handling and ignored files reviewed | **Verified** | No tracked secrets or `.env` files were found. `.gitignore` covers `.env`, `.env.test`, generated Prisma client, `dist`, and `coverage`. |
| Authentication flow documented | **Verified** | Register, login, refresh, logout, `/me`, token storage, rotation, and frontend retry behavior match the implementation. |
| API documentation location and usage verified | **Verified** | [API.md](API.md) documents the actual endpoint groups and explains that no Swagger UI is served. |
| Architecture documentation checked | **Verified** | [Architecture.md](Architecture.md) describes the implemented component boundaries, request flow, data integrity, and testing strategy. |
| Testing commands verified | **Verified** | Backend lint/unit/integration/build and frontend lint/test/build were executed in the running containers. |
| CI environment requirements documented | **Verified** | [DEVELOPMENT.md](DEVELOPMENT.md) matches `.github/workflows/ci.yml`, including service database creation and test-placeholder secrets. |
| Internal links and anchors checked | **Verified** | Links in the new and updated documentation resolve to existing files/headings. |
| Screenshots and demo URL | **Incomplete** | No verified current screenshots or working public demo are available; none were invented. |
| Remaining limitations and unverified steps recorded | **Verified** | Recorded in this document and in README's security/limitations section. |

## Environment and Repository Checks

| Item | Status | Evidence |
|---|---|---|
| No tracked environment files | **Verified** | `git ls-files` returned only `.env.example`-style files. |
| No tracked build/test artifacts | **Verified** | Generated Prisma client, `dist`, coverage, and test databases are not tracked. |
| Service topology and ports | **Verified** | `frontend` `5173`, `backend` `3000`, `postgres` `5432`. |
| Prisma schema validation | **Verified** | `npx prisma validate` completed successfully. |
| Migration state | **Verified** | `npx prisma migrate status` reported 8 migrations and an up-to-date schema. |
| Test database availability | **Verified** | `finance_test_db` exists with the expected tables and applied migrations. |
| Clean-clone Prisma generation | **Reviewed** | The dependency on `prisma generate` is documented and CI performs it; it was not re-executed as a fresh-clone test. |
| Clean-clone Docker startup | **Not verified** | Requires building/starting services, which was outside the review constraints. |

## Quality Check Results

All commands were run in the existing Docker containers on 2026-10-21.

| Check | Command | Result |
|---|---|---|
| Backend lint | `docker compose exec -T backend npm run lint` | **Passed** |
| Frontend lint | `docker compose exec -T frontend npm run lint` | **Passed** |
| Frontend tests | `docker compose exec -T frontend npm test` | **Passed**: 44 files, 340 tests |
| Backend unit/API tests | `. ./.env.test`, then `npm test -- --run` in `backend` | **Passed**: 19 files, 186 tests |
| Backend integration tests | `. ./.env.test`, then `npm run test:integration -- --run` in `backend` | **Passed**: 39 files, 380 tests |
| Backend coverage command | `. ./.env.test`, then `npm run test:coverage` in `backend` | **Passed**; 40.35% statement coverage from the non-integration suite |
| Backend build/type check | `docker compose exec -T backend npm run build` | **Passed** |
| Frontend build/type check | `docker compose exec -T frontend npm run build` | **Passed**; Vite reported a chunk-size warning for a 551.80 kB JS chunk |
| Backend formatting check | `docker compose exec -T backend npm run format:check` | **Failed**: Prettier reports style differences in 136 files. Not part of CI. |
| Frontend formatting check | `docker compose exec -T frontend npm run format:check` | **Failed**: `prettier: not found`; Prettier is not installed in the frontend dependencies. |
| CI workflow run | GitHub Actions | **Not verified**; the workflow was reviewed statically, not triggered from this environment |

Coverage is not enforced by a configured threshold and the frontend has no coverage script. The reported backend percentage covers only the non-integration suite, so it is not a full-project coverage measure. Formatting is also not enforced by CI; lint, tests, and builds are.

The frontend build emitted a Vite warning about a JavaScript chunk larger than 500 kB. This does not fail the build but is a performance optimization item.

## API and Contract Status

| Item | Status | Notes |
|---|---|---|
| API base and error envelope documented | **Verified** | Base path is `/api`; errors use `{ "error": { "code", "message", "details"? } }`. |
| Authentication and ownership behavior documented | **Verified** | Ownership failures are returned as `404`. |
| No Swagger/Redoc UI | **Verified** | No documentation UI route exists. |
| OpenAPI file present | **Verified** | [OpenAPI.yml](OpenAPI.yml) exists. |
| OpenAPI matches implementation | **Incomplete** | Known drift is listed below. The implementation remains authoritative. |

Known OpenAPI differences:

1. Register is documented with an `AuthResponse`-shaped response, but the implementation returns only `{ "user": ... }`.
2. Transaction sort values in the implementation use underscores (`date_asc`, `date_desc`, etc.); the spec uses colon-separated values.
3. The spec's `TokenResponse` includes `tokenType` and `expiresIn`, which the implementation does not return.
4. Account balances are Prisma `Decimal` values and may be serialized as numeric strings, while the spec declares a number.

These are documentation/contract mismatches, not behavior changes made during this review.

## Security and Production Readiness

| Item | Status | Notes |
|---|---|---|
| Password hashing | **Verified** | Argon2id. |
| JWT access/refresh separation | **Verified** | Separate secrets and expiry configuration. |
| Refresh-token hashing/rotation/revocation | **Verified** | Token hashes are stored; refresh rotates and logout revokes. |
| Ownership/IDOR protection | **Verified** | Integration tests cover cross-user access. |
| Request validation | **Verified** | Strict Zod body/query/parameter schemas. |
| Centralized error handling | **Verified** | Unexpected errors are sanitized. |
| Test-support routes disabled | **Incomplete** | `/api/validation-test`, `/api/auth-test`, and `/api/test-resources` are mounted unconditionally. |
| CORS or same-origin production proxy | **Incomplete** | Current development flow relies on the Vite proxy. |
| Rate limiting and security headers | **Incomplete** | Not implemented. |
| Production server configuration | **Incomplete** | Docker Compose runs development servers (`tsx watch`, Vite), not production builds. |
| Token storage hardening | **Incomplete** | Tokens are stored in `localStorage`, which is exposed to XSS. |
| Email verification/password reset | **Incomplete** | Not implemented. |
| Backup/recovery procedure | **Incomplete** | Not defined. |
| HTTPS/TLS termination | **Incomplete** | No deployment configuration exists in the repository. |

## Proposed Deployment Path (Not Executed)

This is a minimal direction for a future deployment, not a tested procedure or a claim of production readiness:

1. Remove or disable the test-support routes.
2. Build the backend with `npm ci`, `npx prisma generate`, and `npm run build`; run `npx prisma migrate deploy` before starting `npm start` against a managed PostgreSQL instance.
3. Build the frontend with `npm ci` and `npm run build`; serve the static `dist` output from a web server or CDN.
4. Put the frontend and `/api` behind the same HTTPS origin, proxying `/api` to the backend. This preserves the current same-origin assumption without adding CORS.
5. Supply database credentials and JWT secrets through the hosting platform's secret store, and use separate values from local development.
6. Add rate limiting, security headers, request logging with secret redaction, backups, and a rollback plan before exposing the service publicly.

## Release Decision

**Not release-ready for public production use.** The executed lint, test, and build checks pass, but formatting checks fail, and the security hardening, test-route removal, production hosting configuration, and deployment verification items above remain incomplete. The repository is suitable for portfolio review with the limitations stated in the README.
