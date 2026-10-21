import { describe, expect, it } from "vitest";

import { accountFormSchema } from "./account.schemas";

describe("accountFormSchema", () => {
  it("accepts valid account values and trims the name", () => {
    const result = accountFormSchema.parse({
      name: "  Checking  ",
      type: "BANK",
      initialBalance: 100,
    });

    expect(result.name).toBe("Checking");
  });

  it("requires a non-empty name", () => {
    const result = accountFormSchema.safeParse({
      name: "   ",
      type: "BANK",
      initialBalance: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects names longer than 100 characters", () => {
    const result = accountFormSchema.safeParse({
      name: "a".repeat(101),
      type: "BANK",
      initialBalance: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative and non-numeric balances", () => {
    expect(
      accountFormSchema.safeParse({
        name: "Cash",
        type: "CASH",
        initialBalance: -1,
      }).success,
    ).toBe(false);

    expect(
      accountFormSchema.safeParse({
        name: "Cash",
        type: "CASH",
        initialBalance: Number.NaN,
      }).success,
    ).toBe(false);
  });
});
