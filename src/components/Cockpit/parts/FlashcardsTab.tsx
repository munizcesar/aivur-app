"use client";

import { useEffect, useState } from "react";
import { XCircle, ThumbsUp, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardsTabProps {
  topicTitle?: string;
  subjectName?: string;
}

export default function FlashcardsTab({ topicTitle, subjectName }: FlashcardsTabProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCards() {
      setIsLoading(true);
      setError(null);
      setCurrentIndex(0);
      setIsFlipped(false);
      try {
        const response = await fetch("/api/mentor/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: topicTitle ?? "Tópico atual", subject: subjectName ?? "Geral" }),
        });
        const data = await response.json() as { flashcards?: Flashcard[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível gerar os flashcards.");
        if (!cancelled) setCards(data.flashcards ?? []);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Erro ao carregar flashcards.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadCards();
    return () => { cancelled = true; };
  }, [topicTitle, subjectName]);

  const card = cards[currentIndex];
  const isFinished = !isLoading && cards.length > 0 && currentIndex >= cards.length;
  const advance = () => {
    setIsFlipped(false);
    window.setTimeout(() => setCurrentIndex((previous) => previous + 1), 150);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
        <span>Gerando flashcards com contexto do tópico...</span>
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div className="mx-auto mt-8 flex min-h-[260px] max-w-2xl flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-300">
        <p>{error ?? "Nenhum flashcard foi gerado para este tópico."}</p>
        <p className="text-xs text-slate-500">Tente novamente após selecionar outro tópico.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9A84C]/30 bg-white/[0.02] p-8 text-center">
        <div className="mb-4 rounded-full bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 size={40} className="shrink-0 flex-none" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-[#FBEBD0]">Sessão concluída</h3>
        <p className="mb-6 max-w-md text-sm text-slate-400">
          Você revisou todos os flashcards gerados para este tópico.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <RotateCcw size={20} className="shrink-0 flex-none" />
          Revisar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center pb-10">
      {/* 3D via arbitrary values — rotate-y-180/perspective-1000 não existem no Tailwind base */}
      <div
        className="group relative mx-auto mt-8 h-80 w-full max-w-lg cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped((value) => !value)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsFlipped((value) => !value);
          }
        }}
        aria-label={isFlipped ? "Virar para a pergunta" : "Virar para a resposta"}
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Frente */}
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-2xl border border-[#C9A84C]/30 bg-[#122338] p-8 text-center shadow-lg [backface-visibility:hidden]">
            <span className="mb-6 text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Pergunta {currentIndex + 1} de {cards.length}
            </span>
            <h3 className="text-xl font-bold leading-snug text-white md:text-2xl">{card.front}</h3>
            <p className="absolute bottom-6 text-sm font-medium text-slate-400">
              Clique para revelar a resposta
            </p>
          </div>

          {/* Verso */}
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-2xl border border-emerald-500/50 bg-[#0B1929] p-8 text-center shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="mb-6 text-xs font-bold uppercase tracking-widest text-emerald-400">
              Resposta
            </span>
            <p className="text-lg leading-relaxed text-slate-200">{card.back}</p>
          </div>
        </div>
      </div>

      <div
        className={`mt-8 flex flex-wrap items-center justify-center gap-3 transition-all duration-300 ${
          isFlipped ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <button
          onClick={(event) => {
            event.stopPropagation();
            advance();
          }}
          className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/20"
        >
          <XCircle size={22} className="shrink-0 flex-none" />
          Errei
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            advance();
          }}
          className="flex items-center gap-2 rounded-lg border border-slate-400/30 bg-slate-500/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-500/20"
        >
          <ThumbsUp size={22} className="shrink-0 flex-none" />
          Bom
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            advance();
          }}
          className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
        >
          <CheckCircle2 size={22} className="shrink-0 flex-none" />
          Fácil
        </button>
      </div>
    </div>
  );
}
