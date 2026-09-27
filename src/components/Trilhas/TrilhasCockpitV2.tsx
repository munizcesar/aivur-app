"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Link2, FileText, BookMarked, AlertCircle } from "lucide-react";
import { useStudyStore, type GenerationStatus } from "@/store/useStudyStore";
import type { TrilhaSourceType } from "@/mocks/trilhasMock";
import { TrilhaSchema } from "@/lib/validations/trilha";

// ─── Generation step labels ───────────────────────────────────────────────────
const STEP_LABELS: Record<GenerationStatus, string> = {
  idle:               "",
  extracting_context: "Analisando o contexto do edital…",
  structuring_data:   "Estruturando flashcards e questões…",
  finalizing:         "Finalizando e validando a trilha…",
  error:              "Erro ao gerar. Tente novamente.",
};

const STEP_ORDER: GenerationStatus[] = [
  "extracting_context",
  "structuring_data",
  "finalizing",
];

// ─── Source detection ─────────────────────────────────────────────────────────
function detectSource(input: string): TrilhaSourceType {
  if (/^https?:\/\/(www\.)?youtu(be\.com|\.be)/i.test(input.trim())) return "youtube";
  if (/youtu\.be|youtube\.com/i.test(input)) return "youtube";
  if (input.trim().length > 500) return "edital";
  if (/^https?:\/\//i.test(input.trim())) return "text";
  return "text";
}

// ─── Spinner component ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span
      role="status"
      aria-label="Carregando"
      style={{
        display: "inline-block",
        width: "1.1rem",
        height: "1.1rem",
        border: "2.5px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "ckv2-spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ status }: { status: GenerationStatus }) {
  const currentIdx = STEP_ORDER.indexOf(status);
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {STEP_ORDER.map((step, i) => (
        <span
          key={step}
          style={{
            width: i === currentIdx ? "1.5rem" : "0.45rem",
            height: "0.45rem",
            borderRadius: "999px",
            background:
              i < currentIdx
                ? "var(--color-primary)"
                : i === currentIdx
                ? "var(--color-primary)"
                : "var(--color-border)",
            opacity: i > currentIdx ? 0.4 : 1,
            transition: "all 0.35s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Source badge helper ──────────────────────────────────────────────────────
const SOURCE_ICONS: Record<TrilhaSourceType, React.ElementType> = {
  youtube: Link2,
  text:    FileText,
  edital:  BookMarked,
  system:  Sparkles,
};

// ─── Main Cockpit ─────────────────────────────────────────────────────────────
export default function TrilhasCockpitV2() {
  const router = useRouter();
  const { generationStatus, setGenerationStatus, generationError, setGenerationError, addCustomTrilha } = useStudyStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const detectedSource = detectSource(inputValue);
  const SourceIcon = SOURCE_ICONS[detectedSource];

  const isGenerating = generationStatus !== "idle" && generationStatus !== "error";
  const hasContent   = inputValue.trim().length > 0;

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, resizeTextarea]);

  // Prevent submit on Enter (allow Shift+Enter for newlines)
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!hasContent || isGenerating) return;

      // Step 1 — visual feedback imediato antes do fetch
      setGenerationStatus("extracting_context");

      // Avança para step 2 após 600ms (simula leitura de contexto)
      const step2Timer = setTimeout(() => setGenerationStatus("structuring_data"), 600);

      try {
        const res = await fetch("/api/trilhas/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input:      inputValue.trim(),
            titulo:     inputTitle.trim() || undefined,
            sourceType: detectedSource,
          }),
        });

        clearTimeout(step2Timer);
        setGenerationStatus("finalizing");

        if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
        if (res.status === 429) throw new Error("Limite de gerações atingido. Aguarde e tente novamente.");
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(errJson.error || `Erro ${res.status} na geração.`);
        }

        const raw = await res.json();

        // ── ACOPLAMENTO ZOD (client-side guard) ───────────────────────────────
        // Valida o payload retornado pela API antes de injetar no Zustand.
        // Protege contra respostas malformadas que possam corromper o estado global.
        const parsed = TrilhaSchema.safeParse(raw);
        if (!parsed.success) {
          console.error("[CockpitV2] Client-side Zod validation failed:", parsed.error.issues);
          throw new Error("Trilha gerada com formato inválido. Tente novamente.");
        }

        // Persiste no store local (fallback offline + acesso imediato na rota)
        addCustomTrilha(parsed.data);
        setGenerationStatus("idle");
        router.push(`/trilhas/${parsed.data.id}`);
      } catch (err: any) {
        clearTimeout(step2Timer);
        console.error("[CockpitV2] Generation failed:", err);
        setGenerationStatus("error");
        setGenerationError(err?.message ?? "Erro desconhecido. Tente novamente.");
        // Auto-reset para idle após 5s — libera o form sem recarregar a página
        setTimeout(() => { setGenerationStatus("idle"); setGenerationError(null); }, 5000);
      }
    },
    [hasContent, isGenerating, inputValue, inputTitle, detectedSource, setGenerationStatus, setGenerationError, addCustomTrilha, router]
  );

  return (
    <>
      <style>{`
        @keyframes ckv2-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ckv2-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ckv2-shell {
          min-height: 100dvh;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem 5rem;
          font-family: var(--font-body, system-ui, sans-serif);
        }
        .ckv2-center {
          width: 100%;
          max-width: 660px;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          animation: ckv2-fadein 0.45s ease;
        }
        .ckv2-headline {
          text-align: center;
        }
        .ckv2-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-primary);
          border: 1.5px solid var(--color-primary);
          border-radius: 999px;
          padding: 0.25rem 0.75rem;
          margin-bottom: 1.25rem;
        }
        .ckv2-title {
          font-size: clamp(1.8rem, 5vw, 2.75rem);
          font-weight: 800;
          color: var(--color-heading, var(--color-text));
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
        }
        .ckv2-sub {
          font-size: 1rem;
          color: var(--color-text-muted);
          line-height: 1.65;
          margin: 0;
          max-width: 480px;
          margin-inline: auto;
        }
        .ckv2-card {
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 1.5rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 4px 24px -6px rgba(0,0,0,0.08);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .ckv2-card:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent),
                      0 4px 24px -6px rgba(0,0,0,0.08);
        }
        .ckv2-title-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-heading, var(--color-text));
          font-family: inherit;
          padding: 0;
          border-bottom: 1.5px solid var(--color-border);
          padding-bottom: 0.75rem;
        }
        .ckv2-title-input::placeholder { color: var(--color-text-muted); font-weight: 500; }
        .ckv2-textarea {
          width: 100%;
          resize: none;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.975rem;
          line-height: 1.7;
          color: var(--color-text);
          font-family: inherit;
          min-height: 6rem;
          max-height: 320px;
          overflow-y: auto;
          field-sizing: content;
        }
        .ckv2-textarea::placeholder { color: var(--color-text-muted); }
        .ckv2-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .ckv2-source-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
          border-radius: 999px;
          padding: 0.2rem 0.6rem;
          transition: opacity 0.2s;
        }
        .ckv2-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.7rem 1.4rem;
          border-radius: 0.9rem;
          font-size: 0.9rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          background: var(--color-primary);
          color: #fff;
          min-width: 9rem;
        }
        .ckv2-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
        }
        .ckv2-btn:not(:disabled):hover { opacity: 0.88; transform: translateY(-1px); }
        .ckv2-btn:not(:disabled):active { transform: scale(0.97); }
        .ckv2-feedback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 1.25rem;
          animation: ckv2-fadein 0.3s ease;
        }
        .ckv2-feedback-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .ckv2-feedback-label {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          text-align: center;
        }
        .ckv2-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-error, #C41230);
          padding: 0.75rem 1rem;
          background: color-mix(in srgb, var(--color-error, #C41230) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-error, #C41230) 25%, transparent);
          border-radius: 0.75rem;
          animation: ckv2-fadein 0.25s ease;
        }
        .ckv2-skeleton-bar {
          height: 0.65rem;
          border-radius: 999px;
          background: var(--color-border);
          animation: ckv2-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ckv2-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      <div className="ckv2-shell">
        <div className="ckv2-center">

          {/* ── Headline ── */}
          <div className="ckv2-headline">
            <span className="ckv2-eyebrow">
              <Sparkles size={12} />
              Cockpit de Geração
            </span>
            <h1 className="ckv2-title">
              Sua próxima trilha,<br />
              <span style={{ color: "var(--color-primary)" }}>em segundos.</span>
            </h1>
            <p className="ckv2-sub">
              Cole um link do YouTube, texto de edital ou qualquer conteúdo.<br />
              A IA gera flashcards e questões automaticamente.
            </p>
          </div>

          {/* ── Input Card ── */}
          {!isGenerating && (
            <form onSubmit={handleSubmit}>
              <div className="ckv2-card">
                <input
                  id="ckv2-title-input"
                  className="ckv2-title-input"
                  type="text"
                  placeholder="Título da trilha (opcional)"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  disabled={isGenerating}
                  maxLength={120}
                  autoComplete="off"
                />
                <textarea
                  id="ckv2-main-input"
                  ref={textareaRef}
                  className="ckv2-textarea"
                  placeholder="Cole aqui o link do YouTube, trecho do edital ou texto que deseja transformar em trilha…"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); resizeTextarea(); }}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  aria-label="Conteúdo para geração de trilha"
                />
                <div className="ckv2-toolbar">
                  {hasContent && (
                    <span className="ckv2-source-badge">
                      <SourceIcon size={11} />
                      {detectedSource === "youtube"  && "YouTube"}
                      {detectedSource === "edital"   && "Edital"}
                      {detectedSource === "text"     && "Texto"}
                      {detectedSource === "system"   && "Sistema"}
                    </span>
                  )}
                  {!hasContent && <span />}
                  <button
                    id="ckv2-generate-btn"
                    type="submit"
                    className="ckv2-btn"
                    disabled={!hasContent || isGenerating}
                    aria-label="Gerar trilha estratégica com IA"
                  >
                    <Sparkles size={16} />
                    Gerar Trilha
                  </button>
                </div>
              </div>

              {/* Error toast — mensagem granular do servidor, auto-dismiss em 5s */}
              {generationStatus === "error" && (
                <div
                  className="ckv2-error"
                  role="alert"
                  aria-live="assertive"
                  id="ckv2-error-toast"
                >
                  <AlertCircle size={16} />
                  {generationError ?? STEP_LABELS.error}
                </div>
              )}
            </form>
          )}

          {/* ── Generation Feedback (Progressive) ── */}
          {isGenerating && (
            <div className="ckv2-feedback" role="status" aria-live="polite">
              <div className="ckv2-feedback-row">
                <Spinner />
                <span>{STEP_LABELS[generationStatus]}</span>
              </div>
              <ProgressDots status={generationStatus} />
              <p className="ckv2-feedback-label">
                Isso costuma levar entre 5 e 15 segundos. Não feche a tela.
              </p>
              {/* Skeleton placeholder cards */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div className="ckv2-skeleton-bar" style={{ width: `${85 - i * 12}%` }} />
                    <div className="ckv2-skeleton-bar" style={{ width: `${65 - i * 8}%`, opacity: 0.6 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
