import { Router } from "express";

import { errorCodes } from "../constants/error-codes.js";

import { AppError } from "../utils/app-error.js";

import {
  bodyTestSchema,
  paramsTestSchema,
  queryTestSchema,
} from "../schemas/validation-test.schema.js";

import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = Router();

router.post(
  "/body",
  validationMiddleware(bodyTestSchema, "body"),
  (_req, res) => {
    res.status(200).json({ status: "ok" });
  },
);

router.get(
  "/query",
  validationMiddleware(queryTestSchema, "query"),
  (_req, res) => {
    res.status(200).json({ status: "ok" });
  },
);

router.get(
  "/params/:id",
  validationMiddleware(paramsTestSchema, "params"),
  (_req, res) => {
    res.status(200).json({ status: "ok" });
  },
);

router.get("/app-error", () => {
  throw new AppError(
    409,
    errorCodes.CONFLICT,
    "Resource already exists",
  );
});

router.get("/unknown-error", () => {
  throw new Error("database password: secret");
});

export default router;