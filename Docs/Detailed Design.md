# Detailed Design

## 1. Overview

This document defines the detailed design of the Personal Finance Management System based on the approved system architecture, domain model, and OpenAPI specification.

The purpose of this document is to define the internal structure and responsibilities of the system components without changing the previously defined API contract or system architecture.

The system consists of:

- React + TypeScript frontend
- Node.js + Express + TypeScript backend
- Prisma ORM
- PostgreSQL relational database
- REST API defined by `openapi.yml`

The system follows a layered architecture on the backend and a feature-oriented architecture on the frontend.

---

# 2. Backend Detailed Design

## 2.1 Backend Module Structure

The backend is organized by business modules.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── dashboard/
│   │   └── reports/
│   │
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   └── app.ts
│
├── prisma/
│   └── schema.prisma
│
└── package.json
```

Each module contains the implementation related to one system feature.

Example:

```text
transactions/
├── transaction.routes.ts
├── transaction.controller.ts
├── transaction.service.ts
├── transaction.repository.ts
├── transaction.validator.ts
└── transaction.types.ts
```

This structure keeps feature-specific logic together and reduces unnecessary coupling between modules.

---

## 2.2 Backend Layered Architecture

The backend follows this request flow:

```text
Client
  ↓
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL
```

Each layer has a specific responsibility.

### Route

Defines HTTP endpoints and connects them to middleware and controllers.

Routes must not contain business logic.

### Middleware

Handles cross-cutting HTTP concerns such as:

- Authentication
- Request validation
- Error handling
- Security-related processing

### Controller

Handles HTTP-related responsibilities:

- Reading request parameters
- Reading query parameters
- Reading request body
- Obtaining authenticated user identity
- Calling services
- Returning HTTP responses

Controllers should contain minimal business logic.

### Service

Contains the main business logic and business rules of the application.

Services coordinate operations that may involve multiple repositories.

### Repository

Provides data-access operations for a module.

Repositories isolate the business logic from direct Prisma/database operations.

### Prisma

Provides ORM-based access to PostgreSQL.

### PostgreSQL

Stores the persistent application data.

---

# 2.3 Route Design

The backend API follows the endpoints defined in `openapi.yml`.

```text
/api
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /refresh
│   ├── POST   /logout
│   └── GET    /me
│
├── /accounts
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── /categories
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── /transactions
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── /budgets
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── GET    /:id/progress
│
├── /dashboard
│   └── GET    /
│
└── /reports
    ├── GET    /summary
    ├── GET    /expenses
    └── GET    /cash-flow
```

The API contract is defined by `openapi.yml`.

---

# 2.4 Middleware Design

## Authentication Middleware

Protected endpoints require a Bearer access token.

```text
Authorization: Bearer <access-token>
```

The authentication middleware:

1. Reads the Authorization header.
2. Extracts the access token.
3. Verifies the JWT.
4. Extracts the authenticated user's identity.
5. Makes the authenticated user ID available to subsequent layers.
6. Rejects invalid or missing authentication.

The client must not provide `userId` for protected resources.

The authenticated user's identity is derived from the JWT.

---

## Validation Middleware

Request data is validated before reaching the controller.

Examples of validation rules include:

- UUID format
- Positive transaction amount
- Valid enum values
- Valid dates
- Password minimum length
- Description maximum length
- Valid budget month

Backend validation is mandatory even when frontend validation exists.

---

## Error Middleware

Errors are handled centrally and converted into the standard API error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Internal implementation details must not be exposed to clients.

---

# 2.5 Controller Design

Controllers provide the HTTP interface to services.

Example transaction flow:

```text
transaction.routes.ts
        ↓
transaction.controller.ts
        ↓
