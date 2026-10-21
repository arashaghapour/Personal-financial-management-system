/**
 * Account types mirroring the backend contract
 * (see docs/OpenAPI.yml and backend/src/modules/account/account.schema.ts).
 */

export const ACCOUNT_TYPES = [
  "CASH",
  "BANK",
  "CREDIT_CARD",
  "INVESTMENT",
  "OTHER",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * Account returned by the backend. The balance is a Prisma Decimal, which is
 * serialized either as a number or a numeric string depending on the response
 * encoding, so both are accepted and normalized before formatting.
 */
export type Account = {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number | string;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/accounts request body. `userId` is derived from the session. */
export type CreateAccountRequest = {
  name: string;
  type: AccountType;
  initialBalance: number;
};

/** PATCH /api/accounts/:id request body. Balance is intentionally excluded. */
export type UpdateAccountRequest = {
  name: string;
  type: AccountType;
};
