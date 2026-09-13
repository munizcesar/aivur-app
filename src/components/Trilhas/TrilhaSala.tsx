"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, Zap, Loader2 } from "lucide-react";
import { TRILHAS_MOCK, TrilhaQuestao } from "@/mocks/trilhasMock";
import { useStudyStore, StudyTab } from "@/store/useStudyStore";

// ─── 1. TELEMETRIA E GROWTH (Mixpanel/PostHog Hooks) ──────────────────────
const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (typeof window !== "undefined") {
    console.log(`[Analytics] ${eventName}`, properties);
  }
};

// ─── COMPONENTE PRINCIPAL DE PRODUÇÃO ────────────────────────────────────
export default function TrilhaSala() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const trilha = TRILHAS_MOCK.find(t => t.id === id);

  const { progressData, registerAnswer, toggleTopicCompletion } = useStudyStore();

  const [activeTab, setActiveTab] = useState<StudyTab>("video");

  const [currentFc, setCurrentFc] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showEndState, setShowEndState] = useState(false);
  
  const [questoesExtras, setQuestoesExtras] = useState<TrilhaQuestao[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!trilha) return;
    const startTime = Date.now();
    trackEvent("module_started", { module_title: trilha.titulo, trilha_id: trilha.id });
    return () => trackEvent("module_abandoned", { duration_sec: (Date.now() - startTime) / 1000, trilha_id: trilha.id });
  }, [trilha]);

  const handleTabChange = useCallback((tab: StudyTab) => {
    if (!trilha) return;
    setActiveTab(tab);
    trackEvent("tab_viewed", { tab_name: tab, trilha_id: trilha.id });
  }, [trilha]);

  const handleAprofundarIA = async () => {
    if (!trilha) return;
    setIsGenerating(true);
    
    try {
      const activeQuestoes = [...trilha.questoes, ...questoesExtras];
      const erros = activeQuestoes
        .filter(q => progressData.answers[q.id] === false)
        .map(q => q.enunciado);

      const res = await fetch("/api/ai/gerar-questoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trilhaId: trilha.id, 
          topico: trilha.titulo, 
          erros: erros.length > 0 ? erros : null 
        }),
      });
      
      const raw: unknown = await res.json();

      // Runtime guard: confirma shape real antes de tratar como tipado
      const questoesValidas: TrilhaQuestao[] =
        raw !== null &&
        typeof raw === "object" &&
        Array.isArray((raw as Record<string, unknown>).questoes)
          ? ((raw as Record<string, unknown>).questoes as unknown[]).filter(
              (q): q is TrilhaQuestao =>
                q !== null &&
                typeof q === "object" &&
                typeof (q as TrilhaQuestao).enunciado === "string" &&
                Array.isArray((q as TrilhaQuestao).opcoes) &&
                typeof (q as TrilhaQuestao).corretaIdx === "number"
            )
          : [];

      if (questoesValidas.length > 0) {
        setQuestoesExtras(prev => [...prev, ...questoesValidas]);
        setShowEndState(false);
        setIsSubmitted(false);
        setSelectedOpt(null);
        setCurrentQ(activeQuestoes.length);
        trackEvent("ai_questions_generated", { count: questoesValidas.length, trilha_id: trilha.id });
      }
    } catch (e) {
      console.error("[IA Aprofundar]", e);
      trackEvent("ai_generation_error", { trilha_id: trilha.id });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!trilha) {
    return (
      <div className="fixed inset-0 z-[9999] h-[100dvh] w-full bg-[var(--color-bg)] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mb-4" />
        <p className="text-[var(--color-text)] font-bold text-lg animate-pulse">Carregando módulo de estudo...</p>
      </div>
    );
  }

  const totalQuestoes = [...trilha.questoes, ...questoesExtras];

  const renderVideo = () => {
    if (!trilha?.video?.youtubeId) return null;
    return (
      <div className="w-full max-w-[800px] mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="aspect-video w-full bg-black rounded-xl border border-[var(--color-border)] overflow-hidden shadow-2xl">
          <iframe 
            className="w-full h-full" 
            src={`https://www.youtube.com/embed/${trilha.video.youtubeId}?rel=0&modestbranding=1`} 
            title={trilha.video.titulo} 
            allowFullScreen 
            loading="lazy"
            onLoad={() => trackEvent("video_iframe_loaded", { trilha_id: trilha.id })}
          />
        </div>
        <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 md:p-6 text-left">
          <h3 className="text-[var(--color-heading)] font-bold text-lg md:text-xl">{trilha.video.titulo}</h3>
          <p className="text-[var(--color-text-muted)] text-sm md:text-base mt-2 leading-relaxed">{trilha.video.resumo}</p>
        </div>
      </div>
    );
  };

  const renderResumo = () => {
    return (
      <div className="w-full max-w-[800px] mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 md:p-8 text-left shadow-lg">
          <h3 className="text-[var(--color-heading)] font-bold text-xl md:text-2xl mb-4">Resumo da Aula</h3>
          <p className="text-[var(--color-text)] text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {trilha.video?.resumo || "O resumo detalhado desta trilha estará disponível em breve."}
          </p>
        </div>
      </div>
    );
  };

  const renderFlashcards = () => {
    const card = trilha.flashcards[currentFc];
    if (!card) return null;
    return (
      <div className="w-full max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-4 flex justify-between items-center text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest">
          <span>Revisão Rápida</span>
          <span>{currentFc + 1} de {trilha.flashcards.length}</span>
        </div>

        <div 
          className="relative w-full h-[320px] cursor-pointer [perspective:1000px] group"
          onClick={() => {
            if (!fcFlipped) trackEvent("flashcard_flipped", { card_id: card.id, trilha_id: trilha.id });
            setFcFlipped(!fcFlipped);
          }}
        >
          <div className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${fcFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 w-full h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-xl [backface-visibility:hidden]">
              <span className="text-[var(--color-primary)] text-xs font-bold tracking-widest mb-6 uppercase">Pergunta</span>
              <p className="text-[var(--color-heading)] text-xl md:text-2xl font-medium leading-relaxed">{card.frente}</p>
            </div>
            <div className="absolute inset-0 w-full h-full bg-[var(--elite-navy)] border border-[var(--color-primary)] rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="text-[var(--color-primary)] text-xs font-bold tracking-widest mb-6 uppercase">Resposta</span>
              <p className="text-[var(--elite-cream)] text-lg md:text-xl font-medium leading-relaxed">{card.verso}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={() => { setFcFlipped(false); setTimeout(() => setCurrentFc(p => p > 0 ? p - 1 : trilha.flashcards.length - 1), 150); }} className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] text-sm font-bold hover:bg-[var(--color-border)] transition-colors">
            Anterior
          </button>
          <button onClick={() => { setFcFlipped(false); setTimeout(() => setCurrentFc(p => p < trilha.flashcards.length - 1 ? p + 1 : 0), 150); }} className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg">
            Próximo
          </button>
        </div>
      </div>
    );
  };

  const renderQuestoes = () => {
    if (showEndState) {
      return (
        <div className="w-full max-w-[600px] mx-auto text-center py-12 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-heading)] mb-2">Trilha Concluída!</h2>
          <p className="text-[var(--color-text-muted)] mb-8">Você fixou os conceitos essenciais desta aula com sucesso.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.back()} className="px-6 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-bold hover:bg-[var(--color-border)] transition-colors">
              Voltar ao Painel
            </button>
            <button 
              onClick={handleAprofundarIA} 
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary-hover)] flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} 
              {isGenerating ? "Mapeando Gaps..." : "Aprofundar com IA"}
            </button>
          </div>
        </div>
      );
    }

    const q = totalQuestoes[currentQ];
    if (!q) return null;
    
    const acerto = isSubmitted && selectedOpt === q.corretaIdx;

    return (
      <div className="w-full max-w-[800px] mx-auto animate-in slide-in-from-right-8 duration-300">
        <div className="mb-4 flex justify-between items-center text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest">
          <span>Questão de Fixação</span><span>{currentQ + 1} de {totalQuestoes.length}</span>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 text-left shadow-lg">
          <p className="text-[var(--color-heading)] font-medium text-lg md:text-xl mb-8 leading-relaxed">{q.enunciado}</p>
          <div className="space-y-3">
            {q.opcoes.map((alt, i) => {
              const isSelected = selectedOpt === i;
              const isCorrect = isSubmitted && i === q.corretaIdx;
              const isWrongSelected = isSubmitted && isSelected && !isCorrect;
              
              let style = "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)] text-[var(--color-text)]";
              let badgeStyle = "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]";

              if (isSelected && !isSubmitted) {
                style = "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-heading)]";
                badgeStyle = "bg-[var(--color-primary)] text-white border-[var(--color-primary)]";
              } else if (isCorrect) {
                style = "border-emerald-500 bg-emerald-500/10 text-[var(--color-heading)]";
                badgeStyle = "bg-emerald-500 text-white border-emerald-500";
              } else if (isWrongSelected) {
                style = "border-rose-500 bg-rose-500/10 text-[var(--color-heading)]";
                badgeStyle = "bg-rose-500 text-white border-rose-500";
              }

              return (
                <button key={i} disabled={isSubmitted} onClick={() => setSelectedOpt(i)} className={`w-full flex items-start gap-4 p-4 text-left rounded-xl border transition-all ${style} ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}>
                  <span className={`shrink-0 flex items-center justify-center w-8 h-8 font-bold rounded-lg text-sm border transition-colors ${badgeStyle}`}>{["A", "B", "C", "D", "E"][i] || i}</span>
                  <span className="flex-1 text-sm md:text-base whitespace-normal leading-snug pt-1">{alt}</span>
                  {isCorrect && <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />}
                  {isWrongSelected && <XCircle className="text-rose-500 shrink-0 mt-1" size={20} />}
                </button>
              );
            })}
          </div>

          {/* CLS FIX: min-h permanente para não gerar empurrão (Layout Shift) no botão de ação */}
          <div className={`mt-6 rounded-xl border transition-all duration-300 flex flex-col justify-center overflow-hidden min-h-[140px] ${isSubmitted ? (acerto ? "bg-emerald-500/10 border-emerald-500/30 p-5 opacity-100" : "bg-rose-500/10 border-rose-500/30 p-5 opacity-100") : "border-transparent p-0 opacity-0 pointer-events-none"}`}>
            {isSubmitted && (
              <div className="animate-in fade-in duration-500">
                <span className={`text-xs font-bold uppercase tracking-widest ${acerto ? "text-emerald-500" : "text-rose-500"}`}>{acerto ? "Resposta Correta" : "Resposta Incorreta"}</span>
                <p className="text-[var(--color-text)] mt-2 text-sm md:text-base leading-relaxed">{q.justificativa}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            {!isSubmitted ? (
              <button 
                disabled={selectedOpt === null}
                onClick={() => {
                  const correct = selectedOpt === q.corretaIdx;
                  setIsSubmitted(true);
                  registerAnswer(q.id, correct);
                  trackEvent("question_answered", { question_id: q.id, correct, trilha_id: trilha.id });
                }}
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Conferir Resposta
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (currentQ < totalQuestoes.length - 1) {
                    setIsSubmitted(false);
                    setSelectedOpt(null);
                    setCurrentQ(p => p + 1);
                  } else {
                    toggleTopicCompletion(trilha.id);
                    trackEvent("module_completed", { module_title: trilha.titulo, trilha_id: trilha.id });
                    setShowEndState(true);
                  }
                }}
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-bold hover:bg-[var(--color-border)] transition-colors flex items-center justify-center gap-2"
              >
                {currentQ < totalQuestoes.length - 1 ? "Próxima Questão" : "Finalizar Trilha"} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] h-[100dvh] w-full overflow-y-auto bg-[var(--color-bg)] flex flex-col">
      <header className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md flex justify-center sticky top-0 z-50 flex-none shadow-sm">
        <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center w-full md:w-auto gap-3">
            <button onClick={() => router.back()} className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-[var(--color-heading)] font-bold text-base md:text-lg line-clamp-1">{trilha.titulo}</h1>
          </div>
          <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex gap-1 md:gap-2 bg-[var(--color-bg)] p-1 rounded-xl border border-[var(--color-border)] w-full md:w-auto">
              {(["video", "resumo", "flashcards", "questoes"] as StudyTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
                >
                  {tab === "questoes" ? "Questões" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col items-center p-4 md:p-8 pt-8 pb-32">
        <div className={`w-full ${activeTab === 'video' ? 'block' : 'hidden'}`}>{renderVideo()}</div>
        <div className={`w-full ${activeTab === 'resumo' ? 'block' : 'hidden'}`}>{renderResumo()}</div>
        <div className={`w-full ${activeTab === 'flashcards' ? 'block' : 'hidden'}`}>{renderFlashcards()}</div>
        <div className={`w-full ${activeTab === 'questoes' ? 'block' : 'hidden'}`}>{renderQuestoes()}</div>
      </main>
    </div>
  );
}
