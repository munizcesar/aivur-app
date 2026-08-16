"use client";

import { useEffect, useState } from "react";
import { pullSync } from "@/lib/sync";

export default function GlobalSync() {
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function doSync() {
      // Pequeno atraso para não engasgar o render inicial
      setTimeout(async () => {
        setSyncing(true);
        const hasUpdates = await pullSync();
        if (hasUpdates) {
          // Atualiza a página inteira para garantir que useLocalCourses e useCourseProgress re-hidratem com a nuvem
          window.location.reload();
        } else {
          setSyncing(false);
        }
      }, 2000);
    }
    doSync();
  }, []);

  if (!syncing) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium flex items-center shadow-lg z-50 animate-pulse">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sincronizando...
    </div>
  );
}
