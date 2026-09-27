"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Link2,
  FileUp,
  PenLine,
  AlertCircle,
  Upload,
  X,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useStudyStore, type GenerationStatus } from "@/store/useStudyStore";
import { TrilhaSchema } from "@/lib/validations/trilha";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEP_LABELS: Record<GenerationStatus, string> = {
  idle:               "",
  extracting_context: "Lendo e extraindo o contexto…",
  structuring_data:   "Estruturando flashcards e questões…",
  finalizing:         "Validando e finalizando a trilha…",
  error:              "Algo deu errado. Tente novamente.",
};

const STEP_ORDER: GenerationStatus[] = [
  "extracting_context",
  "structuring_data",
  "finalizing",
];

// ─── Tab types ────────────────────────────────────────────────────────────────
type InputTab = "link" | "pdf" | "text";

interface TabDef {
  id: InputTab;
  label: string;
  Icon: React.ElementType;
  placeholder: string;
}

const TABS: TabDef[] = [
  { id: "link", label: "Link",   Icon: Link2,    placeholder: "Cole um link do YouTube ou qualquer URL…" },
  { id: "pdf",  label: "PDF",    Icon: FileUp,   placeholder: "" },
  { id: "text", label: "Texto",  Icon: PenLine,  placeholder: "Cole o texto do edital, apostila ou anotações…" },
];

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className="inline-block w-[1.1rem] h-[1.1rem] border-[2.5px] border-current border-t-transparent rounded-full animate-spin shrink-0"
    />
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ status }: { status: GenerationStatus }) {
  const idx = STEP_ORDER.indexOf(status);
  const pct = idx === -1 ? 0 : Math.round(((idx + 1) / STEP_ORDER.length) * 100);
  return (
    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--color-primary), var(--color-ai))",
        }}
      />
    </div>
  );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────
