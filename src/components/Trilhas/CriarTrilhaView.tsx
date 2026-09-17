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
  AlertCircle,
  Edit2
} from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import type { TrilhaTemplateType } from "@/lib/validations/trilha";

interface CriarTrilhaViewProps {
  
  initialTitle?: string;
  initialText?: string;
}

export default function CriarTrilhaView({
  
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
  const [inputType, setInputType] = useState<"text" | "pdf">("text");

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const loadingPhrases = [
    "Extraindo conteúdo do PDF...",
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
      let finalContent = text.trim();

      if (file) {
        if (file.type === "application/pdf") {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let extractedText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += pageText + "\n";
          }
          finalContent = (finalContent + "\n" + extractedText).trim();
        } else {
          throw new Error("Apenas arquivos PDF são suportados no momento.");
        }
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("text", finalContent);

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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-red)]/15 text-[var(--color-red)] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Mentor AIVUR 360 · Criação
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Criar Trilha Personalizada
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-slate-blue)] mt-1 max-w-xl">
            Converta qualquer edital ou conteúdo programático em um roteiro diário estruturado para aprovação.
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => router.push("/trilhas")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[var(--color-slate-blue)] hover:text-[var(--color-cream)] text-sm font-semibold transition-colors duration-150"
          >
            <FolderCheck className="w-4 h-4" />
            <span>Voltar para trilhas</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--color-red)] flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">{error}</div>
        </div>
      )}

      {step === "input" && (
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[var(--color-navy)]/30 p-6 md:p-8 backdrop-blur-sm space-y-8">
            {/* Passo 1 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">1</span>
                <label className="block text-base font-bold text-[var(--color-cream)]">
                  Nome do Concurso / Trilha
                </label>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Polícia Federal — Agente Administrativo 2026"
                className="w-full px-4 py-3 rounded-lg border border-[rgba(107,153,179,0.25)] bg-[var(--color-bg)]/70 text-[#F8FAFC] placeholder:text-slate-500 text-sm md:text-base focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
                required
              />
            </div>

            {/* Passo 2 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">2</span>
                <label className="block text-base font-bold text-[var(--color-cream)]">
                  Fonte de Dados
                </label>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-lg bg-[var(--color-bg)]/50 border border-[rgba(107,153,179,0.1)] w-fit">
                <button
                  type="button"
                  onClick={() => setInputType("text")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${inputType === "text" ? "bg-[var(--color-surface)] text-[var(--color-cream)] shadow-sm" : "text-[var(--color-slate-blue)] hover:text-[var(--color-cream)]"}`}
                >
                  <FileText className="w-4 h-4" />
                  Colar Texto
                </button>
                <button
                  type="button"
                  onClick={() => setInputType("pdf")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${inputType === "pdf" ? "bg-[var(--color-surface)] text-[var(--color-cream)] shadow-sm" : "text-[var(--color-slate-blue)] hover:text-[var(--color-cream)]"}`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload de PDF
                </button>
              </div>

              {/* Tab Content */}
              {inputType === "text" ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole aqui os tópicos completos do edital, súmulas, leis específicas ou a lista de assuntos que você precisa cobrir..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(107,153,179,0.25)] bg-[var(--color-bg)]/70 text-[#F8FAFC] placeholder:text-slate-500 text-sm leading-relaxed focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors resize-y"
                />
              ) : (
                <div className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[rgba(107,153,179,0.3)] hover:border-[var(--color-primary)] rounded-xl p-8 text-center transition-colors bg-[var(--color-bg)]/30 cursor-pointer min-h-[220px]">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-[var(--color-slate-blue)]" />
                  {file ? (
                    <div className="text-sm font-semibold text-[var(--color-primary)]">
                      Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[var(--color-cream)]">
                        Clique para selecionar ou arraste o PDF do edital aqui
                      </p>
                      <p className="text-xs text-[var(--color-slate-blue)]">
                        Suporta arquivos de até 15MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[var(--color-slate-blue)]">
              A IA estruturará as matérias em tópicos atômicos prontos para estudo diário.
            </p>
            <button
              ref={submitButtonRef}
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold shadow-sm focus:ring-4 focus:ring-[var(--color-primary)]/50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer outline-none"
            >
              <Sparkles className="w-5 h-5 text-white/70" />
              <span>Gerar Trilha com IA</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      )}

      {step === "loading" && (
        <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[var(--color-navy)]/20 p-12 text-center my-8 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-[rgba(107,153,179,0.2)] border-t-[var(--color-red)] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processando Conteúdo Programático...</h2>
          <p className="text-base text-[var(--color-slate-blue)] font-medium min-h-[28px] transition-all duration-300">
            {loadingPhrases[loadingPhraseIdx]}
          </p>
        </div>
      )}

      {step === "review" && draftTrilha && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-[rgba(107,153,179,0.2)] bg-[var(--color-navy)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--color-red)] uppercase tracking-wider">Trilha Estruturada</span>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={draftTrilha.titulo}
                  onChange={(e) => setDraftTrilha({ ...draftTrilha, titulo: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  className="block w-full max-w-sm mt-0.5 px-3 py-1.5 rounded-lg border border-[var(--color-red)] bg-[var(--color-bg)]/90 text-xl font-bold text-white outline-none focus:ring-1 focus:ring-[var(--color-red)]"
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-bold text-white mt-0.5 group flex items-center gap-2 cursor-text hover:text-[var(--color-cream)] transition-colors"
                  title="Clique para editar o nome"
                >
                  {draftTrilha.titulo}
                  <Edit2 className="w-4 h-4 text-[var(--color-slate-blue)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
              )}
              <p className="text-xs text-[var(--color-slate-blue)] mt-1">
                {draftTrilha.disciplina} • {draftTrilha.questoes.length} questões e {draftTrilha.flashcards.length} flashcards
              </p>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-sm shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar e Iniciar Trilha</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



