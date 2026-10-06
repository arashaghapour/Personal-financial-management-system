import { Prisma } from "../../generated/prisma/client.js";

import { errorCodes } from "../../constants/error-codes.js";
import { AppError } from "../../utils/app-error.js";

import {
  getCashFlowByDate,
  getExpenseByCategory,
  getExpenseSummary,
  getIncomeSummary,
  findCategoryByIdAndUserId,
} from "./reports.repository.js";

import type {
  CashFlowData,
  CashFlowReport,
  ExpenseCategoryAggregation,
  ExpenseReportFilters,
  FinancialSummary,
  ReportDateFilters,
} from "./reports.types.js";

export const getSummary = async (
  userId: number,
  filters: ReportDateFilters = {},
): Promise<FinancialSummary> => {
  const [incomeSummary, expenseSummary] = await Promise.all([
    getIncomeSummary(userId, filters),
    getExpenseSummary(userId, filters),
  ]);

  const totalIncome = new Prisma.Decimal(
    incomeSummary.totalIncome,
  );

  const totalExpenses = new Prisma.Decimal(
    expenseSummary.totalExpenses,
  );

  const netCashFlow = totalIncome
    .minus(totalExpenses)
    .toString();

  return {
    totalIncome: totalIncome.toString(),
    totalExpenses: totalExpenses.toString(),
    netCashFlow,

    transactionCount:
      incomeSummary.transactionCount +
      expenseSummary.transactionCount,

    incomeTransactionCount:
      incomeSummary.transactionCount,

    expenseTransactionCount:
      expenseSummary.transactionCount,
  };
};

export const getExpensesReport = async (
  userId: number,
  filters: ExpenseReportFilters = {},
): Promise<{
  totalExpenses: string;
  categories: ExpenseCategoryAggregation[];
}> => {
  if (filters.categoryId !== undefined) {
    const category = await findCategoryByIdAndUserId(
      filters.categoryId,
      userId,
    );

    if (category === null) {
      throw new AppError(
        404,
        errorCodes.NOT_FOUND,
        "Category not found",
      );
    }
  }

  const [expenseSummary, categories] = await Promise.all([
    getExpenseSummary(userId, filters),
    getExpenseByCategory(userId, filters),
  ]);

  return {
    totalExpenses: expenseSummary.totalExpenses,
    categories,
  };
};

const createCashFlowData = (
  date: string,
  income: string,
  expenses: string,
): CashFlowData => {
  const incomeDecimal = new Prisma.Decimal(income);
  const expensesDecimal = new Prisma.Decimal(expenses);

  return {
    date,
    income: incomeDecimal.toString(),
    expenses: expensesDecimal.toString(),
    netCashFlow: incomeDecimal
      .minus(expensesDecimal)
      .toString(),
  };
};

export const getCashFlowReport = async (
  userId: number,
  filters: ReportDateFilters = {},
): Promise<CashFlowReport> => {
  const aggregation = await getCashFlowByDate(
    userId,
    filters,
  );

  const data = aggregation.map((item) =>
    createCashFlowData(
      item.date,
      item.income,
      item.expenses,
    ),
  );

  return {
    startDate:
      filters.startDate ??
      data[0]?.date ??
      "",

    endDate:
      filters.endDate ??
      data[data.length - 1]?.date ??
      "",

    data,
  };
};