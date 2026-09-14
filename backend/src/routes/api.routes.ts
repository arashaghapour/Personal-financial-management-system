import { Router } from "express";
import healthRouter from "../modules/health/health.routes.js";
import validationTestRouter from "./validation-test.routes.js";



const apiRouter = Router();

apiRouter.use("/validation-test", validationTestRouter);
apiRouter.use("/health", healthRouter);

export default apiRouter;