"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudyStore, type StudyTab } from "@/store/useStudyStore";
import { useHydrated } from "@/hooks/useHydrated";

import CockpitSidebar from "@/components/Cockpit/parts/CockpitSidebar";
import CockpitMobileTrigger from "@/components/Cockpit/parts/CockpitMobileTrigger";
import CockpitHeader from "@/components/Cockpit/parts/CockpitHeader";
import CockpitNavigation from "@/components/Cockpit/parts/CockpitNavigation";
import CockpitStage from "@/components/Cockpit/parts/CockpitStage";

function CockpitContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const selectTopic = useStudyStore((state) => state.selectTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  const loadStudyPath = useStudyStore((state) => state.loadStudyPath);
  const isLoading = useStudyStore((state) => state.isLoading);
  const modules = useStudyStore((state) => state.modules);

  // Dispara a carga de dados iniciais
  useEffect(() => {
    loadStudyPath();
  }, [loadStudyPath]);

  // Sync searchParams with Zustand on mount — URL params win over persisted state
  useEffect(() => {
    if (isLoading) return; // Aguarda dados reais para resolver módulos

    const tabParam = searchParams.get("tab") as StudyTab;
    const topicParam = searchParams.get("topic");

    if (tabParam && ["video", "resumo", "flashcards", "questoes"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (topicParam) {
      const targetModule = modules.find((m) =>
        m.subtópicos.some((t) => t.id === topicParam)
      );
      if (targetModule) {
        selectTopic(targetModule.id, topicParam);
      }
    }
  }, [searchParams, setActiveTab, selectTopic, isLoading, modules]);

  // ── Hydration Guard ─────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        Carregando Cockpit...
      </div>
    );
  }

  // ── Skeleton Premium (Proteção CLS) ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
        {/* Skeleton Sidebar */}
        <aside className="hidden md:flex flex-col inset-y-0 left-0 w-80 shrink-0 bg-white border-r border-slate-200 shadow-sm p-6">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-8" />
          
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Skeleton Stage */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020c14] px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-4" />
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-8" />
            
            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>

            <div className="h-[400px] w-full bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <CockpitSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        <CockpitMobileTrigger />
        {currentTopicId ? (
          <div className="flex-1 overflow-y-auto bg-[#020c14] px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
              <CockpitHeader />
              <CockpitNavigation />
              <CockpitStage />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-xl font-bold text-slate-700 mb-2">Pronto para evoluir?</h2>
              <p className="text-slate-500">Selecione um tópico no edital ao lado para carregar as questões e focar no seu progresso.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudyCockpit() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">Carregando Cockpit...</div>}>
      <CockpitContent />
    </Suspense>
  );
}
