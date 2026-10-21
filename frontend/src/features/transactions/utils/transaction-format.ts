import { formatCurrency } from "../../accounts/utils/account-format";

import type { TransactionType } from "../types";

const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}/;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Formats a transaction amount with an explicit direction. The backend stores
 * amounts as unsigned decimals; the transaction type supplies the sign.
 */
export const formatTransactionAmount = (
  type: TransactionType,
  amount: number | string,
): string => {
  const formatted = formatCurrency(amount);

  if (formatted === "—") {
    return formatted;
  }

  return `${type === "INCOME" ? "+" : "-"}${formatted}`;
};

/**
 * Formats the API date as a calendar date. Transactions store a date without a
 * meaningful time, so the value is parsed as UTC to avoid timezone shifts.
 */
export const formatTransactionDate = (date: string): string => {
  if (!DATE_PREFIX_PATTERN.test(date)) {
    return "—";
  }

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return dateFormatter.format(parsed);
};

/** Converts an API timestamp or date string into an `<input type="date">` value. */
export const toDateInputValue = (date: string | undefined): string => {
  if (!date || !DATE_PREFIX_PATTERN.test(date)) {
    return "";
  }

  return date.slice(0, 10);
};

/** Today's local calendar date in the backend's YYYY-MM-DD format. */
export const todayDateInputValue = (): string => {
  const now = new Date();
  const localTime = now.getTime() - now.getTimezoneOffset() * 60_000;

  return new Date(localTime).toISOString().slice(0, 10);
};

export const formatTransactionType = (type: TransactionType): string => type;
