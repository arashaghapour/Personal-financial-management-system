import { isCalendarDate } from "../../transactions/schemas/transaction.schemas";

import type { DashboardFilters } from "../types";

export type DashboardDateRangeDraft = {
  startDate: string;
  endDate: string;
};

export type DashboardDateRangeErrors = Partial<
  Record<keyof DashboardDateRangeDraft, string>
>;

export const emptyDashboardDateRange: DashboardDateRangeDraft = {
  startDate: "",
  endDate: "",
};

/** Validates the optional date controls using the backend's YYYY-MM-DD rule. */
export const getDashboardDateRangeErrors = (
  draft: DashboardDateRangeDraft,
): DashboardDateRangeErrors => {
  const errors: DashboardDateRangeErrors = {};

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
 * Converts the validated controls into the only query parameters supported by
 * GET /api/dashboard. Empty dates are omitted rather than sent as blank values.
 */
export const toDashboardFilters = (
  draft: DashboardDateRangeDraft,
): DashboardFilters => ({
  ...(draft.startDate !== "" && { startDate: draft.startDate }),
  ...(draft.endDate !== "" && { endDate: draft.endDate }),
});

export const hasActiveDashboardDateRange = (
  draft: DashboardDateRangeDraft,
): boolean => draft.startDate !== "" || draft.endDate !== "";
