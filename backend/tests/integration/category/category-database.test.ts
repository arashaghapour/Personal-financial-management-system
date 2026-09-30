import { describe, expect, it } from "vitest";

import { prisma } from "../../../src/lib/prisma.js";

describe("Category database", () => {
  it("should create a category with correct persisted fields", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-fields@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const beforeCreate = new Date();

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const afterCreate = new Date();

    expect(category.id).toEqual(expect.any(String));
    expect(category.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(category.userId).toBe(user.id);
    expect(category.name).toBe("Food");
    expect(category.normalizedName).toBe("food");
    expect(category.type).toBe("EXPENSE");

    expect(category.createdAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime(),
    );

    expect(category.createdAt.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime(),
    );

    expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(
      category.createdAt.getTime(),
    );
  });

  it("should persist the relation between user and category", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-relation@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const userWithCategories = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        categories: true,
      },
    });

    expect(userWithCategories).not.toBeNull();
    expect(userWithCategories?.categories).toHaveLength(1);

    expect(userWithCategories?.categories[0]).toEqual(
      expect.objectContaining({
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      }),
    );
  });

  it("should persist both INCOME and EXPENSE category types", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-types@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const expenseCategory = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const incomeCategory = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Salary",
        normalizedName: "salary",
        type: "INCOME",
      },
    });

    expect(expenseCategory.type).toBe("EXPENSE");
    expect(incomeCategory.type).toBe("INCOME");

    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(categories).toHaveLength(2);
    expect(categories.map((category) => category.type)).toEqual([
      "EXPENSE",
      "INCOME",
    ]);
  });

  it("should enforce the unique constraint on userId, normalizedName, and type", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-unique@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    await expect(
      prisma.category.create({
        data: {
          userId: user.id,
          name: "food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      }),
    ).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("should allow the same normalized name for different types", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-different-type@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const expenseCategory = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const incomeCategory = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "INCOME",
      },
    });

    expect(expenseCategory.id).not.toBe(incomeCategory.id);
  });

  it("should allow the same normalized name and type for different users", async () => {
    const userA = await prisma.user.create({
      data: {
        email: "category-db-user-a@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "A",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "category-db-user-b@example.com",
        passwordHash: "hashed-password",
        firstName: "User",
        lastName: "B",
      },
    });

    const categoryA = await prisma.category.create({
      data: {
        userId: userA.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const categoryB = await prisma.category.create({
      data: {
        userId: userB.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    expect(categoryA.id).not.toBe(categoryB.id);
    expect(categoryA.userId).toBe(userA.id);
    expect(categoryB.userId).toBe(userB.id);
  });

  it("should enforce the foreign key between category and user", async () => {
    await expect(
      prisma.category.create({
        data: {
          userId: 999999999,
          name: "Food",
          normalizedName: "food",
          type: "EXPENSE",
        },
      }),
    ).rejects.toMatchObject({
      code: "P2003",
    });
  });

  it("should update updatedAt when the category is updated", async () => {
    const user = await prisma.user.create({
      data: {
        email: "category-db-timestamps@example.com",
        passwordHash: "hashed-password",
        firstName: "Test",
        lastName: "User",
      },
    });

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name: "Food",
        normalizedName: "food",
        type: "EXPENSE",
      },
    });

    const originalUpdatedAt = category.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const updatedCategory = await prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        name: "Groceries",
        normalizedName: "groceries",
      },
    });

    expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime(),
    );
  });
});