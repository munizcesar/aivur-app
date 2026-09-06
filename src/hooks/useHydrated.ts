"use client";

import { useEffect, useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";

/**
 * Returns true only after Zustand's persist middleware has finished
 * rehydrating from localStorage on the client.
 *
 * Use this to gate any render that reads persisted state, preventing
 * Next.js SSR Hydration Mismatch errors.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // hasHydrated() is synchronously true if rehydration already finished
    // (e.g. synchronous localStorage). onFinishHydration fires for async storages.
    const unsub = useStudyStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Eagerly resolve if already done before this effect ran
    if (useStudyStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, []);

  return hydrated;
}
