import { describe, expect, it } from "vitest";

import {
  transactionFilterDraftSchema,
  transactionFormSchema,
} from "./transaction.schemas";

const validValues = {
  type: "EXPENSE" as const,
  amount: 25.5,
  description: "Lunch",
  date: "2026-09-20",
  accountId: 1,
  categoryId: "11111111-1111-4111-8111-111111111111",
};

describe("transactionFormSchema", () => {
  it("accepts values supported by the backend", () => {
    expect(transactionFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("accepts an omitted or empty description", () => {
    expect(
      transactionFormSchema.safeParse({
        ...validValues,
        description: "",
      }).success,
    ).toBe(true);

    const { description: _description, ...withoutDescription } = validValues;

    void _description;

    expect(transactionFormSchema.safeParse(withoutDescription).success).toBe(
      true,
    );
  });

  it("requires a positive finite amount", () => {
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = transactionFormSchema.safeParse({
        ...validValues,
        amount,
      });

      expect(result.success).toBe(false);
    }
  });

  it("requires a real calendar date in YYYY-MM-DD format", () => {
    for (const date of ["", "20-09-2026", "2026-13-01", "2026-02-30"]) {
      const result = transactionFormSchema.safeParse({
        ...validValues,
        date,
      });

      expect(result.success).toBe(false);
    }
  });

  it("rejects descriptions longer than the backend limit", () => {
    const result = transactionFormSchema.safeParse({
      ...validValues,
      description: "a".repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it("requires an account and a UUID category", () => {
    expect(
      transactionFormSchema.safeParse({
        ...validValues,
        accountId: Number.NaN,
      }).success,
    ).toBe(false);

    expect(
      transactionFormSchema.safeParse({
        ...validValues,
        categoryId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("transactionFilterDraftSchema", () => {
  it("accepts empty draft filters", () => {
    expect(
      transactionFilterDraftSchema.safeParse({
        type: "ALL",
        accountId: "",
        categoryId: "",
        startDate: "",
        endDate: "",
        minAmount: "",
        maxAmount: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an inverted date range", () => {
    const result = transactionFilterDraftSchema.safeParse({
      type: "ALL",
      accountId: "",
      categoryId: "",
      startDate: "2026-09-30",
      endDate: "2026-09-01",
      minAmount: "",
      maxAmount: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an inverted amount range and non-positive amounts", () => {
    expect(
      transactionFilterDraftSchema.safeParse({
        type: "ALL",
        accountId: "",
        categoryId: "",
        startDate: "",
        endDate: "",
        minAmount: "100",
        maxAmount: "50",
      }).success,
    ).toBe(false);

    expect(
      transactionFilterDraftSchema.safeParse({
        type: "ALL",
        accountId: "",
        categoryId: "",
        startDate: "",
        endDate: "",
        minAmount: "0",
        maxAmount: "",
      }).success,
    ).toBe(false);
  });
});
