import type { Request, Response } from "express";

import {
  createTestResource,
  getTestResource,
  updateTestResource,
  deleteTestResource,
} from "./test-resource.service.js";


import type {
  CreateTestResourceRequest,
} from "./test-resource.types.js";

export const createTestResourceController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.id;

  const result = await createTestResource(
    req.body as CreateTestResourceRequest,
    Number(userId),
  );

  return res.status(201).json(result);
};

export const getTestResourceController = async (
  req: Request,
  res: Response,
) => {
  const resourceId = Number(req.params.id);
  const userId = Number(req.user!.id);

  const result = await getTestResource(
    resourceId,
    userId,
  );

  if (!result) {
    return res.status(404).json({
      message: "Test resource not found",
    });
  }

  return res.status(200).json(result);
};

export const updateTestResourceController = async (
  req: Request,
  res: Response,
) => {
  const resourceId = Number(req.params.id);
  const userId = Number(req.user!.id);

  const result = await updateTestResource(
    resourceId,
    userId,
    req.body,
  );

  if (!result) {
    return res.status(404).json({
      message: "Test resource not found",
    });
  }

  return res.status(200).json(result);
};

export const deleteTestResourceController = async (
  req: Request,
  res: Response,
) => {
  const resourceId = Number(req.params.id);
  const userId = Number(req.user!.id);

  const deleted = await deleteTestResource(
    resourceId,
    userId,
  );

  if (!deleted) {
    return res.status(404).json({
      message: "Test resource not found",
    });
  }

  return res.status(204).send();
};