import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Flag,
  FolderPlus,
  Info,
  MessageCircle,
  MoreHorizontal,
  StickyNote,
  Tag,
  X,
} from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

interface Option {
  texto: string;
  isCorreta: boolean;
}

interface Question {
  id: string;
  codigo: string;
  banca: string;
  ano: string;
  orgao: string;
  prova: string;
  tags: string[];
  enunciado: string;
  alternativas: Option[];
  comentario: string;
}

const letters = ["A", "B", "C", "D", "E"];
type AnswerState = { selected: number; submitted: boolean };

const iconButtonClass =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]";

function Metadata({ question, compact = false }: { question: Question; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center text-xs text-[var(--color-text-muted)] ${compact ? "gap-x-3 gap-y-1" : "gap-x-4 gap-y-2"}`}>
      <span><strong className="font-bold text-[var(--color-text)]">Ano</strong> {question.ano}</span>
      <span><strong className="font-bold text-[var(--color-text)]">Banca</strong> {question.banca}</span>
      <span><strong className="font-bold text-[var(--color-text)]">Órgão</strong> {question.orgao}</span>
      {!compact && <span><strong className="font-bold text-[var(--color-text)]">Prova</strong> {question.prova}</span>}
    </div>
  );
}

function ResultIcon({ isCorrect, isSelected }: { isCorrect: boolean; isSelected: boolean }) {
  if (isCorrect) return <CheckCircle2 size={19} className="shrink-0 flex-none text-[var(--color-success)]" aria-hidden="true" />;
  if (isSelected) return <X size={19} className="shrink-0 flex-none text-[var(--color-error)]" aria-hidden="true" />;
  return null;
}

function AnswerOption({
  option,
  index,
  answer,
  mobile = false,
  resolving = false,
  onSelect,
}: {
  option: Option;
  index: number;
  answer?: AnswerState;
  mobile?: boolean;
  resolving?: boolean;
  onSelect: () => void;
}) {
  const selected = answer?.selected === index;
  const submitted = answer?.submitted;
  const correct = submitted && option.isCorreta;
  const incorrect = submitted && selected && !option.isCorreta;
  const stateClass = correct
    ? "border-emerald-500 bg-emerald-50"
    : incorrect
      ? "border-rose-500 bg-rose-50"
      : selected
        ? "border-[#C9A84C] bg-[#C9A84C]/10"
        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#C9A84C]/60 hover:bg-[var(--color-surface-offset)]";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={submitted || resolving}
      aria-pressed={selected}
      className={`group grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 text-left transition-colors disabled:cursor-default ${mobile ? "rounded-xl border px-5 py-4" : "rounded-lg border px-3 py-2.5"} ${stateClass} ${resolving && selected ? "opacity-80" : ""}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${correct ? "border-emerald-500 bg-emerald-500 text-white" : incorrect ? "border-rose-500 bg-rose-500 text-white" : selected ? "border-[#C9A84C] bg-[#C9A84C] text-[#0B1929]" : "border-[var(--color-border)] bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]"}`}>
        {resolving && selected ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1929]/30 border-t-[#0B1929]" />
        ) : (
          letters[index]
        )}
      </span>
      <span className={`min-w-0 leading-relaxed ${mobile ? "text-[15px]" : "text-sm"} ${submitted && !correct && !incorrect ? "text-[var(--color-text-faint)]" : "text-[var(--color-text)]"}`}>{option.texto}</span>
      <ResultIcon isCorrect={Boolean(correct)} isSelected={Boolean(incorrect)} />
    </button>
  );
}

function ActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-[var(--color-divider)] pt-2">
      <button type="button" className={iconButtonClass}><Info size={15} className="shrink-0 flex-none" />Gabarito Comentado</button>
      <button type="button" className={iconButtonClass}><BookOpen size={15} className="shrink-0 flex-none" />Aulas</button>
      <button type="button" className={iconButtonClass}><MessageCircle size={15} className="shrink-0 flex-none" />Comentários</button>
      <button type="button" className={iconButtonClass}><BarChart3 size={15} className="shrink-0 flex-none" />Estatísticas</button>
      <button type="button" className={iconButtonClass}><FolderPlus size={15} className="shrink-0 flex-none" />Cadernos</button>
      <button type="button" className={iconButtonClass}><StickyNote size={15} className="shrink-0 flex-none" />Anotações</button>
      <button type="button" className={iconButtonClass}><Flag size={15} className="shrink-0 flex-none" />Notificar Erro</button>
    </div>
  );
}

function QuestionResult({ question }: { question: Question }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 rounded-lg border border-[#C9A84C]/50 bg-[#122338] p-4 text-sm text-slate-200 shadow-[inset_0_0_0_1px_rgba(201,168,76,0.12)]"
    >
      <div className="flex items-start gap-2">
        <Info size={17} className="mt-0.5 shrink-0 flex-none text-[#C9A84C]" />
        <div>
          <strong className="font-bold text-[#C9A84C]">Gabarito comentado</strong>
          <p className="mt-1 leading-relaxed text-slate-300">{question.comentario}</p>
        </div>
      </div>
    </div>
  );
}

function DesktopQuestion({ question, index, answer, pending, resolving, onSelect, onSubmit }: { question: Question; index: number; answer?: AnswerState; pending?: number; resolving?: boolean; onSelect: (index: number) => void; onSubmit: () => void }) {
  return (
    <article className="border-b border-[var(--color-divider)] px-1 py-6 first:pt-2 last:border-b-0">
      <header className="mb-3 flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[#C9A84C] px-2 font-bold text-[#0B1929]">{index}</span>
        <span className="font-bold text-[var(--color-text)]">Questão {question.codigo}</span><span className="text-[var(--color-text-faint)]">•</span>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {question.tags.map((tag, tagIndex) => <span key={tag} className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><Tag size={12} className="shrink-0 flex-none text-[#C9A84C]" />{tag}{tagIndex < question.tags.length - 1 && <ChevronRight size={12} className="shrink-0 flex-none" />}</span>)}
        </div>
      </header>
      <Metadata question={question} />
      <p className="mt-4 max-w-4xl text-[15px] font-medium leading-7 text-[var(--color-text)]">{question.enunciado}</p>
      <div className="mt-4 grid max-w-4xl gap-2">{question.alternativas.map((option, optionIndex) => <AnswerOption key={option.texto} option={option} index={optionIndex} answer={answer ?? (pending === undefined ? undefined : { selected: pending, submitted: false })} resolving={resolving} onSelect={() => onSelect(optionIndex)} />)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={answer?.submitted || pending === undefined || resolving} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-bold text-[#0B1929] transition-colors hover:bg-[#d4b65e] disabled:cursor-default disabled:opacity-60">{resolving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1929]/30 border-t-[#0B1929]" /> : answer?.submitted ? <Check size={16} className="shrink-0 flex-none" /> : null}{resolving ? "Validando..." : answer?.submitted ? "Respondida" : "Responder"}</button>
        <span className="text-xs text-[var(--color-text-faint)]">{answer?.submitted ? "Resposta registrada" : "Selecione uma alternativa"}</span>
      </div>
      {answer?.submitted && <QuestionResult question={question} />}
      <div className="mt-4"><ActionBar /></div>
    </article>
  );
}

function MobileQuestionHeader({ question, index, total }: { question: Question; index: number; total: number }) {
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const modules = useStudyStore((state) => state.modules);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  
  const activeModule = modules.find((m) => m.id === activeModuleId);
  const topic = activeModule?.subtópicos.find((t) => t.id === currentTopicId);

  return (
    <header className="border-b border-[var(--color-divider)] bg-[var(--color-surface)] px-4 pb-3 pt-3">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setActiveTab('resumo')} aria-label="Voltar" className="mt-0.5 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)]"><ArrowLeft size={20} className="shrink-0 flex-none" /></button>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--color-text)]">{topic?.titulo ?? "Questão " + question.codigo}</p><p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{activeModule?.titulo ?? "Geral"} &middot; Questão {index} de {total}</p></div>
        <button type="button" aria-label="Filtrar questões" className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)]"><Filter size={19} className="shrink-0 flex-none" /></button>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div><div className="text-2xl font-black leading-none text-[var(--color-text)]"><span className="text-[var(--color-primary)]">{index}</span> <span className="text-base font-semibold text-[var(--color-text-muted)]">de {total}</span></div><div className="mt-2 h-1 w-16 rounded-full bg-[var(--color-primary)]" /></div>
        <div className="flex items-center gap-1 text-[var(--color-text-muted)]"><button type="button" aria-label="Aulas" className="rounded-md p-2 hover:bg-[var(--color-surface-offset)]"><BookOpen size={17} className="shrink-0 flex-none" /></button><button type="button" aria-label="Comentários" className="rounded-md p-2 hover:bg-[var(--color-surface-offset)]"><MessageCircle size={17} className="shrink-0 flex-none" /></button><button type="button" aria-label="Mais recursos" className="rounded-md p-2 hover:bg-[var(--color-surface-offset)]"><MoreHorizontal size={19} className="shrink-0 flex-none" /></button></div>
      </div>
    </header>
  );
}

export default function QuestionsTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [pending, setPending] = useState<Record<string, number | undefined>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const registerAnswer = useStudyStore((state) => state.registerAnswer);
  const modules = useStudyStore((state) => state.modules);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);
  const activeModule = modules.find((module) => module.id === activeModuleId);
  const topic = activeModule?.subtópicos.find((item) => item.id === currentTopicId);
  const question = questions[currentIndex];

  useEffect(() => {
    const selectedTopic = topic as NonNullable<typeof topic>;
    if (!selectedTopic) return;
    let cancelled = false;
    async function loadQuestions() {
      setIsLoading(true);
      setError(null);
      setCurrentIndex(0);
      setAnswers({});
      setPending({});
      setResolvingId(null);
      try {
        const response = await fetch("/api/mentor/questoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: selectedTopic.titulo, subject: activeModule?.titulo }),
        });
        const data = await response.json() as { questoes?: Array<{ id: string; enunciado: string; alternativas: Record<string, string>; correta: string; justificativa: string }>; error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível gerar questões.");
        const mapped = (data.questoes ?? []).map((item, index): Question => ({
          id: item.id,
          codigo: `IA-${index + 1}`,
          banca: "Gerada com IA",
          ano: new Date().getFullYear().toString(),
          orgao: activeModule?.titulo ?? "AIVUR",
          prova: selectedTopic.titulo,
          tags: [activeModule?.titulo ?? "Geral", selectedTopic.titulo],
          enunciado: item.enunciado,
          alternativas: Object.entries(item.alternativas).map(([key, texto]) => ({ texto: `${key}) ${texto}`, isCorreta: key === item.correta })),
          comentario: item.justificativa,
        }));
        if (!cancelled) setQuestions(mapped);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Erro ao gerar questões.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadQuestions();
    return () => { cancelled = true; };
  }, [topic, activeModule?.titulo]);

  const selectOption = (questionId: string, optionIndex: number) => {
    if (answers[questionId]?.submitted || resolvingId) return;
    setPending((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const submitAnswer = (questionId: string) => {
    const selected = pending[questionId];
    if (selected === undefined || answers[questionId]?.submitted || resolvingId) return;
    setResolvingId(questionId);
    window.setTimeout(() => {
      setAnswers((current) => ({ ...current, [questionId]: { selected, submitted: true } }));
      const submittedQuestion = questions.find((item) => item.id === questionId);
      registerAnswer(questionId, Boolean(submittedQuestion?.alternativas[selected]?.isCorreta));
      setResolvingId(null);
    }, 280);
  };

  const selectAndSubmitMobile = (questionId: string, optionIndex: number) => {
    if (answers[questionId]?.submitted || resolvingId) return;
    setPending((current) => ({ ...current, [questionId]: optionIndex }));
    setResolvingId(questionId);
    window.setTimeout(() => {
      setAnswers((current) => ({ ...current, [questionId]: { selected: optionIndex, submitted: true } }));
      const submittedQuestion = questions.find((item) => item.id === questionId);
      registerAnswer(questionId, Boolean(submittedQuestion?.alternativas[optionIndex]?.isCorreta));
      setResolvingId(null);
    }, 280);
  };

  if (isLoading) return <div className="mt-6 flex min-h-[320px] items-center justify-center gap-3 text-slate-400"><span className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C]" />Gerando questões com contexto do tópico...</div>;
  if (error || questions.length === 0 || !question) return <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-950/20 p-6 text-center text-sm text-rose-300">{error ?? "Nenhuma questão foi gerada para este tópico."}</div>;

  return (
    <section style={{ "--spacing": "0.25rem" } as CSSProperties} className="mt-4 w-full min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)] lg:mt-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
      <div className="hidden lg:block">
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-4"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]"><button type="button" onClick={() => setActiveTab('resumo')} className="mr-2 p-1 hover:bg-white/10 rounded-md"><ArrowLeft size={16} /></button><Link href="/trilhas" className="hover:underline">{activeModule?.titulo}</Link> <span className="text-[var(--color-text-muted)]">&gt;</span> <button type="button" onClick={() => setActiveTab('resumo')} className="hover:underline">{topic?.titulo}</button> <span className="text-[var(--color-text-muted)]">&gt;</span> <span className="text-[var(--color-text)]">Questões</span></p><h3 className="mt-1 text-xl font-black text-[var(--color-text)]">Questão {currentIndex + 1} de {questions.length}</h3></div><div className="flex gap-2"><button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] disabled:opacity-40"><ChevronLeft size={17} className="shrink-0 flex-none" />Anterior</button><button type="button" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] disabled:opacity-40">Próxima<ChevronRight size={17} className="shrink-0 flex-none" /></button></div></div>
        <div>{questions.map((item, index) => <DesktopQuestion key={item.id} question={item} index={index + 1} answer={answers[item.id]} pending={pending[item.id]} resolving={resolvingId === item.id} onSelect={(optionIndex) => selectOption(item.id, optionIndex)} onSubmit={() => submitAnswer(item.id)} />)}</div>
      </div>

      <div className="lg:hidden">
        <MobileQuestionHeader question={question} index={currentIndex + 1} total={questions.length} />
        <div className="px-4 pb-24 pt-4"><Metadata question={question} compact /><p className="mt-5 text-base font-medium leading-7 text-[var(--color-text)]">{question.enunciado}</p><div className="mt-5 grid gap-3">{question.alternativas.map((option, index) => <AnswerOption key={option.texto} option={option} index={index} answer={answers[question.id] ?? (pending[question.id] === undefined ? undefined : { selected: pending[question.id] as number, submitted: false })} resolving={resolvingId === question.id} mobile onSelect={() => selectAndSubmitMobile(question.id, index)} />)}</div>{answers[question.id]?.submitted && <QuestionResult question={question} />}</div>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-[var(--color-divider)] bg-[var(--color-surface)]/95 px-3 py-3 shadow-[0_-4px_12px_rgba(10,46,69,0.08)] backdrop-blur lg:hidden">
          <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] disabled:opacity-40"><ChevronLeft size={17} className="shrink-0 flex-none" />Anterior</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-text-muted)]"><FileText size={15} className="shrink-0 flex-none" />Ir para questão</button>
          <button type="button" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[#C9A84C] disabled:opacity-40">Próxima<ChevronRight size={17} className="shrink-0 flex-none" /></button>
        </nav>
      </div>
    </section>
  );
}
