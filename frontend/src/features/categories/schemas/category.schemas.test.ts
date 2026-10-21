import { describe, expect, it } from "vitest";

import { categoryFormSchema } from "./category.schemas";

describe("categoryFormSchema", () => {
  it("accepts valid category values and trims the name", () => {
    const result = categoryFormSchema.parse({
      name: "  Food  ",
      type: "EXPENSE",
    });

    expect(result).toEqual({ name: "Food", type: "EXPENSE" });
  });

  it("requires a non-empty name", () => {
    const result = categoryFormSchema.safeParse({
      name: "   ",
      type: "EXPENSE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects names longer than 100 characters", () => {
    const result = categoryFormSchema.safeParse({
      name: "a".repeat(101),
      type: "EXPENSE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown category types", () => {
    const result = categoryFormSchema.safeParse({
      name: "Transfers",
      type: "TRANSFER",
    });

    expect(result.success).toBe(false);
  });

  it("accepts both supported category types", () => {
    expect(
      categoryFormSchema.safeParse({ name: "Salary", type: "INCOME" }).success,
    ).toBe(true);
    expect(
      categoryFormSchema.safeParse({ name: "Food", type: "EXPENSE" }).success,
    ).toBe(true);
  });
});
