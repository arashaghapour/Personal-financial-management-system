# System Architecture

## 1. Overview

The Personal Finance Management System is a web-based application for managing and analyzing personal finances.

The system is a full-stack web application consisting of:

- Frontend
- Backend
- Relational Database

The main features include:

- User authentication
- Financial account management
- Income and expense transactions
- Category management
- Budget management
- Financial dashboard
- Financial reports
- Transaction search and filtering

The frontend communicates with the backend through a RESTful API.

---

# 2. High-Level Architecture

The overall system follows a client-server architecture.

```text
                        User
                          |
                          v
                +------------------+
                |     Frontend     |
                |                  |
                | React + TypeScript|
                +--------+---------+
                         |
                    HTTP / JSON
                         |
                         v
                +------------------+
                |     Backend      |
                |                  |
                | Node.js + Express|
                +--------+---------+
                         |
                       Prisma
                         |
                         v
                +------------------+
                |     Database     |
                |                  |
                |   PostgreSQL     |
                +------------------+
```

The frontend and backend are separated and communicate through the API.

---

# 3. Frontend Architecture

The frontend is responsible for the user interface and user interaction.

The frontend architecture is organized around the following main layers:

```text
                        Frontend
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
        Pages         Components         Layouts
          |                |
          +--------+-------+
                   |
                   v
                 Hooks
                   |
          +--------+--------+
          |                 |
          v                 v
    Server State         UI State
          |                 |
          v                 v
      API Client        Local State
          |
          v
       Backend API
```

## 3.1 Pages

Pages represent the main screens of the application.

Examples:

- Login
- Register
- Dashboard
- Accounts
- Transactions
- Categories
- Budgets
- Reports

Example:

```text
Dashboard
├── Balance Summary
├── Income Summary
├── Expense Summary
├── Budget Progress
└── Financial Charts
```

Pages are responsible for composing components and presenting the appropriate application view.

---

## 3.2 Components

Components are reusable UI elements.

Examples:

- Button
- Input
- Modal
- Table
- Card
- Form
- Chart
- Transaction Card
- Account Card

Components should generally be reusable and should avoid containing unnecessary business logic.

Example:

```text
Transaction Page
│
├── Transaction Filters
├── Transaction Table
│   ├── Transaction Row
│   ├── Transaction Row
│   └── Transaction Row
│
└── Add Transaction Button
```

---

## 3.3 Layouts

Layouts define the common structure of different pages.

For example, authenticated application pages can use a dashboard layout:

```text
DashboardLayout
├── Sidebar
├── Navbar
└── Page Content
```

Authentication pages can use a separate layout:

```text
AuthLayout
└── Authentication Content
```

---

## 3.4 Features

Features organize functionality according to the application's business capabilities.

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

Each feature can contain its own:

- Components
- Hooks
- API functions
- Types
- Validation schemas
- Business-related frontend logic

This keeps related functionality together.

---

## 3.5 Hooks

Hooks contain reusable React logic.

Examples:

- Fetching transactions
- Creating a transaction
- Updating an account
- Managing authentication
- Managing form-related logic

Example:

```text
Component
    |
    v
Custom Hook
    |
    v
API / State
```

Hooks help keep components focused primarily on UI.

---

## 3.6 State Management

Frontend state is divided into different categories.

### UI State

State related to the user interface.

Examples:

- Modal open/closed
- Sidebar state
- Selected tab
- Filters
- Theme

### Server State

Data received from the backend.

Examples:

- Transactions
- Accounts
- Categories
- Budgets
- Reports
- Dashboard data

### Authentication State

Information related to the authenticated user.

Examples:

- Current user
- Access token
- Authentication status

### Form State

Data entered into forms.

Examples:

- Login form
- Register form
- Transaction form
- Budget form

Different types of state should be managed using appropriate tools rather than putting all application state into a single global store.

---

## 3.7 API Client

The API client is responsible for communication between the frontend and backend.

