"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  FolderCheck, 
  FileText, 
  UploadCloud,
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import type { TrilhaTemplateType } from "@/lib/validations/trilha";

interface CriarTrilhaViewProps {
  onNavigateToMinhas: () => void;
  initialTitle?: string;
  initialText?: string;
}

export default function CriarTrilhaView({
  onNavigateToMinhas,
  initialTitle = "",
  initialText = "",
}: CriarTrilhaViewProps) {
  const router = useRouter();
  const { addCustomTrilha } = useStudyStore();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<"input" | "loading" | "review">("input");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialText) setText(initialText);

    if (initialTitle && step === "input") {
      setTimeout(() => {
        submitButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        submitButtonRef.current?.focus();
      }, 150);
    }
  }, [initialTitle, initialText, step]);

  const [draftTrilha, setDraftTrilha] = useState<TrilhaTemplateType | null>(null);

  const loadingPhrases = [
    "Analisando o conteúdo...",
    "Estruturando questões e flashcards...",
    "Buscando referências de aula...",
    "Finalizando trilha de estudo atômica..."
  ];
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx((prev) => (prev + 1) % loadingPhrases.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [step, loadingPhrases.length]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Preencha o título da trilha.");
      return;
    }
    if (!text.trim() && !file) {
      setError("Por favor, cole o texto do edital ou faça upload de um arquivo PDF.");
      return;
    }

    setError(null);
    setStep("loading");

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (text) formData.append("text", text);
      if (file) formData.append("file", file);

      const res = await fetch("/api/ai/gerar-trilha", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || "Erro ao gerar trilha com IA");
      }

      const generatedTrilha = (await res.json()) as TrilhaTemplateType;
      setDraftTrilha(generatedTrilha);
      setStep("review");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao processar o edital.");
      setStep("input");
    }
  };

  const handleSave = async () => {
    if (!draftTrilha) return;
    addCustomTrilha(draftTrilha);
    router.push(`/trilhas/${draftTrilha.id}`);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-[rgba(107,153,179,0.2)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#C41230]/15 text-[#C41230] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Mentor AIVUR 360 · Criação
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Criar Trilha Personalizada
          </h1>
          <p className="text-sm sm:text-base text-[#6B99B3] mt-1 max-w-xl">
            Converta qualquer edital ou conteúdo programático em um roteiro diário estruturado para aprovação.
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onNavigateToMinhas}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(107,153,179,0.3)] bg-[#0A2E45]/40 hover:bg-[#0A2E45] text-[#FBEBD0] text-sm font-semibold transition-all duration-150 hover:border-[rgba(107,153,179,0.6)] active:scale-95 shadow-sm"
          >
            <FolderCheck className="w-4 h-4 text-[#F4A261]" />
            <span>Verificar minhas trilhas</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#C41230] flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">{error}</div>
        </div>
      )}

      {step === "input" && (
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/30 p-6 md:p-8 backdrop-blur-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#FBEBD0] mb-2">
                Nome do Concurso / Trilha *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Polícia Federal — Agente Administrativo 2026"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(107,153,179,0.25)] bg-[#020C14]/70 text-[#F8FAFC] placeholder:text-slate-500 text-sm md:text-base focus:border-[#C41230] focus:ring-1 focus:ring-[#C41230] outline-none transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-[#FBEBD0]">
                  Edital, Matérias ou Tópicos de Estudo
                </label>
                <span className="text-xs text-[#6B99B3]">
                  Cole o anexo de conteúdo programático
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui os tópicos completos do edital, súmulas, leis específicas ou a lista de assuntos que você precisa cobrir..."
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-[rgba(107,153,179,0.25)] bg-[#020C14]/70 text-[#F8FAFC] placeholder:text-slate-500 text-sm leading-relaxed focus:border-[#C41230] focus:ring-1 focus:ring-[#C41230] outline-none transition-colors resize-y"
              />
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[rgba(107,153,179,0.2)]"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-[#6B99B3] font-bold">
                ou envie o documento
              </span>
              <div className="flex-grow border-t border-[rgba(107,153,179,0.2)]"></div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#FBEBD0] mb-2">
                Upload de Edital em PDF
              </label>
              <div className="relative border-2 border-dashed border-[rgba(107,153,179,0.3)] hover:border-[#F4A261] rounded-xl p-6 text-center transition-colors bg-[#020C14]/30 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <UploadCloud className="w-8 h-8 text-[#F4A261]" />
                  {file ? (
                    <div className="text-sm font-semibold text-emerald-400">
                      Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#FBEBD0]">
                        Clique para selecionar ou arraste o PDF do edital aqui
                      </p>
                      <p className="text-xs text-[#6B99B3]">
                        Suporta arquivos de até 15MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#6B99B3]">
              A IA estruturará as matérias em tópicos atômicos prontos para estudo diário.
            </p>
            <button
              ref={submitButtonRef}
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#C41230] hover:bg-[#6B0000] disabled:opacity-40 disabled:cursor-not-allowed text-[#FBEBD0] text-base font-bold shadow-[2px_2px_0px_#6B0000] focus:ring-4 focus:ring-[#C41230]/50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer outline-none"
            >
              <Sparkles className="w-5 h-5 text-[#F4A261]" />
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      )}

      {step === "loading" && (
        <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/20 p-12 text-center my-8 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-[rgba(107,153,179,0.2)] border-t-[#C41230] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processando Conteúdo Programático...</h2>
          <p className="text-base text-[#F4A261] font-medium min-h-[28px] transition-all duration-300">
            {loadingPhrases[loadingPhraseIdx]}
          </p>
        </div>
      )}

      {step === "review" && draftTrilha && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/30">
            <div>
              <span className="text-xs font-bold text-[#F4A261] uppercase tracking-wider">Trilha Estruturada</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{draftTrilha.titulo}</h2>
              <p className="text-xs text-[#6B99B3]">
                {draftTrilha.disciplina} • {draftTrilha.questoes.length} questões e {draftTrilha.flashcards.length} flashcards
              </p>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#C41230] hover:bg-[#6B0000] text-[#FBEBD0] font-bold text-sm shadow-[2px_2px_0px_#6B0000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F4A261]" />
              <span>Salvar e Iniciar Trilha</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
