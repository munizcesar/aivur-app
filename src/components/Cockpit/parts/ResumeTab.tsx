"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

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

  if (!topic) return <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">Selecione um tópico para gerar o resumo.</div>;
  const isCompleted = completedTopicIds.includes(topic.id);

  return <article className="w-full h-full bg-[#0B1929] rounded-2xl border border-[#C9A84C]/20 p-6 md:p-10 overflow-y-auto text-slate-300 leading-relaxed">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Resumo inteligente</p><h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{topic.titulo}</h2></div><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><BookOpen size={18} className="shrink-0 flex-none" />Leitura guiada</div></div>
    {isLoading ? <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-500"><Loader2 size={28} className="animate-spin text-emerald-500" /><span>Consultando contexto e preparando seu resumo...</span></div> : error ? <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-300">{error}</div> : <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-emerald-600"><ReactMarkdown>{content}</ReactMarkdown></div>}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-white/10"><span className="text-sm text-slate-500 dark:text-slate-400">O conteúdo é gerado com contexto RAG e protocolo de confiabilidade.</span><button type="button" onClick={() => toggleTopicCompletion(topic.id)} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${isCompleted ? "border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>{isCompleted && <CheckCircle2 size={18} className="shrink-0 flex-none" />}{isCompleted ? "Resumo concluído" : "Marcar como lido"}</button></div>
  </article>;
}
