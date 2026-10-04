import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorCodes } from "../../../src/constants/error-codes.js";

import { getBudgetProgress } from "../../../src/modules/budget/budget.service.js";

import {
  createBudget,
  getBudgetById,
  getBudgets,
  updateBudget,
  deleteBudget,
} from "../../../src/modules/budget/budget.service.js";

import * as budgetRepository from "../../../src/modules/budget/budget.repository.js";
import { categoryRepository } from "../../../src/modules/category/category.repository.js";

vi.mock("../../../src/modules/budget/budget.repository.js", () => ({
  create: vi.fn(),
  findByUserCategoryAndPeriod: vi.fn(),
  findMany: vi.fn(),
  findByIdAndUserId: vi.fn(),
  updateByIdAndUserId: vi.fn(),
  deleteByIdAndUserId: vi.fn(),
  calculateSpentAmount: vi.fn(),
}));

vi.mock("../../../src/modules/category/category.repository.js", () => ({
  categoryRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("Budget service - create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a budget", async () => {
    const userId = 1;

    const category = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      name: "Food",
      normalizedName: "food",
      type: "EXPENSE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdBudget = {
      id: "22222222-2222-4222-8222-222222222222",
      userId,
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date("2026-10-03"),
    };

    vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(
      category,
    );

    vi.mocked(
      budgetRepository.findByUserCategoryAndPeriod,
    ).mockResolvedValue(null);

    vi.mocked(budgetRepository.create).mockResolvedValue(
      createdBudget as never,
    );

    const result = await createBudget(userId, {
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 10,
    });

    expect(result).toEqual(createdBudget);

    expect(
      categoryRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(category.id, userId);

    expect(
      budgetRepository.findByUserCategoryAndPeriod,
    ).toHaveBeenCalledWith(
      userId,
      category.id,
      2026,
      10,
    );

    expect(budgetRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should reject when category does not exist", async () => {
    const userId = 1;

    vi.mocked(
      categoryRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      createBudget(userId, {
        categoryId: "11111111-1111-4111-8111-111111111111",
        amount: 1000,
        year: 2026,
        month: 10,
      }),
    ).rejects.toMatchObject({
      code: errorCodes.INVALID_BUDGET_CATEGORY,
    });

    expect(
      budgetRepository.findByUserCategoryAndPeriod,
    ).not.toHaveBeenCalled();

    expect(budgetRepository.create).not.toHaveBeenCalled();
  });

  it("should reject when category belongs to another user", async () => {
    const userId = 1;

    vi.mocked(
      categoryRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      createBudget(userId, {
        categoryId: "11111111-1111-4111-8111-111111111111",
        amount: 1000,
        year: 2026,
        month: 10,
      }),
    ).rejects.toMatchObject({
      code: errorCodes.INVALID_BUDGET_CATEGORY,
    });

    expect(
      categoryRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      userId,
    );

    expect(budgetRepository.create).not.toHaveBeenCalled();
  });

  it("should reject when category is INCOME", async () => {
    const userId = 1;

    const category = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      name: "Salary",
      normalizedName: "salary",
      type: "INCOME" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(
      category,
    );

    await expect(
      createBudget(userId, {
        categoryId: category.id,
        amount: 1000,
        year: 2026,
        month: 10,
      }),
    ).rejects.toMatchObject({
      code: errorCodes.INVALID_BUDGET_CATEGORY,
    });

    expect(
      budgetRepository.findByUserCategoryAndPeriod,
    ).not.toHaveBeenCalled();

    expect(budgetRepository.create).not.toHaveBeenCalled();
  });

  it("should reject duplicate budget", async () => {
    const userId = 1;

    const category = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      name: "Food",
      normalizedName: "food",
      type: "EXPENSE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingBudget = {
      id: "22222222-2222-4222-8222-222222222222",
      userId,
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date("2026-10-01"),
    };

    vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(
      category,
    );

    vi.mocked(
      budgetRepository.findByUserCategoryAndPeriod,
    ).mockResolvedValue(existingBudget as never);

    await expect(
      createBudget(userId, {
        categoryId: category.id,
        amount: 2000,
        year: 2026,
        month: 10,
      }),
    ).rejects.toMatchObject({
      code: errorCodes.DUPLICATE_BUDGET,
    });

    expect(budgetRepository.create).not.toHaveBeenCalled();
  });

  it("should use current date as startDate for current month", async () => {
    const userId = 1;

    const category = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      name: "Food",
      normalizedName: "food",
      type: "EXPENSE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const now = new Date("2026-10-03T12:30:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(now);

    vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(
      category,
    );

    vi.mocked(
      budgetRepository.findByUserCategoryAndPeriod,
    ).mockResolvedValue(null);

    vi.mocked(budgetRepository.create).mockResolvedValue(
      {} as never,
    );

    await createBudget(userId, {
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 10,
    });

    expect(budgetRepository.create).toHaveBeenCalledWith({
      userId,
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: now,
    });

    vi.useRealTimers();
  });

  it("should use first day of target month for another month", async () => {
    const userId = 1;

    const category = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      name: "Food",
      normalizedName: "food",
      type: "EXPENSE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const now = new Date("2026-10-03T12:30:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(now);

    vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(
      category,
    );

    vi.mocked(
      budgetRepository.findByUserCategoryAndPeriod,
    ).mockResolvedValue(null);

    vi.mocked(budgetRepository.create).mockResolvedValue(
      {} as never,
    );

    await createBudget(userId, {
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 11,
    });

    expect(budgetRepository.create).toHaveBeenCalledWith({
      userId,
      categoryId: category.id,
      amount: 1000,
      year: 2026,
      month: 11,
      startDate: new Date(2026, 10, 1),
    });

    vi.useRealTimers();
  });
});

describe("Budget service - list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user's budgets", async () => {
    const userId = 1;

    const budgets = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        userId,
        categoryId: "22222222-2222-4222-8222-222222222222",
        amount: 1000,
        year: 2026,
        month: 10,
        startDate: new Date("2026-10-01"),
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        userId,
        categoryId: "44444444-4444-4444-8444-444444444444",
        amount: 2000,
        year: 2026,
        month: 11,
        startDate: new Date("2026-11-01"),
      },
    ];

    vi.mocked(budgetRepository.findMany).mockResolvedValue(
      budgets as never,
    );

    const result = await getBudgets(userId, {});

    expect(result).toEqual(budgets);

    expect(budgetRepository.findMany).toHaveBeenCalledWith(
      userId,
      {},
    );
  });

  it("should pass year filter to repository", async () => {
    const userId = 1;

    vi.mocked(budgetRepository.findMany).mockResolvedValue(
      [] as never,
    );

    await getBudgets(userId, {
      year: 2026,
    });

    expect(budgetRepository.findMany).toHaveBeenCalledWith(
      userId,
      {
        year: 2026,
      },
    );
  });

  it("should pass month filter to repository", async () => {
    const userId = 1;

    vi.mocked(budgetRepository.findMany).mockResolvedValue(
      [] as never,
    );

    await getBudgets(userId, {
      month: 10,
    });

    expect(budgetRepository.findMany).toHaveBeenCalledWith(
      userId,
      {
        month: 10,
      },
    );
  });

  it("should pass categoryId filter to repository", async () => {
    const userId = 1;

    const categoryId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(budgetRepository.findMany).mockResolvedValue(
      [] as never,
    );

    await getBudgets(userId, {
      categoryId,
    });

    expect(budgetRepository.findMany).toHaveBeenCalledWith(
      userId,
      {
        categoryId,
      },
    );
  });

  it("should pass combined filters to repository", async () => {
    const userId = 1;

    const categoryId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(budgetRepository.findMany).mockResolvedValue(
      [] as never,
    );

    await getBudgets(userId, {
      year: 2026,
      month: 10,
      categoryId,
    });

    expect(budgetRepository.findMany).toHaveBeenCalledWith(
      userId,
      {
        year: 2026,
        month: 10,
        categoryId,
      },
    );
  });
});

