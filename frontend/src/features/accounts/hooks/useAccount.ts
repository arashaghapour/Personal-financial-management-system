import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAccount } from "../api/accounts.queries";
import { getAccountErrorMessage } from "../api/error-messages";

import type { Account } from "../types";

export type AccountQueryResult = {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/** Loads a single account for the edit form. */
export function useAccountQuery(id: number): AccountQueryResult {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const run = async () => {
      try {
        const result = await fetchAccount(id);

        if (!active) {
          return;
        }

        setAccount(result);
        setError(null);
      } catch (caught) {
        if (active) {
          setAccount(null);
          setError(getAccountErrorMessage(caught));
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
      const result = await fetchAccount(id);

      if (!mountedRef.current) {
        return;
      }

      setAccount(result);
      setError(null);
    } catch (caught) {
      if (mountedRef.current) {
        setAccount(null);
        setError(getAccountErrorMessage(caught));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id]);

  return { account, isLoading, error, refetch };
}
