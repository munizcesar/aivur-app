"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  RotateCcw,
  PlayCircle,
  BookOpen,
  Layers,
  HelpCircle,
} from "lucide-react";
import { TRILHAS_MOCK, type TrilhaQuestao, type Trilha } from "@/mocks/trilhasMock";
import { useStudyStore } from "@/store/useStudyStore";
import { useAivoStore } from "@/store/useAivoStore";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { type ReactNode } from "react";

// ─── Analytics Hook (mesmo padrão do TrilhaSala original) ────────────────────
const trackEvent = (eventName: string, properties: Record<string, unknown> = {}) => {
  if (typeof window !== "undefined") {
    console.log(`[Analytics V2] ${eventName}`, properties);
  }
};

// ─── Markdown renderer (mesmo config do TrilhaSala original) ─────────────────
const markdownComponents: Components = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="v2-md-h1">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="v2-md-h2">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="v2-md-h3">{children}</h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="v2-md-p">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="v2-md-ul">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="v2-md-ol">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="v2-md-li">{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="v2-md-strong">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="v2-md-em">{children}</em>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="v2-md-blockquote">{children}</blockquote>
  ),
};

// ─── Accordion Section IDs ────────────────────────────────────────────────────
type SectionId = "video" | "resumo" | "flashcards" | "questoes";
export type ModuleStatus = "nao_preparado" | "preparando" | "preparado" | "erro";

interface SectionMeta {
  id: SectionId;
  label: string;
  Icon: React.ElementType;
}

const SECTIONS: SectionMeta[] = [
  { id: "video",      label: "Vídeo",      Icon: PlayCircle  },
  { id: "resumo",     label: "Resumo",     Icon: BookOpen    },
  { id: "flashcards", label: "Flashcards", Icon: Layers      },
  { id: "questoes",   label: "Questões",   Icon: HelpCircle  },
];

// ─── Flashcard sub-component ──────────────────────────────────────────────────
function FlashcardPanel({
  flashcards,
  trilhaId,
  status,
  errorMsg,
  onRetry,
  onGenerateMore,
  isGeneratingMore,
  moreError,
  toggleTopicCompletion,
  completedTopicIds,
}: {
  flashcards: { id: string; frente: string; verso: string }[];
  trilhaId: string;
  status: ModuleStatus;
  errorMsg: string;
  onRetry: () => void;
  onGenerateMore: () => Promise<void>;
  isGeneratingMore: boolean;
  moreError: string;
  toggleTopicCompletion: (id: string) => void;
  completedTopicIds: string[];
}) {
  const { currentFlashcard, setCurrentFlashcard } = useStudyStore();
  const current = currentFlashcard[trilhaId] || 0;
  const safeCurrent = Math.min(Math.max(0, current), Math.max(0, flashcards.length - 1));

  const setCurrent = useCallback((val: number | ((prev: number) => number)) => {
    const nextVal = typeof val === 'function' ? val(safeCurrent) : val;
    setCurrentFlashcard(trilhaId, nextVal);
  }, [safeCurrent, setCurrentFlashcard, trilhaId]);

  const [flipped, setFlipped] = useState(false);

  const total = flashcards.length;
  const card  = flashcards[safeCurrent];

  const prev = useCallback(() => { setFlipped(false); setCurrent(c => Math.max(0, c - 1)); }, [setCurrent]);
  const next = useCallback(() => {
    setFlipped(false);
    setCurrent(c => {
      const nextIdx = Math.min(total - 1, c + 1);
      if (nextIdx === total - 1 && !completedTopicIds.includes(`${trilhaId}-flashcards`)) {
        toggleTopicCompletion(`${trilhaId}-flashcards`);
      }
      return nextIdx;
    });
  }, [total, trilhaId, toggleTopicCompletion, completedTopicIds, setCurrent]);

  if (status === "preparando") {
    return (
      <div className="v2-fc-wrapper" style={{ padding: '2rem 1rem' }}>
        <div className="v2-skeleton-card" style={{ width: '100%', maxWidth: '520px', minHeight: '200px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem', boxSizing: 'border-box' }}>
          <div className="v2-skeleton-line" style={{ width: '40%', height: '1rem' }} />
          <div className="v2-skeleton-line" style={{ width: '80%', height: '2rem' }} />
          <div className="v2-skeleton-line" style={{ width: '60%', height: '1rem' }} />
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Preparando flashcards com inteligência artificial...
        </p>
      </div>
    );
  }

  if (status === "erro") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', maxWidth: '480px', lineHeight: 1.5 }}>
          {errorMsg || "Não foi possível carregar os flashcards neste momento."}
        </span>
        <button className="v2-btn-outline" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nenhum flashcard disponível.</p>
        <button className="v2-btn-outline" onClick={onRetry}>
          Gerar Flashcards com IA ✨
        </button>
      </div>
    );
  }

  return (
    <div className="v2-fc-wrapper">
      <p className="v2-fc-counter">{safeCurrent + 1} / {total}</p>

      {/* Flip card */}
      <div
        id={`v2-flashcard-${card.id}`}
        className={`v2-fc-scene${flipped ? " v2-fc-scene--flipped" : ""}`}
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? "Verso do flashcard — clique para ver a frente" : "Frente do flashcard — clique para revelar"}
      >
        <div className="v2-fc-card">
          <div className="v2-fc-face v2-fc-face--front">
            <span className="v2-fc-badge">Frente</span>
            <p className="v2-fc-text">{card.frente}</p>
            <span className="v2-fc-hint">Clique para revelar</span>
          </div>
          <div className="v2-fc-face v2-fc-face--back">
            <span className="v2-fc-badge v2-fc-badge--back">Verso</span>
            <p className="v2-fc-text">{card.verso}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="v2-fc-nav" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          id="v2-fc-prev"
          disabled={safeCurrent === 0}
          onClick={prev}
          className="v2-btn-ghost"
          aria-label="Flashcard anterior"
        >
          ← Anterior
        </button>
        <button
          id="v2-fc-flip"
          onClick={() => setFlipped(f => !f)}
          className="v2-btn-outline"
          aria-label="Virar flashcard"
        >
          <RotateCcw size={15} /> Virar
        </button>
        <button
          id="v2-fc-next"
          disabled={safeCurrent === total - 1}
          onClick={next}
          className="v2-btn-ghost"
          aria-label="Próximo flashcard"
        >
          Próximo →
        </button>
      </div>

      {/* Gerar mais */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        {safeCurrent === total - 1 && (
          <button
            className="v2-btn-outline"
            onClick={onGenerateMore}
            disabled={isGeneratingMore}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {isGeneratingMore ? "Gerando..." : "Gerar mais flashcards ✨"}
          </button>
        )}
        {moreError && <span style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{moreError}</span>}
      </div>
    </div>
  );
}

