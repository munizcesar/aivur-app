"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import styles from "./Material.module.css";
import Header from "@/components/Header/Header";
import { useAivoStore } from "@/store/useAivoStore";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Info,
  BookOpen,
  HelpCircle,
  Layers,
} from "lucide-react";
import {
  MATERIAL_LIMITS,
  evaluateContentLimits,
} from "@/lib/validations/material";
import {
  validatePDFFile,
  extractPDFContent,
} from "@/utils/materialExtractor";
import {
  MaterialGeneratedContentSchema,
  type MaterialGeneratedContent,
} from "@/lib/validations/material-ai";
import FlashcardsTool from "./FlashcardsTool";
import QuizTool from "./QuizTool";

type InputMode = "pdf" | "texto";
type StudyTab = "resumo" | "flashcards" | "questoes";

interface ValidatedMaterial {
  origem: InputMode;
  titulo: string;
  conteudo: string;
  nomeArquivo?: string;
  tamanhoBytes?: number;
  paginas?: number;
  caracteres: number;
}

interface AiErrorState {
  code: number;
  message: string;
}

export default function MaterialPage() {
  const [inputMode, setInputMode] = useState<InputMode>("pdf");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Estado para texto colado
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  // Estado para material verificado e pronto para conferência (Fase 1)
  const [verifiedMaterial, setVerifiedMaterial] = useState<ValidatedMaterial | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Estados de IA e Estudo Ativo (Fase 2, Passo 2.3)
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<AiErrorState | null>(null);
  const [generatedContent, setGeneratedContent] = useState<MaterialGeneratedContent | null>(null);
  const [activeStudyTab, setActiveStudyTab] = useState<StudyTab>("resumo");

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef(false);
  const [, startTransition] = useTransition();

  // Sincroniza o contexto do Meu Material com o AIVU (Regra Estrita de Ancoragem)
  useEffect(() => {
    if (verifiedMaterial) {
      const activeTabLabel =
        activeStudyTab === "resumo"
          ? "Resumo Estruturado"
          : activeStudyTab === "flashcards"
          ? "Revisão com Flashcards"
          : "Caderno de Questões";

      useAivoStore.getState().setActiveContext({
        pathname: "/material",
        modulo: "material",
        atividade: "estudando_material",
        titulo: verifiedMaterial.titulo,
        disciplina: "Meu Material",
        trecho_foco: verifiedMaterial.conteudo.slice(0, 1500),
        metadados: {
          origem: verifiedMaterial.origem,
          abaAtiva: activeTabLabel,
          totalCaracteres: String(verifiedMaterial.caracteres),
        },
      });
    } else {
      useAivoStore.getState().setActiveContext(null);
    }

    return () => {
      useAivoStore.getState().setActiveContext(null);
    };
  }, [verifiedMaterial, activeStudyTab]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const processUploadedFile = async (file: File) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setInfoMessage(null);
    setAiError(null);

    const validationError = validatePDFFile(file);
    if (validationError) {
      setErrorMessage(validationError.message);
      return;
    }

    setIsExtracting(true);
    setInfoMessage("Lendo e extraindo o texto das páginas do PDF...");

    try {
      const buffer = await file.arrayBuffer();
      const outcome = await extractPDFContent(buffer);

      if (!outcome.success) {
        setErrorMessage(outcome.error.message);
        setInfoMessage(null);
        return;
      }

      const { text, pageCount, charCount, isTooLong } = outcome.data;
      const docTitle = file.name.replace(/\.pdf$/i, "").trim() || "Material de Estudo";

      if (charCount < MATERIAL_LIMITS.MIN_CHARS) {
        setErrorMessage(
          `Conteúdo insuficiente: apenas ${charCount} caracteres extraídos das ${pageCount} página(s). O mínimo exigido nesta etapa é de ${MATERIAL_LIMITS.MIN_CHARS} caracteres.`
        );
        setInfoMessage(null);
        return;
      }

      if (isTooLong) {
        setWarningMessage(
          `Documento extenso: o PDF possui ${charCount.toLocaleString("pt-BR")} caracteres em ${pageCount} página(s), excedendo o teto de ${MATERIAL_LIMITS.MAX_CHARS.toLocaleString("pt-BR")} caracteres desta etapa. O conteúdo NÃO foi truncado silenciosamente. Para processar trechos específicos, utilize a aba "Colar Texto".`
        );
      }

      setVerifiedMaterial({
        origem: "pdf",
        titulo: docTitle,
        conteudo: text,
        nomeArquivo: file.name,
        tamanhoBytes: file.size,
        paginas: pageCount,
        caracteres: charCount,
      });

      setInfoMessage(null);
    } catch (err: any) {
      setErrorMessage(`Erro inesperado ao processar o arquivo: ${err?.message || "Falha na leitura."}`);
      setInfoMessage(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleValidatePastedText = () => {
    setErrorMessage(null);
    setWarningMessage(null);
    setAiError(null);

    const feedback = evaluateContentLimits(pastedText);
    if (!feedback.isValid) {
      setErrorMessage(feedback.message);
      return;
    }

    const docTitle = pastedTitle.trim() || "Texto de Estudo";

    startTransition(() => {
      setVerifiedMaterial({
        origem: "texto",
        titulo: docTitle,
        conteudo: pastedText.trim(),
        caracteres: feedback.charCount,
      });
    });
  };

  const handleReset = () => {
    isGeneratingRef.current = false;
    setVerifiedMaterial(null);
    setGeneratedContent(null);
    setAiError(null);
    setIsGenerating(false);
    setActiveStudyTab("resumo");
    setErrorMessage(null);
    setWarningMessage(null);
    setInfoMessage(null);
    setPastedText("");
    setPastedTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyText = async () => {
    if (!verifiedMaterial) return;
    try {
      await navigator.clipboard.writeText(verifiedMaterial.conteudo);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleGenerateAI = async () => {
    if (isGeneratingRef.current || isGenerating || !verifiedMaterial) return;

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/material/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: verifiedMaterial.titulo,
          conteudo: verifiedMaterial.conteudo,
          disciplina: "Geral",
          metadados: {
            origem: verifiedMaterial.origem,
            totalCaracteresMaterial: verifiedMaterial.caracteres,
            tipoExtracao: "recorte",
            nomeArquivo: verifiedMaterial.nomeArquivo,
            paginas: verifiedMaterial.paginas,
          },
        }),
      });

      if (res.status === 401) {
        setAiError({
          code: 401,
          message: "Sua sessão expirou ou é inválida. Faça login para continuar gerando materiais com IA.",
        });
        return;
      }

      if (res.status === 429) {
        setAiError({
          code: 429,
          message: "Limite temporário de requisições excedido. Por favor, aguarde alguns instantes antes de tentar novamente.",
        });
        return;
      }

      if (res.status === 422) {
        setAiError({
          code: 422,
          message: "Não foi possível estruturar o material gerado pela IA no formato pedagógico necessário. Tente novamente.",
        });
        return;
      }

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        setAiError({
          code: res.status,
          message: errorData?.error || "O serviço de IA está temporariamente indisponível. Tente novamente mais tarde.",
        });
        return;
      }

      const json = await res.json();
      const validation = MaterialGeneratedContentSchema.safeParse(json);

      if (!validation.success) {
        setAiError({
          code: 500,
          message: "A resposta da IA não respeitou o contrato pedagógico do sistema.",
        });
        return;
      }

      setGeneratedContent(validation.data);
      setActiveStudyTab("resumo");
    } catch (err: any) {
      setAiError({
        code: 0,
        message: "Erro de conexão ao comunicar com o serviço de IA. Verifique sua rede e tente novamente.",
      });
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  const pastedFeedback = evaluateContentLimits(pastedText);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {/* ESTADO 3: STUDIO DE ESTUDO ATIVO GERADO PELA IA */}
        {generatedContent ? (
          <div className={styles.studioContainer} style={{ marginTop: "1.5rem" }}>
            <div className={styles.studioHeaderCard}>
              <div>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-slate-blue)", fontWeight: 700 }}>
                  Meu Material · Síntese de Estudo Ativo
                </span>
                <h1 className={styles.studioTitle}>{generatedContent.titulo}</h1>
                <div className={styles.studioMetaRow}>
                  <span className={styles.statBadge}>
                    📚 {generatedContent.disciplina}
                  </span>
                  <span className={styles.statBadge}>
                    🔤 {generatedContent.escopoProcessado.caracteresProcessados.toLocaleString("pt-BR")} caracteres
                  </span>
                  <span className={styles.statBadge} style={{ color: "#34D399", borderColor: "rgba(52, 211, 153, 0.4)" }}>
                    <CheckCircle2 size={14} className="shrink-0 flex-none" />
                    {generatedContent.escopoProcessado.cobertura === "recorte" ? "Recorte Pedagógico" : "Integral"}
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleReset}
                >
                  <RotateCcw size={16} className="shrink-0 flex-none" /> Importar Outro Material
                </button>
              </div>
            </div>

            {/* NAVEGAÇÃO ENTRE AS FERRAMENTAS DE ESTUDO */}
            <div className={styles.studyTabsNav} role="tablist" aria-label="Ferramentas de Estudo">
              <button
                type="button"
                role="tab"
                aria-selected={activeStudyTab === "resumo"}
                className={`${styles.studyTabBtn} ${activeStudyTab === "resumo" ? styles.studyTabBtnActive : ""}`}
                onClick={() => setActiveStudyTab("resumo")}
              >
                <BookOpen size={16} className="shrink-0 flex-none" /> Resumo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeStudyTab === "flashcards"}
                className={`${styles.studyTabBtn} ${activeStudyTab === "flashcards" ? styles.studyTabBtnActive : ""}`}
                onClick={() => setActiveStudyTab("flashcards")}
              >
                <Layers size={16} className="shrink-0 flex-none" /> Flashcards ({generatedContent.flashcards.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeStudyTab === "questoes"}
                className={`${styles.studyTabBtn} ${activeStudyTab === "questoes" ? styles.studyTabBtnActive : ""}`}
                onClick={() => setActiveStudyTab("questoes")}
              >
                <HelpCircle size={16} className="shrink-0 flex-none" /> Questões ({generatedContent.questoes.length})
              </button>
            </div>

            {/* CONTEÚDO DA FERRAMENTA ATIVA */}
            <div className={styles.studioContentCard}>
              {activeStudyTab === "resumo" && (
                <div className={styles.summaryContainer}>
                  <div className={styles.themeCallout}>
                    <div className={styles.themeLabel}>Tema Central Fundamentado</div>
                    <div className={styles.themeText}>{generatedContent.resumo.tema_central}</div>
                  </div>

                  <div className={styles.keyPointsSection}>
                    <h3 className={styles.sectionHeading}>Pontos-Chave Extraídos</h3>
                    <div className={styles.keyPointsGrid}>
                      {generatedContent.resumo.pontos_chave.map((ponto, idx) => (
                        <div key={idx} className={styles.keyPointItem}>
                          <CheckCircle2 size={16} className="shrink-0 flex-none" style={{ color: "#10B981", marginTop: "0.2rem" }} />
                          <span>{ponto}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.keyPointsSection}>
                    <h3 className={styles.sectionHeading}>Síntese Conceitual Estruturada</h3>
                    <div className={styles.markdownBox}>
                      {generatedContent.resumo.conteudo_markdown}
                    </div>
                  </div>
                </div>
              )}

              {activeStudyTab === "flashcards" && (
                <FlashcardsTool flashcards={generatedContent.flashcards} />
              )}

              {activeStudyTab === "questoes" && (
                <QuizTool questoes={generatedContent.questoes} />
              )}
            </div>
          </div>
        ) : !verifiedMaterial ? (
          /* ESTADO 1: FORMULÁRIO DE IMPORTAÇÃO */
          <div className={styles.uploadContainer} style={{ marginTop: "2rem" }}>
            <div className={styles.heroHeader}>
              <div className={styles.heroTextCol}>
                <h1 className={styles.title}>Cofre Editorial</h1>
                <p className={styles.subtitle}>
                  Importe seu PDF ou cole seu material de estudo para conferência e validação antes do processamento.
                </p>
              </div>
              <div className={styles.heroImageCol}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src="/images/aivur/material.png" alt="Aivur Cofre 3D" />
              </div>
            </div>

            <div className={styles.inputModeNav} role="tablist" aria-label="Modo de Importação">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "pdf"}
                className={`${styles.modeNavBtn} ${inputMode === "pdf" ? styles.modeNavBtnActive : ""}`}
                onClick={() => {
                  setInputMode("pdf");
                  setErrorMessage(null);
                  setWarningMessage(null);
                }}
              >
                <UploadCloud size={18} className="shrink-0 flex-none" /> Upload de PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "texto"}
                className={`${styles.modeNavBtn} ${inputMode === "texto" ? styles.modeNavBtnActive : ""}`}
                onClick={() => {
                  setInputMode("texto");
                  setErrorMessage(null);
                  setWarningMessage(null);
                }}
              >
                <FileText size={18} className="shrink-0 flex-none" /> Colar Texto
              </button>
            </div>

            {errorMessage && (
              <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
                <AlertCircle size={20} className="shrink-0 flex-none" />
                <div>
                  <strong>Não foi possível importar o material:</strong>
                  <div>{errorMessage}</div>
                </div>
              </div>
            )}

            {warningMessage && (
              <div className={`${styles.alertBox} ${styles.alertWarning}`} role="alert">
                <AlertTriangle size={20} className="shrink-0 flex-none" />
                <div>{warningMessage}</div>
              </div>
            )}

            {infoMessage && (
              <div className={`${styles.alertBox} ${styles.alertInfo}`} role="status">
                <Loader2 size={20} className={`shrink-0 flex-none ${styles.spinner}`} />
                <div>{infoMessage}</div>
              </div>
            )}

            {inputMode === "pdf" && (
              <div
                ref={dropzoneRef}
                className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Área para soltar arquivo PDF ou clicar para selecionar"
              >
                <div className={styles.dropzoneInner} style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
                  {isExtracting ? (
                    <>
                      <Loader2 size={48} className={`shrink-0 flex-none ${styles.spinner} ${styles.dropIcon}`} />
                      <h3>Extraindo texto do documento...</h3>
                      <p>Lendo páginas e verificando camada de texto selecionável.</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={48} className={`shrink-0 flex-none ${styles.dropIcon}`} />
                      <h3>Arraste seu arquivo PDF aqui</h3>
                      <p>Formatos suportados: apenas arquivos .pdf com texto selecionável (máximo 10MB)</p>
                      <button
                        type="button"
                        className={styles.browseBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Procurar Arquivo PDF
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={isExtracting}
                  />
                </div>
              </div>
            )}

            {inputMode === "texto" && (
              <div className={styles.pasteArea}>
                <div>
                  <label htmlFor="material-title" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-cream)", marginBottom: "0.4rem" }}>
                    Título do Material (opcional)
                  </label>
                  <input
                    id="material-title"
                    type="text"
                    className={styles.titleInput}
                    placeholder="Ex: Direito Constitucional - Direitos Fundamentais (Art. 5º)"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    maxLength={120}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <label htmlFor="material-text" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-cream)" }}>
                      Texto do Material *
                    </label>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-slate-blue)" }}>
                      Mínimo de 100 e máximo de 8.000 caracteres
                    </span>
                  </div>
                  <textarea
                    id="material-text"
                    className={styles.textAreaInput}
                    placeholder="Cole aqui o texto do seu resumo, apostila, anotações de aula ou artigo..."
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                </div>

                <div className={styles.charCounterRow}>
                  <div>
                    {pastedText.length === 0 && (
                      <span className={`${styles.counterBadge} ${styles.counterNormal}`}>
                        Aguardando texto...
                      </span>
                    )}
                    {pastedFeedback.status === "too_short" && (
                      <span className={`${styles.counterBadge} ${styles.counterWarn}`}>
                        <AlertTriangle size={14} className="shrink-0 flex-none" />
                        Faltam {MATERIAL_LIMITS.MIN_CHARS - pastedFeedback.charCount} caracteres para o mínimo
                      </span>
                    )}
                    {pastedFeedback.status === "valid" && (
                      <span className={`${styles.counterBadge} ${styles.counterValid}`}>
                        <CheckCircle2 size={14} className="shrink-0 flex-none" />
                        Tamanho ideal para conferência
                      </span>
                    )}
                    {pastedFeedback.status === "too_long" && (
                      <span className={`${styles.counterBadge} ${styles.counterError}`}>
                        <AlertCircle size={14} className="shrink-0 flex-none" />
                        Excede em {pastedFeedback.charCount - MATERIAL_LIMITS.MAX_CHARS} caracteres
                      </span>
                    )}
                  </div>

                  <span
                    className={`${styles.counterBadge} ${
                      pastedFeedback.status === "valid"
                        ? styles.counterValid
                        : pastedFeedback.status === "too_long"
                        ? styles.counterError
                        : styles.counterNormal
                    }`}
                  >
                    {pastedFeedback.charCount.toLocaleString("pt-BR")} / {MATERIAL_LIMITS.MAX_CHARS.toLocaleString("pt-BR")} caracteres
                  </span>
                </div>

                <div className={styles.actionBlock} style={{ marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleValidatePastedText}
                    disabled={!pastedFeedback.isValid}
                    style={{ opacity: pastedFeedback.isValid ? 1 : 0.6, cursor: pastedFeedback.isValid ? "pointer" : "not-allowed" }}
                  >
                    Validar e Visualizar Texto
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ESTADO 2: CONFERÊNCIA E PRÉVIA DO MATERIAL IMPORTADO */
          <div className={styles.uploadContainer} style={{ marginTop: "2rem" }}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div>
                  <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-slate-blue)", fontWeight: 700 }}>
                    Conferência de Importação
                  </span>
                  <h2 className={styles.previewTitle}>{verifiedMaterial.titulo}</h2>
                </div>

                <div className={styles.badgeList}>
                  {verifiedMaterial.origem === "pdf" ? (
                    <>
                      <span className={styles.statBadge}>
                        <FileText size={14} className="shrink-0 flex-none" />
                        {verifiedMaterial.nomeArquivo}
                      </span>
                      {verifiedMaterial.paginas && (
                        <span className={styles.statBadge}>
                          📖 {verifiedMaterial.paginas} página(s) lidas
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.statBadge}>
                      ✍️ Texto Colado
                    </span>
                  )}
                  <span className={styles.statBadge}>
                    🔤 {verifiedMaterial.caracteres.toLocaleString("pt-BR")} caracteres
                  </span>
                  <span className={`${styles.statBadge}`} style={{ color: "#34D399", borderColor: "rgba(52, 211, 153, 0.4)" }}>
                    <CheckCircle2 size={14} className="shrink-0 flex-none" />
                    Validado
                  </span>
                </div>
              </div>

              {warningMessage && (
                <div className={`${styles.alertBox} ${styles.alertWarning}`} role="alert">
                  <AlertTriangle size={20} className="shrink-0 flex-none" />
                  <div>{warningMessage}</div>
                </div>
              )}

              {aiError && (
                <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
                  <AlertCircle size={20} className="shrink-0 flex-none" />
                  <div>
                    <strong>Não foi possível gerar o estudo pedagógico:</strong>
                    <div>{aiError.message}</div>
                    {aiError.code === 401 && (
                      <a href="/login?redirect=/material" className={styles.loginLinkBtn}>
                        Fazer Login
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-cream)" }}>
                    Texto Extraído / Fornecido:
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleCopyText}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                  >
                    {hasCopied ? (
                      <>
                        <Check size={14} className="shrink-0 flex-none" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="shrink-0 flex-none" /> Copiar Texto
                      </>
                    )}
                  </button>
                </div>
                <div className={styles.previewTextContent}>
                  {verifiedMaterial.conteudo}
                </div>
              </div>

              <div className={styles.phaseBanner}>
                <Info size={18} className="shrink-0 flex-none" />
                <span>
                  <strong>Fase 1 Concluída:</strong> O material foi lido, extraído e validado no navegador. Nenhuma chamada de IA ou persistência em banco foi disparada nesta etapa.
                </span>
              </div>

              <div className={styles.previewActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  <RotateCcw size={16} className="shrink-0 flex-none" /> Importar Outro Material
                </button>

                <button
                  type="button"
                  className={styles.generateBtn}
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className={`shrink-0 flex-none ${styles.spinner}`} />
                      Sintetizando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="shrink-0 flex-none" />
                      Sintetizar com IA (Resumo, Flashcards e Questões)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
