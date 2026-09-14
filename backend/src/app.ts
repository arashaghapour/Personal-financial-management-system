import express from "express";
import apiRouter from "./routes/api.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { AppError } from "./utils/app-error.js";
import { errorCodes } from "./constants/error-codes.js";

const app = express();

app.use(express.json());

app.use("/api", apiRouter);
app.use((_req, _res, next) => {
  next(
    new AppError(
      404,
      errorCodes.NOT_FOUND,
      "Resource not found",
    ),
  );
});
app.use(errorMiddleware);

export default app;