# API Guide

The API is an Express REST API served under `http://localhost:3000/api`. The OpenAPI 3.0 document is [OpenAPI.yml](OpenAPI.yml).

## Where the documentation lives

There is no Swagger UI or Redoc page served by this application, and `http://localhost:3000/api` is the API base URL rather than an OpenAPI JSON endpoint. The OpenAPI file is the structured contract reference; the backend implementation remains the final source of truth.

To review it:

- Open [OpenAPI.yml](OpenAPI.yml) in an editor with YAML and OpenAPI support.
- Or import the file into a tool such as Swagger Editor.

Browser-based "Try it out" tools may be blocked when they call the API from another origin because the backend has no CORS middleware. The `curl` examples below work directly against the local API.

The backend implementation is the source of truth. See [OpenAPI maintenance notes](#openapi-maintenance-notes) for the small differences found during the documentation review.

## Conventions

- Requests and responses use JSON unless a response has no body.
- Protected endpoints require `Authorization: Bearer <access-token>`.
- The client must not send `userId`; the backend derives it from the access token. Unknown query parameters and body fields are rejected by strict Zod schemas.
- Account IDs are integers. Category, transaction, and budget IDs are UUIDs.
- Amounts in responses may be numeric strings because Prisma `Decimal` values are serialized by the database client.
- Dates sent to the API use `YYYY-MM-DD`. Timestamps in responses are ISO date-time strings.

### Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

`details` is present for request-validation errors. Internal errors return a generic `INTERNAL_SERVER_ERROR` response without implementation details.

Common status codes:

| Status | Meaning |
|---|---|
| `400` | Invalid request data, invalid ID format, category/type mismatch, or insufficient balance |
| `401` | Missing, expired, or invalid access token; invalid credentials; invalid refresh token |
| `404` | Resource not found, or a resource not owned by the authenticated user |
| `409` | Duplicate email, category, or budget; a referenced resource is still in use |
| `500` | Unexpected server error |

## Authentication

### Flow

1. `POST /api/auth/register` creates a user. It returns `201` with `{ "user": { ... } }` and does not log the user in.
2. `POST /api/auth/login` returns `200` with the public user, an access token, and a refresh token.
3. Send the access token on protected requests as `Authorization: Bearer <access-token>`.
4. When the access token expires, call `POST /api/auth/refresh` with the refresh token to receive a new access/refresh pair.
5. `POST /api/auth/logout` requires an access token and the current refresh token, revokes the refresh-token record, and returns `204`.
6. `GET /api/auth/me` returns the authenticated public user.

Passwords are hashed with Argon2id and must be at least 8 characters. Access and refresh tokens are JWTs signed with separate secrets. Refresh tokens are stored as hashes, rotated on refresh, and revoked on logout.

The frontend stores both tokens in `localStorage`, attaches the access token through its shared API client, retries a failed authenticated request once after a successful refresh, and clears the session if refresh fails.

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "<password-at-least-8-characters>",
    "firstName": "<first-name>",
    "lastName": "<last-name>"
  }'
```

Response (`201`):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "<first-name>",
    "lastName": "<last-name>",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

### Log in

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "<password>"
  }'
```

Response (`200`):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "<first-name>",
    "lastName": "<last-name>",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  },
  "accessToken": "<access-token>",
  "refreshToken": "<refresh-token>"
}
```

### Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<refresh-token>" }'
```

Response (`200`):

```json
{
  "accessToken": "<new-access-token>",
  "refreshToken": "<new-refresh-token>"
}
```

### Current user

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access-token>"
```

### Log out

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<refresh-token>" }'
```

Response: `204 No Content`.

## Endpoint groups

### Health

| Method | Path | Authentication |
|---|---|---|
| `GET` | `/api/health` | Public |

Returns `{ "status": "ok" }`. It does not check the database.

### Accounts

All account endpoints require authentication.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/accounts` | List the user's accounts |
| `POST` | `/api/accounts` | Create an account |
| `GET` | `/api/accounts/:id` | Get one account |
| `PATCH` | `/api/accounts/:id` | Update name or type |
| `DELETE` | `/api/accounts/:id` | Delete an account |

Create body: `name` (1–100 characters), `type` (`CASH`, `BANK`, `CREDIT_CARD`, `INVESTMENT`, `OTHER`), optional `initialBalance` (zero or greater, defaults to 0).

Example:

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Main bank", "type": "BANK", "initialBalance": 1000 }'
```

An account referenced by a transaction cannot be deleted (`409`).

### Categories

All category endpoints require authentication.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/categories` | List categories; optional `?type=INCOME` or `?type=EXPENSE` |
| `POST` | `/api/categories` | Create a category |
| `GET` | `/api/categories/:id` | Get one category |
| `PATCH` | `/api/categories/:id` | Update name or type |
| `DELETE` | `/api/categories/:id` | Delete a category |

Create body: `name` (1–100 characters) and `type` (`INCOME` or `EXPENSE`). Category names are unique per user and type. A category referenced by a transaction cannot be deleted (`409`); deleting a category with budgets cascades to those budgets according to the Prisma schema.

### Transactions

All transaction endpoints require authentication.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/transactions` | List and filter transactions |
| `POST` | `/api/transactions` | Create a transaction |
| `GET` | `/api/transactions/:id` | Get one transaction |
| `PATCH` | `/api/transactions/:id` | Update amount, description, date, account, or category |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |

