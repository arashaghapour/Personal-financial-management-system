import {
  getTotalBalance,
  getTotalIncome,
  getTotalExpenses,
  getExpensesByCategory,
  getIncomeByCategory,
  getRecentTransactions,
} from "./dashboard.repository.js";

export type DashboardQuery = {
  startDate?: string;
  endDate?: string;
};

export const getDashboard = async (
  userId: number,
  filters: DashboardQuery = {},
) => {
  const [
    totalBalance,
    totalIncome,
    totalExpenses,
    expenseByCategory,
    incomeByCategory,
    recentTransactions,
  ] = await Promise.all([
    getTotalBalance(userId),
    getTotalIncome(userId, filters),
    getTotalExpenses(userId, filters),
    getExpensesByCategory(userId, filters),
    getIncomeByCategory(userId, filters),
    getRecentTransactions(userId, filters),
  ]);

  const netCashFlow = totalIncome - totalExpenses;

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    netCashFlow,
    expenseByCategory,
    incomeByCategory,
    recentTransactions,
  };
};