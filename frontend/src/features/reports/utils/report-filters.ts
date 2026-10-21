import { isCalendarDate } from "../../transactions/schemas/transaction.schemas";

import type { ReportDateFilters } from "../types";

export type ReportDateRangeDraft = {
  startDate: string;
  endDate: string;
};

export type ReportDateRangeErrors = Partial<
  Record<keyof ReportDateRangeDraft, string>
>;

export const emptyReportDateRange: ReportDateRangeDraft = {
  startDate: "",
  endDate: "",
};

/** Validates the optional date controls using the backend's YYYY-MM-DD rule. */
export const getReportDateRangeErrors = (
  draft: ReportDateRangeDraft,
): ReportDateRangeErrors => {
  const errors: ReportDateRangeErrors = {};

  if (draft.startDate !== "" && !isCalendarDate(draft.startDate)) {
    errors.startDate = "Enter a valid start date.";
  }

  if (draft.endDate !== "" && !isCalendarDate(draft.endDate)) {
    errors.endDate = "Enter a valid end date.";
  }

  if (
    !errors.startDate &&
    !errors.endDate &&
    draft.startDate !== "" &&
    draft.endDate !== "" &&
    draft.startDate > draft.endDate
  ) {
    errors.startDate = "Start date must be on or before the end date.";
  }

  return errors;
};

/**
 * Converts the validated controls into the only date query parameters
 * supported by the report endpoints. Empty dates are omitted.
 */
export const toReportDateFilters = (
  draft: ReportDateRangeDraft,
): ReportDateFilters => ({
  ...(draft.startDate !== "" && { startDate: draft.startDate }),
  ...(draft.endDate !== "" && { endDate: draft.endDate }),
});

export const hasActiveReportDateRange = (
  draft: ReportDateRangeDraft,
): boolean => draft.startDate !== "" || draft.endDate !== "";

export const hasAppliedReportDateRange = (
  filters: ReportDateFilters,
): boolean =>
  filters.startDate !== undefined || filters.endDate !== undefined;
