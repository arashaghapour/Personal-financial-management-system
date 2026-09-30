import type {
  NextFunction,
  Request,
  Response,
} from "express";

import * as categoryService from "./category.service.js";

import type { CategoryListQuery } from "./category.types.js";

export const createCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category =
      await categoryService.createCategory(
        req.user!.id,
        req.body,
      );

    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
};

export const getCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query =
      req.query as CategoryListQuery;

    const categories =
      await categoryService.getCategories(
        req.user!.id,
        query.type,
      );

    return res.status(200).json(categories);
  } catch (error) {
    return next(error);
  }
};

export const getCategoryController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category =
      await categoryService.getCategory(
        req.user!.id,
        req.params.id,
      );

    return res.status(200).json(category);
  } catch (error) {
    return next(error);
  }
};

export const updateCategoryController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category =
      await categoryService.updateCategory(
        req.user!.id,
        req.params.id,
        req.body,
      );

    return res.status(200).json(category);
  } catch (error) {
    return next(error);
  }
};

export const deleteCategoryController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await categoryService.deleteCategory(
      req.user!.id,
      req.params.id,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};