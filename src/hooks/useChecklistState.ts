"use client";

import { useState, useEffect, useCallback } from "react";

interface ChecklistState {
  checked: Set<string>;
  toggle: (topicId: string) => void;
  resetAll: () => void;
  isHydrated: boolean;
}

/**
 * Hook de persistência do checklist por curso.
 *
 * Persiste no localStorage sob a chave `aivur_checklist_<courseId>`.
 * A interface (checked, toggle, resetAll) está desenhada para ser trocada
 * por chamadas de API REST sem reescrever os componentes — basta substituir
 * a lógica interna deste hook.
 */
export function useChecklistState(courseId: string): ChecklistState {
  const storageKey = `aivur_checklist_${courseId}`;

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Carrega do localStorage apenas no cliente (evita hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        setChecked(new Set(parsed));
      }
    } catch {
      // localStorage indisponível ou dado corrompido — inicia vazio
    }
    setIsHydrated(true);
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // silently ignore
      }
    },
    [storageKey]
  );

  const toggle = useCallback(
    (topicId: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(topicId)) {
          next.delete(topicId);
        } else {
          next.add(topicId);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetAll = useCallback(() => {
    const empty = new Set<string>();
    setChecked(empty);
    persist(empty);
  }, [persist]);

  return { checked, toggle, resetAll, isHydrated };
}
