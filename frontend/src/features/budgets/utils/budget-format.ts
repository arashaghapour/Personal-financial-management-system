import type { BudgetStatus } from "../types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const STATUS_LABELS: Record<BudgetStatus, string> = {
  UNDER_BUDGET: "Under budget",
  NEAR_LIMIT: "Near limit",
  OVER_BUDGET: "Over budget",
};

export type BudgetStatusModifier = "under" | "near" | "over";

const STATUS_MODIFIERS: Record<BudgetStatus, BudgetStatusModifier> = {
  UNDER_BUDGET: "under",
  NEAR_LIMIT: "near",
  OVER_BUDGET: "over",
};

export const formatBudgetPercentage = (value: number): string =>
  Number.isFinite(value) ? `${Math.round(value)}%` : "0%";

export const getBudgetStatusLabel = (status: BudgetStatus): string =>
  STATUS_LABELS[status];

export const getBudgetStatusModifier = (
  status: BudgetStatus,
): BudgetStatusModifier => STATUS_MODIFIERS[status];

export const formatBudgetPeriod = (year: number, month: number): string => {
  const monthName = MONTH_NAMES[month - 1] ?? "Unknown month";

  return `${monthName} ${year}`;
};

export const getMonthName = (month: number): string =>
  MONTH_NAMES[month - 1] ?? "Unknown month";

export const BUDGET_MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({
  value: index + 1,
  label: name,
}));
