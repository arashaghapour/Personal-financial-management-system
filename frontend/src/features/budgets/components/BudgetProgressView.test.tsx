import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BudgetProgressView } from "./BudgetProgressView";

import type { BudgetProgress } from "../types";

const BUDGET_ID = "22222222-2222-4222-8222-222222222222";

const makeProgress = (
  overrides: Partial<BudgetProgress> = {},
): BudgetProgress => ({
  budgetId: BUDGET_ID,
  budgetAmount: 1000,
  spentAmount: 650,
  remainingAmount: 350,
  percentageUsed: 65,
  status: "UNDER_BUDGET",
  ...overrides,
});

describe("BudgetProgressView", () => {
  it("renders amounts and the backend's percentage and status", () => {
    render(
      <BudgetProgressView progress={makeProgress()} categoryName="Food" />,
    );

    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("$650.00")).toBeInTheDocument();
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    expect(screen.getByText("65% used")).toBeInTheDocument();
    expect(screen.getByText("Under budget")).toBeInTheDocument();

    const progressbar = screen.getByRole("progressbar", {
      name: "Food budget usage",
    });

    expect(progressbar).toHaveAttribute("aria-valuenow", "65");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    expect(progressbar).toHaveAttribute("aria-valuetext", "65% used");
  });

  it("shows zero spending without dividing by zero", () => {
    render(
      <BudgetProgressView
        progress={makeProgress({
          spentAmount: 0,
          remainingAmount: 1000,
          percentageUsed: 0,
          status: "UNDER_BUDGET",
        })}
        categoryName="Food"
      />,
    );

    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("0% used")).toBeInTheDocument();
  });

  it("renders near-limit budgets", () => {
    render(
      <BudgetProgressView
        progress={makeProgress({
          spentAmount: 900,
          remainingAmount: 100,
          percentageUsed: 90,
          status: "NEAR_LIMIT",
        })}
        categoryName="Food"
      />,
    );

    expect(screen.getByText("90% used")).toBeInTheDocument();
    expect(screen.getByText("Near limit")).toBeInTheDocument();
  });

  it("shows over-budget percentages exactly while clamping the bar", () => {
    render(
      <BudgetProgressView
        progress={makeProgress({
          spentAmount: 1200,
          remainingAmount: -200,
          percentageUsed: 120,
          status: "OVER_BUDGET",
        })}
        categoryName="Food"
      />,
    );

    expect(screen.getByText("120% used")).toBeInTheDocument();
    expect(screen.getByText("Over budget")).toBeInTheDocument();
    expect(screen.getByText("-$200.00")).toBeInTheDocument();

    const progressbar = screen.getByRole("progressbar", {
      name: "Food budget usage",
    });

    expect(progressbar).toHaveAttribute("aria-valuenow", "120");
    expect(progressbar).toHaveAttribute("aria-valuemax", "120");
  });
});
