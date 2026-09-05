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
import QuestionSkeleton from "@/components/UI/QuestionSkeleton";

type CockpitQuestion = {
  id: string;
  enunciado: string;
  alternativas: { id: string; texto: string }[];
  correta: string;
  explicacao: string;
};

const cockpitQuestions: CockpitQuestion[] = [
  {
    id: "cockpit-q1",
    enunciado: "Qual princípio orienta a atuação da Administração Pública conforme o caput do art. 37 da Constituição Federal?",
    alternativas: [
      { id: "A", texto: "Legalidade, impessoalidade, moralidade, publicidade e eficiência." },
      { id: "B", texto: "Autonomia, soberania, cidadania, pluralismo e igualdade." },
      { id: "C", texto: "Oralidade, informalidade, economia e celeridade." },
      { id: "D", texto: "Contraditório, ampla defesa, juiz natural e presunção de inocência." },
    ],
    correta: "A",
    explicacao: "O art. 37, caput, reúne os princípios LIMPE: legalidade, impessoalidade, moralidade, publicidade e eficiência.",
  },
  {
    id: "cockpit-q2",
    enunciado: "No processo administrativo, a motivação dos atos públicos contribui principalmente para:",
    alternativas: [
      { id: "A", texto: "Eliminar a necessidade de controle pelos interessados." },
      { id: "B", texto: "Demonstrar os fundamentos da decisão e permitir seu controle." },
      { id: "C", texto: "Substituir a publicação oficial do ato administrativo." },
      { id: "D", texto: "Restringir o acesso do cidadão aos documentos públicos." },
    ],
    correta: "B",
    explicacao: "A motivação apresenta os fatos e fundamentos jurídicos da decisão, permitindo transparência e controle do ato administrativo.",
  },
  {
    id: "cockpit-q3",
    enunciado: "A publicidade dos atos administrativos tem como finalidade essencial:",
    alternativas: [
      { id: "A", texto: "Garantir transparência e eficácia externa aos atos, quando exigida." },
      { id: "B", texto: "Permitir que todo ato seja mantido em sigilo permanente." },
      { id: "C", texto: "Dispensar a Administração de prestar informações." },
      { id: "D", texto: "Transferir a decisão administrativa para o Poder Judiciário." },
    ],
    correta: "A",
    explicacao: "A publicidade assegura transparência e, quando exigida, dá eficácia externa aos atos administrativos.",
  },
];

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

function QuestionList() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const isLoading = useStudyStore((state) => state.isLoading);
  const registerAnswer = useStudyStore((state) => state.registerAnswer);
  const answeredCount = useStudyStore((state) => state.progressData.answered);

  const selectAnswer = (questionId: string, optionId: string) => {
    if (answeredQuestions[questionId]) return;
    setSelectedAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  const confirmAnswer = (question: CockpitQuestion) => {
    if (!selectedAnswers[question.id]) return;
    registerAnswer(question.id, selectedAnswers[question.id] === question.correta);
    setAnsweredQuestions((current) => ({ ...current, [question.id]: true }));
  };

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b99b3]">
            Questões do módulo
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#fbead0]">Pratique antes de avançar</h3>
        </div>
        <span className="hidden text-xs text-[#9bb3c0] sm:block">
          {answeredCount}/{cockpitQuestions.length} respondidas
        </span>
      </div>

      {isLoading
        ? Array.from({ length: 4 }, (_, index) => <QuestionSkeleton key={`question-skeleton-${index}`} />)
        : cockpitQuestions.map((question, index) => {
        const selected = selectedAnswers[question.id];
        const answered = answeredQuestions[question.id];

        return (
          <article key={question.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs text-[#9bb3c0]">
              <span className="font-bold text-[#fbead0]">Q{index + 1}</span>
              <span>Inédita · {answered ? "Respondida" : "Pendente"}</span>
            </div>
            <div className="p-4 md:p-6">
              <p className="text-base font-semibold leading-relaxed text-[#fbead0] md:text-lg">{question.enunciado}</p>
              <div className="mt-5 flex flex-col gap-3">
                {question.alternativas.map((option) => {
                  const isSelected = selected === option.id;
                  const isCorrect = answered && option.id === question.correta;
                  const isWrong = answered && isSelected && !isCorrect;
                  const isInactive = answered && !isCorrect && !isWrong;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectAnswer(question.id, option.id)}
                      disabled={answered}
                      className={`w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 ease-in-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 disabled:cursor-default ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : isWrong
                            ? "border-rose-500 bg-rose-50 text-rose-900"
                            : isInactive
                              ? "border-slate-200 bg-white text-slate-600 opacity-60"
                            : isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md ring-1 ring-[var(--color-primary)]/50"
                          : "hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                      }`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px minmax(0, 1fr)",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 20px",
                        minHeight: "72px",
                        boxSizing: "border-box",
                        backgroundColor: isCorrect
                          ? "#ecfdf5"
                          : isWrong
                            ? "#fff1f2"
                            : isInactive
                              ? "#ffffff"
                            : isSelected
                              ? "color-mix(in srgb, var(--color-primary) 5%, white)"
                              : "#ffffff",
                        borderColor: isCorrect
                          ? "#10b981"
                          : isWrong
                            ? "#f43f5e"
                            : isInactive
                              ? "#e2e8f0"
                              : undefined,
                        color: isCorrect ? "#064e3b" : isWrong ? "#881337" : isInactive ? "#475569" : "#1e293b",
                        opacity: isInactive ? 0.6 : 1,
                      }}
                    >
                      <span
                        className={`flex items-center justify-center rounded-full border-2 text-sm font-bold transition-transform duration-200 ease-in-out ${
                          isSelected ? "scale-105" : ""
                        }`}
                        style={{
                          width: "40px",
                          height: "40px",
                          minWidth: "40px",
                          minHeight: "40px",
                          color: isCorrect || isWrong ? "#ffffff" : isInactive ? "#475569" : "#334155",
                          backgroundColor: isCorrect ? "#10b981" : isWrong ? "#f43f5e" : isSelected ? "#e2e8f0" : "#ffffff",
                          borderColor: isCorrect ? "#10b981" : isWrong ? "#f43f5e" : isSelected ? "var(--color-primary)" : "#cbd5e1",
                          transform: isSelected ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        {option.id}
                      </span>
                      <span
                        className="text-base font-medium leading-relaxed text-slate-800"
                        style={{
                          color: isCorrect ? "#064e3b" : isWrong ? "#881337" : isInactive ? "#475569" : "#1e293b",
                          minWidth: 0,
                        }}
                      >
                        {option.texto}
                      </span>
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div
                  className={`mt-6 rounded-xl border p-4 opacity-100 transition-opacity duration-300 ease-in-out ${
                    selected === question.correta
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-slate-100 text-slate-800"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-sm font-bold">
                    {selected === question.correta ? "Resposta correta!" : "Resposta incorreta"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{question.explicacao}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => confirmAnswer(question)}
                disabled={!selected || answered}
                className="mt-5 w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {answered ? `Resposta registrada · ${selected}` : "Responder"}
              </button>
            </div>
          </article>
        );
        })}
    </div>
  );
}