// ─── Question sub-component ───────────────────────────────────────────────────
function QuestoesPanel({
  questoes,
  topicoId,
  status,
  errorMsg,
  onRetry,
  onGenerateMore,
  isGeneratingMore,
  moreError,
  registerAnswer,
  toggleTopicCompletion,
}: {
  questoes: TrilhaQuestao[];
  topicoId: string;
  status: ModuleStatus;
  errorMsg: string;
  onRetry: () => void;
  onGenerateMore: () => Promise<void>;
  isGeneratingMore: boolean;
  moreError: string;
  registerAnswer: (id: string, correct: boolean) => void;
  toggleTopicCompletion: (id: string) => void;
}) {
  const { currentQuestao, setCurrentQuestao } = useStudyStore();

  const currentQ = currentQuestao[topicoId] || 0;
  const safeCurrentQ = Math.min(Math.max(0, currentQ), Math.max(0, questoes.length - 1));

  const setCurrentQ = useCallback((val: number | ((prev: number) => number)) => {
    const nextVal = typeof val === 'function' ? val(safeCurrentQ) : val;
    setCurrentQuestao(topicoId, nextVal);
  }, [safeCurrentQ, setCurrentQuestao, topicoId]);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showEnd, setShowEnd]         = useState(false);

  if (status === "preparando") {
    return (
      <div className="v2-q-wrapper">
         <div className="v2-skeleton-card" style={{ flexDirection: 'column', padding: '1.5rem', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
           <div className="v2-skeleton-line" style={{ width: '30%', height: '1.2rem' }} />
           <div className="v2-skeleton-line" style={{ width: '100%', height: '4rem', marginTop: '1rem' }} />
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
             {[1,2,3,4].map(i => <div key={i} className="v2-skeleton-line" style={{ width: '100%', height: '3rem', borderRadius: '0.5rem' }} />)}
           </div>
         </div>
         <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
           Preparando questões com inteligência artificial...
         </p>
      </div>
    );
  }

  if (status === "erro") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', maxWidth: '480px', lineHeight: 1.5 }}>
          {errorMsg || "Não foi possível carregar as questões neste momento."}
        </span>
        <button className="v2-btn-outline" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nenhuma questão disponível.</p>
        <button className="v2-btn-outline" onClick={onRetry}>
          Gerar Questões com IA ✨
        </button>
      </div>
    );
  }

  const q = questoes[safeCurrentQ];
  const acerto = isSubmitted && selectedOpt === q?.corretaIdx;

  if (showEnd) {
    return (
      <div className="v2-end-state" id="v2-end-state">
        <CheckCircle2 size={56} className="v2-end-icon" />
        <h3 className="v2-end-title">Trilha concluída! 🎉</h3>
        <p className="v2-end-sub">Você respondeu todas as questões desta trilha.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', width: '100%', alignItems: 'center' }}>
          <button
            id="v2-restart-btn"
            className="v2-btn-primary"
            style={{ width: '100%', maxWidth: '300px' }}
            onClick={() => {
              setCurrentQ(0);
              setSelectedOpt(null);
              setIsSubmitted(false);
              setShowEnd(false);
            }}
          >
            Recomeçar
          </button>
          <button
            className="v2-btn-outline"
            onClick={async () => {
              await onGenerateMore();
              setIsSubmitted(false);
              setSelectedOpt(null);
              setShowEnd(false);
            }}
            disabled={isGeneratingMore}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {isGeneratingMore ? "Gerando..." : "Gerar mais questões ✨"}
          </button>
          {moreError && <span style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{moreError}</span>}
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="v2-q-wrapper">
      <div className="v2-q-header">
        <span className="v2-q-label">Questão de Fixação</span>
        <span className="v2-q-counter">{safeCurrentQ + 1} de {questoes.length}</span>
      </div>

      <div className="v2-q-card">
        <p className="v2-q-enunciado">{q.enunciado}</p>

        <div className="v2-q-options">
          {q.opcoes.map((alt, i) => {
            const isSelected      = selectedOpt === i;
            const isCorrect       = isSubmitted && i === q.corretaIdx;
            const isWrongSelected = isSubmitted && isSelected && !isCorrect;

            let cls = "v2-q-opt";
            if (isSelected && !isSubmitted) cls += " v2-q-opt--selected";
            else if (isCorrect)             cls += " v2-q-opt--correct";
            else if (isWrongSelected)       cls += " v2-q-opt--wrong";

            const letterCls = isSelected && !isSubmitted
              ? "v2-q-letter v2-q-letter--selected"
              : isCorrect
              ? "v2-q-letter v2-q-letter--correct"
              : isWrongSelected
              ? "v2-q-letter v2-q-letter--wrong"
              : "v2-q-letter";

            return (
              <button
                key={i}
                id={`v2-q-opt-${safeCurrentQ}-${i}`}
                disabled={isSubmitted}
                onClick={() => setSelectedOpt(i)}
                className={cls}
              >
                <span className={letterCls}>
                  {q.tipo_questao === "CERTO_ERRADO" ? alt.charAt(0).toUpperCase() : ["A", "B", "C", "D", "E"][i]}
                </span>
                <span className="v2-q-opt-text">{alt}</span>
                <span className="v2-q-icon">
                  {isCorrect       && <CheckCircle2 size={18} className="v2-icon-correct" />}
                  {isWrongSelected && <XCircle      size={18} className="v2-icon-wrong"   />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback panel — always rendered, animated in/out via CSS */}
        <div className={`v2-q-feedback${isSubmitted ? (acerto ? " v2-q-feedback--correct" : " v2-q-feedback--wrong") : " v2-q-feedback--hidden"}`}>
          {isSubmitted && (
            <>
              <span className={`v2-q-feedback-label${acerto ? " v2-q-feedback-label--correct" : " v2-q-feedback-label--wrong"}`}>
                {acerto ? "Resposta Correta ✓" : "Resposta Incorreta ✗"}
              </span>
              <p className="v2-q-feedback-text">{q.justificativa}</p>
            </>
          )}
        </div>

        <div className="v2-q-actions">
          {!isSubmitted ? (
            <button
              id="v2-conferir-btn"
              disabled={selectedOpt === null}
              onClick={() => {
                const correct = selectedOpt === q.corretaIdx;
                setIsSubmitted(true);
                registerAnswer(String(q.id), correct);
                trackEvent("question_answered_v2", { question_id: String(q.id), correct, trilha_id: topicoId });
              }}
              className="v2-btn-primary"
            >
              Conferir Resposta
            </button>
          ) : (
            <button
              id="v2-next-q-btn"
              onClick={() => {
                if (safeCurrentQ < questoes.length - 1) {
                  setIsSubmitted(false);
                  setSelectedOpt(null);
                  setCurrentQ(q => q + 1);
                } else {
                  toggleTopicCompletion(topicoId);
                  trackEvent("module_completed_v2", { trilha_id: topicoId });
                  setShowEnd(true);
                }
              }}
              className="v2-btn-secondary"
            >
              {safeCurrentQ < questoes.length - 1 ? "Próxima Questão" : "Finalizar Trilha"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TrilhaSalaV2() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;

  const { error, registerAnswer, toggleTopicCompletion, customTrilhas, videoResultsCache, setVideoResults, selectedVideoByTrilha, setSelectedVideo, progressData, completedTopicIds } = useStudyStore();

  const localTrilha = TRILHAS_MOCK.find(t => t.id === id) || customTrilhas.find(t => t.id === id);

  const [d1Trilha, setD1Trilha] = useState<Trilha | null>(null);
  const [isLoadingD1, setIsLoadingD1] = useState(!localTrilha);
  const [d1Error, setD1Error] = useState(false);

  const generatingRef = useRef<Record<string, boolean>>({});

  const [activeFlashcards, setActiveFlashcards] = useState<{ id: string; frente: string; verso: string }[]>([]);
  const [activeQuestoes, setActiveQuestoes] = useState<TrilhaQuestao[]>([]);
  const [activeResumoMarkdown, setActiveResumoMarkdown] = useState<string>("");
  const [activeResumoText, setActiveResumoText] = useState<string>("");

  const [flashcardsStatus, setFlashcardsStatus] = useState<ModuleStatus>("nao_preparado");
  const [questoesStatus, setQuestoesStatus] = useState<ModuleStatus>("nao_preparado");
  const [resumoStatus, setResumoStatus] = useState<ModuleStatus>("nao_preparado");

  const [flashcardsError, setFlashcardsError] = useState("");
  const [questoesError, setQuestoesError] = useState("");
  const [resumoError, setResumoError] = useState("");

  const [isGeneratingMoreFc, setIsGeneratingMoreFc] = useState(false);
  const [fcMoreError, setFcMoreError] = useState("");
  const [isGeneratingMoreQ, setIsGeneratingMoreQ] = useState(false);
  const [qMoreError, setQMoreError] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (!localTrilha) setIsLoadingD1(true);
    fetch(`/api/trilhas/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data: any) => {
        if (isMounted) {
          if (data.trilha) {
            setD1Trilha(data.trilha);
          } else if (!localTrilha) {
            setD1Error(true);
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn("D1 fetch fallback to local:", err);
          if (!localTrilha) setD1Error(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingD1(false);
      });

    return () => { isMounted = false; };
  }, [id, localTrilha]);

  const trilha = d1Trilha || localTrilha;

  useEffect(() => {
    if (!trilha) return;

    // Resumo
    const md = trilha.video?.resumo_markdown || "";
    const txt = trilha.video?.resumo || "";
    setActiveResumoMarkdown(md);
    setActiveResumoText(txt);
    if ((md && md.trim() !== "") || (txt && txt.trim() !== "")) {
      setResumoStatus("preparado");
    } else {
      setResumoStatus("nao_preparado");
    }

    // Flashcards
    const fc = (trilha.flashcards || []) as { id: string; frente: string; verso: string }[];
    setActiveFlashcards(fc);
    if (fc.length > 0) {
      setFlashcardsStatus("preparado");
    } else {
      setFlashcardsStatus("nao_preparado");
    }

    // Questoes
    const q = (trilha.questoes || []) as TrilhaQuestao[];
    setActiveQuestoes(q);
    if (q.length > 0) {
      setQuestoesStatus("preparado");
    } else {
      setQuestoesStatus("nao_preparado");
    }
  }, [trilha]);

  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [forceGallery, setForceGallery] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Sincroniza a trilha e seção ativa com o AIVU Professor Particular
  useEffect(() => {
    if (!trilha) {
      useAivoStore.getState().setActiveContext(null);
      return;
    }

    let atividade: "navegando" | "resolvendo_questao" | "revisando_flashcard" | "lendo_teoria" = "navegando";
    let trechoFoco: string | undefined = undefined;

    if (openSection === "questoes") {
      atividade = "resolvendo_questao";
      if (activeQuestoes.length > 0) {
        const q = activeQuestoes[0];
        const opts = (q.opcoes || []).map((opt, i) => `(${String.fromCharCode(65 + i)}) ${opt}`).join("\n");
        trechoFoco = `Questão da Trilha:\n${q.enunciado}\n\nAlternativas:\n${opts}`.slice(0, 1500);
      }
    } else if (openSection === "flashcards") {
      atividade = "revisando_flashcard";
      if (activeFlashcards.length > 0) {
        const fc = activeFlashcards[0];
        trechoFoco = `Flashcard de Estudo:\nFrente: ${fc.frente}\nVerso: ${fc.verso}`.slice(0, 1500);
      }
    } else if (openSection === "resumo") {
      atividade = "lendo_teoria";
      trechoFoco = (activeResumoMarkdown || activeResumoText || "").slice(0, 1500);
    } else {
      const disc = (trilha as any).disciplina || (trilha as any).materia || "Geral";
      trechoFoco = `Trilha: ${trilha.titulo}. Matéria: ${disc}.`.slice(0, 1500);
    }

    const disciplinaNome = (trilha as any).disciplina || (trilha as any).materia || undefined;

    useAivoStore.getState().setActiveContext({
      pathname: `/trilhas/${trilha.id}`,
      modulo: "trilhas",
      atividade,
      disciplina: disciplinaNome,
      topico: trilha.titulo,
      titulo: trilha.titulo,
      trecho_foco: trechoFoco || undefined,
      metadados: {
        trilhaId: trilha.id,
        secaoAtiva: openSection || "geral",
      },
    });

    return () => {
      useAivoStore.getState().setActiveContext(null);
    };
  }, [trilha, openSection, activeQuestoes, activeFlashcards, activeResumoMarkdown, activeResumoText]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M visualizações`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)} mil visualizações`;
    return `${views} visualizações`;
  };

  useEffect(() => {
    if (openSection === "video" && trilha) {
      setForceGallery(false);
      if (!videoResultsCache[trilha.id] && !isLoadingVideo) {
        setIsLoadingVideo(true);
        fetch(`/api/youtube-search?query=${encodeURIComponent(trilha.titulo)}`)
          .then(res => res.json())
          .then((data: any) => {
            if (data.items) {
              setVideoResults(trilha.id, data.items);
            } else {
              setVideoResults(trilha.id, []);
            }
          })
          .catch(err => {
            console.error("Error fetching videos:", err);
            setVideoResults(trilha.id, []);
          })
          .finally(() => setIsLoadingVideo(false));
      }
    }
  }, [openSection, trilha, videoResultsCache, setVideoResults, isLoadingVideo]);

  // Mark Resumo as completed using a simple dwell time (3s) when opened
  useEffect(() => {
    if (openSection === "resumo" && trilha) {
      const timer = setTimeout(() => {
        if (!completedTopicIds.includes(`${trilha.id}-resumo`)) {
          toggleTopicCompletion(`${trilha.id}-resumo`);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [openSection, trilha, completedTopicIds, toggleTopicCompletion]);

  const generateModule = useCallback(async (tipo: "resumo" | "flashcards" | "questoes") => {
    if (generatingRef.current[tipo]) {
      return;
    }
    generatingRef.current[tipo] = true;

    if (tipo === "resumo") {
      setResumoStatus("preparando");
      setResumoError("");
    } else if (tipo === "flashcards") {
      setFlashcardsStatus("preparando");
      setFlashcardsError("");
    } else if (tipo === "questoes") {
      setQuestoesStatus("preparando");
      setQuestoesError("");
    }

    try {
      const res = await fetch(`/api/trilhas/${id}/gerar-mais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok || !data.success) {
        const msg = data.error || (res.status === 429
          ? "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns segundos antes de tentar novamente."
          : "Erro ao gerar conteúdo.");
        if (tipo === "resumo") {
          setResumoStatus("erro");
          setResumoError(msg);
        } else if (tipo === "flashcards") {
          setFlashcardsStatus("erro");
          setFlashcardsError(msg);
        } else if (tipo === "questoes") {
          setQuestoesStatus("erro");
          setQuestoesError(msg);
        }
        return;
      }

      if (tipo === "resumo") {
        setActiveResumoMarkdown(data.resumo_markdown || "");
        setActiveResumoText(data.resumo || "");
        setResumoStatus("preparado");
        setD1Trilha(prev => prev ? {
          ...prev,
          video: { ...prev.video, resumo: data.resumo, resumo_markdown: data.resumo_markdown }
        } : prev);
      } else if (tipo === "flashcards") {
        const items = data.items || [];
        setActiveFlashcards(items);
        setFlashcardsStatus("preparado");
        setD1Trilha(prev => prev ? { ...prev, flashcards: items } : prev);
      } else if (tipo === "questoes") {
        const items = data.items || [];
        setActiveQuestoes(items);
        setQuestoesStatus("preparado");
        setD1Trilha(prev => prev ? { ...prev, questoes: items } : prev);
      }
    } catch {
      const msg = "Erro de conexão ao gerar conteúdo.";
      if (tipo === "resumo") {
        setResumoStatus("erro");
        setResumoError(msg);
      } else if (tipo === "flashcards") {
        setFlashcardsStatus("erro");
        setFlashcardsError(msg);
      } else if (tipo === "questoes") {
        setQuestoesStatus("erro");
        setQuestoesError(msg);
      }
    } finally {
      generatingRef.current[tipo] = false;
    }
  }, [id]);

  const handleGenerateMoreFlashcards = useCallback(async () => {
    if (generatingRef.current["flashcards_more"]) return;
    generatingRef.current["flashcards_more"] = true;
    setIsGeneratingMoreFc(true);
    setFcMoreError("");

    try {
      const res = await fetch(`/api/trilhas/${id}/gerar-mais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "flashcards" }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || !data.success) {
        setFcMoreError(data.error || (res.status === 429
          ? "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns segundos antes de tentar novamente."
          : "Erro ao gerar mais flashcards."));
        return;
      }
      if (data.items && data.items.length > 0) {
        const updated = [...activeFlashcards, ...data.items];
        setActiveFlashcards(updated);
        setD1Trilha(prev => prev ? { ...prev, flashcards: updated } : prev);
        const current = useStudyStore.getState().currentFlashcard[id] || 0;
        useStudyStore.getState().setCurrentFlashcard(id, current + 1);
      }
    } catch {
      setFcMoreError("Erro de conexão ao gerar mais flashcards.");
    } finally {
      setIsGeneratingMoreFc(false);
      generatingRef.current["flashcards_more"] = false;
    }
  }, [id, activeFlashcards]);

  const handleGenerateMoreQuestoes = useCallback(async () => {
    if (generatingRef.current["questoes_more"]) return;
    generatingRef.current["questoes_more"] = true;
    setIsGeneratingMoreQ(true);
    setQMoreError("");

    try {
      const res = await fetch(`/api/trilhas/${id}/gerar-mais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "questoes" }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || !data.success) {
        setQMoreError(data.error || (res.status === 429
          ? "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns segundos antes de tentar novamente."
          : "Erro ao gerar mais questões."));
        return;
      }
      if (data.items && data.items.length > 0) {
        const updated = [...activeQuestoes, ...data.items];
        setActiveQuestoes(updated);
        setD1Trilha(prev => prev ? { ...prev, questoes: updated } : prev);
        useStudyStore.getState().setQuestoesCache(id, updated);
        const current = useStudyStore.getState().currentQuestao[id] || 0;
        useStudyStore.getState().setCurrentQuestao(id, current + 1);
      }
    } catch {
      setQMoreError("Erro de conexão ao gerar mais questões.");
    } finally {
      setIsGeneratingMoreQ(false);
      generatingRef.current["questoes_more"] = false;
    }
  }, [id, activeQuestoes]);

  const toggle = useCallback((section: SectionId) => {
    setOpenSection(prev => {
      const isOpening = prev !== section;
      const next = isOpening ? section : null;
      if (next && trilha) trackEvent("v2_section_opened", { section, trilha_id: trilha.id });

      if (isOpening) {
        if (section === "resumo" && resumoStatus === "nao_preparado") {
          generateModule("resumo");
        } else if (section === "flashcards" && flashcardsStatus === "nao_preparado") {
          generateModule("flashcards");
        } else if (section === "questoes" && questoesStatus === "nao_preparado") {
          generateModule("questoes");
        }
      }

      return next;
    });
  }, [trilha, resumoStatus, flashcardsStatus, questoesStatus, generateModule]);

  if (isLoadingD1) {
    return (
      <div className="v2-not-found">
        <p>Carregando trilha...</p>
      </div>
    );
  }

  if (!trilha || d1Error) {
    return (
      <div className="v2-not-found">
        <p>Trilha não encontrada.</p>
        <button className="v2-btn-primary" onClick={() => router.push("/trilhas")}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="v2-toast-error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {/* Inject scoped styles — zero dependency on external CSS modules */}
      <style>{`
        /* ── Toasts ───────────────────────────────────────────── */
        .v2-toast-error {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-error, #C41230);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          z-index: 100;
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-weight: 600;
          font-size: 0.9rem;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 1.5rem); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* ── Layout shell ─────────────────────────────────────── */
        .v2-shell {
          min-height: 100dvh;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          font-family: var(--font-body);
        }

        /* ── Topbar ───────────────────────────────────────────── */
        .v2-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
          background: color-mix(in srgb, var(--color-surface) 92%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }
        .v2-topbar-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .v2-back-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
          transition: background var(--transition), color var(--transition), border-color var(--transition);
        }
        .v2-back-btn:hover {
          background: var(--color-primary);
          color: var(--color-white);
          border-color: transparent;
        }
        .v2-topbar-title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--color-heading, var(--color-text));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .v2-topbar-badge {
          flex-shrink: 0;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-primary);
          border: 1.5px solid var(--color-primary);
          border-radius: var(--radius-full);
          padding: 0.15rem 0.55rem;
        }

        /* ── Main content ─────────────────────────────────────── */
        .v2-main {
          flex: 1;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 1.5rem 1rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── Accordion item ───────────────────────────────────── */
        .v2-acc-item {
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .v2-acc-item--open {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent), var(--shadow-md);
        }
        .v2-acc-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition);
          color: var(--color-text);
        }
        .v2-acc-trigger:hover {
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
        }
        .v2-acc-icon-wrap {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
          color: var(--color-primary);
          transition: background var(--transition), color var(--transition);
        }
        .v2-acc-item--open .v2-acc-icon-wrap {
          background: var(--color-primary);
          color: var(--color-white);
        }
        .v2-acc-label {
          flex: 1;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--color-heading, var(--color-text));
        }
        .v2-acc-chevron {
          flex-shrink: 0;
          color: var(--color-text-muted);
          transition: transform 0.3s var(--bounce-ease);
        }
        .v2-acc-item--open .v2-acc-chevron {
          transform: rotate(180deg);
          color: var(--color-primary);
        }

        /* ── Accordion body (expand/collapse) ─────────────────── */
        .v2-acc-body {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          opacity: 0;
        }
        .v2-acc-body--open {
          max-height: 9999px;   /* large enough for any content */
          opacity: 1;
        }
        .v2-acc-body-inner {
          padding: 0 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        /* ── Video panel ──────────────────────────────────────── */
        .v2-video-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
        }
        .v2-video-iframe-box {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #000;
        }
        .v2-video-iframe-box iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        .v2-video-title {
          font-weight: 700;
          color: var(--color-heading, var(--color-text));
          font-size: 0.9rem;
        }

        /* ── Video Gallery ────────────────────────────────────── */
        .v2-video-gallery {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .v2-video-card {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          transition: border-color var(--transition), background var(--transition);
        }
        .v2-video-card:hover {
          border-color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
        }
        .v2-video-thumb {
          width: 120px;
          aspect-ratio: 16/9;
          border-radius: var(--radius-md);
          object-fit: cover;
          background: var(--color-bg);
          flex-shrink: 0;
        }
        .v2-video-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.25rem;
          overflow: hidden;
        }
        .v2-video-card-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-heading, var(--color-text));
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .v2-video-card-meta {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .v2-skeleton-card {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .v2-skeleton-thumb {
          width: 120px;
          aspect-ratio: 16/9;
          border-radius: var(--radius-md);
          background: var(--color-border);
          animation: pulse 1.5s infinite;
        }
        .v2-skeleton-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.5rem;
        }
        .v2-skeleton-line {
          height: 0.75rem;
          background: var(--color-border);
          border-radius: var(--radius-sm);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ── Resumo panel ─────────────────────────────────────── */
        .v2-resumo-wrapper { padding-top: 1rem; }
        .v2-md-h1 { margin-top: 2rem; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700; color: var(--color-primary); }
        .v2-md-h2 { margin-top: 1.75rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
        .v2-md-h3 { margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 600; color: var(--color-primary); }
        .v2-md-p  { font-size: 1.0rem; line-height: 1.8; color: var(--color-text-muted); margin-bottom: 1rem; }
        .v2-md-ul { list-style: disc; padding-left: 1.5rem; margin: 1rem 0; color: var(--color-text-muted); }
        .v2-md-ol { list-style: decimal; padding-left: 1.5rem; margin: 1rem 0; color: var(--color-text-muted); }
        .v2-md-li { line-height: 1.7; margin-bottom: 0.4rem; }
        .v2-md-strong { font-weight: 600; color: var(--color-text); }
        .v2-md-em { font-style: italic; opacity: 0.8; }
        .v2-md-blockquote { border-left: 3px solid var(--color-primary); padding-left: 1.25rem; margin: 1.5rem 0; color: var(--color-text-muted); font-style: italic; }

        /* ── Flashcard panel ──────────────────────────────────── */
        .v2-fc-wrapper {
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .v2-fc-counter {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }
        /* 3-D flip card */
        .v2-fc-scene {
          width: 100%;
          max-width: 520px;
          perspective: 900px;
          cursor: pointer;
          user-select: none;
        }
        .v2-fc-card {
          position: relative;
          width: 100%;
          min-height: 200px;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .v2-fc-scene--flipped .v2-fc-card {
          transform: rotateY(180deg);
        }
        .v2-fc-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: var(--radius-xl);
          border: 1.5px solid var(--color-border);
          background: var(--color-cream);
          color: var(--color-navy);
          padding: 1.75rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-align: center;
          min-height: 200px;
        }
        .v2-fc-face--back {
          transform: rotateY(180deg);
          background: var(--color-navy);
          color: var(--color-white);

          border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
        .v2-fc-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: inherit;
          opacity: 0.7;
          border: 1px solid currentColor;
          border-radius: var(--radius-full);
          padding: 0.1rem 0.5rem;
          align-self: flex-start;
        }
        .v2-fc-badge--back {
          /* Reusing the same style since it inherits the white color now */
        }
        .v2-fc-text {
          font-size: 1rem;
          line-height: 1.65;
          color: inherit;
          font-weight: 600;
        }
        .v2-fc-hint {
          font-size: 0.72rem;
          color: inherit;
          opacity: 0.6;
          margin-top: 0.25rem;
        }
        .v2-fc-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* ── Questões panel ───────────────────────────────────── */
        .v2-q-wrapper { padding-top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .v2-q-header { display: flex; justify-content: space-between; align-items: center; }
        .v2-q-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); }
        .v2-q-counter { font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted); }
        .v2-q-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 1.25rem; }
        .v2-q-enunciado { font-size: 1rem; font-weight: 500; color: var(--color-heading, var(--color-text)); line-height: 1.6; }
        .v2-q-options { display: flex; flex-direction: column; gap: 0.6rem; }

        .v2-q-opt {
          display: grid;
          grid-template-columns: 2.25rem 1fr 1.25rem;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          text-align: left;
          cursor: pointer;
          transition: border-color var(--transition), background var(--transition);
          font-family: inherit;
        }
        .v2-q-opt:hover:not(:disabled) { border-color: var(--color-primary); }
        .v2-q-opt:disabled { cursor: default; }
        .v2-q-opt--selected { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); }
        .v2-q-opt--correct  { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface)); }
        .v2-q-opt--wrong    { border-color: var(--color-red); background: color-mix(in srgb, var(--color-red) 10%, var(--color-surface)); }

        .v2-q-letter {
          display: flex; align-items: center; justify-content: center;
          width: 2rem; height: 2rem;
          border-radius: var(--radius-md);
          font-weight: 700; font-size: 0.85rem;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          flex-shrink: 0;
          transition: background var(--transition), color var(--transition), border-color var(--transition);
        }
        .v2-q-letter--selected { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
        .v2-q-letter--correct  { background: var(--color-success); color: var(--color-white); border-color: var(--color-success); }
        .v2-q-letter--wrong    { background: var(--color-red); color: var(--color-white); border-color: var(--color-red); }
        .v2-q-opt-text { font-size: 0.9rem; line-height: 1.5; padding-top: 0.2rem; }
        .v2-q-icon { display: flex; align-items: center; justify-content: center; padding-top: 0.1rem; }
        .v2-icon-correct { color: var(--color-success); }
        .v2-icon-wrong   { color: var(--color-red); }

        /* Feedback */
        .v2-q-feedback {
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          min-height: 5rem;
          padding: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, opacity 0.25s ease, padding 0.3s ease;
          max-height: 0;
          opacity: 0;
        }
        .v2-q-feedback--correct, .v2-q-feedback--wrong {
          max-height: 400px;
          opacity: 1;
          padding: 1rem 1.25rem;
        }
        .v2-q-feedback--correct { background: color-mix(in srgb, var(--color-success) 10%, transparent); border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
        .v2-q-feedback--wrong   { background: color-mix(in srgb, var(--color-red) 10%, transparent); border-color: color-mix(in srgb, var(--color-red) 30%, transparent); }
        .v2-q-feedback--hidden  { max-height: 0; opacity: 0; padding: 0; }
        .v2-q-feedback-label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 0.5rem; }
        .v2-q-feedback-label--correct { color: var(--color-success); }
        .v2-q-feedback-label--wrong   { color: var(--color-red); }
        .v2-q-feedback-text { font-size: 0.9rem; line-height: 1.6; color: var(--color-text); }

        .v2-q-actions { display: flex; justify-content: flex-end; }

        /* End state */
        .v2-end-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2.5rem 1rem; text-align: center; }
        .v2-end-icon  { color: var(--color-success); }
        .v2-end-title { font-size: 1.35rem; font-weight: 700; color: var(--color-heading, var(--color-text)); }
        .v2-end-sub   { color: var(--color-text-muted); font-size: 0.95rem; }

        /* ── Buttons ──────────────────────────────────────────── */
        .v2-btn-primary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.5rem;
          border-radius: var(--radius-lg);
          background: var(--color-primary);
          color: var(--color-white); font-weight: 700; font-size: 0.9rem;
          border: none; cursor: pointer;
          transition: background var(--transition), opacity var(--transition);
          font-family: inherit;
        }
        .v2-btn-primary:hover { background: var(--color-primary-hover); }
        .v2-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .v2-btn-secondary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.5rem;
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          color: var(--color-text); font-weight: 700; font-size: 0.9rem;
          border: 1.5px solid var(--color-border); cursor: pointer;
          transition: background var(--transition), border-color var(--transition);
          font-family: inherit;
        }
        .v2-btn-secondary:hover { background: var(--color-border); }

        .v2-btn-outline {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.55rem 1rem;
          min-height: 44px;
          border-radius: var(--radius-lg);
          background: transparent;
          color: var(--color-text); font-weight: 600; font-size: 0.83rem;
          border: 1.5px solid var(--color-border); cursor: pointer;
          transition: border-color var(--transition), color var(--transition);
          font-family: inherit;
        }
        .v2-btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

        .v2-btn-ghost {
          background: none; border: none; cursor: pointer;
          color: var(--color-text-muted); font-size: 0.85rem; font-weight: 600;
          padding: 0.35rem 0.75rem; border-radius: var(--radius-md);
          transition: color var(--transition), background var(--transition);
          font-family: inherit;
        }
        .v2-btn-ghost:hover:not(:disabled) { color: var(--color-text); background: var(--color-border); }
        .v2-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Not found ────────────────────────────────────────── */
        .v2-not-found {
          min-height: 100dvh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1rem;
          font-family: var(--font-body); color: var(--color-text);
        }
      `}</style>

      <div className="v2-shell">
        {/* ── Topbar ──────────────────────────────────────────── */}
        <header className="v2-topbar">
          <div className="v2-topbar-inner">
            <button
              id="v2-back-btn"
              className="v2-back-btn"
              onClick={() => router.back()}
              aria-label="Voltar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h1 className="v2-topbar-title">{trilha.titulo}</h1>
          </div>
        </header>

        {/* ── Accordion main ──────────────────────────────────── */}
        <main className="v2-main">
          {SECTIONS.map(({ id: sId, label, Icon }) => {
            const isOpen = openSection === sId;
            let isCompleted = false;

            if (sId === "video") {
              isCompleted = !!selectedVideoByTrilha[trilha.id];
            } else if (sId === "resumo") {
              isCompleted = completedTopicIds.includes(`${trilha.id}-resumo`);
            } else if (sId === "flashcards") {
              isCompleted = completedTopicIds.includes(`${trilha.id}-flashcards`);
            } else if (sId === "questoes") {
              const qIds = activeQuestoes.map((q: any) => String(q.id));
              isCompleted = qIds.length > 0 && qIds.every((id: string) => progressData.answers[id] !== undefined);
            }

            return (
              <div
                key={sId}
                id={`v2-acc-${sId}`}
                className={`v2-acc-item${isOpen ? " v2-acc-item--open" : ""}`}
              >
                {/* Header / trigger */}
                <button
                  id={`v2-acc-trigger-${sId}`}
                  className="v2-acc-trigger"
                  onClick={() => toggle(sId)}
                  aria-expanded={isOpen}
                  aria-controls={`v2-acc-body-${sId}`}
                >
                  <span className="v2-acc-icon-wrap">
                    <Icon size={16} />
                  </span>
                  <span className="v2-acc-label">{label}</span>
                  {isCompleted && (
                    <CheckCircle2
                      size={18}
                      style={{ color: "var(--color-slate-blue)", marginRight: "0.5rem" }}
                      aria-label="Concluído"
                    />
                  )}
                  <ChevronDown size={18} className="v2-acc-chevron" />
                </button>

                {/* Body */}
                <div
                  id={`v2-acc-body-${sId}`}
                  role="region"
                  className={`v2-acc-body${isOpen ? " v2-acc-body--open" : ""}`}
                >
                  <div className="v2-acc-body-inner">
                    {/* ── VIDEO ──────────────────────────────── */}
                    {sId === "video" && (() => {
                      const activeVideoId = !forceGallery ? selectedVideoByTrilha[trilha.id] : null;
                      return (
                        <div className="v2-video-wrapper">
                          {activeVideoId ? (
                            <>
                              <div className="v2-video-iframe-box">
                                <iframe
                                  src={`https://www.youtube.com/embed/${activeVideoId}?rel=0&modestbranding=1&autoplay=1`}
                                  title="Video Player"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                              <button className="v2-btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => setForceGallery(true)}>
                                ← Ver outras opções
                              </button>
                            </>
                          ) : (
                            <div className="v2-video-gallery">
                              {!videoResultsCache[trilha.id] ? (
                                <>
                                  {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="v2-skeleton-card">
                                      <div className="v2-skeleton-thumb" />
                                      <div className="v2-skeleton-text">
                                        <div className="v2-skeleton-line" style={{ width: '90%' }} />
                                        <div className="v2-skeleton-line" style={{ width: '60%' }} />
                                        <div className="v2-skeleton-line" style={{ width: '40%' }} />
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                videoResultsCache[trilha.id].length > 0 ? (
                                  videoResultsCache[trilha.id].map((v: any) => (
                                    <div key={v.videoId} className="v2-video-card" onClick={() => {
                                      setSelectedVideo(trilha.id, v.videoId);
                                      setForceGallery(false);
                                    }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={v.thumbnail} alt={v.title} className="v2-video-thumb" />
                                      <div className="v2-video-info">
                                        <h4 className="v2-video-card-title">{v.title}</h4>
                                        <span className="v2-video-card-meta">{v.channelTitle} • {formatViews(v.viewCount)}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="v2-video-card" style={{ justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                                    <p className="v2-video-card-meta" style={{ fontSize: '0.9rem' }}>Não foi possível carregar sugestões de vídeo agora.</p>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── RESUMO ─────────────────────────────── */}
                    {sId === "resumo" && (
                      <div className="v2-resumo-wrapper">
                        {resumoStatus === "preparando" && (
                          <div>
                            <div className="v2-skeleton-card" style={{ flexDirection: 'column', padding: '1.5rem', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                              <div className="v2-skeleton-line" style={{ width: '40%', height: '1.5rem' }} />
                              <div className="v2-skeleton-line" style={{ width: '100%', height: '1rem' }} />
                              <div className="v2-skeleton-line" style={{ width: '95%', height: '1rem' }} />
                              <div className="v2-skeleton-line" style={{ width: '90%', height: '1rem' }} />
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.75rem' }}>
                              Preparando resumo teórico com inteligência artificial...
                            </p>
                          </div>
                        )}

                        {resumoStatus === "erro" && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-error)', fontSize: '0.9rem', maxWidth: '480px', lineHeight: 1.5 }}>
                              {resumoError || "Não foi possível gerar o resumo neste momento."}
                            </span>
                            <button className="v2-btn-outline" onClick={() => generateModule("resumo")}>
                              Tentar novamente
                            </button>
                          </div>
                        )}

                        {resumoStatus === "preparado" && (
                          activeResumoMarkdown ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {activeResumoMarkdown}
                            </ReactMarkdown>
                          ) : activeResumoText ? (
                            <p className="v2-md-p">{activeResumoText}</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 1rem' }}>
                              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nenhum resumo teórico disponível.</p>
                              <button className="v2-btn-outline" onClick={() => generateModule("resumo")}>
                                Gerar Resumo com IA ✨
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* ── FLASHCARDS ─────────────────────────── */}
                    {sId === "flashcards" && (
                      <FlashcardPanel
                        flashcards={activeFlashcards}
                        trilhaId={trilha.id}
                        status={flashcardsStatus}
                        errorMsg={flashcardsError}
                        onRetry={() => generateModule("flashcards")}
                        onGenerateMore={handleGenerateMoreFlashcards}
                        isGeneratingMore={isGeneratingMoreFc}
                        moreError={fcMoreError}
                        toggleTopicCompletion={toggleTopicCompletion}
                        completedTopicIds={completedTopicIds}
                      />
                    )}

                    {/* ── QUESTÕES ───────────────────────────── */}
                    {sId === "questoes" && (
                      <QuestoesPanel
                        questoes={activeQuestoes}
                        topicoId={trilha.id}
                        status={questoesStatus}
                        errorMsg={questoesError}
                        onRetry={() => generateModule("questoes")}
                        onGenerateMore={handleGenerateMoreQuestoes}
                        isGeneratingMore={isGeneratingMoreQ}
                        moreError={qMoreError}
                        registerAnswer={registerAnswer}
                        toggleTopicCompletion={toggleTopicCompletion}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </main>
      </div>
    </>
  );
}