transaction.service.ts
```

The transaction controller is responsible for:

- Reading transaction filters
- Reading transaction request bodies
- Reading transaction IDs
- Obtaining authenticated user ID
- Calling the transaction service
- Returning the appropriate HTTP response

Business rules such as balance modification must remain in the service layer.

---

# 2.6 Service Design

Services contain the business rules of the system.

Main service areas include:

```text
AuthService
AccountService
CategoryService
TransactionService
BudgetService
DashboardService
ReportService
```

Examples of transaction service operations:

```text
createTransaction()
getTransactions()
getTransactionById()
updateTransaction()
deleteTransaction()
```

Services may coordinate multiple repositories when an operation affects multiple entities.

---

# 2.7 Repository Design

Repositories provide data-access operations.

Example:

```text
transaction.repository.ts

findMany()
findById()
create()
update()
delete()
```

Account and Category repositories can be used by the Transaction Service when transaction operations require validation or balance updates.

The Service layer determines which operations need to be performed; the Repository layer performs the required database operations.

---

# 2.8 Validation Design

Validation is performed on both frontend and backend.

Frontend validation improves user experience.

Backend validation provides the security and integrity boundary of the system.

Examples:

```text
Register
→ email valid
→ password length >= 8

Transaction
→ amount > 0
→ valid type
→ valid accountId
→ valid categoryId when provided
→ valid date
→ description <= 500 characters

Budget
→ amount > 0
→ month between 1 and 12
```

---

# 2.9 Authentication Design

The authentication system uses:

```text
Access Token
+
Refresh Token
```

After successful login, the API returns an `AuthResponse`.

Protected requests use the access token:

```text
Authorization: Bearer <access-token>
```

The refresh endpoint is used to obtain a new access token when the current access token expires.

Logout requires authentication and invalidates the user's refresh-token session according to the authentication implementation.

Passwords are never stored as plain text.

A password hashing algorithm such as Argon2 or bcrypt is used.

---

# 2.10 Authorization and Resource Ownership

Protected resources belong to the authenticated user.

The client does not provide `userId`.

Instead:

```text
JWT
 ↓
Authenticated User ID
 ↓
Service / Repository
 ↓
User-owned Resource
```

For example, when retrieving a transaction:

```text
transaction.id = requestedId
AND
transaction.userId = authenticatedUserId
```

A resource belonging to another user must not be accessible.

The API uses `404 Not Found` for resources that either do not exist or do not belong to the authenticated user.

---

# 2.11 Business Rules

## Transaction Rules

### Income

When an Income Transaction is created:

```text
Account Balance += Transaction Amount
```

### Expense

When an Expense Transaction is created:

```text
Account Balance -= Transaction Amount
```

An Expense cannot exceed the current Account Balance.

If:

```text
Expense Amount > Account Balance
```

the operation is rejected.

The Transaction must not be created and the Account Balance must remain unchanged.

The API returns an appropriate error, such as:

```text
INSUFFICIENT_BALANCE
```

---

## Transaction Update

When a Transaction is updated, its previous effect on the Account Balance must be reversed before the new effect is applied.

Conceptually:

```text
Current Balance
      ↓
Reverse Old Transaction Effect
      ↓
Apply New Transaction Effect
      ↓
Updated Balance
```

Example:

```text
Current Balance = 8,000
Old Expense = 2,000
New Expense = 3,000
```

Result:

```text
8,000 + 2,000 - 3,000 = 7,000
```

The operation must also correctly handle changes to the account associated with a transaction.

---

## Transaction Deletion

When a Transaction is deleted, its previous effect on the Account Balance must be reversed.

For an Expense:

```text
Balance += Expense Amount
```

For an Income:

```text
Balance -= Income Amount
```

---

## Category Ownership

Each Category belongs to a specific User.

A user can only access and use their own Categories.

A Category belonging to another user cannot be used for the user's Transactions.

---

## Budget Rules

A Budget is associated with a Category and a specific year/month.

Budget progress is calculated using:

```text
percentageUsed =
(spentAmount / budgetAmount) × 100
```

The Budget status is determined as follows:

```text
percentageUsed < 90%
    → UNDER_BUDGET

90% <= percentageUsed < 100%
    → NEAR_LIMIT

percentageUsed >= 100%
    → OVER_BUDGET
```

Therefore:

```text
0% - 89.99%
→ UNDER_BUDGET

90% - 99.99%
→ NEAR_LIMIT

