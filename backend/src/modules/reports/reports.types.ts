export type ReportDateFilters = {
  startDate?: string;
  endDate?: string;
};

export type ExpenseReportFilters = ReportDateFilters & {
  categoryId?: string;
};

export type IncomeSummary = {
  totalIncome: string;
  transactionCount: number;
};

export type ExpenseSummary = {
  totalExpenses: string;
  transactionCount: number;
};

export type FinancialSummary = {
  totalIncome: string;
  totalExpenses: string;
  netCashFlow: string;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
};

export type ExpenseCategoryAggregation = {
  categoryId: string;
  categoryName: string;
  amount: string;
  transactionCount: number;
};

export type CashFlowAggregation = {
  date: string;
  income: string;
  expenses: string;
};

export type CashFlowData = {
  date: string;
  income: string;
  expenses: string;
  netCashFlow: string;
};

export type CashFlowReport = {
  startDate: string;
  endDate: string;
  data: CashFlowData[];
};