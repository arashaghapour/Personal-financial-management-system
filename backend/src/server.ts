import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";

const host = "0.0.0.0";

app.listen(env.port, host, () => {
  console.log(`Server is running on http://${host}:${env.port}`);
});