100% and above
→ OVER_BUDGET
```

When spending approaches the budget limit, the system exposes the corresponding warning status through the Budget Progress response.

---

# 2.12 Database Transaction Design

Operations that modify both Transactions and Account Balances must use database transactions.

The goal is to guarantee atomicity:

```text
All operations succeed
        OR
All operations are rolled back
```

## Create Expense

```text
Begin Database Transaction
        ↓
Validate Account
        ↓
Check Available Balance
        ↓
Create Expense Transaction
        ↓
Decrease Account Balance
        ↓
Commit
```

If the balance is insufficient, the operation is rejected before the transaction is committed.

---

## Create Income

```text
Begin Database Transaction
        ↓
Create Income Transaction
        ↓
Increase Account Balance
        ↓
Commit
```

---

## Update Transaction

```text
Begin Database Transaction
        ↓
Read Existing Transaction
        ↓
Reverse Old Balance Effect
        ↓
Validate New Transaction
        ↓
Apply New Balance Effect
        ↓
Update Transaction
        ↓
Commit
```

---

## Delete Transaction

```text
Begin Database Transaction
        ↓
Read Existing Transaction
        ↓
Reverse Its Balance Effect
        ↓
Delete Transaction
        ↓
Commit
```

This prevents inconsistent states such as:

```text
Transaction created
+
Balance not updated
```

---

# 3. Frontend Detailed Design

## 3.1 Frontend Structure

```text
frontend/
└── src/
    ├── app/
    ├── pages/
    ├── components/
    ├── layouts/
    ├── features/
    ├── services/
    ├── hooks/
    ├── schemas/
    ├── types/
    └── utils/
```

The frontend follows a feature-oriented structure.

---

# 3.2 Application Layer

```text
app/
├── App.tsx
├── router.tsx
└── providers.tsx
```

### App.tsx

Provides the main application component.

### router.tsx

Defines application routes.

### providers.tsx

Contains application-level providers such as those required for server-state management.

---

# 3.3 Page Design

Pages represent complete application screens.

```text
pages/
├── LoginPage.tsx
├── RegisterPage.tsx
├── DashboardPage.tsx
├── AccountsPage.tsx
├── TransactionsPage.tsx
├── CategoriesPage.tsx
├── BudgetsPage.tsx
└── ReportsPage.tsx
```

Pages compose Components and Hooks rather than implementing complex business logic themselves.

---

# 3.4 Layout Design

Two primary layouts are used.

```text
layouts/
├── AuthLayout.tsx
└── DashboardLayout.tsx
```

`AuthLayout` is used for authentication-related pages.

`DashboardLayout` provides the common structure for authenticated application pages.

Example:

```text
DashboardLayout
├── Header
├── Sidebar
└── Page Content
```

---

# 3.5 Feature Design

Feature-specific code is grouped under `features`.

```text
features/
├── auth/
├── accounts/
├── transactions/
├── categories/
├── budgets/
├── dashboard/
└── reports/
```

Example:

```text
features/transactions/
├── components/
├── hooks/
├── api/
├── schemas/
├── types/
└── utils/
```

This structure keeps Transaction-specific implementation separate from unrelated features.

---

# 3.6 Component Design

Components provide reusable UI elements.

Example:

```text
features/transactions/components/
├── TransactionForm.tsx
├── TransactionTable.tsx
├── TransactionItem.tsx
└── TransactionFilters.tsx
```

Components should focus primarily on presentation and user interaction.

Complex business logic belongs in Hooks or the Backend Service layer.

---

# 3.7 Hook Design

Hooks contain reusable React logic.

Example:

```text
features/transactions/hooks/
├── useTransactions.ts
├── useCreateTransaction.ts
├── useUpdateTransaction.ts
└── useDeleteTransaction.ts
```

Hooks act as the bridge between Components and application services/API operations.

Example:

```text
TransactionsPage
      ↓
useTransactions()
      ↓
transactionApi
      ↓
