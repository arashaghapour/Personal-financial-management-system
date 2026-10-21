import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCategory } from "../api/categories.queries";
import { getCategoryErrorMessage } from "../api/error-messages";

import type { Category } from "../types";

export type CategoryQueryResult = {
  category: Category | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/** Loads a single category for the edit form. */
export function useCategoryQuery(id: string): CategoryQueryResult {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const run = async () => {
      try {
        const result = await fetchCategory(id);

        if (!active) {
          return;
        }

        setCategory(result);
        setError(null);
      } catch (caught) {
        if (active) {
          setCategory(null);
          setError(getCategoryErrorMessage(caught));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [id]);

  const refetch = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchCategory(id);

      if (!mountedRef.current) {
        return;
      }

      setCategory(result);
      setError(null);
    } catch (caught) {
      if (mountedRef.current) {
        setCategory(null);
        setError(getCategoryErrorMessage(caught));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id]);

  return { category, isLoading, error, refetch };
}
