"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudyStore, type StudyTab } from "@/store/useStudyStore";
import { useHydrated } from "@/hooks/useHydrated";
import studyPathMock from "@/mocks/studyPathMock";

import CockpitSidebar from "@/components/Cockpit/parts/CockpitSidebar";
import CockpitMobileTrigger from "@/components/Cockpit/parts/CockpitMobileTrigger";
import CockpitHeader from "@/components/Cockpit/parts/CockpitHeader";
import CockpitNavigation from "@/components/Cockpit/parts/CockpitNavigation";
import CockpitStage from "@/components/Cockpit/parts/CockpitStage";

function CockpitContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const setActiveModule = useStudyStore((state) => state.setActiveModule);
  const setCurrentTopic = useStudyStore((state) => state.setCurrentTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);

  // Sync searchParams with Zustand on mount — URL params win over persisted state
  useEffect(() => {
    const tabParam = searchParams.get("tab") as StudyTab;
    const topicParam = searchParams.get("topic");

    if (tabParam && ["video", "resumo", "flashcards", "questoes"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (topicParam) {
      setCurrentTopic(topicParam);
      const targetModule = studyPathMock.modulos.find((m) =>
        m.subtópicos.some((t) => t.id === topicParam)
      );
      if (targetModule) {
        setActiveModule(targetModule.id);
      }
    }
  }, [searchParams, setActiveTab, setActiveModule, setCurrentTopic]);

  // ── Hydration Guard ─────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        Carregando Cockpit...
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
