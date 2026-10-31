import cors from "cors";
import express from "express";
import apiRouter from "./routes/api.routes.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { AppError } from "./utils/app-error.js";
import { errorCodes } from "./constants/error-codes.js";

const app = express();

const configuredOrigins = env.corsOrigin
  ?.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOrigin =
  !configuredOrigins ||
  configuredOrigins.length === 0 ||
  configuredOrigins.includes("*")
    ? "*"
    : configuredOrigins;

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,
  }),
);

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