```text
Frontend
   |
   v
API Client
   |
   | HTTP / JSON
   v
REST API
   |
   v
Backend
```

The API client handles operations such as:

- Sending requests
- Adding authentication headers
- Receiving responses
- Handling HTTP errors
- Refreshing expired access tokens when necessary

---

## 3.8 Schemas

Schemas define the expected structure of frontend data, especially form input.

Examples:

- Login schema
- Register schema
- Transaction schema
- Budget schema

Validation occurs before invalid data is sent to the backend.

```text
Form
  |
  v
Schema Validation
  |
  +---- Invalid ----> Display Error
  |
  v
API Request
```

---

## 3.9 Types

TypeScript types describe the structure of application data.

Examples:

```text
User
Account
Category
Transaction
Budget
Dashboard
Report
```

Types help maintain consistency between different parts of the frontend.

They can also be aligned with the API contract defined by OpenAPI.

---

## 3.10 Utils

The `utils` layer contains reusable general-purpose functions.

Examples:

- Date formatting
- Currency formatting
- Number formatting
- General helper functions

Utilities should not contain feature-specific business logic.

---

# 4. Backend Architecture

The backend follows a layered architecture:

```text
Client
  |
  v
Routes
  |
  v
Middleware
  |
  v
Controllers
  |
  v
Services
  |
  v
Data Access / Prisma
  |
  v
Database
```

Each layer has a specific responsibility.

---

## 4.1 Routes

The routes layer defines the API endpoints and HTTP methods.

Examples:

```text
POST   /api/auth/login

GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/:id
PATCH  /api/accounts/:id
DELETE /api/accounts/:id

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/budgets
POST   /api/budgets
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
```

Routes should not contain business logic.

---

## 4.2 Middleware

Middleware processes requests before they reach the controllers.

Main responsibilities include:

- Authentication
- Request validation
- Error handling
- Security-related processing

For protected endpoints, the authentication middleware verifies the access token.

```text
Request
   |
   v
Authentication Middleware
   |
   v
Validation Middleware
   |
   v
Controller
```

---

## 4.3 Controllers

Controllers handle HTTP-related operations.

Responsibilities:

- Receive the HTTP request
- Read path parameters
- Read query parameters
- Read request body
- Call the appropriate service
- Return the HTTP response

Controllers should contain minimal business logic.

```text
HTTP Request
     |
     v
Controller
     |
     v
Service
     |
     v
HTTP Response
```

---

## 4.4 Services

The service layer contains the main business logic of the application.

Examples:

- Creating transactions
- Updating transactions
- Validating business rules
- Managing account balances
- Creating budgets
- Calculating budget progress
- Generating financial reports
- Preparing dashboard data

Example transaction flow:

```text
Create Transaction
       |
       v
Check Account
       |
       v
Check Category
       |
       v
Validate Business Rules
       |
       v
Create Transaction
       |
       v
Update Account Balance
```

---

## 4.5 Data Access

The data access layer is responsible for communicating with the database.

Prisma ORM is used for database access.

Responsibilities include:

- Querying data
- Creating records
- Updating records
- Deleting records
- Loading related data

```text
Service
   |
   v
Prisma
   |
   v
Database
```

---

# 5. Database

The system uses a relational database.

The main entities include:

```text
User
Account
Category
Transaction
Budget
RefreshToken
```

The relationships between these entities are defined in the relational data model.

---

# 6. Authentication

Authentication is based on access tokens and refresh tokens.

```text
Login
  |
  v
Access Token + Refresh Token
  |
  +----------------------+
  |                      |
  v                      v
Normal API Requests    Refresh Request
  |                      |
  v                      v
Backend                New Access Token
```

Protected requests include the access token in the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

The authenticated user's identity is obtained from the access token.

The client does not send `userId` for protected resources.

---

# 7. API Contract

The API contract is defined using OpenAPI.

The `openapi.yml` file specifies:

- Available endpoints
- HTTP methods
- Request parameters
- Request body
- Authentication requirements
- Response structures
- HTTP status codes
- Error responses
- Data schemas

