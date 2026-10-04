import { describe, expect, it } from "vitest";

import {
  budgetIdSchema,
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetQuerySchema,
} from "../../../src/modules/budget/budget.validation.js";

describe("budget validation", () => {
  describe("createBudgetSchema", () => {
    it("should accept valid budget data", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 2026,
        month: 10,
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid categoryId", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "invalid-id",
        amount: 500000,
        year: 2026,
        month: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject amount equal to zero", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 0,
        year: 2026,
        month: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: -100,
        year: 2026,
        month: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject month equal to zero", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 2026,
        month: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject month greater than 12", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 2026,
        month: 13,
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid year", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 0,
        month: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported userId field", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 2026,
        month: 10,
        userId: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported startDate field", () => {
      const result = createBudgetSchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        amount: 500000,
        year: 2026,
        month: 10,
        startDate: "2026-10-01",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateBudgetSchema", () => {
    it("should accept valid amount", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 750000,
      });

      expect(result.success).toBe(true);
    });

    it("should reject amount equal to zero", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const result = updateBudgetSchema.safeParse({
        amount: -100,
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported categoryId field", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 750000,
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported year field", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 750000,
        year: 2026,
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported month field", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 750000,
        month: 10,
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported userId field", () => {
      const result = updateBudgetSchema.safeParse({
        amount: 750000,
        userId: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("budgetIdSchema", () => {
    it("should accept valid budget id", () => {
      const result = budgetIdSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid budget id", () => {
      const result = budgetIdSchema.safeParse({
        id: "invalid-id",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("listBudgetQuerySchema", () => {
    it("should accept valid year", () => {
      const result = listBudgetQuerySchema.safeParse({
        year: 2026,
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid month", () => {
      const result = listBudgetQuerySchema.safeParse({
        month: 10,
      });

      expect(result.success).toBe(true);
    });

    it("should accept valid categoryId", () => {
      const result = listBudgetQuerySchema.safeParse({
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should accept combined filters", () => {
      const result = listBudgetQuerySchema.safeParse({
        year: 2026,
        month: 10,
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should reject year equal to zero", () => {
      const result = listBudgetQuerySchema.safeParse({
        year: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject month equal to zero", () => {
      const result = listBudgetQuerySchema.safeParse({
        month: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should reject month greater than 12", () => {
      const result = listBudgetQuerySchema.safeParse({
        month: 13,
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid categoryId", () => {
      const result = listBudgetQuerySchema.safeParse({
        categoryId: "invalid-id",
      });

      expect(result.success).toBe(false);
    });

    it("should reject unsupported userId filter", () => {
      const result = listBudgetQuerySchema.safeParse({
        userId: 1,
      });

      expect(result.success).toBe(false);
    });
  });
});