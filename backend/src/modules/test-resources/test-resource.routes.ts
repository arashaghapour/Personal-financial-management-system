import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";

import {
  createTestResourceController,
  getTestResourceController,
  updateTestResourceController,
  deleteTestResourceController,
} from "./test-resource.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  createTestResourceController,
);

router.get(
  "/:id",
  authMiddleware,
  getTestResourceController,
);

router.patch(
  "/:id",
  authMiddleware,
  updateTestResourceController,
);

router.delete(
  "/:id",
  authMiddleware,
  deleteTestResourceController,
);

export default router;