describe("Budget service - get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user's budget", async () => {
    const userId = 1;

    const budget = {
      id: "11111111-1111-4111-8111-111111111111",
      userId,
      categoryId: "22222222-2222-4222-8222-222222222222",
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date("2026-10-01"),
    };

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(budget as never);

    const result = await getBudgetById(
      userId,
      budget.id,
    );

    expect(result).toEqual(budget);

    expect(
      budgetRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(
      budget.id,
      userId,
    );
  });

  it("should throw NOT_FOUND when budget does not exist", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      getBudgetById(userId, budgetId),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );
  });

  it("should throw NOT_FOUND when budget belongs to another user", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      getBudgetById(userId, budgetId),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );
  });
});


describe("Budget service - update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update user's budget", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    const existingBudget = {
      id: budgetId,
      userId,
      categoryId:
        "22222222-2222-4222-8222-222222222222",
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date("2026-10-01"),
    };

    const updatedBudget = {
      ...existingBudget,
      amount: 2000,
    };

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(existingBudget as never);

    vi.mocked(
      budgetRepository.updateByIdAndUserId,
    ).mockResolvedValue(updatedBudget as never);

    const result = await updateBudget(
      userId,
      budgetId,
      {
        amount: 2000,
      },
    );

    expect(result).toEqual(updatedBudget);

    expect(
      budgetRepository.findByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );

    expect(
      budgetRepository.updateByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
      {
        amount: 2000,
      },
    );
  });

  it("should throw NOT_FOUND when budget does not exist", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      updateBudget(
        userId,
        budgetId,
        {
          amount: 2000,
        },
      ),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.updateByIdAndUserId,
    ).not.toHaveBeenCalled();
  });

  it("should throw NOT_FOUND when budget belongs to another user", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.findByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      updateBudget(
        userId,
        budgetId,
        {
          amount: 2000,
        },
      ),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.updateByIdAndUserId,
    ).not.toHaveBeenCalled();
  });
});

