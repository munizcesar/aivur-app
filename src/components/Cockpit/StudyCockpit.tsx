"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStudyStore, type StudyTab } from "@/store/useStudyStore";
import { useHydrated } from "@/hooks/useHydrated";

import CockpitSidebar from "@/components/Cockpit/parts/CockpitSidebar";
import CockpitHeader from "@/components/Cockpit/parts/CockpitHeader";
import CockpitNavigation from "@/components/Cockpit/parts/CockpitNavigation";
import CockpitStage from "@/components/Cockpit/parts/CockpitStage";
import { Menu } from "lucide-react";

function CockpitContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const selectTopic = useStudyStore((state) => state.selectTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  const loadStudyPath = useStudyStore((state) => state.loadStudyPath);
  const isLoading = useStudyStore((state) => state.isLoading);
  const modules = useStudyStore((state) => state.modules);
  const isMobileDrawerOpen = useStudyStore((state) => state.isMobileDrawerOpen);
  const toggleMobileDrawer = useStudyStore((state) => state.toggleMobileDrawer);

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
      <div className="flex min-h-screen w-full flex-col overflow-hidden bg-[#0B1929] text-slate-200 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem]">
        Carregando Cockpit...
      </div>
    );
  }

  // ── Skeleton Premium (Proteção CLS) ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col overflow-hidden bg-[#0B1929] text-slate-200 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Skeleton Sidebar */}
        <aside className="hidden flex-col bg-[#091422] p-6 shadow-sm lg:flex lg:h-screen lg:w-full lg:min-w-0 lg:shrink-0 lg:border-r lg:border-[#C9A84C]/20">
          <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-8" />
          
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Skeleton Stage */}
        <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-[#020c14] p-4 lg:p-10">
          <div className="flex w-full min-w-0 flex-1 flex-col">
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
    <div className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-[#0B1929] text-slate-200 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem]">
      
      {/* Overlay Escuro para Mobile (clicar para fechar) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={toggleMobileDrawer} />
      )}

      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-[#020c14] p-4 lg:p-10">
        {/* Botão Hambúrguer (Apenas Mobile) */}
        <button 
          className="lg:hidden mb-6 p-2 bg-[#122338] text-[#C9A84C] rounded-lg border border-[#C9A84C]/30 hover:bg-[#1E3A5F] transition-colors" 
          onClick={toggleMobileDrawer}
        >
          <Menu size={24}/>
        </button>

        {currentTopicId ? (
          <div className="flex w-full min-w-0 flex-1 flex-col">
            <CockpitHeader />
            <CockpitNavigation />
            <CockpitStage />
          </div>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-xl font-bold text-[#FBEBD0] mb-2">Pronto para evoluir?</h2>
              <p className="text-slate-400">Selecione um tópico no edital ao lado para carregar as questões e focar no seu progresso.</p>
            </div>
          </div>
        )}
      </main>

      <CockpitSidebar />
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
