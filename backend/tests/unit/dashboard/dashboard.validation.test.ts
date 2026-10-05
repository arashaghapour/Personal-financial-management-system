import { describe, expect, it } from "vitest";

import { dashboardQuerySchema } from "../../../src/modules/dashboard/dashboard.validation.js";

describe("dashboardQuerySchema", () => {
  it("should accept a valid startDate", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "2026-10-01",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        startDate: "2026-10-01",
      });
    }
  });

  it("should accept a valid endDate", () => {
    const result = dashboardQuerySchema.safeParse({
      endDate: "2026-10-31",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        endDate: "2026-10-31",
      });
    }
  });

  it("should accept both startDate and endDate", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });
    }
  });

  it("should accept startDate equal to endDate", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "2026-10-15",
      endDate: "2026-10-15",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        startDate: "2026-10-15",
        endDate: "2026-10-15",
      });
    }
  });

  it("should accept an empty query", () => {
    const result = dashboardQuerySchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({});
    }
  });



  it("should reject startDate with an invalid format", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "10/01/2026",
    });

    expect(result.success).toBe(false);
  });

  it("should reject endDate with an invalid format", () => {
    const result = dashboardQuerySchema.safeParse({
      endDate: "2026/10/31",
    });

    expect(result.success).toBe(false);
  });

  it("should reject when startDate is after endDate", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "2026-10-20",
      endDate: "2026-10-10",
    });

    expect(result.success).toBe(false);
  });

  it("should reject unknown query fields", () => {
    const result = dashboardQuerySchema.safeParse({
      startDate: "2026-10-01",
      unknownField: "test",
    });

    expect(result.success).toBe(false);
  });
});
