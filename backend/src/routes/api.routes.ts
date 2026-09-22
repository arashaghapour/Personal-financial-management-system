import { Router } from "express";
import healthRouter from "../modules/health/health.routes.js";
import validationTestRouter from "./validation-test.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import authTestRoutes from "./auth-test.routes.js";

const apiRouter = Router();

apiRouter.use("/validation-test", validationTestRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/auth-test", authTestRoutes);

export default apiRouter;