import * as categoryRepositoryModule from "./category.repository.js";

import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./category.types.js";

import { normalizeCategoryName } from "./category.utils.js";

import { AppError } from "../../utils/app-error.js";

import type {
  CategoryType,
} from "../../generated/prisma/client.js";

export const createCategory = async (
  userId: number,
  data: CreateCategoryRequest,
) => {
  const name = data.name.trim();

  const normalizedName =
    normalizeCategoryName(name);

  const existingCategory =
    await categoryRepositoryModule.categoryRepository
      .findByNormalizedNameAndTypeAndUserId(
        normalizedName,
        data.type,
        userId,
      );

  if (existingCategory) {
    throw new AppError(
      409,
      "CATEGORY_ALREADY_EXISTS",
      "Category already exists",
    );
  }

  return categoryRepositoryModule.categoryRepository.create({
    userId,
    name,
    normalizedName,
    type: data.type,
  });
};

export const getCategories = async (
  userId: number,
  type?: CategoryType,
) => {
  if (type !== undefined) {
    return categoryRepositoryModule.categoryRepository
      .findManyByUserIdAndType(
        userId,
        type,
      );
  }

  return categoryRepositoryModule.categoryRepository
    .findManyByUserId(userId);
};

export const getCategory = async (
  userId: number,
  categoryId: string,
) => {
  const category =
    await categoryRepositoryModule.categoryRepository
      .findByIdAndUserId(
        categoryId,
        userId,
      );

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Category not found",
    );
  }

  return category;
};

export const updateCategory = async (
  userId: number,
  categoryId: string,
  data: UpdateCategoryRequest,
) => {
  const existingCategory =
    await categoryRepositoryModule.categoryRepository
      .findByIdAndUserId(
        categoryId,
        userId,
      );

  if (!existingCategory) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Category not found",
    );
  }

  const nextName =
    data.name !== undefined
      ? data.name.trim()
      : existingCategory.name;

  const nextType =
    data.type !== undefined
      ? data.type
      : existingCategory.type;

  const nextNormalizedName =
    normalizeCategoryName(nextName);

  const duplicateCategory =
    await categoryRepositoryModule.categoryRepository
      .findByNormalizedNameAndTypeAndUserId(
        nextNormalizedName,
        nextType,
        userId,
        categoryId,
      );

  if (duplicateCategory) {
    throw new AppError(
      409,
      "CATEGORY_ALREADY_EXISTS",
      "Category already exists",
    );
  }

  const updateData: {
    name?: string;
    normalizedName?: string;
    type?: CategoryType;
  } = {};

  if (data.name !== undefined) {
    updateData.name = nextName;
    updateData.normalizedName =
      nextNormalizedName;
  }

  if (data.type !== undefined) {
    updateData.type = nextType;
  }

  const updatedCategory =
    await categoryRepositoryModule.categoryRepository
      .updateByIdAndUserId(
        categoryId,
        userId,
        updateData,
      );

  if (!updatedCategory) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Category not found",
    );
  }

  return updatedCategory;
};

export const deleteCategory = async (
  userId: number,
  categoryId: string,
) => {
  const deleted =
    await categoryRepositoryModule.categoryRepository
      .deleteByIdAndUserId(
        categoryId,
        userId,
      );

  if (!deleted) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Category not found",
    );
  }
};