The frontend and backend use the OpenAPI specification as the contract between them.

```text
                 openapi.yml
                      |
                API Contract
                 /       \
                /         \
               v           v
          Frontend       Backend
```

---

# 8. Frontend-Backend Communication

The frontend communicates with the backend through HTTP requests.

Example:

```text
User
 |
 v
Transactions Page
 |
 v
Transaction Hook
 |
 v
API Client
 |
 | GET /api/transactions
 v
Backend
 |
 v
Authentication Middleware
 |
 v
Controller
 |
 v
Service
 |
 v
Prisma
 |
 v
Database
```

The response then travels back to the frontend:

```text
Database
   |
   v
Prisma
   |
   v
Service
   |
   v
Controller
   |
   v
JSON Response
   |
   v
API Client
   |
   v
Hook
   |
   v
Component
   |
   v
UI
```

---

# 9. Request Flow

A typical protected API request follows this flow:

```text
Client
  |
  | HTTP Request
  v
Frontend API Client
  |
  v
Backend Route
  |
  v
Authentication Middleware
  |
  v
Validation
  |
  v
Controller
  |
  v
Service
  |
  v
Prisma
  |
  v
Database
  |
  v
Prisma
  |
  v
Service
  |
  v
Controller
  |
  v
JSON Response
  |
  v
Frontend API Client
  |
  v
Frontend State
  |
  v
UI
```

---

# 10. Error Handling

Errors are handled centrally through error-handling middleware in the backend.

```text
Controller / Service
        |
        v
      Error
        |
        v
Error Handling Middleware
        |
        v
Standard Error Response
        |
        v
Frontend
        |
        v
Display Error
```

The API uses a consistent error response structure.

Example:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Transaction not found"
  }
}
```

The frontend can use the error code and message to provide appropriate feedback to the user.

---

# 11. Validation

Validation exists on both frontend and backend.

Frontend validation provides immediate feedback to the user.

Backend validation provides the final protection for the API.

```text
Frontend Form
      |
      v
Frontend Validation
      |
      v
API Request
      |
      v
Backend Validation
      |
      v
Business Logic
```

Frontend validation does not replace backend validation.

---

# 12. Project Structure

The overall project structure is:

```text
personal-finance-system/
|
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── features/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── tests/
│
├── openapi.yml
├── README.md
└── .gitignore
```

---

# 13. Dependency Direction

The frontend follows this general dependency direction:

```text
Pages
  |
  v
Components
  |
  v
Hooks
  |
  v
API Client / State
```

The backend follows:

```text
Routes
  |
  v
Controllers
  |
  v
Services
  |
  v
Data Access
  |
  v
Database
```

The two applications communicate only through the API contract.

```text
Frontend
    |
    | HTTP / JSON
    v
Backend
    |
    v
Database
```

---

# 14. Main Technologies

The technology stack will be finalized after evaluating the technical requirements of the project.

The current candidates include:

| Concern | Technology |
|---|---|
| Frontend Framework | React |
| Frontend Language | TypeScript |
| Frontend Build Tool | Vite |
| Routing | React Router |
| Server State | TanStack Query |
| Form Management | React Hook Form |
| Validation | Zod |
| Backend Runtime | Node.js |
| Backend Language | TypeScript |
| Backend Framework | Express |
| API Style | REST |
| API Specification | OpenAPI |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT |
| Password Hashing | Argon2 / bcrypt |
| Backend Testing | Vitest / Jest + Supertest |
| Frontend Testing | Vitest + Testing Library |

These technologies are subject to final evaluation before implementation.

---

# 15. Architectural Goals

The architecture is designed to provide:

- Separation of concerns
- Maintainability
- Testability
- Clear frontend-backend boundaries
- Reusable frontend components
- Organized business features
- Secure authentication
- Consistent API communication
- Consistent error handling
- Easy future expansion
- Independent frontend and backend development
- Clear API contracts through OpenAPI