import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/api/client";

/**
 * Încarcă date din API și le reîncarcă de fiecare dată când ecranul revine în prim-plan
 * (ex. după ce te întorci dintr-un ecran de editare), ca listele să fie mereu la zi.
 */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadStable = useCallback(load, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await loadStable();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [loadStable]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, error, loading, reload, setData };
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "A apărut o eroare neașteptată.";
}
