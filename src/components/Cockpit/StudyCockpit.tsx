"use client";

import { useEffect, useState } from "react";
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

export default function StudyCockpit() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const activeTab = useStudyStore((state) => state.activeTab);
  const fetchQuestions = useStudyStore((state) => state.fetchQuestions);
  const setActiveModule = useStudyStore((state) => state.setActiveModule);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const activeModuleIndex = Math.max(
    0,
    studyPathMock.modulos.findIndex((module) => module.id === activeModuleId),
  );
  const activeModule = studyPathMock.modulos[activeModuleIndex];

  const selectModule = (id: string) => {
    setActiveModule(id);
    setIsSidebarOpen(false);
  };

  return (
    <section className="h-screen min-h-screen overflow-hidden bg-[#071d2d] text-[#fbead0]">
      <div className="flex h-full min-h-0 w-full flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a2e45]/95 px-4 py-4 backdrop-blur-md md:px-6">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3">
            <button
              type="button"
              aria-label="Abrir trilha do edital"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-white/15 text-[#fbead0] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] md:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9bb3c0]">
                {studyPathMock.titulo_curso}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="truncate text-lg font-bold text-[#fbead0] md:text-xl">
                  {activeModule.titulo}
                </h1>
                <span className="hidden text-xs text-[#9bb3c0] sm:inline">
                  Módulo {activeModuleIndex + 1} de {studyPathMock.modulos.length}
                </span>
              </div>
            </div>

            <div className="hidden w-48 flex-none sm:block md:w-64">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#9bb3c0]">
                <span>Progresso geral</span>
                <span className="text-[#fbead0]">{studyPathMock.progresso_geral}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
                  style={{ width: `${studyPathMock.progresso_geral}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1">
          <div
            className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
              isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] -translate-x-full border-r border-white/10 bg-[#0a2e45] px-4 py-5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:sticky md:top-[77px] md:z-20 md:block md:h-[calc(100vh-77px)] md:w-72 md:flex-none md:translate-x-0 md:overflow-y-auto md:px-5 md:py-6 ${
              isSidebarOpen ? "translate-x-0" : ""
            }`}
            style={{ width: "288px", flex: "0 0 288px" }}
          >
            <div className="mb-6 flex items-center justify-between md:block">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  Trilha do edital
                </p>
                <h2 className="mt-2 text-lg font-bold text-[#fbead0]">Plano de estudos</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar trilha do edital"
                onClick={() => setIsSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-[#fbead0] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] md:hidden"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Módulos da trilha" className="space-y-2">
              {studyPathMock.modulos.map((module, index) => {
                const isActive = index === activeModuleIndex;
                return (
                  <button
                    key={module.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => selectModule(module.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? "border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg text-xs font-bold ${
                          isActive ? "bg-[var(--color-primary)] text-[#071d2d]" : "bg-white/10 text-[#9bb3c0]"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-[#fbead0]">
                          {module.titulo}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[#9bb3c0]">
                          {module.subtitulo}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className={`mt-1 flex-none ${isActive ? "text-[var(--color-primary)]" : "text-[#6b99b3]"}`}
                        aria-hidden="true"
                      />
                    </div>
                    <ModuleProgress module={module} />
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-6 md:px-8 md:py-8">
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
                    className="mt-6 min-h-[420px] rounded-2xl border border-dashed border-white/15 bg-white/[0.02]"
                  />
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
      </div>
    </section>
  );
}
