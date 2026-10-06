import type { RequestHandler } from "express";

import {
  getCashFlowReport,
  getExpensesReport,
  getSummary,
} from "../reports/reports.service.js";

import type {
  CashFlowQuery,
  ExpensesQuery,
  SummaryQuery,
} from "../reports/reports.validation.js";

export const getSummaryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user!.id;
    const query = res.locals.query as SummaryQuery;

    const filters = {
      ...(query.startDate !== undefined && {
        startDate: query.startDate,
      }),
      ...(query.endDate !== undefined && {
        endDate: query.endDate,
      }),
    };

    const summary = await getSummary(userId, filters);

    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};

export const getExpensesReportController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user!.id;
    const query = res.locals.query as ExpensesQuery;

    const filters = {
      ...(query.startDate !== undefined && {
        startDate: query.startDate,
      }),
      ...(query.endDate !== undefined && {
        endDate: query.endDate,
      }),
      ...(query.categoryId !== undefined && {
        categoryId: query.categoryId,
      }),
    };

    const report = await getExpensesReport(userId, filters);

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

export const getCashFlowReportController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.user!.id;
    const query = res.locals.query as CashFlowQuery;

    const filters = {
      ...(query.startDate !== undefined && {
        startDate: query.startDate,
      }),
      ...(query.endDate !== undefined && {
        endDate: query.endDate,
      }),
    };

    const report = await getCashFlowReport(userId, filters);

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};