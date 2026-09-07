import { useState, type CSSProperties } from "react";
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
  RotateCcw,
  StickyNote,
  Tag,
  X,
} from "lucide-react";

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

const mockQuestions: Question[] = [
  {
    id: "q-1",
    codigo: "VUNESP-2024-001",
    banca: "VUNESP",
    ano: "2024",
    orgao: "TJ-SP",
    prova: "Analista Judiciário",
    tags: ["Direito Administrativo", "Agentes públicos", "Investidura"],
    enunciado: "De acordo com a Lei nº 8.112/1990, a investidura em cargo público ocorrerá com a:",
    alternativas: [
      { texto: "Nomeação.", isCorreta: false },
      { texto: "Posse.", isCorreta: true },
      { texto: "Homologação do concurso.", isCorreta: false },
      { texto: "Aprovação em estágio probatório.", isCorreta: false },
    ],
    comentario: "A investidura em cargo público ocorre com a posse (Art. 7º da Lei 8.112/90). A nomeação é apenas o provimento, e o exercício é o efetivo desempenho das atribuições.",
  },
  {
    id: "q-2",
    codigo: "CESPE-2023-018",
    banca: "CESPE/CEBRASPE",
    ano: "2023",
    orgao: "INSS",
    prova: "Técnico do Seguro Social",
    tags: ["Direito Administrativo", "Princípios", "Administração pública"],
    enunciado: "O princípio administrativo que impõe ao agente público o dever de buscar os melhores resultados com o menor custo possível é o princípio da:",
    alternativas: [
      { texto: "Legalidade.", isCorreta: false },
      { texto: "Impessoalidade.", isCorreta: false },
      { texto: "Publicidade.", isCorreta: false },
      { texto: "Eficiência.", isCorreta: true },
    ],
    comentario: "O princípio da eficiência exige que a atividade administrativa seja exercida com presteza, perfeição e rendimento funcional.",
  },
];

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
  onSelect,
}: {
  option: Option;
  index: number;
  answer?: AnswerState;
  mobile?: boolean;
  onSelect: () => void;
}) {
  const selected = answer?.selected === index;
  const submitted = answer?.submitted;
  const correct = submitted && option.isCorreta;
  const incorrect = submitted && selected && !option.isCorreta;
  const stateClass = correct
    ? "border-[var(--color-success)] bg-emerald-50"
    : incorrect
      ? "border-[var(--color-error)] bg-rose-50"
      : selected
        ? "border-[var(--color-primary)] bg-[var(--color-surface-offset)]"
        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-offset)]";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={submitted}
      aria-pressed={selected}
      className={`group grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 text-left transition-colors disabled:cursor-default ${mobile ? "rounded-xl border px-4 py-4" : "rounded-lg border px-3 py-2.5"} ${stateClass}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${correct ? "border-[var(--color-success)] bg-[var(--color-success)] text-white" : incorrect ? "border-[var(--color-error)] bg-[var(--color-error)] text-white" : selected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]"}`}>
        {letters[index]}
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
    <div className="mt-4 rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 text-sm text-[var(--color-text)]">
      <div className="flex items-start gap-2"><Info size={17} className="mt-0.5 shrink-0 flex-none text-[var(--color-primary)]" /><div><strong className="font-bold">Gabarito comentado</strong><p className="mt-1 leading-relaxed text-[var(--color-text-muted)]">{question.comentario}</p></div></div>
    </div>
  );
}

