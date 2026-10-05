import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboard } from "../../../src/modules/dashboard/dashboard.service.js";

import * as dashboardRepository from "../../../src/modules/dashboard/dashboard.repository.js";

vi.mock("../../../src/modules/dashboard/dashboard.repository.js", () => ({
  getTotalBalance: vi.fn(),
  getTotalIncome: vi.fn(),
  getTotalExpenses: vi.fn(),
  getExpensesByCategory: vi.fn(),
  getIncomeByCategory: vi.fn(),
  getRecentTransactions: vi.fn(),
}));

describe("Dashboard service - empty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty dashboard for user with no financial data", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result).toEqual({
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      expenseByCategory: [],
      incomeByCategory: [],
      recentTransactions: [],
    });
  });
});

describe("Dashboard service - balance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return total balance from dashboard repository", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(2500);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.totalBalance).toBe(2500);

    expect(
      dashboardRepository.getTotalBalance,
    ).toHaveBeenCalledWith(userId);
  });

  it("should calculate total balance independently from date filters", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(2500);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });

    expect(result.totalBalance).toBe(2500);

    expect(
      dashboardRepository.getTotalBalance,
    ).toHaveBeenCalledWith(userId);

    expect(
      dashboardRepository.getTotalBalance,
    ).not.toHaveBeenCalledWith(
      userId,
      expect.anything(),
    );
  });
});

describe("Dashboard service - income", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return total income from dashboard repository", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(500);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.totalIncome).toBe(3000);

    expect(
      dashboardRepository.getTotalIncome,
    ).toHaveBeenCalledWith(userId, {});
  });

  it("should pass date filters to total income query", async () => {
    const userId = 1;

    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, filters);

    expect(result.totalIncome).toBe(3000);

    expect(
      dashboardRepository.getTotalIncome,
    ).toHaveBeenCalledWith(
      userId,
      filters,
    );
  });
});

describe("Dashboard service - expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return total expenses from dashboard repository", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(2000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(1000);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.totalExpenses).toBe(1000);

    expect(
      dashboardRepository.getTotalExpenses,
    ).toHaveBeenCalledWith(userId, {});
  });

  it("should pass date filters to total expenses query", async () => {
    const userId = 1;

    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(2000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(1000);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, filters);

    expect(result.totalExpenses).toBe(1000);

    expect(
      dashboardRepository.getTotalExpenses,
    ).toHaveBeenCalledWith(
      userId,
      filters,
    );
  });
});

describe("Dashboard service - net cash flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate positive net cash flow", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(5000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(3200);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.netCashFlow).toBe(1800);
  });

  it("should calculate negative net cash flow", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(4500);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.netCashFlow).toBe(-1500);
  });

  it("should calculate zero net cash flow when income equals expenses", async () => {
    const userId = 1;

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.netCashFlow).toBe(0);
  });

  it("should pass the same date filters to income and expense queries", async () => {
    const userId = 1;

    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(2500);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(5000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(3200);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, filters);

    expect(result.netCashFlow).toBe(1800);

    expect(
      dashboardRepository.getTotalIncome,
    ).toHaveBeenCalledWith(
      userId,
      filters,
    );

    expect(
      dashboardRepository.getTotalExpenses,
    ).toHaveBeenCalledWith(
      userId,
      filters,
    );

    expect(
      dashboardRepository.getTotalBalance,
    ).toHaveBeenCalledWith(userId);
  });
});

describe("Dashboard service - expense by category", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return expenseByCategory from dashboard repository", async () => {
    const userId = 1;

    const expenseByCategory = [
      {
        categoryId: "category-food",
        categoryName: "Food",
        total: "500",
      },
      {
        categoryId: "category-transport",
        categoryName: "Transport",
        total: "150",
      },
    ];

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(2500);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(650);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue(expenseByCategory);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.expenseByCategory).toEqual(expenseByCategory);
  });

  it("should pass date filters to expenseByCategory query", async () => {
    const userId = 1;

    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(2500);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(650);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    await getDashboard(userId, filters);

    expect(
      dashboardRepository.getExpensesByCategory,
    ).toHaveBeenCalledWith(userId, filters);
  });
});

describe("Dashboard service - income by category", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return incomeByCategory from dashboard repository", async () => {
    const userId = 1;

    const incomeByCategory = [
      {
        categoryId: "category-salary",
        categoryName: "Salary",
        total: "5000",
      },
      {
        categoryId: "category-freelance",
        categoryName: "Freelance",
        total: "1000",
      },
    ];

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(6000);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(6000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue(incomeByCategory);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    const result = await getDashboard(userId, {});

    expect(result.incomeByCategory).toEqual(incomeByCategory);
  });

  it("should pass date filters to incomeByCategory query", async () => {
    const userId = 1;

    const filters = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    };

    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(6000);

    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(6000);

    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(0);

    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([]);

    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([]);

    await getDashboard(userId, filters);

    expect(
      dashboardRepository.getIncomeByCategory,
    ).toHaveBeenCalledWith(userId, filters);
  });

  it("should return only the authenticated user's dashboard data", async () => {
    const userA = 1;
  
    vi.mocked(
      dashboardRepository.getTotalBalance,
    ).mockResolvedValue(1000);
  
    vi.mocked(
      dashboardRepository.getTotalIncome,
    ).mockResolvedValue(3000);
  
    vi.mocked(
      dashboardRepository.getTotalExpenses,
    ).mockResolvedValue(500);
  
    vi.mocked(
      dashboardRepository.getExpensesByCategory,
    ).mockResolvedValue([
      {
        categoryId: "expense-a",
        categoryName: "Food",
        total: "500",
      },
    ]);
  
    vi.mocked(
      dashboardRepository.getIncomeByCategory,
    ).mockResolvedValue([
      {
        categoryId: "income-a",
        categoryName: "Salary",
        total: "3000",
      },
    ]);
  
    vi.mocked(
      dashboardRepository.getRecentTransactions,
    ).mockResolvedValue([
      {
        id: 1,
        userId: userA,
      } as never,
    ]);
  
    const result = await getDashboard(userA, {});
  
    expect(result.totalBalance).toBe(1000);
    expect(result.totalIncome).toBe(3000);
    expect(result.totalExpenses).toBe(500);
  
    expect(result.expenseByCategory).toEqual([
      {
        categoryId: "expense-a",
        categoryName: "Food",
        total: "500",
      },
    ]);
  
    expect(result.incomeByCategory).toEqual([
      {
        categoryId: "income-a",
        categoryName: "Salary",
        total: "3000",
      },
    ]);
  
    expect(result.recentTransactions).toEqual([
      expect.objectContaining({
        userId: userA,
      }),
    ]);
  
    expect(
      dashboardRepository.getTotalBalance,
    ).toHaveBeenCalledWith(userA);
  
    expect(
      dashboardRepository.getTotalIncome,
    ).toHaveBeenCalledWith(userA, {});
  
    expect(
      dashboardRepository.getTotalExpenses,
    ).toHaveBeenCalledWith(userA, {});
  
    expect(
      dashboardRepository.getExpensesByCategory,
    ).toHaveBeenCalledWith(userA, {});
  
    expect(
      dashboardRepository.getIncomeByCategory,
    ).toHaveBeenCalledWith(userA, {});
  
    expect(
      dashboardRepository.getRecentTransactions,
    ).toHaveBeenCalledWith(userA, {});
  });
  
});
  
  