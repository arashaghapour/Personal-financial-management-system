import type { AccountType } from "../../generated/prisma/client.js";

export type CreateAccountRequest = {
  name: string;
  type: AccountType;
  initialBalance?: number;
};