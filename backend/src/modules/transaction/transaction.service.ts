import * as accountRepositoryModule from "../account/account.repository.js";
import * as categoryRepositoryModule from "../category/category.repository.js";
import * as transactionRepositoryModule from "./transaction.repository.js";

import type {
  CreateTransactionInput,
  ListTransactionQuery,
  UpdateTransactionInput,
} from "./transaction.schema.js";

import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";

export const createTransaction = async (
  userId: number,
  data: CreateTransactionInput,
) => {
  return prisma.$transaction(async (tx) => {
    const account =
      await accountRepositoryModule.accountRepository.findByIdAndUserId(
        data.accountId,
        userId,
        tx,
      );

    if (!account) {
      throw new AppError(
        404,
        "ACCOUNT_NOT_FOUND",
        "Account not found",
      );
    }

    const category =
      await categoryRepositoryModule.categoryRepository.findByIdAndUserId(
        data.categoryId,
        userId,
        tx,
      );

    if (!category) {
      throw new AppError(
        404,
        "CATEGORY_NOT_FOUND",
        "Category not found",
      );
    }

    if (category.type !== data.type) {
      throw new AppError(
        400,
        "CATEGORY_TYPE_MISMATCH",
        "Category type does not match transaction type",
      );
    }

    const amount = new Prisma.Decimal(data.amount);

    if (data.type === "INCOME") {
      const updatedAccount =
        await accountRepositoryModule.accountRepository.increaseBalance(
          data.accountId,
          userId,
          amount,
          tx,
        );

      if (!updatedAccount) {
        throw new AppError(
          404,
          "ACCOUNT_NOT_FOUND",
          "Account not found",
        );
      }
    } else {
      const updatedAccount =
        await accountRepositoryModule.accountRepository.decreaseBalance(
          data.accountId,
          userId,
          amount,
          tx,
        );

      if (!updatedAccount) {
        throw new AppError(
          400,
          "INSUFFICIENT_BALANCE",
          "Insufficient account balance",
        );
      }
    }

    return transactionRepositoryModule.transactionRepository.create(
      {
        userId,
        type: data.type,
        amount,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        date: new Date(`${data.date}T00:00:00.000Z`),
        accountId: data.accountId,
        categoryId: data.categoryId,
      },
      tx,
    );
  });
};

export const getTransaction = async (
  userId: number,
  transactionId: string,
) => {
  const transaction =
    await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
      transactionId,
      userId,
    );

  if (!transaction) {
    throw new AppError(
      404,
      "TRANSACTION_NOT_FOUND",
      "Transaction not found",
    );
  }

  return transaction;
};

export const getTransactions = async (
  userId: number,
  data: ListTransactionQuery,
) => {

  const filters = {
    userId,
    ...(data.type !== undefined && {
      type: data.type,
    }),
    ...(data.accountId !== undefined && {
      accountId: data.accountId,
    }),
    ...(data.categoryId !== undefined && {
      categoryId: data.categoryId,
    }),
    ...(data.startDate !== undefined && {
      startDate: new Date(
        `${data.startDate}T00:00:00.000Z`,
      ),
    }),
    ...(data.endDate !== undefined && {
      endDate: new Date(
        `${data.endDate}T00:00:00.000Z`,
      ),
    }),
    ...(data.minAmount !== undefined && {
      minAmount: new Prisma.Decimal(data.minAmount),
    }),
    ...(data.maxAmount !== undefined && {
      maxAmount: new Prisma.Decimal(data.maxAmount),
    }),
  };

  const pagination = {
    page: data.page,
    limit: data.limit,
  };
  console.log("SERVICE PAGINATION:", pagination);
  const sort = data.sort;

  const [transactions, total] = await Promise.all([
    transactionRepositoryModule.transactionRepository.findMany(
      filters,
      pagination,
      sort,
    ),
    transactionRepositoryModule.transactionRepository.count(
      filters,
    ),
  ]);

  return {
    data: transactions,
    pagination: {
      page: data.page,
      limit: data.limit,
      total,
      totalPages: Math.ceil(total / data.limit),
    },
  };
};

