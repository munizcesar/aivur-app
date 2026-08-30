"use client";

import { useState } from "react";
import {
  CheckCircle2,
  BookOpen,
  MessageSquare,
  BarChart2,
  FolderPlus,
  StickyNote,
  Flag,
} from "lucide-react";
import type { Questao } from "@/hooks/useTopicContent";

interface DesktopQuestionListProps {
  questions: Questao[];
  userResponses: Record<string, string>;
  subject: string;
  nicho: string;
  topicLabel: string;
  dificuldade: string;
  banca: string;
  onAnswer: (questao: Questao, alternativa: string) => void;
  onOpenGabarito?: (questaoId: string) => void;
  onOpenAulas?: (questaoId: string) => void;
  onOpenComentarios?: (questaoId: string) => void;
  onOpenEstatisticas?: (questaoId: string) => void;
  onAddCaderno?: (questaoId: string) => void;
  onCriarAnotacao?: (questaoId: string) => void;
  onNotificarErro?: (questaoId: string) => void;
}

export default function DesktopQuestionList({
  questions,
  userResponses,
  subject,
  nicho,
  topicLabel,
  dificuldade,
  banca,
  onAnswer,
  onOpenGabarito,
  onOpenAulas,
  onOpenComentarios,
  onOpenEstatisticas,
  onAddCaderno,
  onCriarAnotacao,
  onNotificarErro,
}: DesktopQuestionListProps) {
  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto">
      {questions.map((question, idx) => (
        <QuestionBlock
          key={question.id}
          index={idx + 1}
          question={question}
          userResponse={userResponses[question.id]}
          subject={subject}
          nicho={nicho}
          topicLabel={topicLabel}
          dificuldade={dificuldade}
          banca={banca}
          onAnswer={onAnswer}
          onOpenGabarito={onOpenGabarito}
          onOpenAulas={onOpenAulas}
          onOpenComentarios={onOpenComentarios}
          onOpenEstatisticas={onOpenEstatisticas}
          onAddCaderno={onAddCaderno}
          onCriarAnotacao={onCriarAnotacao}
          onNotificarErro={onNotificarErro}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QuestionBlock — bloco individual de questão                       */
/* ------------------------------------------------------------------ */

function QuestionBlock({
  index,
  question,
  userResponse,
  subject,
  nicho,
  topicLabel,
  dificuldade,
  banca,
  onAnswer,
  onOpenGabarito,
  onOpenAulas,
  onOpenComentarios,
  onOpenEstatisticas,
  onAddCaderno,
  onCriarAnotacao,
  onNotificarErro,
}: {
  index: number;
  question: Questao;
  userResponse?: string;
  subject: string;
  nicho: string;
  topicLabel: string;
  dificuldade: string;
  banca: string;
} & Pick<
  DesktopQuestionListProps,
  | "onAnswer"
  | "onOpenGabarito"
  | "onOpenAulas"
  | "onOpenComentarios"
  | "onOpenEstatisticas"
  | "onAddCaderno"
  | "onCriarAnotacao"
  | "onNotificarErro"
>) {
  const [selected, setSelected] = useState<string | null>(userResponse || null);
  const [answered, setAnswered] = useState(!!userResponse);
  const [struckOut, setStruckOut] = useState<Set<string>>(new Set());
  const [showGabarito, setShowGabarito] = useState(false);

  function toggleStrike(optionId: string, e: React.MouseEvent) {
    e.preventDefault();
    if (answered) return;
    setStruckOut((prev) => {
      const next = new Set(prev);
      next.has(optionId) ? next.delete(optionId) : next.add(optionId);
      return next;
    });
  }

  function handleSelect(optionId: string) {
    if (answered || struckOut.has(optionId)) return;
    setSelected(optionId);
  }

  function handleSubmit() {
    if (!selected || answered) return;
    setAnswered(true);
    onAnswer(question, selected);
  }

  function handleGabarito() {
    setShowGabarito((prev) => !prev);
    onOpenGabarito?.(question.id);
  }

  function getOptionState(optionId: string) {
    if (struckOut.has(optionId)) return "struck";
    if (!answered) return selected === optionId ? "selected" : "default";
    if (optionId === question.correta) return "correct";
    if (optionId === selected) return "incorrect";
    return "disabled";
  }

  const isCorrect = selected === question.correta;

  return (
    <div className="rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60">
      {/* ── Breadcrumb / Tags ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
        <span className="font-semibold px-1.5 py-0.5 rounded bg-[#f68b33] text-white">
          {index}
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Q{index}
        </span>
        <span className="flex items-center gap-1">
          <span>›</span>
          <span className="text-[#f68b33] cursor-default">{subject}</span>
        </span>
        {nicho && (
          <span className="flex items-center gap-1">
            <span>›</span>
            <span className="text-[#f68b33] cursor-default">{nicho}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <span>›</span>
          <span className="text-[#f68b33] cursor-default">{topicLabel}</span>
        </span>
      </div>

      {/* ── Metadados ── */}
      <div className="px-4 py-2 text-xs flex flex-wrap gap-x-4 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
        <span>
          <strong className="text-slate-700 dark:text-slate-200">Dificuldade:</strong>{" "}
          <span className="text-[#f68b33]">{dificuldade}</span>
        </span>
        <span>
          <strong className="text-slate-700 dark:text-slate-200">Banca:</strong>{" "}
          <span className="text-[#f68b33]">{banca}</span>
        </span>
        <span>
          <strong className="text-slate-700 dark:text-slate-200">Tipo:</strong>{" "}
          Gerada por IA
        </span>
      </div>

      {/* ── Enunciado ── */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
          {question.enunciado}
        </p>
      </div>

      {/* ── Alternativas ── */}
      <div className="px-4 pb-3 flex flex-col gap-1.5">
        {Object.entries(question.alternativas).map(([letra, texto]) => {
          const state = getOptionState(letra);
          return (
            <div
              key={letra}
              onClick={() => handleSelect(letra)}
              onContextMenu={(e) => toggleStrike(letra, e)}
              className={`flex items-start gap-2.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${optionRowClass(state)}`}
              title="Clique para marcar · Clique direito para riscar"
            >
              <span
                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-xs font-semibold ${optionBadgeClass(state)}`}
              >
                {letra}
              </span>
              <span
                className={`leading-snug pt-0.5 ${
                  state === "struck"
                    ? "line-through opacity-50 text-slate-400 dark:text-slate-500"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {texto}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Botão Responder / Feedback ── */}
      <div className="px-4 pb-4">
        {!answered ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="px-5 py-2 rounded font-semibold text-sm bg-[#f68b33] text-white shadow-[3px_3px_0_#6B0000] hover:brightness-110 transition-all disabled:opacity-40 disabled:shadow-none"
          >
            Responder
          </button>
        ) : (
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
              isCorrect
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            <CheckCircle2 size={16} />
            {isCorrect
              ? "Resposta correta!"
              : `Resposta incorreta. Gabarito: ${question.correta}.`}
          </div>
        )}
      </div>

      {/* ── Gabarito Comentado (expansível) ── */}
      {showGabarito && question.justificativa && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-orange-50 dark:bg-[#f68b33]/10 border border-orange-200 dark:border-[#f68b33]/30 rounded-lg text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
            <p className="font-bold text-[#f68b33] mb-1 text-xs uppercase tracking-wide">Gabarito Comentado</p>
            {question.justificativa}
          </div>
        </div>
      )}

      {/* ── Barra de Ações Secundárias ── */}
      <div className="flex flex-wrap items-center gap-4 md:gap-5 px-4 py-2.5 text-xs border-t border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
        <ActionLink
          icon={<CheckCircle2 size={15} />}
          label="Gabarito Comentado"
          onClick={handleGabarito}
          active={showGabarito}
        />
        <ActionLink
          icon={<BookOpen size={15} />}
          label="Aulas"
          onClick={() => onOpenAulas?.(question.id)}
        />
        <ActionLink
          icon={<MessageSquare size={15} />}
          label="Comentários"
          onClick={() => onOpenComentarios?.(question.id)}
        />
        <ActionLink
          icon={<BarChart2 size={15} />}
          label="Estatísticas"
          onClick={() => onOpenEstatisticas?.(question.id)}
        />
        <ActionLink
          icon={<FolderPlus size={15} />}
          label="Cadernos"
          onClick={() => onAddCaderno?.(question.id)}
        />
        <ActionLink
          icon={<StickyNote size={15} />}
          label="Criar anotações"
          onClick={() => onCriarAnotacao?.(question.id)}
        />
        <ActionLink
          icon={<Flag size={15} />}
          label="Notificar Erro"
          onClick={() => onNotificarErro?.(question.id)}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionLink — botão compacto da barra de ações                     */
/* ------------------------------------------------------------------ */

function ActionLink({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 hover:text-[#f68b33] transition-colors ${
        active ? "text-[#f68b33] font-semibold" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Funções de estilo por estado (Tailwind puro)                      */
/* ------------------------------------------------------------------ */

function optionRowClass(state: string): string {
  switch (state) {
    case "selected":
      return "bg-[#f68b33]/10";
    case "correct":
      return "bg-green-50 dark:bg-green-900/20";
    case "incorrect":
      return "bg-red-50 dark:bg-red-900/20";
    case "disabled":
      return "opacity-60";
    case "struck":
      return "bg-transparent";
    default:
      return "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50";
  }
}

function optionBadgeClass(state: string): string {
  switch (state) {
    case "selected":
      return "bg-[#f68b33] text-white";
    case "correct":
      return "bg-green-500 text-white";
    case "incorrect":
      return "bg-red-600 text-white";
    default:
      return "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300";
  }
}