List query parameters:

```text
type, accountId, categoryId, startDate, endDate,
minAmount, maxAmount, page, limit, sort
```

- `page` defaults to `1`; `limit` defaults to `20` and is capped at `100`.
- `sort` accepts `date_asc`, `date_desc`, `amount_asc`, `amount_desc`, `createdAt_asc`, or `createdAt_desc`. The default is `date_desc`.
- The response is `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }`.

Create body:

```json
{
  "type": "EXPENSE",
  "accountId": 1,
  "categoryId": "<expense-category-uuid>",
  "amount": 42.5,
  "description": "<optional-description>",
  "date": "2026-10-21"
}
```

The category type must match the transaction type. Creating an expense must not take the account balance below zero. Creating, updating, or deleting a transaction updates account balances in the same database transaction. The transaction type cannot be changed by `PATCH`.

### Budgets

All budget endpoints require authentication.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/budgets` | List budgets; filters: `year`, `month`, `categoryId` |
| `POST` | `/api/budgets` | Create a budget |
| `GET` | `/api/budgets/:id` | Get one budget |
| `PATCH` | `/api/budgets/:id` | Update the budget amount |
| `DELETE` | `/api/budgets/:id` | Delete a budget |
| `GET` | `/api/budgets/:id/progress` | Get calculated budget progress |

Create body:

```json
{
  "categoryId": "<expense-category-uuid>",
  "amount": 500,
  "year": 2026,
  "month": 10
}
```

Budgets can only use the user's expense categories. A user can have one budget per category, year, and month. The start date is the first day of the month for future/past months and the creation moment for the current month.

Progress response:

```json
{
  "budgetId": "<budget-uuid>",
  "budgetAmount": 500,
  "spentAmount": 120,
  "remainingAmount": 380,
  "percentageUsed": 24,
  "status": "UNDER_BUDGET"
}
```

Status thresholds in the implementation:

- `UNDER_BUDGET` below 90%.
- `NEAR_LIMIT` from 90% through exactly 100%.
- `OVER_BUDGET` above 100%.

### Dashboard

| Method | Path | Authentication |
|---|---|---|
| `GET` | `/api/dashboard` | Required |

Optional query parameters: `startDate`, `endDate` (`YYYY-MM-DD`).

Response fields: `totalBalance`, `totalIncome`, `totalExpenses`, `netCashFlow`, `expenseByCategory`, `incomeByCategory`, and `recentTransactions` (up to five). `totalBalance` is the sum of current account balances; the other totals respect the date filters.

### Reports

All report endpoints require authentication.

| Method | Path | Filters |
|---|---|---|
| `GET` | `/api/reports/summary` | `startDate`, `endDate` |
| `GET` | `/api/reports/expenses` | `startDate`, `endDate`, `categoryId` |
| `GET` | `/api/reports/cash-flow` | `startDate`, `endDate` |

Example:

```bash
curl "http://localhost:3000/api/reports/summary?startDate=2026-10-01&endDate=2026-10-31" \
  -H "Authorization: Bearer <access-token>"
```

- Summary returns total income, total expenses, net cash flow, and transaction counts.
- Expenses returns the expense total and category totals sorted by amount descending.
- Cash flow returns daily income, expenses, and net cash flow for dates with transactions.

If `categoryId` does not belong to the authenticated user, the expenses endpoint returns `404` with `NOT_FOUND`.

## Authorization model

The authentication middleware verifies the Bearer token and sets the request's user ID from the JWT subject. Controllers pass that ID to services, and Prisma queries include `userId` in their filters. A resource that does not exist or belongs to another user is treated as not found (`404`), which avoids confirming the existence of another user's records.

## Test-support routes

The application also mounts internal routes used by the test suite:

- `/api/validation-test`
- `/api/auth-test`
- `/api/test-resources`

These are not part of the product API and are not documented in the OpenAPI file. They are currently mounted unconditionally, so they must be removed or disabled before any public deployment.

## OpenAPI maintenance notes

The OpenAPI file describes the intended contract, but the following differences were found against the current implementation. The implementation is authoritative:

- `POST /api/auth/register` returns only `{ "user": ... }`; the spec references the login-shaped `AuthResponse`, which also includes tokens.
- Transaction `sort` values in the implementation are `date_asc`, `date_desc`, `amount_asc`, `amount_desc`, `createdAt_asc`, and `createdAt_desc`; the spec's transaction sort enum uses colon-separated values.
- The spec's `TokenResponse` includes optional `tokenType` and `expiresIn` fields that the implementation does not return.
- Account `balance` is serialized from a Prisma `Decimal` and may appear as a numeric string; the spec types it as a number.

These are documentation issues only. The API behavior was not changed during this review.
