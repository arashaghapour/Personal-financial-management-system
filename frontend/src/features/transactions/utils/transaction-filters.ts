import {
  transactionFilterDraftSchema,
  type TransactionFilterDraft,
} from "../schemas/transaction.schemas";

import type { TransactionFilters, TransactionSort } from "../types";

export type TransactionFilterErrors = Partial<
  Record<keyof TransactionFilterDraft, string>
>;

export type TransactionFilterPaging = {
  page: number;
  limit: number;
  sort: TransactionSort;
};

/** Converts validated string controls into the backend query parameter types. */
export const toTransactionFilters = (
  draft: TransactionFilterDraft,
  { page, limit, sort }: TransactionFilterPaging,
): TransactionFilters => {
  const filters: TransactionFilters = { page, limit, sort };

  if (draft.type !== "ALL") {
    filters.type = draft.type;
  }

  if (draft.accountId !== "") {
    filters.accountId = Number(draft.accountId);
  }

  if (draft.categoryId !== "") {
    filters.categoryId = draft.categoryId;
  }

  if (draft.startDate !== "") {
    filters.startDate = draft.startDate;
  }

  if (draft.endDate !== "") {
    filters.endDate = draft.endDate;
  }

  if (draft.minAmount !== "") {
    filters.minAmount = Number(draft.minAmount);
  }

  if (draft.maxAmount !== "") {
    filters.maxAmount = Number(draft.maxAmount);
  }

  return filters;
};

export const getTransactionFilterErrors = (
  draft: TransactionFilterDraft,
): TransactionFilterErrors => {
  const result = transactionFilterDraftSchema.safeParse(draft);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<TransactionFilterErrors>(
    (errors, issue) => {
      const field = issue.path[0];

      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof TransactionFilterDraft] = issue.message;
      }

      return errors;
    },
    {},
  );
};

/** Whether the draft narrows the result set beyond sort and pagination. */
export const hasActiveFilters = (draft: TransactionFilterDraft): boolean =>
  draft.type !== "ALL" ||
  draft.accountId !== "" ||
  draft.categoryId !== "" ||
  draft.startDate !== "" ||
  draft.endDate !== "" ||
  draft.minAmount !== "" ||
  draft.maxAmount !== "";