export const updateTransactionAmount = async (
  userId: number,
  transactionId: string,
  newAmount: number,
) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!transaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    const oldAmount = transaction.amount;
    const newAmountDecimal = new Prisma.Decimal(newAmount);
    const difference = newAmountDecimal.minus(oldAmount);

    if (difference.equals(0)) {
      return transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        {
          amount: newAmountDecimal,
        },
        tx,
      );
    }

    if (transaction.type === "INCOME") {
      if (difference.greaterThan(0)) {
        const updatedAccount =
          await accountRepositoryModule.accountRepository.increaseBalance(
            transaction.accountId,
            userId,
            difference,
            tx,
          );

        if (!updatedAccount) {
          throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found",
          );
        }
      } else {
        const updatedAccount =
          await accountRepositoryModule.accountRepository.decreaseBalance(
            transaction.accountId,
            userId,
            difference.abs(),
            tx,
          );

        if (!updatedAccount) {
          throw new AppError(
            400,
            "INSUFFICIENT_BALANCE",
            "Insufficient account balance",
          );
        }
      }
    } else {
      if (difference.greaterThan(0)) {
        const updatedAccount =
          await accountRepositoryModule.accountRepository.decreaseBalance(
            transaction.accountId,
            userId,
            difference,
            tx,
          );

        if (!updatedAccount) {
          throw new AppError(
            400,
            "INSUFFICIENT_BALANCE",
            "Insufficient account balance",
          );
        }
      } else {
        const updatedAccount =
          await accountRepositoryModule.accountRepository.increaseBalance(
            transaction.accountId,
            userId,
            difference.abs(),
            tx,
          );

        if (!updatedAccount) {
          throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found",
          );
        }
      }
    }

    const updatedTransaction =
      await transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        {
          amount: newAmountDecimal,
        },
        tx,
      );

    if (!updatedTransaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    return updatedTransaction;
  });
};

export const updateTransactionAccount = async (
  userId: number,
  transactionId: string,
  newAccountId: number,
) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!transaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    const newAccount =
      await accountRepositoryModule.accountRepository.findByIdAndUserId(
        newAccountId,
        userId,
        tx,
      );

    if (!newAccount) {
      throw new AppError(
        404,
        "ACCOUNT_NOT_FOUND",
        "Account not found",
      );
    }

    if (transaction.accountId === newAccountId) {
      return transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        {
          accountId: newAccountId,
        },
        tx,
      );
    }

    const amount = transaction.amount;

    if (transaction.type === "EXPENSE") {
      const restoredOldAccount =
        await accountRepositoryModule.accountRepository.increaseBalance(
          transaction.accountId,
          userId,
          amount,
          tx,
        );

      if (!restoredOldAccount) {
        throw new AppError(
          404,
          "ACCOUNT_NOT_FOUND",
          "Account not found",
        );
      }

      const updatedNewAccount =
        await accountRepositoryModule.accountRepository.decreaseBalance(
          newAccountId,
          userId,
          amount,
          tx,
        );

      if (!updatedNewAccount) {
        throw new AppError(
          400,
          "INSUFFICIENT_BALANCE",
          "Insufficient account balance",
        );
      }
    } else {
      const restoredOldAccount =
        await accountRepositoryModule.accountRepository.decreaseBalance(
          transaction.accountId,
          userId,
          amount,
          tx,
        );

      if (!restoredOldAccount) {
        throw new AppError(
          400,
          "INSUFFICIENT_BALANCE",
          "Insufficient account balance",
        );
      }

      const updatedNewAccount =
        await accountRepositoryModule.accountRepository.increaseBalance(
          newAccountId,
          userId,
          amount,
          tx,
        );

      if (!updatedNewAccount) {
        throw new AppError(
          404,
          "ACCOUNT_NOT_FOUND",
          "Account not found",
        );
      }
    }

    const updatedTransaction =
      await transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        {
          accountId: newAccountId,
        },
        tx,
      );

    if (!updatedTransaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    return updatedTransaction;
  });
};

export const updateTransactionCategory = async (
  userId: number,
  transactionId: string,
  newCategoryId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!transaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    const category =
      await categoryRepositoryModule.categoryRepository.findByIdAndUserId(
        newCategoryId,
        userId,
        tx,
      );

    if (!category) {
      throw new AppError(
        404,
        "CATEGORY_NOT_FOUND",
        "Category not found",
      );
    }

    if (category.type !== transaction.type) {
      throw new AppError(
        400,
        "CATEGORY_TYPE_MISMATCH",
        "Category type does not match transaction type",
      );
    }

    const updatedTransaction =
      await transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        {
          categoryId: newCategoryId,
        },
        tx,
      );

    if (!updatedTransaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    return updatedTransaction;
  });
};

