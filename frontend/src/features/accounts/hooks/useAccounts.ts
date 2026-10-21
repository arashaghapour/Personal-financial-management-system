import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAccounts } from "../api/accounts.queries";
import { getAccountErrorMessage } from "../api/error-messages";

import type { Account } from "../types";

export type AccountsQueryResult = {
  accounts: Account[] | null;
  /** True only while the first load is in flight. */
  isLoading: boolean;
  /** True while any load or refetch is in flight. */
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Applies a successful mutation to the cached list. */
  addAccount: (account: Account) => void;
  replaceAccount: (account: Account) => void;
  removeAccount: (id: number) => void;
};

/**
 * Loads the authenticated user's accounts. State lives here so server data is
 * not duplicated into unrelated component state; mutations call `refetch` to
 * invalidate the current view.
 */
export function useAccountsQuery(): AccountsQueryResult {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const run = async () => {
      try {
        const result = await fetchAccounts();

        if (!active) {
          return;
        }

        setAccounts(result);
        setError(null);
      } catch (caught) {
        if (active) {
          setError(getAccountErrorMessage(caught));
        }
      } finally {
        if (active) {
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
  }, []);

  const refetch = useCallback(async () => {
    setIsFetching(true);

    try {
      const result = await fetchAccounts();

      if (!mountedRef.current) {
        return;
      }

      setAccounts(result);
      setError(null);
    } catch (caught) {
      if (mountedRef.current) {
        setError(getAccountErrorMessage(caught));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, []);

  const addAccount = useCallback((account: Account) => {
    setAccounts((current) =>
      current ? [...current, account] : [account],
    );
  }, []);

  const replaceAccount = useCallback((account: Account) => {
    setAccounts((current) =>
      current
        ? current.map((item) => (item.id === account.id ? account : item))
        : current,
    );
  }, []);

  const removeAccount = useCallback((id: number) => {
    setAccounts((current) =>
      current ? current.filter((item) => item.id !== id) : current,
    );
  }, []);

  return {
    accounts,
    isLoading,
    isFetching,
    error,
    refetch,
    addAccount,
    replaceAccount,
    removeAccount,
  };
}