apiClient
```

---

# 3.8 Server State Design

Server state is managed using TanStack Query.

Examples:

```text
Transactions
Accounts
Categories
Budgets
Dashboard
Reports
```

TanStack Query is responsible for:

- Fetching server data
- Caching
- Loading state
- Error state
- Refetching
- Query invalidation

After a successful mutation, related queries are invalidated when necessary so the UI can obtain updated server data.

Example:

```text
Create Transaction
       ↓
Success
       ↓
Invalidate Transactions Query
       ↓
Refetch
       ↓
Updated UI
```

---

# 3.9 UI State Design

UI-only state is managed locally using React state where appropriate.

Examples:

```text
Modal open/closed
Selected tab
Sidebar state
Temporary UI selections
```

UI state does not need to be stored in server-state management.

---

# 3.10 Form State Design

Forms are managed using React Hook Form.

Validation schemas are defined using Zod.

Example:

```text
TransactionForm
      ↓
React Hook Form
      ↓
Zod Validation
      ↓
Submit
      ↓
Mutation Hook
      ↓
API
```

Frontend validation improves the user experience, but the backend remains responsible for authoritative validation.

---

# 3.11 API Client Design

The API Client provides a centralized mechanism for communication with the backend.

```text
Feature API
    ↓
API Client
    ↓
HTTP Request
    ↓
Backend
```

The API Client is responsible for common HTTP concerns such as:

- Base URL
- Request headers
- Authorization header
- Response processing
- Error processing
- Authentication token handling

Feature-specific API functions should use the centralized API Client rather than implementing HTTP communication independently.

---

# 3.12 Authentication Flow

Login flow:

```text
LoginPage
    ↓
Authentication Hook
    ↓
POST /auth/login
    ↓
Backend
    ↓
AuthResponse
```

Protected requests:

```text
API Client
    ↓
Authorization: Bearer <access-token>
    ↓
Backend
```

When the access token expires, the API Client can use:

```text
POST /auth/refresh
```

to obtain a new access token and retry the original request when appropriate.

If the refresh operation fails, the frontend should terminate the authenticated session and redirect the user to the login page.

---

# 3.13 Routing Design

Frontend routes:

```text
/login
/register

/dashboard
/accounts
/transactions
/categories
/budgets
/reports
```

Authenticated pages are protected.

Conceptually:

```text
ProtectedRoute
      ↓
Is user authenticated?
      ├── Yes → Application Page
      └── No  → /login
```

---

# 3.14 Loading and Error States

API-driven pages must account for:

```text
Loading
Success
Error
```

Example:

```text
useTransactions()
      ├── Loading
      ├── Success
      └── Error
```

During loading, the UI displays an appropriate loading state.

During success, the received data is displayed.

During failure, a user-friendly error message is displayed.

Backend error codes can be mapped to appropriate frontend messages.

For example:

```text
INSUFFICIENT_BALANCE
        ↓
"Insufficient account balance"
```

---

# 4. Cross-Cutting Concerns

## 4.1 Configuration

Application configuration is provided through environment variables rather than hard-coded values.

Backend configuration may include:

```text
PORT
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN
```

Frontend configuration may include:

```text
VITE_API_BASE_URL
```

---

# 4.2 Environment Variables

Sensitive values must not be committed to source control.

The project uses:

```text
.env
```

for actual environment-specific values and:

```text
.env.example
```

as a template.

Secrets must not be included in `.env.example`.

---

# 4.3 Logging

The backend should provide structured logging for important application events.

Examples:

```text
Server startup
Database connection
Authentication failures
Validation failures
Unexpected errors
```

Sensitive information must never be logged.

Examples of information that must not be logged:

```text
Passwords
Access Tokens
Refresh Tokens
JWT Secrets
```

---

# 4.4 Security

The application follows the following security principles:

- Password hashing
- JWT-based authentication
- Resource ownership checks
- Input validation
- Centralized error handling
- Appropriate CORS configuration
- Security headers
- HTTPS in production
- No exposure of internal implementation details

Authentication and authorization are separate concerns:

```text
Authentication
→ Who is the user?

