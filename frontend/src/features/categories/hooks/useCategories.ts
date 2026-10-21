import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCategories } from "../api/categories.queries";
import { getCategoryErrorMessage } from "../api/error-messages";

import type {
  Category,
  CategoryFilter,
  CategoryType,
} from "../types";

export type CategoriesQueryResult = {
  categories: Category[] | null;
  /** True only while the first load (or a filter change) is in flight. */
  isLoading: boolean;
  /** True while any load or refetch is in flight. */
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Applies a successful mutation to the cached list for the active filter. */
  addCategory: (category: Category) => void;
  replaceCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
};

const filterToType = (filter: CategoryFilter): CategoryType | undefined =>
  filter === "ALL" ? undefined : filter;

const matchesFilter = (category: Category, filter: CategoryFilter): boolean =>
  filter === "ALL" || category.type === filter;

/**
 * Loads the authenticated user's categories for the selected filter.
 *
 * The selected filter is part of the request identity and the hook state, so
 * each All / Income / Expense view fetches only its own data and picks up
 * mutations through `refetch` after a successful create, update, or delete.
 * Data from a previous filter is hidden while the new view is loading, which
 * keeps the displayed list consistent with the active filter.
 */
export function useCategoriesQuery(
  filter: CategoryFilter,
): CategoriesQueryResult {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [dataFilter, setDataFilter] = useState<CategoryFilter>(filter);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const latestRequestRef = useRef(0);
  const filterRef = useRef(filter);

  // Keep the request helpers pointed at the currently selected filter without
  // capturing a stale filter in mutation callbacks.
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const startRequest = useCallback(() => {
    const requestFilter = filterRef.current;
    const requestId = ++latestRequestRef.current;

    return {
      requestId,
      requestFilter,
      request: fetchCategories(filterToType(requestFilter)),
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const { requestId, requestFilter, request } = startRequest();

    const run = async () => {
      try {
        const result = await request;

        if (!active || requestId !== latestRequestRef.current) {
          return;
        }

        setCategories(result);
        setDataFilter(requestFilter);
        setError(null);
      } catch (caught) {
        if (!active || requestId !== latestRequestRef.current) {
          return;
        }

        setCategories(null);
        setDataFilter(requestFilter);
        setError(getCategoryErrorMessage(caught));
      } finally {
        if (active && requestId === latestRequestRef.current) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [filter, startRequest]);

  const refetch = useCallback(async () => {
    setIsFetching(true);

    const { requestId, requestFilter, request } = startRequest();

    try {
      const result = await request;

      if (!mountedRef.current || requestId !== latestRequestRef.current) {
        return;
      }

      setCategories(result);
      setDataFilter(requestFilter);
      setError(null);
    } catch (caught) {
      if (mountedRef.current && requestId === latestRequestRef.current) {
        setError(getCategoryErrorMessage(caught));
      }
    } finally {
      if (mountedRef.current && requestId === latestRequestRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [startRequest]);

  const addCategory = useCallback((category: Category) => {
    if (!matchesFilter(category, filterRef.current)) {
      return;
    }

    setCategories((current) =>
      current ? [...current, category] : [category],
    );
  }, []);

  const replaceCategory = useCallback((category: Category) => {
    setCategories((current) => {
      if (!current) {
        return current;
      }

      if (!matchesFilter(category, filterRef.current)) {
        return current.filter((item) => item.id !== category.id);
      }

      return current.map((item) =>
        item.id === category.id ? category : item,
      );
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((current) =>
      current ? current.filter((item) => item.id !== id) : current,
    );
  }, []);

  const filterChanged = dataFilter !== filter;

  return {
    categories: filterChanged ? null : categories,
    isLoading: filterChanged || isLoading,
    isFetching: filterChanged || isFetching,
    error: filterChanged ? null : error,
    refetch,
    addCategory,
    replaceCategory,
    removeCategory,
  };
}
