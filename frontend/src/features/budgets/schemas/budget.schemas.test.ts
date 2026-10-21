import { describe, expect, it } from "vitest";

import { createBudgetSchema, updateBudgetSchema } from "./budget.schemas";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

const validBudget = {
  categoryId: CATEGORY_ID,
  amount: 1000,
  year: 2026,
  month: 10,
};

const messagesFor = (
  schema: typeof createBudgetSchema | typeof updateBudgetSchema,
  value: unknown,
): string => {
  const result = schema.safeParse(value);

  return result.success
    ? ""
    : result.error.issues.map((issue) => issue.message).join(" | ");
};

describe("createBudgetSchema", () => {
  it("accepts a valid budget", () => {
    expect(createBudgetSchema.parse(validBudget)).toEqual(validBudget);
  });

  it("requires a category UUID", () => {
    expect(
      messagesFor(createBudgetSchema, { ...validBudget, categoryId: "" }),
    ).toContain("Select a category");
    expect(
      messagesFor(createBudgetSchema, {
        ...validBudget,
        categoryId: "not-a-uuid",
      }),
    ).toContain("Select a category");
  });

  it("requires a finite amount greater than zero", () => {
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(messagesFor(createBudgetSchema, { ...validBudget, amount })).toMatch(
        /Budget amount is required|Enter a valid amount|Amount must be greater than 0/,
      );
    }
  });

  it("requires a positive integer year", () => {
    for (const year of [0, -1, 2026.5]) {
      expect(messagesFor(createBudgetSchema, { ...validBudget, year })).toContain(
        "Enter a valid year",
      );
    }
  });

  it("requires a month from 1 through 12", () => {
    for (const month of [0, 13, 6.5]) {
      expect(
        messagesFor(createBudgetSchema, { ...validBudget, month }),
      ).toContain("Select a valid month");
    }
  });

  it("rejects fields the backend does not accept", () => {
    expect(
      createBudgetSchema.safeParse({ ...validBudget, userId: 42 }).success,
    ).toBe(false);
  });
});

describe("updateBudgetSchema", () => {
  it("accepts a positive amount", () => {
    expect(updateBudgetSchema.parse({ amount: 1500 })).toEqual({
      amount: 1500,
    });
  });

  it("rejects non-positive or non-finite amounts", () => {
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(messagesFor(updateBudgetSchema, { amount })).toMatch(
        /Budget amount is required|Enter a valid amount|Amount must be greater than 0/,
      );
    }
  });

  it("rejects editable fields the backend does not support", () => {
    expect(
      updateBudgetSchema.safeParse({ amount: 1500, categoryId: CATEGORY_ID })
        .success,
    ).toBe(false);
    expect(
      updateBudgetSchema.safeParse({ amount: 1500, year: 2026 }).success,
    ).toBe(false);
  });
});
