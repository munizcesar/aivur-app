"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Layers3,
  ListChecks,
  LockKeyhole,
  Menu,
  X,
} from "lucide-react";
import studyPathMock, {
  type StudyModule,
  type StudyTopicStatus,
} from "@/mocks/studyPathMock";
import { useStudyStore, type StudyTab } from "@/store/useStudyStore";
import QuestionList from "@/components/Cockpit/QuestionList";
import { useHydrated } from "@/hooks/useHydrated";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";

const tabs: { key: StudyTab; label: string; icon: typeof BookOpen }[] = [
  { key: "resumo", label: "Resumo Express", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers3 },
  { key: "questoes", label: "Questões", icon: ListChecks },
];

const statusLabel: Record<StudyTopicStatus, string> = {
  completed: "Concluído",
  in_progress: "Em andamento",
  locked: "Bloqueado",
};

function getStatusIcon(status: StudyTopicStatus) {
  if (status === "completed") return <CheckCircle2 size={17} aria-hidden="true" />;
  if (status === "locked") return <LockKeyhole size={16} aria-hidden="true" />;
  return <Circle size={16} aria-hidden="true" />;
}

function ModuleProgress({ module }: { module: StudyModule }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
          style={{ width: `${module.progresso}%` }}
        />
      </div>
      <span className="min-w-[34px] text-right text-[11px] font-semibold text-[#9bb3c0]">
        {module.progresso}%
      </span>
    </div>
  );
}

function CockpitContent() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const activeTab = useStudyStore((state) => state.activeTab);
  const fetchQuestions = useStudyStore((state) => state.fetchQuestions);
  const setActiveModule = useStudyStore((state) => state.setActiveModule);
  const setCurrentTopic = useStudyStore((state) => state.setCurrentTopic);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Sync searchParams with Zustand on mount — URL params win over persisted state
  useEffect(() => {
    const tabParam = searchParams.get("tab") as StudyTab;
    const topicParam = searchParams.get("topic");

    if (tabParam && ["resumo", "flashcards", "questoes"].includes(tabParam)) {
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

  const activeModuleIndex = Math.max(
    0,
    studyPathMock.modulos.findIndex((module) => module.id === activeModuleId),
  );
  const activeModule = studyPathMock.modulos[activeModuleIndex];

  const selectModule = (moduleId: string) => {
    setActiveModule(moduleId);
    setIsSidebarOpen(false);
  };

  // ── Hydration Guard ─────────────────────────────────────────────────────────
  // Prevents Next.js SSR Hydration Mismatch: persisted state from localStorage
  // is unavailable on the server. We return a skeleton until the client
  // rehydrates so server HTML === first client render.
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        Carregando Cockpit...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Botão Hambúrguer Mobile */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Abrir trilha do edital"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Backdrop Mobile */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar (Trilhas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                Modo Flow
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-800">Trilhas</h2>
            </div>
            <button
              type="button"
              aria-label="Fechar trilha"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {studyPathMock.modulos.map((module) => (
              <TrilhasAccordion
                key={module.id}
                title={module.titulo}
                progressPercent={module.progresso}
                topics={module.subtópicos.map((t) => ({
                  id: t.id,
                  label: t.titulo,
                  done: t.status === "completed",
                }))}
              />
            ))}
          </div>
        </div>
      </aside>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#020c14] px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    Conteúdo do módulo
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#fbead0]">{activeModule.titulo}</h2>
                </div>
                <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs text-[#9bb3c0] sm:inline-flex">
                  {activeModule.progresso}% concluído
                </span>
              </div>

              <div className="border-b border-white/10" role="tablist" aria-label="Conteúdo do módulo">
                <div className="flex gap-5 overflow-x-auto">
                  {tabs.map(({ key, label, icon: Icon }) => {
                    const isActive = key === activeTab;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(key)}
                        className={`inline-flex flex-none items-center gap-2 rounded-lg border-b-2 px-1 pb-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 ${
                          isActive
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto pb-32 custom-scrollbar"
                style={{ paddingBottom: "128px" }}
              >
                {activeTab === "questoes" ? (
                  <QuestionList />
                ) : (
                  <div
                    aria-label={`Área reservada para ${activeTab === "resumo" ? "Resumo Express" : "Flashcards"}`}
                    className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"
                  >
                     <div className="mb-4 rounded-full bg-white/5 p-4 text-[#6b99b3]">
                        {activeTab === "resumo" ? <BookOpen size={32} /> : <Layers3 size={32} />}
                     </div>
                     <h3 className="mb-2 text-xl font-bold text-[#fbead0]">
                       {activeTab === "resumo" ? "Resumo Express" : "Flashcards de Revisão"}
                     </h3>
                     <p className="max-w-md text-sm text-[#9bb3c0]">
                       Você está visualizando o módulo correspondente ao tópico selecionado na sua trilha. O motor de {activeTab} carregará o conteúdo inteligente aqui.
                     </p>
                  </div>
                )}

                <div className="mt-8 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b99b3]">
                  Tópicos deste módulo
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activeModule.subtópicos.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"
                    >
                      <span
                        className={`flex-none ${
                          topic.status === "completed"
                            ? "text-emerald-400"
                            : topic.status === "in_progress"
                              ? "text-[var(--color-primary)]"
                              : "text-[#6b99b3]"
                        }`}
                        title={statusLabel[topic.status]}
                      >
                        {getStatusIcon(topic.status)}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-[#dce8ed]">{topic.titulo}</span>
                      <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b99b3]">
                        {statusLabel[topic.status]}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </div>
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
