"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  FolderCheck, 
  FileText, 
  UploadCloud, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useLocalCourses } from "@/hooks/useLocalCourses";
import type { Course, CourseSubject } from "@/types/course";

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
  const { saveCourse } = useLocalCourses();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<"input" | "loading" | "review">("input");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState<File | null>(null);

  // Update if initial props change
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

  // Review states
  const [draftCourse, setDraftCourse] = useState<Course | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);

  const loadingPhrases = [
    "Lendo e interpretando o conteúdo do edital...",
    "Mapeando pesos das disciplinas e frequência em provas...",
    "Estruturando leis, doutrinas e tópicos chave...",
    "Montando cronograma sequencial de alta retenção...",
    "Finalizando sua trilha de estudo..."
  ];
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => {
      setLoadingPhraseIdx((prev) => (prev + 1) % loadingPhrases.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [step, loadingPhrases.length]);

  const toggleSubject = (sIdx: number) => {
    setExpandedSubjects((prev) =>
      prev.includes(sIdx) ? prev.filter((idx) => idx !== sIdx) : [...prev, sIdx]
    );
  };

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

      const res = await fetch("/api/mentor/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || "Erro ao gerar trilha com IA");
      }

      const generatedCourse = (await res.json()) as Course;
      generatedCourse.userId = null;
      setDraftCourse(generatedCourse);
      setStep("review");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao processar o edital.");
      setStep("input");
    }
  };

  const handleSave = async () => {
    if (!draftCourse) return;
    await saveCourse(draftCourse);
    router.push(`/mentor/${draftCourse.id}`);
  };

  const handleUpdateSubject = (sIdx: number, field: keyof CourseSubject, value: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx] = { ...updated.subjects[sIdx], [field]: value };
    setDraftCourse(updated);
  };

  const handleDeleteSubject = (sIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects.splice(sIdx, 1);
    setDraftCourse(updated);
  };

  const handleUpdateNicho = (sIdx: number, nIdx: number, nTitle: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].title = nTitle;
    setDraftCourse(updated);
  };

  const handleDeleteNicho = (sIdx: number, nIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos.splice(nIdx, 1);
    setDraftCourse(updated);
  };

  const handleUpdateTopic = (sIdx: number, nIdx: number, iIdx: number, label: string) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].items[iIdx].label = label;
    setDraftCourse(updated);
  };

  const handleDeleteTopic = (sIdx: number, nIdx: number, iIdx: number) => {
    if (!draftCourse) return;
    const updated = { ...draftCourse };
    updated.subjects[sIdx].nichos[nIdx].items.splice(iIdx, 1);
    setDraftCourse(updated);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 py-6 md:py-8">
      {/* CABEÇALHO DA VIEW 1 */}
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

        {/* AÇÃO SECUNDÁRIA (FUGA): ROTEIA EXCLUSIVAMENTE PARA MINHAS TRILHAS */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onNavigateToMinhas}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(107,153,179,0.3)] bg-[#0A2E45]/40 hover:bg-[#0A2E45] text-[#FBEBD0] text-sm font-semibold transition-all duration-150 hover:border-[rgba(107,153,179,0.6)] active:scale-95 shadow-sm"
            aria-label="Verificar minhas trilhas de estudo"
          >
            <FolderCheck className="w-4 h-4 text-[#F4A261]" />
            <span>Verificar minhas trilhas</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#C41230] flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">{error}</div>
        </div>
      )}

      {/* ETAPA 1: INPUT DO FORMULÁRIO */}
      {step === "input" && (
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/30 p-6 md:p-8 backdrop-blur-sm space-y-6">
            {/* Campo 1: Título */}
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

            {/* Campo 2: Texto do Edital */}
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

            {/* Divisor Visual */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[rgba(107,153,179,0.2)]"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-[#6B99B3] font-bold">
                ou envie o documento
              </span>
              <div className="flex-grow border-t border-[rgba(107,153,179,0.2)]"></div>
            </div>

            {/* Campo 3: Upload de Arquivo PDF */}
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

          {/* Botão Primário de Disparo */}
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

      {/* ETAPA 2: LOADING COM FEEDBACK PROGRESSIVO */}
      {step === "loading" && (
        <div className="rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/20 p-12 text-center my-8 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-[rgba(107,153,179,0.2)] border-t-[#C41230] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processando Conteúdo Programático...</h2>
          <p className="text-base text-[#F4A261] font-medium min-h-[28px] transition-all duration-300">
            {loadingPhrases[loadingPhraseIdx]}
          </p>
          <p className="text-xs text-slate-500 mt-4">
            Isso leva de 10 a 25 segundos dependendo da extensão do edital.
          </p>
        </div>
      )}

      {/* ETAPA 3: REVISÃO E SALVAMENTO */}
      {step === "review" && draftCourse && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-[rgba(107,153,179,0.2)] bg-[#0A2E45]/30">
            <div>
              <span className="text-xs font-bold text-[#F4A261] uppercase tracking-wider">Trilha Estruturada</span>
              <h2 className="text-xl font-bold text-white mt-0.5">{draftCourse.title}</h2>
              <p className="text-xs text-[#6B99B3]">
                {draftCourse.subjects.length} disciplinas • {draftCourse.subjects.reduce((acc, s) => acc + s.nichos.reduce((a, n) => a + n.items.length, 0), 0)} tópicos gerados
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

          <div className="space-y-3">
            {draftCourse.subjects.map((subject, sIdx) => {
              const isExpanded = expandedSubjects.includes(sIdx);
              const subjectTopics = subject.nichos.reduce((acc, n) => acc + n.items.length, 0);

              return (
                <div
                  key={sIdx}
                  className="rounded-lg border border-[rgba(107,153,179,0.2)] bg-[#020C14]/60 p-4 transition-colors"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer gap-4"
                    onClick={() => toggleSubject(sIdx)}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-[#C41230]" />
                      <span className="font-bold text-white text-base">
                        {subject.subject}
                      </span>
                      <span className="text-xs text-[#6B99B3] px-2 py-0.5 rounded bg-[#0A2E45]/60">
                        {subjectTopics} tópicos
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B99B3]">
                      <span>{isExpanded ? "Ocultar" : "Revisar"}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[rgba(107,153,179,0.15)] space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-[#6B99B3] mb-1">
                            Nome da Disciplina
                          </label>
                          <input
                            value={subject.subject}
                            onChange={(e) => handleUpdateSubject(sIdx, "subject", e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded bg-[#0A2E45]/40 border border-[rgba(107,153,179,0.2)] text-white focus:border-[#C41230] outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sIdx)}
                          className="self-end text-xs text-red-400 hover:text-red-300 font-semibold py-2 px-2"
                        >
                          Excluir Disciplina
                        </button>
                      </div>

                      {/* Nichos e Tópicos */}
                      <div className="pl-3 border-l-2 border-[rgba(107,153,179,0.2)] space-y-3">
                        {subject.nichos.map((nicho, nIdx) => (
                          <div key={nIdx} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                value={nicho.title}
                                onChange={(e) => handleUpdateNicho(sIdx, nIdx, e.target.value)}
                                className="px-2 py-1 text-sm font-semibold rounded bg-transparent border border-transparent hover:border-[rgba(107,153,179,0.3)] text-[#FBEBD0] focus:border-[#C41230] outline-none flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteNicho(sIdx, nIdx)}
                                className="text-xs text-slate-500 hover:text-red-400 p-1"
                                title="Remover grupo de tópicos"
                              >
                                ×
                              </button>
                            </div>

                            <div className="pl-4 space-y-1.5">
                              {nicho.items.map((item, iIdx) => (
                                <div key={item.id} className="flex items-center gap-2">
                                  <input
                                    value={item.label}
                                    onChange={(e) => handleUpdateTopic(sIdx, nIdx, iIdx, e.target.value)}
                                    className="px-2 py-1 text-xs rounded bg-[#020C14]/80 border border-[rgba(107,153,179,0.15)] text-slate-200 focus:border-[#C41230] outline-none flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(sIdx, nIdx, iIdx)}
                                    className="text-slate-500 hover:text-red-400 p-1"
                                    title="Remover tópico"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

