import { createHash } from "node:crypto";

export const hashRefreshToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};