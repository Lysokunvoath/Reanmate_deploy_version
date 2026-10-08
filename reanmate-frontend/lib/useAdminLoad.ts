"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";

/**
 * Loads admin data in the browser so the session cookie is sent.
 * Redirects to /login on 401; any other failure is returned as `error`.
 */
export function useAdminLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const apiError = err instanceof ApiError ? err : new ApiError(String(err), 0);
        if (apiError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(apiError);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}
