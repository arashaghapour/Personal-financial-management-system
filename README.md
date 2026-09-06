# Personal Finance Management System

A web-based personal finance management system for managing and analyzing personal finances.

## Features

### 1. User Authentication

Users can:

- Register
- Log in and log out
- Manage their profile
- Access only their own financial data

### 2. Financial Accounts

Users can manage their financial accounts, such as:

- Bank accounts
- Cash
- Wallets

Each transaction belongs to one account.

### 3. Transactions

Users can:

- Create transactions
- View transactions
- Edit transactions
- Delete transactions

Each transaction contains:

- Amount
- Type
- Date
- Category
- Account
- Description

Transaction types:

- Income
- Expense

### 4. Categories

Users can create and manage categories for their transactions.

Examples:

- Food
- Transportation
- Rent
- Shopping
- Salary


### 5. Budgeting

Budgeting is **monthly**.

Each category can have **one budget per month**.

A budget contains:

- Category
- Budget amount
- Start date
- End date

#### Budget Rules

- The default budget period is from the first day to the last day of the month.
- A user can create a budget during the month.
- If a budget is created after the beginning of the month, its start date is the creation date.
- The budget will then apply from its start date until the end of that month.
- Spending is calculated only from the budget start date onward.
- Each category can have only one active budget for a given month.

The system calculates:

- Budget amount
- Amount spent
- Remaining budget
- Budget usage percentage

### 6. Financial Dashboard

The dashboard provides an overview of the user's financial situation, including:

- Current balance
- Total income
- Total expenses
- Net income
- Budget status
- Expenses by category
- Income vs. expenses

### 7. Reports

Users can view financial reports based on different time periods:

- Today
- This week
- This month
- Last month
- Custom date range

Reports may include:

- Total income
- Total expenses
- Net income
- Income by category
- Expenses by category
- Period comparisons

### 8. Search & Filtering

Users can search and filter transactions by:

- Text
- Type
- Category
- Account
- Amount range
- Date range

---

## MVP

The initial version includes:

- Authentication
- Financial accounts
- Transactions
- Categories
- Monthly budgeting
- Financial dashboard
- Reports
- Search and filtering

## Future Features

Possible future features include:

- Recurring transactions
- Financial goals
- Notifications
- Multiple currencies
- Import/export
- Bank integration
- Shared accounts
- Advanced analytics
- AI-powered financial insights
- Mobile/PWA application

---

## Project Status

🚧 Early Development

Requirements and features may evolve as the project develops.