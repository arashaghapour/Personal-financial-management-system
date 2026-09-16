import { Router } from "express";
import { validationMiddleware } from "../../middleware/validation.middleware.js";
import { registerController } from "./auth.controller.js";
import { registerSchema } from "./auth.validator.js";

const authRouter = Router();

authRouter.post(
  "/register",
  validationMiddleware(registerSchema, "body"),
  registerController,
);

export default authRouter;