import type { AccountType } from "../types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank account",
  CREDIT_CARD: "Credit card",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Formats an account balance consistently. Decimal strings are accepted. */
export const formatCurrency = (value: number | string): string => {
  const amount = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return currencyFormatter.format(amount);
};

export const formatAccountType = (type: AccountType): string =>
  ACCOUNT_TYPE_LABELS[type] ?? type;
