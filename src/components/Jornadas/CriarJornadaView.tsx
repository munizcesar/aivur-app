"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FileText,
  UploadCloud,
  AlertCircle,
  FolderCheck,
  Compass,
  RefreshCw,
} from "lucide-react";
import type { JornadaEmentaType } from "@/lib/validations/jornada";
import EmentaReviewModal from "./EmentaReviewModal";

async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function CriarJornadaView() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [banca, setBanca] = useState("");
  const [cargo, setCargo] = useState("");
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"text" | "pdf">("text");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [extractedEmenta, setExtractedEmenta] = useState<JornadaEmentaType | null>(null);
  const [docHash, setDocHash] = useState("");
  const [ementaHash, setEmentaHash] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [partialResumption, setPartialResumption] = useState<{
    bloco_inicio: number;
    total_blocos?: number;
    edital_hash: string;
    conteudo_parcial: JornadaEmentaType;
    originalText: string;
    disciplinasCount: number;
  } | null>(null);

  const handleProcessEdital = async (
    e?: React.FormEvent,
    forceResumption?: boolean
  ) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError("Preencha o título do concurso.");
      return;
    }
    if (!text.trim() && !file && !partialResumption) {
      setError("Cole o texto do conteúdo programático ou envie o arquivo PDF do edital.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let rawText = text.trim();

      if (file && (!partialResumption || !forceResumption)) {
        if (file.type !== "application/pdf") {
          throw new Error("Apenas arquivos PDF são aceitos.");
        }

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((it: any) => it.str).join(" ") + "\n";
        }
        rawText = fullText.trim();
      }

      const textForAi = rawText.length > 15000 ? rawText.slice(0, 15000) : rawText;

      const isResuming = Boolean(
        forceResumption ||
        (partialResumption && partialResumption.originalText === textForAi)
      );

      const effectiveText =
        isResuming && partialResumption ? partialResumption.originalText : textForAi;

      if (effectiveText.length < 50) {
        throw new Error(
          "Conteúdo insuficiente do edital. O texto deve ter pelo menos 50 caracteres de matérias e tópicos."
        );
      }

      // Calcula os hashes criptográficos para rastreabilidade e idempotência
      const calculatedDocHash = await sha256Hex(effectiveText);
      const normalizedForHash = effectiveText.toLowerCase().replace(/\s+/g, " ").trim();
      const calculatedEmentaHash = await sha256Hex(normalizedForHash);

      setDocHash(calculatedDocHash);
      setEmentaHash(calculatedEmentaHash);

      const requestPayload: any = {
        title: title.trim(),
        text: effectiveText,
        banca: banca.trim() || undefined,
        cargo: cargo.trim() || undefined,
        ano: Number(ano) || undefined,
      };

      if (isResuming && partialResumption) {
        requestPayload.bloco_inicio = partialResumption.bloco_inicio;
        requestPayload.edital_hash = partialResumption.edital_hash;
        requestPayload.conteudo_parcial = partialResumption.conteudo_parcial;
      }

      const res = await fetch("/api/ai/gerar-jornada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/jornadas/novo");
          return;
        }

        const errJson = (await res.json().catch(() => ({}))) as any;

        // Se o servidor retornou conteúdo parcial (status 422), preserva para retomada
        if (
          res.status === 422 &&
          errJson.conteudo_parcial &&
          Array.isArray(errJson.conteudo_parcial.disciplinas) &&
          errJson.conteudo_parcial.disciplinas.length > 0 &&
          (errJson.edital_hash || errJson.conteudo_parcial.edital_hash)
        ) {
          const nextBlock = errJson.etapa_falha?.bloco_indice || 2;
          const hash = errJson.edital_hash || errJson.conteudo_parcial.edital_hash;

          setPartialResumption({
            bloco_inicio: nextBlock,
            total_blocos: errJson.etapa_falha?.total_blocos,
            edital_hash: hash,
            conteudo_parcial: errJson.conteudo_parcial,
            originalText: effectiveText,
            disciplinasCount: errJson.conteudo_parcial.disciplinas.length,
          });

          setError(
            errJson.error ||
            `A estruturação foi interrompida na seção ${nextBlock}. Você pode tentar novamente para retomar de onde parou.`
          );
          return;
        }

        throw new Error(errJson.error || "Falha ao analisar edital.");
      }

      // Sucesso na extração total ou na retomada completa
      setPartialResumption(null);
      const ementaData = (await res.json()) as JornadaEmentaType;
      setExtractedEmenta(ementaData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar o edital.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = async (finalEmenta: JornadaEmentaType) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        ...finalEmenta,
        edital_fonte_tipo: inputType === "pdf" ? ("PDF" as const) : ("TEXTO" as const),
        edital_nome_arquivo: file?.name || undefined,
        doc_original_hash: docHash,
        ementa_hash: ementaHash,
      };

      const res = await fetch("/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/jornadas/novo");
          return;
        }
        const errJson = (await res.json().catch(() => ({}))) as any;
        throw new Error(errJson.error || "Erro ao salvar jornada no banco de dados.");
      }

      const created = (await res.json()) as { id: string };
      router.push(`/jornadas/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-[var(--color-border)]">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2">
            <Compass size={14} /> Jornada de Edital
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] m-0">
            Importar Edital Completo
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
            Transforme o conteúdo programático do concurso em um roteiro diário estruturado, tópico por tópico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/trilhas")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-heading)] transition-colors"
        >
          <FolderCheck size={16} /> Voltar para trilhas
        </button>
      </div>

      {partialResumption && (
        <div
          data-testid="jornada-resumption-banner"
          className="mb-6 p-5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 flex-none mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold text-amber-100 m-0">
                Estruturação parcial preservada ({partialResumption.disciplinasCount} matéria{partialResumption.disciplinasCount > 1 ? "s" : ""} salva{partialResumption.disciplinasCount > 1 ? "s" : ""})
              </p>
              <p className="text-xs text-amber-300/80 mt-1 m-0">
                {error ||
                  `O processamento foi interrompido na seção ${partialResumption.bloco_inicio}. Você pode retomar de onde parou sem perder o progresso já analisado.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="btn-retry-jornada"
              disabled={isLoading}
              onClick={() => handleProcessEdital(undefined, true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={`shrink-0 flex-none ${isLoading ? "animate-spin" : ""}`} />
              <span>Tentar novamente</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setPartialResumption(null);
                setError(null);
              }}
              className="px-3 py-2 rounded-xl border border-amber-800 hover:bg-amber-900/50 text-amber-300 text-xs font-semibold transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {error && !partialResumption && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 flex-none mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleProcessEdital} className="space-y-6">
        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--color-heading)] m-0">
            1. Dados Básicos do Concurso
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Nome do Concurso ou Órgão *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (partialResumption) setPartialResumption(null);
                }}
                placeholder="Ex: TJ-SP — Escrevente Técnico Judiciário"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                Banca Examinadora (Opcional)
              </label>
              <input
                type="text"
                value={banca}
                onChange={(e) => {
                  setBanca(e.target.value);
                  if (partialResumption) setPartialResumption(null);
                }}
                placeholder="Ex: VUNESP, Cebraspe, FGV"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => {
                    setCargo(e.target.value);
                    if (partialResumption) setPartialResumption(null);
                  }}
                  placeholder="Ex: Escrevente"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                  Ano
                </label>
                <input
                  type="number"
                  value={ano}
                  onChange={(e) => {
                    setAno(Number(e.target.value));
                    if (partialResumption) setPartialResumption(null);
                  }}
                  min={2020}
                  max={2035}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-heading)] m-0">
              2. Conteúdo Programático
            </h2>
            <div className="flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-bg)]">
              <button
                type="button"
                onClick={() => setInputType("text")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  inputType === "text"
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-heading)]"
                }`}
              >
                Colar Texto
              </button>
              <button
                type="button"
                onClick={() => setInputType("pdf")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  inputType === "pdf"
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-heading)]"
                }`}
              >
                Upload PDF
              </button>
            </div>
          </div>

          {inputType === "text" ? (
            <div>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (partialResumption) setPartialResumption(null);
                }}
                rows={9}
                placeholder="Cole aqui o trecho do edital contendo as disciplinas e tópicos (ex: Língua Portuguesa, Direito Constitucional...)"
                className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-heading)] text-sm focus:outline-none focus:border-[var(--color-primary)] leading-relaxed font-mono text-xs"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Dica: Para maior precisão, copie e cole apenas a seção de Conteúdos Programáticos / Conhecimentos Básicos e Específicos.
              </p>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-xl text-center flex flex-col items-center justify-center bg-[var(--color-bg)]">
              <UploadCloud size={36} className="text-[var(--color-text-muted)] mb-2" />
              <label className="cursor-pointer font-bold text-sm text-[var(--color-primary)] hover:underline">
                <span>Clique para selecionar o PDF do edital</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    if (partialResumption) setPartialResumption(null);
                  }}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="mt-2 text-xs font-semibold text-[var(--color-heading)] flex items-center gap-1.5">
                  <FileText size={14} /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[#6B0000] text-white text-base font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span>
              {partialResumption
                ? "Retomando estruturação do edital..."
                : "Analisando e Estruturando o Edital com IA..."}
            </span>
          ) : partialResumption ? (
            <>
              <RefreshCw size={18} className="shrink-0 flex-none" />
              <span>Retomar da Seção {partialResumption.bloco_inicio} (Tentar novamente)</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="shrink-0 flex-none" />
              <span>Estruturar Ementa do Edital</span>
            </>
          )}
        </button>
      </form>

      {/* Modal de Revisão Humana antes da gravação */}
      {extractedEmenta && (
        <EmentaReviewModal
          initialEmenta={extractedEmenta}
          docOriginalHash={docHash}
          editalFonteTipo={inputType === "pdf" ? "PDF" : "TEXTO"}
          editalNomeArquivo={file?.name}
          onConfirm={handleConfirmSave}
          onCancel={() => setExtractedEmenta(null)}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}
    </div>
  );
}
