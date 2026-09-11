"use client";

import { useEffect, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

const markdownComponents: Components = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-8 mb-4 text-2xl font-bold text-[#C9A84C] md:text-3xl">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-7 mb-3 text-xl font-bold text-[#C9A84C] md:text-2xl">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-[#C9A84C]">{children}</h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="text-[1.05rem] leading-[1.8] text-slate-300">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-slate-300">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-slate-300">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-[#FBEBD0]">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic text-slate-200">{children}</em>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-6 border-l-2 border-[#C9A84C]/50 pl-5 italic text-slate-300">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-[#122338] px-1.5 py-0.5 text-sm text-[#C9A84C]">{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a href={href} className="font-medium text-emerald-400 underline-offset-2 hover:underline">
      {children}
    </a>
  ),
};

export default function ResumeTab() {
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);
  const toggleTopicCompletion = useStudyStore((state) => state.toggleTopicCompletion);
  const modules = useStudyStore((state) => state.modules);
  const activeModule = modules.find((module) => module.id === activeModuleId);
  const topic = activeModule?.subtópicos.find((item) => item.id === currentTopicId);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selectedTopic = topic as NonNullable<typeof topic>;
    if (!selectedTopic) return;
    let cancelled = false;
    async function loadSummary() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/mentor/teoria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tema: selectedTopic.titulo, subject: activeModule?.titulo ?? "Geral" }),
        });
        const data = await response.json() as { resposta?: string; teoria?: string; error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível gerar o resumo.");
        if (!cancelled) setContent(data.resposta ?? data.teoria ?? "");
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Erro ao gerar o resumo.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadSummary();
    return () => { cancelled = true; };
  }, [topic, activeModule?.titulo]);

  if (!topic) {
    return (
      <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
        Selecione um tópico para gerar o resumo.
      </div>
    );
  }

  const isCompleted = completedTopicIds.includes(topic.id);

  return (
    <div className="w-full h-full p-6 md:p-12 overflow-y-auto bg-transparent">
      <article className="mx-auto max-w-3xl space-y-6 text-[1.05rem] md:text-[1.15rem] font-medium leading-[1.8] tracking-wide text-slate-300">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Resumo inteligente
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#C9A84C] md:text-3xl">
              {topic.titulo}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <BookOpen size={18} className="shrink-0 flex-none" />
            Leitura guiada
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={28} className="shrink-0 flex-none animate-spin text-[#C9A84C]" />
            <span>Consultando contexto e preparando seu resumo...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-5">
          <span className="text-sm text-slate-400">
            O conteúdo é gerado com contexto RAG e protocolo de confiabilidade.
          </span>
          <button
            type="button"
            onClick={() => toggleTopicCompletion(topic.id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              isCompleted
                ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                : "bg-[#C9A84C] text-[#0B1929] hover:bg-[#d4b65e]"
            }`}
          >
            {isCompleted && <CheckCircle2 size={18} className="shrink-0 flex-none" />}
            {isCompleted ? "Resumo concluído" : "Marcar como lido"}
          </button>
        </div>
      </article>
    </div>
  );
}
