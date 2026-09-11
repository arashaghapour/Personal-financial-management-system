import express from "express";
import apiRouter from "./routes/api.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api", apiRouter);

app.use(errorMiddleware);

export default app;