describe("Budget service - delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete user's budget", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    const deletedBudget = {
      id: budgetId,
      userId,
      categoryId: "22222222-2222-4222-8222-222222222222",
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date("2026-10-01"),
    };

    vi.mocked(
      budgetRepository.deleteByIdAndUserId,
    ).mockResolvedValue(deletedBudget as never);

    const result = await deleteBudget(userId, budgetId);

    expect(result).toEqual(deletedBudget);

    expect(
      budgetRepository.deleteByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );

    expect(
      budgetRepository.deleteByIdAndUserId,
    ).toHaveBeenCalledTimes(1);
  });

  it("should throw NOT_FOUND when budget does not exist", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.deleteByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      deleteBudget(userId, budgetId),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.deleteByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );
  });

  it("should throw NOT_FOUND when budget belongs to another user", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.deleteByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      deleteBudget(userId, budgetId),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });

    expect(
      budgetRepository.deleteByIdAndUserId,
    ).toHaveBeenCalledWith(
      budgetId,
      userId,
    );
  });

  it("should not call repository again when deletion fails", async () => {
    const userId = 1;

    const budgetId =
      "11111111-1111-4111-8111-111111111111";

    vi.mocked(
      budgetRepository.deleteByIdAndUserId,
    ).mockResolvedValue(null);

    await expect(
      deleteBudget(userId, budgetId),
    ).rejects.toMatchObject({
      code: errorCodes.NOT_FOUND,
    });

    expect(
      budgetRepository.deleteByIdAndUserId,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("getBudgetProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate budget progress", async () => {
    const budget = {
      id: "budget-1",
      userId: 1,
      categoryId: "category-1",
      amount: 1000,
      year: 2026,
      month: 10,
      startDate: new Date(2026, 9, 1),
    };

    vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(
      budget as never,
    );

    vi.mocked(budgetRepository.calculateSpentAmount).mockResolvedValue(
      650 as never,
    );

    const result = await getBudgetProgress(1, "budget-1");

    expect(result).toEqual({
      budgetId: "budget-1",
      budgetAmount: 1000,
      spentAmount: 650,
      remainingAmount: 350,
      percentageUsed: 65,
      status: "UNDER_BUDGET",
    });
  });

  it("should throw NOT_FOUND when budget does not exist", async () => {
    vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(
      null,
    );

    await expect(
      getBudgetProgress(1, "budget-1"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: errorCodes.NOT_FOUND,
    });

    expect(
      budgetRepository.calculateSpentAmount,
    ).not.toHaveBeenCalled();
  });

  it("should throw NOT_FOUND when budget belongs to another user", async () => {
    vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(
      null,
    );

    await expect(
      getBudgetProgress(2, "budget-1"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: errorCodes.NOT_FOUND,
    });

    expect(
      budgetRepository.calculateSpentAmount,
    ).not.toHaveBeenCalled();
  });

  it("should calculate spent amount using the budget period", async () => {
    const startDate = new Date(2026, 9, 1);

    const budget = {
      id: "budget-1",
      userId: 1,
      categoryId: "category-1",
      amount: 1000,
      year: 2026,
      month: 10,
      startDate,
    };

    vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(
      budget as never,
    );

    vi.mocked(budgetRepository.calculateSpentAmount).mockResolvedValue(
      300 as never,
    );

    await getBudgetProgress(1, "budget-1");

    expect(
      budgetRepository.calculateSpentAmount,
    ).toHaveBeenCalledWith(
      1,
      "category-1",
      startDate,
      new Date(2026, 9, 31),
    );
  });
});