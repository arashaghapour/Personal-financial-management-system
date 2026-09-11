import { Router } from "express";
import healthRouter from "../modules/health/health.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
// apiRouter.get("/health", (req, res) => {
//   res.status(200).json({
//     status: "ok",
//   });
// });

export default apiRouter;