import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBudgetMutation,
  deleteBudgetMutation,
  fetchBudget,
  fetchBudgets,
  updateBudgetMutation,
} from "../api/budgets.queries";
import { budgetKeys } from "../api/budget.keys";

import type {
  BudgetFilters,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from "../types";

export const useBudgetsQuery = (filters: BudgetFilters) =>
  useQuery({
    queryKey: budgetKeys.list(filters),
    queryFn: () => fetchBudgets(filters),
  });

export const useBudgetQuery = (id: string) =>
  useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => fetchBudget(id),
  });

const useInvalidateBudgets = () => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: budgetKeys.all });
};

export const useCreateBudgetMutation = () => {
  const invalidateBudgets = useInvalidateBudgets();

  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => createBudgetMutation(data),
    onSuccess: () => invalidateBudgets(),
  });
};

export const useUpdateBudgetMutation = () => {
  const invalidateBudgets = useInvalidateBudgets();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBudgetRequest;
    }) => updateBudgetMutation(id, data),
    onSuccess: () => invalidateBudgets(),
  });
};

export const useDeleteBudgetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBudgetMutation(id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: budgetKeys.progress(id) });
      await queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
};