function PdfDropzone({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped?.type === "application/pdf") onFile(dropped);
    },
    [disabled, onFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0] ?? null;
      if (picked?.type === "application/pdf") onFile(picked);
      e.target.value = "";
    },
    [onFile]
  );

  return (
    <div
      id="ckv2-dropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Área de upload de PDF. Clique ou arraste um arquivo."
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      className={[
        "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed",
        "min-h-[180px] cursor-pointer select-none transition-all duration-200 group",
        isDragging
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]"
          : "border-white/20 hover:border-[var(--color-primary)]/60 hover:bg-white/5",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={handleChange}
        disabled={disabled}
      />

      {file ? (
        <>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 max-w-[90%]">
            <FileText size={20} className="shrink-0 text-[var(--color-primary)]" />
            <span className="text-sm font-semibold text-white/90 truncate">{file.name}</span>
            <span className="text-xs text-white/50 shrink-0">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
            aria-label="Remover arquivo"
          >
            <X size={13} />
            Remover
          </button>
        </>
      ) : (
        <>
          <div className={[
            "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200",
            "bg-white/5 border border-white/10 group-hover:bg-[var(--color-primary)]/15 group-hover:border-[var(--color-primary)]/30",
            isDragging ? "bg-[var(--color-primary)]/20 border-[var(--color-primary)]/40 scale-110" : "",
          ].join(" ")}>
            <Upload size={24} className={isDragging ? "text-[var(--color-primary)]" : "text-white/40 group-hover:text-[var(--color-primary)]"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/80">
              {isDragging ? "Solte o arquivo aqui" : "Arraste ou clique para enviar"}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Apenas arquivos PDF • Máx. 10 MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Cockpit ─────────────────────────────────────────────────────────────
export default function TrilhasCockpitV2() {
  const router = useRouter();
  const {
    generationStatus,
    setGenerationStatus,
    generationError,
    setGenerationError,
    addCustomTrilha,
  } = useStudyStore();

  const [activeTab, setActiveTab]   = useState<InputTab>("link");
  const [inputValue, setInputValue]  = useState("");
  const [inputTitle, setInputTitle]  = useState("");
  const [pdfFile, setPdfFile]        = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isGenerating = generationStatus !== "idle" && generationStatus !== "error";

  const hasContent =
    activeTab === "pdf"
      ? pdfFile !== null
      : inputValue.trim().length > 0;

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, []);

  useEffect(() => { resizeTextarea(); }, [inputValue, resizeTextarea]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!hasContent || isGenerating) return;

      setGenerationStatus("extracting_context");
      const step2Timer = setTimeout(() => setGenerationStatus("structuring_data"), 800);

      try {
        let res: Response;

        if (activeTab === "pdf" && pdfFile) {
          // ── FormData path (PDF upload) ────────────────────────────────────
          const fd = new FormData();
          fd.append("file", pdfFile);
          if (inputTitle.trim()) fd.append("titulo", inputTitle.trim());
          fd.append("sourceType", "edital");

          res = await fetch("/api/trilhas/generate", {
            method: "POST",
            // Content-Type omitido intencionalmente — browser define multipart/form-data + boundary
            body: fd,
          });
        } else {
          // ── JSON path (link / texto livre) ────────────────────────────────
          res = await fetch("/api/trilhas/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input:      inputValue.trim(),
              titulo:     inputTitle.trim() || undefined,
              sourceType: activeTab === "link" ? "youtube" : "text",
            }),
          });
        }

        clearTimeout(step2Timer);
        setGenerationStatus("finalizing");

        if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
        if (res.status === 429) throw new Error("Limite de gerações atingido. Aguarde e tente novamente.");

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error || `Erro ${res.status} na geração.`);
        }

        const raw = await res.json();

        // ── ACOPLAMENTO ZOD (client-side guard) ───────────────────────────
        // Barreira final antes de injetar no store global.
        const parsed = TrilhaSchema.safeParse(raw);
        if (!parsed.success) {
          console.error("[CockpitV2] Zod client validation failed:", parsed.error.issues);
          throw new Error("Trilha gerada com formato inválido. Tente novamente.");
        }

        addCustomTrilha(parsed.data);
        setGenerationStatus("idle");
        router.push(`/trilhas/${parsed.data.id}`);
      } catch (err: unknown) {
        clearTimeout(step2Timer);
        const msg = err instanceof Error ? err.message : "Erro desconhecido.";
        console.error("[CockpitV2] Generation failed:", err);
        setGenerationStatus("error");
        setGenerationError(msg);
        setTimeout(() => { setGenerationStatus("idle"); setGenerationError(null); }, 5000);
      }
    },
    [
      hasContent, isGenerating, activeTab, inputValue, inputTitle, pdfFile,
      setGenerationStatus, setGenerationError, addCustomTrilha, router,
    ]
  );

  return (
    <>
      {/* ── Scoped CSS ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes ckv2-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes ckv2-glow-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.75; }
        }
        @keyframes ckv2-fadein-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ckv2-mascot { animation: ckv2-float 4.5s ease-in-out infinite; }
        .ckv2-glow   { animation: ckv2-glow-pulse 3s ease-in-out infinite; }
        .ckv2-fadein { animation: ckv2-fadein-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ckv2-panel {
          background: linear-gradient(
            145deg,
            rgba(10, 46, 69, 0.72) 0%,
            rgba(10, 46, 69, 0.55) 100%
          );
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06) inset,
            0 32px 64px rgba(0,0,0,0.35),
            0 8px 24px rgba(0,0,0,0.25);
        }
        .ckv2-tab {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1rem;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: 0.625rem;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.45);
          transition: color 0.18s, background 0.18s;
          white-space: nowrap;
        }
        .ckv2-tab:hover   { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.06); }
        .ckv2-tab--active { color: #fff; background: rgba(255,255,255,0.12); }
        .ckv2-tab--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%; transform: translateX(-50%);
          width: 60%; height: 2px;
          border-radius: 2px;
          background: var(--color-primary);
        }
        .ckv2-input-base {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-body, system-ui, sans-serif);
          color: rgba(255,255,255,0.90);
          caret-color: var(--color-primary);
        }
        .ckv2-input-base::placeholder { color: rgba(255,255,255,0.28); }
        .ckv2-title-field {
          font-size: 0.95rem;
          font-weight: 600;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 0.1rem;
        }
        .ckv2-textarea {
          resize: none;
          font-size: 0.92rem;
          line-height: 1.75;
          min-height: 5.5rem;
          max-height: 280px;
          overflow-y: auto;
        }
        .ckv2-btn-generate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.75rem;
          border-radius: 0.875rem;
          font-size: 0.92rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, var(--color-primary) 0%, #B54D39 100%);
          box-shadow: 0 4px 18px -4px rgba(217,107,84,0.55);
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .ckv2-btn-generate:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none; }
        .ckv2-btn-generate:not(:disabled):hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(217,107,84,0.5); }
        .ckv2-btn-generate:not(:disabled):active { transform: scale(0.97); }
        .ckv2-feedback-card {
          background: rgba(10, 46, 69, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.25rem;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          text-align: center;
          animation: ckv2-fadein-up 0.35s ease both;
        }
        .ckv2-error-toast {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          background: rgba(196, 18, 48, 0.85);
          border: 1px solid rgba(196, 18, 48, 0.4);
          border-radius: 0.75rem;
          backdrop-filter: blur(8px);
          animation: ckv2-fadein-up 0.25s ease both;
        }
        .ckv2-skel {
          height: 0.55rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          animation: ckv2-skel-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ckv2-skel-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .ckv2-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--color-primary);
          border: 1.5px solid rgba(217,107,84,0.35);
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          background: rgba(217,107,84,0.1);
        }
      `}</style>

      {/* ── Page Shell ───────────────────────────────────────────────────── */}
      <div
        className="relative min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center px-4 py-16"
        style={{
          background: "linear-gradient(160deg, #091422 0%, #0E1F30 45%, #0A1018 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="ckv2-glow pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(217,107,84,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[350px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(10,46,69,0.6) 0%, transparent 70%)" }}
        />

        {/* ── Main flex layout: mascot + panel ─────────────────────────── */}
        <div className="relative z-10 w-full max-w-[1040px] flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ckv2-fadein">

          {/* ── Mascot column ───────────────────────────────────────────── */}
          <div className="flex flex-col items-center lg:items-end gap-4 lg:w-[320px] shrink-0">
            <div className="ckv2-mascot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/aivur/trilhas.png"
                alt="Aivo, o assistente de trilhas da AIVUR"
                width={280}
                height={280}
                className="w-[200px] sm:w-[240px] lg:w-[280px] h-auto object-contain drop-shadow-2xl"
              />
            </div>
            {/* Mascot speech bubble */}
            <div
              className="hidden lg:block px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-medium text-white/80 max-w-[240px] text-center leading-snug"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
              }}
            >
              Cole um edital, link ou texto e eu monto sua trilha de estudos! 🎯
            </div>
          </div>

          {/* ── Cockpit Panel ────────────────────────────────────────────── */}
          <div className="ckv2-panel rounded-3xl w-full max-w-[600px] p-6 sm:p-8 flex flex-col gap-5">

            {/* Header */}
            <div className="flex flex-col gap-2">
              <span className="ckv2-chip">
                <Sparkles size={11} />
                Cockpit de Geração
              </span>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight m-0"
                style={{ color: "#fff", fontFamily: "var(--font-display, system-ui)" }}
              >
                Gere sua trilha{" "}
                <span style={{ color: "var(--color-primary)" }}>em segundos.</span>
              </h1>
            </div>

            {!isGenerating ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Title field */}
                <input
                  id="ckv2-title"
                  type="text"
                  className="ckv2-input-base ckv2-title-field"
                  placeholder="Título da trilha (opcional — a IA sugere um automaticamente)"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  maxLength={120}
                  autoComplete="off"
                  disabled={isGenerating}
                />

                {/* Tab bar */}
                <div
                  className="flex items-center gap-1 p-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  role="tablist"
                  aria-label="Tipo de entrada"
                >
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      id={`ckv2-tab-${t.id}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === t.id}
                      aria-controls={`ckv2-panel-${t.id}`}
                      onClick={() => { setActiveTab(t.id); setInputValue(""); setPdfFile(null); }}
                      className={`ckv2-tab ${activeTab === t.id ? "ckv2-tab--active" : ""}`}
                    >
                      <t.Icon size={13} className="shrink-0 flex-none" />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div className="flex flex-col gap-3 min-h-[140px]">
                  {/* Link tab */}
                  {activeTab === "link" && (
                    <div
                      id="ckv2-panel-link"
                      role="tabpanel"
                      aria-labelledby="ckv2-tab-link"
                      className="ckv2-fadein"
                    >
                      <textarea
                        id="ckv2-input-link"
                        ref={textareaRef}
                        className="ckv2-input-base ckv2-textarea w-full"
                        placeholder={TABS[0].placeholder}
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); resizeTextarea(); }}
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating}
                        aria-label="URL do YouTube ou link"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* PDF tab */}
                  {activeTab === "pdf" && (
                    <div
                      id="ckv2-panel-pdf"
                      role="tabpanel"
                      aria-labelledby="ckv2-tab-pdf"
                      className="ckv2-fadein"
                    >
                      <PdfDropzone
                        file={pdfFile}
                        onFile={setPdfFile}
                        disabled={isGenerating}
                      />
                    </div>
                  )}

                  {/* Text tab */}
                  {activeTab === "text" && (
                    <div
                      id="ckv2-panel-text"
                      role="tabpanel"
                      aria-labelledby="ckv2-tab-text"
                      className="ckv2-fadein"
                    >
                      <textarea
                        id="ckv2-input-text"
                        ref={textareaRef}
                        className="ckv2-input-base ckv2-textarea w-full"
                        placeholder={TABS[2].placeholder}
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); resizeTextarea(); }}
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating}
                        aria-label="Texto livre para geração de trilha"
                        rows={5}
                      />
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                {/* Footer toolbar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-white/35 leading-snug max-w-[220px]">
                    A IA lê o conteúdo e monta flashcards + questões automaticamente.
                  </p>
                  <button
                    id="ckv2-generate-btn"
                    type="submit"
                    className="ckv2-btn-generate"
                    disabled={!hasContent || isGenerating}
                    aria-label="Gerar trilha estratégica com IA"
                  >
                    <Sparkles size={16} className="shrink-0 flex-none" />
                    Gerar Trilha
                    <ChevronRight size={15} className="shrink-0 flex-none opacity-70" />
                  </button>
                </div>

                {/* Error toast */}
                {generationStatus === "error" && (
                  <div className="ckv2-error-toast" role="alert" aria-live="assertive" id="ckv2-error-toast">
                    <AlertCircle size={16} className="shrink-0 flex-none" />
                    {generationError ?? STEP_LABELS.error}
                  </div>
                )}
              </form>
            ) : (
              /* ── Generation feedback ──────────────────────────────────── */
              <div className="ckv2-feedback-card">
                <Spinner />
                <div className="flex flex-col gap-1 w-full">
                  <p className="text-sm font-semibold text-white/85">
                    {STEP_LABELS[generationStatus]}
                  </p>
                  <ProgressBar status={generationStatus} />
                </div>
                <p className="text-xs text-white/35">
                  Isso leva entre 8 e 20 segundos. Não feche a janela.
                </p>
                {/* Skeleton cards */}
                <div className="w-full flex flex-col gap-2.5 mt-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="ckv2-skel" style={{ width: `${88 - i * 14}%` }} />
                      <div className="ckv2-skel" style={{ width: `${68 - i * 10}%`, opacity: 0.6 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