Authorization
→ Can this user access this resource?
```

---

# 5. Testing Design

Testing is performed at multiple levels.

## 5.1 Backend Unit Tests

Unit tests focus on business logic.

Important scenarios include:

```text
Income increases balance
Expense decreases balance
Expense greater than balance is rejected
Update correctly adjusts balance
Delete correctly reverses balance effect
Budget status is calculated correctly
```

---

## 5.2 Backend Integration Tests

Integration tests verify multiple backend layers together.

Example:

```text
HTTP Request
    ↓
Route
    ↓
Middleware
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Important API scenarios include:

- Authentication
- Resource ownership
- Transaction creation
- Transaction update
- Transaction deletion
- Balance consistency
- Budget progress
- Error responses

Supertest can be used for HTTP integration testing.

---

## 5.3 Frontend Tests

Frontend tests focus on important components and user interactions.

Examples:

```text
TransactionForm
AccountForm
LoginForm
Budget UI
```

Important scenarios include:

- Invalid form data
- Valid form submission
- API success
- API failure
- Loading states
- Error states
- Authentication behavior

Vitest and Testing Library can be used for frontend testing.

---

# 5.4 Critical Business Rule Tests

The following scenarios are considered high-priority tests:

| Scenario | Expected Result |
|---|---|
| Create Income | Account Balance increases |
| Create Expense with sufficient balance | Account Balance decreases |
| Create Expense greater than balance | Operation rejected |
| Rejected Expense | Transaction is not created |
| Update Transaction | Previous effect is reversed and new effect applied |
| Delete Expense | Expense effect is reversed |
| Delete Income | Income effect is reversed |
| Access another user's resource | `404 Not Found` |
| Budget usage < 90% | `UNDER_BUDGET` |
| Budget usage 90%–<100% | `NEAR_LIMIT` |
| Budget usage >= 100% | `OVER_BUDGET` |

---

# 6. Final Project Structure

```text
personal-finance-system/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AccountsPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── BudgetsPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx
│   │   │   └── DashboardLayout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── ui/
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   ├── dashboard/
│   │   │   └── reports/
│   │   │
│   │   ├── services/
│   │   │   └── apiClient.ts
│   │   │
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── accounts/
│   │   │   ├── categories/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── dashboard/
│   │   │   └── reports/
│   │   │
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── utils/
│   │   └── app.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── tests/
│   ├── backend/
│   └── frontend/
│
├── openapi.yml
├── README.md
├── .gitignore
└── .env.example
```

---

# 7. Design Principles

The detailed design follows these principles:

1. **Separation of Concerns**  
   Each layer has a clearly defined responsibility.

2. **Feature Isolation**  
   Feature-specific code is grouped together.

3. **API Contract Consistency**  
   Frontend and backend communicate according to `openapi.yml`.

4. **Business Logic Centralization**  
   Core business rules are implemented in backend services.

5. **Data Consistency**  
   Related financial database operations use database transactions.

6. **Resource Ownership**  
   Users can only access their own resources.

7. **Reusable Frontend Logic**  
   Common React logic is extracted into Hooks and reusable Components.

8. **Server State Separation**  
   Server state is separated from UI state and form state.

9. **Centralized API Communication**  
   HTTP communication is handled through a common API Client.

10. **Testability**  
    Business logic and important user-facing behavior are designed to be independently testable.

---

# 8. Relationship Between Design Documents

The project's design documents have different responsibilities.

```text
Requirements
     ↓
Domain Model
     ↓
API Design
     ↓
System Architecture
     ↓
Detailed Design
     ↓
Implementation
```

### Domain Model

Defines the main entities and relationships.

### API Design

Defines the external API contract:

- Endpoints
- HTTP methods
- Request data
- Response data
- API errors

### System Architecture

Defines the high-level structure of the system:

- Frontend
- Backend
- Database
- Layers
- Technologies
- Major responsibilities

### Detailed Design

Defines how the architecture is implemented internally:

- Module structure
- Layer responsibilities
- Business rules
- Database transaction behavior
- Frontend structure
- State management
- Authentication flow
- Error handling
- Testing strategy

The Detailed Design does not replace the API Design or System Architecture. It builds on them and provides the implementation-level decisions required before coding.