function DesktopQuestion({ question, index, answer, pending, onSelect, onSubmit }: { question: Question; index: number; answer?: AnswerState; pending?: number; onSelect: (index: number) => void; onSubmit: () => void }) {
  return (
    <article className="border-b border-[var(--color-divider)] px-1 py-6 first:pt-2 last:border-b-0">
      <header className="mb-3 flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-[var(--color-primary)] px-2 font-bold text-white">{index}</span>
        <span className="font-bold text-[var(--color-text)]">Questão {question.codigo}</span><span className="text-[var(--color-text-faint)]">•</span>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {question.tags.map((tag, tagIndex) => <span key={tag} className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><Tag size={12} className="shrink-0 flex-none text-[var(--color-primary)]" />{tag}{tagIndex < question.tags.length - 1 && <ChevronRight size={12} className="shrink-0 flex-none" />}</span>)}
        </div>
      </header>
      <Metadata question={question} />
      <p className="mt-4 max-w-4xl text-[15px] font-medium leading-7 text-[var(--color-text)]">{question.enunciado}</p>
      <div className="mt-4 grid max-w-4xl gap-2">{question.alternativas.map((option, optionIndex) => <AnswerOption key={option.texto} option={option} index={optionIndex} answer={answer ?? (pending === undefined ? undefined : { selected: pending, submitted: false })} onSelect={() => onSelect(optionIndex)} />)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={answer?.submitted || pending === undefined} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-default disabled:opacity-60">{answer?.submitted ? <Check size={16} className="shrink-0 flex-none" /> : null}{answer?.submitted ? "Respondida" : "Responder"}</button>
        <span className="text-xs text-[var(--color-text-faint)]">{answer?.submitted ? "Resposta registrada" : "Selecione uma alternativa"}</span>
      </div>
      {answer?.submitted && <QuestionResult question={question} />}
      <div className="mt-4"><ActionBar /></div>
    </article>
  );
}

function MobileQuestionHeader({ question, index, total }: { question: Question; index: number; total: number }) {
  return (
    <header className="border-b border-[var(--color-divider)] bg-[var(--color-surface)] px-4 pb-3 pt-3">
      <div className="flex items-start justify-between gap-3">
        <button type="button" aria-label="Voltar" className="mt-0.5 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)]"><ArrowLeft size={20} className="shrink-0 flex-none" /></button>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--color-text)]">Questão {question.codigo}</p><p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">Direito Administrativo</p></div>
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
  const question = mockQuestions[currentIndex];

  const selectOption = (questionId: string, optionIndex: number) => {
    if (answers[questionId]?.submitted) return;
    setPending((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const submitAnswer = (questionId: string) => {
    const selected = pending[questionId];
    if (selected === undefined) return;
    setAnswers((current) => ({ ...current, [questionId]: { selected, submitted: true } }));
  };

  const reset = () => {
    setCurrentIndex(0);
    setAnswers({});
    setPending({});
  };

  return (
    <section style={{ "--spacing": "0.25rem" } as CSSProperties} className="mt-4 w-full min-w-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)] lg:mt-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
      <div className="hidden lg:block">
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Banco de questões</p><h3 className="mt-1 text-xl font-black text-[var(--color-text)]">Questões de Direito Administrativo</h3></div><button type="button" className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)]"><Filter size={16} className="shrink-0 flex-none" />Filtros</button></div>
        <div>{mockQuestions.map((item, index) => <DesktopQuestion key={item.id} question={item} index={index + 1} answer={answers[item.id]} pending={pending[item.id]} onSelect={(optionIndex) => selectOption(item.id, optionIndex)} onSubmit={() => submitAnswer(item.id)} />)}</div>
      </div>

      <div className="lg:hidden">
        <MobileQuestionHeader question={question} index={currentIndex + 1} total={mockQuestions.length} />
        <div className="px-4 pb-24 pt-4"><Metadata question={question} compact /><p className="mt-5 text-base font-medium leading-7 text-[var(--color-text)]">{question.enunciado}</p><div className="mt-5 grid gap-3">{question.alternativas.map((option, index) => <AnswerOption key={option.texto} option={option} index={index} answer={answers[question.id] ?? (pending[question.id] === undefined ? undefined : { selected: pending[question.id] as number, submitted: false })} mobile onSelect={() => selectOption(question.id, index)} />)}</div>{answers[question.id]?.submitted && <QuestionResult question={question} />}</div>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-[var(--color-divider)] bg-[var(--color-surface)]/95 px-3 py-3 shadow-[0_-4px_12px_rgba(10,46,69,0.08)] backdrop-blur lg:hidden">
          <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] disabled:opacity-40"><ChevronLeft size={17} className="shrink-0 flex-none" />Anterior</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-text-muted)]"><FileText size={15} className="shrink-0 flex-none" />Ir para questão</button>
          <button type="button" disabled={currentIndex === mockQuestions.length - 1} onClick={() => setCurrentIndex((value) => Math.min(mockQuestions.length - 1, value + 1))} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold text-[var(--color-primary)] disabled:opacity-40">Próximo<ChevronRight size={17} className="shrink-0 flex-none" /></button>
        </nav>
      </div>
    </section>
  );
}