export const updateTransaction = async (
  userId: number,
  transactionId: string,
  data: UpdateTransactionInput,
) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!transaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    const newAccountId =
      data.accountId ?? transaction.accountId;

    const newCategoryId =
      data.categoryId ?? transaction.categoryId;

    const newAmount =
      data.amount !== undefined
        ? new Prisma.Decimal(data.amount)
        : transaction.amount;

    const accountChanged =
      newAccountId !== transaction.accountId;

    const amountChanged =
      !newAmount.equals(transaction.amount);

    const categoryChanged =
      newCategoryId !== transaction.categoryId;

    if (accountChanged) {
      const newAccount =
        await accountRepositoryModule.accountRepository.findByIdAndUserId(
          newAccountId,
          userId,
          tx,
        );

      if (!newAccount) {
        throw new AppError(
          404,
          "ACCOUNT_NOT_FOUND",
          "Account not found",
        );
      }
    }

    if (categoryChanged) {
      const newCategory =
        await categoryRepositoryModule.categoryRepository.findByIdAndUserId(
          newCategoryId,
          userId,
          tx,
        );

      if (!newCategory) {
        throw new AppError(
          404,
          "CATEGORY_NOT_FOUND",
          "Category not found",
        );
      }

      if (newCategory.type !== transaction.type) {
        throw new AppError(
          400,
          "CATEGORY_TYPE_MISMATCH",
          "Category type does not match transaction type",
        );
      }
    }

    if (accountChanged) {
      if (transaction.type === "EXPENSE") {
        const restoredOldAccount =
          await accountRepositoryModule.accountRepository.increaseBalance(
            transaction.accountId,
            userId,
            transaction.amount,
            tx,
          );

        if (!restoredOldAccount) {
          throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found",
          );
        }

        const updatedNewAccount =
          await accountRepositoryModule.accountRepository.decreaseBalance(
            newAccountId,
            userId,
            newAmount,
            tx,
          );

        if (!updatedNewAccount) {
          throw new AppError(
            400,
            "INSUFFICIENT_BALANCE",
            "Insufficient account balance",
          );
        }
      } else {
        const restoredOldAccount =
          await accountRepositoryModule.accountRepository.decreaseBalance(
            transaction.accountId,
            userId,
            transaction.amount,
            tx,
          );

        if (!restoredOldAccount) {
          throw new AppError(
            400,
            "INSUFFICIENT_BALANCE",
            "Insufficient account balance",
          );
        }

        const updatedNewAccount =
          await accountRepositoryModule.accountRepository.increaseBalance(
            newAccountId,
            userId,
            newAmount,
            tx,
          );

        if (!updatedNewAccount) {
          throw new AppError(
            404,
            "ACCOUNT_NOT_FOUND",
            "Account not found",
          );
        }
      }
    } else if (amountChanged) {
      const difference =
        newAmount.minus(transaction.amount);

      if (transaction.type === "INCOME") {
        if (difference.greaterThan(0)) {
          const updatedAccount =
            await accountRepositoryModule.accountRepository.increaseBalance(
              transaction.accountId,
              userId,
              difference,
              tx,
            );

          if (!updatedAccount) {
            throw new AppError(
              404,
              "ACCOUNT_NOT_FOUND",
              "Account not found",
            );
          }
        } else {
          const updatedAccount =
            await accountRepositoryModule.accountRepository.decreaseBalance(
              transaction.accountId,
              userId,
              difference.abs(),
              tx,
            );

          if (!updatedAccount) {
            throw new AppError(
              400,
              "INSUFFICIENT_BALANCE",
              "Insufficient account balance",
            );
          }
        }
      } else {
        if (difference.greaterThan(0)) {
          const updatedAccount =
            await accountRepositoryModule.accountRepository.decreaseBalance(
              transaction.accountId,
              userId,
              difference,
              tx,
            );

          if (!updatedAccount) {
            throw new AppError(
              400,
              "INSUFFICIENT_BALANCE",
              "Insufficient account balance",
            );
          }
        } else {
          const updatedAccount =
            await accountRepositoryModule.accountRepository.increaseBalance(
              transaction.accountId,
              userId,
              difference.abs(),
              tx,
            );

          if (!updatedAccount) {
            throw new AppError(
              404,
              "ACCOUNT_NOT_FOUND",
              "Account not found",
            );
          }
        }
      }
    }

    const updateData = {
      ...(data.amount !== undefined && {
        amount: newAmount,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.date !== undefined && {
        date: new Date(
          `${data.date}T00:00:00.000Z`,
        ),
      }),
      ...(data.accountId !== undefined && {
        accountId: data.accountId,
      }),
      ...(data.categoryId !== undefined && {
        categoryId: data.categoryId,
      }),
    };

    const updatedTransaction =
      await transactionRepositoryModule.transactionRepository.updateByIdAndUserId(
        transactionId,
        userId,
        updateData,
        tx,
      );

    if (!updatedTransaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    return updatedTransaction;
  });
};

export const deleteTransaction = async (
  userId: number,
  transactionId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const transaction =
      await transactionRepositoryModule.transactionRepository.findByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!transaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    if (transaction.type === "EXPENSE") {
      const updatedAccount =
        await accountRepositoryModule.accountRepository.increaseBalance(
          transaction.accountId,
          userId,
          transaction.amount,
          tx,
        );

      if (!updatedAccount) {
        throw new AppError(
          404,
          "ACCOUNT_NOT_FOUND",
          "Account not found",
        );
      }
    } else {
      const updatedAccount =
        await accountRepositoryModule.accountRepository.decreaseBalance(
          transaction.accountId,
          userId,
          transaction.amount,
          tx,
        );

      if (!updatedAccount) {
        throw new AppError(
          400,
          "INSUFFICIENT_BALANCE",
          "Insufficient account balance",
        );
      }
    }

    const deletedTransaction =
      await transactionRepositoryModule.transactionRepository.deleteByIdAndUserId(
        transactionId,
        userId,
        tx,
      );

    if (!deletedTransaction) {
      throw new AppError(
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found",
      );
    }

    return deletedTransaction;
  });
};