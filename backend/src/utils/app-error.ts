import { errorCodes } from "../constants/error-codes.js";

export class AppError extends Error {
  statusCode: number;
  code: (typeof errorCodes)[keyof typeof errorCodes];
  details?: unknown;

  constructor(
    statusCode: number,
    code: (typeof errorCodes)[keyof typeof errorCodes],
    message: string,
    details?: unknown,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}