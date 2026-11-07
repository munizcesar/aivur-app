// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAivoStore } from "@/store/useAivoStore";
import { useQuizStore } from "@/store/useQuizStore";
import { Aivo } from "./AivoMascot";
import { X, Send, Paperclip, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./AivoWidget.module.css";
import {
  formatPdfFileSize,
  validatePdfMetadata,
  validatePdfSignature,
  extractPdfTextInBrowser,
} from "@/lib/aivu-pdf";

const aivuMarkdownComponents: Components = {
  p: ({ children }) => <p className={styles.mdParagraph}>{children}</p>,
  h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
  h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
  h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
  strong: ({ children }) => <strong className={styles.mdStrong}>{children}</strong>,
  em: ({ children }) => <em className={styles.mdEm}>{children}</em>,
  ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
  ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
  li: ({ children }) => <li className={styles.mdLi}>{children}</li>,
  blockquote: ({ children }) => <blockquote className={styles.mdBlockquote}>{children}</blockquote>,
  pre: ({ children }) => <pre className={styles.mdPre}>{children}</pre>,
  code: ({ children, className }) => {
    const isBlock = Boolean(className) || (typeof children === "string" && children.includes("\n"));
    return isBlock ? (
      <code className={styles.mdCodeBlock}>{children}</code>
    ) : (
      <code className={styles.mdInlineCode}>{children}</code>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.mdLink}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className={styles.mdTableWrap}>
      <table className={styles.mdTable}>{children}</table>
    </div>
  ),
  th: ({ children }) => <th className={styles.mdTh}>{children}</th>,
  td: ({ children }) => <td className={styles.mdTd}>{children}</td>,
  hr: () => <hr className={styles.mdHr} />,
};

import ActionProposalCard from "./ActionProposalCard";
import { CopyMessageButton } from "./CopyMessageButton";
import {
  prepareAivuChatPayload,
  type AivuActionProposal,
  type AivuCitation,
} from "@/lib/validations/aivu-chat";

export default function AivoWidget() {
  const pathname = usePathname();
  const {
    state,
    messages,
    isOpen,
    targetAnchor,
    isSending,
    activeContext,
    activeDocument,
    setIsOpen,
    addMessage,
    updateMessageProposal,
    setState,
    setIsSending,
    setActiveDocument,
  } = useAivoStore();
  const isDrawerOpen = useQuizStore(s => s.isDrawerOpen);
  const quizModeActive = useQuizStore(s => s.step === 3 && s.mode !== 'redacao' && s.mode !== 'aivos360'); 

  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationWarning, setFileValidationWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [viewportAdjustment, setViewportAdjustment] = useState<{
    keyboardOffset: number;
    visualHeight: number | null;
  }>({ keyboardOffset: 0, visualHeight: null });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileValidationWarning(null);

    const metaError = validatePdfMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (metaError) {
      setFileValidationWarning(metaError.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const slice = await file.slice(0, 1024).arrayBuffer();
      if (!validatePdfSignature(slice)) {
        setFileValidationWarning("O arquivo selecionado não é um documento PDF válido ou sua assinatura está corrompida.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } catch {
      setFileValidationWarning("Falha ao ler os dados do arquivo selecionado.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileValidationWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateDevice = () => setIsMobile(window.innerWidth <= 768);
    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  // Ajuste automático de altura do textarea (44px inicial até ~110px máximo)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const isLandscape = typeof window !== "undefined" && window.innerHeight <= 500;
    const minH = isLandscape ? 40 : 44;
    const maxH = isLandscape ? 80 : 110;
    const scrollHeight = ta.scrollHeight;
    const clampedHeight = Math.min(Math.max(scrollHeight, minH), maxH);
    ta.style.height = `${clampedHeight}px`;
    ta.style.overflowY = scrollHeight > maxH ? "auto" : "hidden";
  }, [inputValue, isOpen]);

  // Acompanha a abertura do teclado virtual no mobile para ajustar ancoragem e altura máxima disponível
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (!vv) return;
      // Aplica ajustes de teclado virtual exclusivamente a dispositivos mobile (largura <= 768px)
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        setViewportAdjustment({ keyboardOffset: 0, visualHeight: null });
        return;
      }
      const offset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
      setViewportAdjustment({
        keyboardOffset: offset,
        visualHeight: vv.height,
      });
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);
    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

  const clearRecoveryTimer = () => {
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  };

  // Cleanup de timer ao desmontar componente
  useEffect(() => {
    return () => {
      clearRecoveryTimer();
    };
  }, []);

  // Sincroniza visibilidade: fecha a janela de chat quando o drawer abre, evitando conflito visual
  useEffect(() => {
    if (isDrawerOpen) {
      setIsOpen(false);
    }
  }, [isDrawerOpen, setIsOpen]);

  // Scroll to bottom restrained exclusively to the internal chatBody container
  useEffect(() => {
    if (isOpen && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if ((!text && !selectedFile) || isSendingRef.current) return;
    
    clearRecoveryTimer();
    isSendingRef.current = true;
    setIsSending(true);

    if (selectedFile) {
      const fileToUpload = selectedFile;
      const displayText = text || "Analise o edital em anexo e elabore uma proposta de Jornada de Estudos.";
      setState('thinking');

      // 1. Extração no navegador via PDF.js e Web Worker local (/pdf.worker.min.mjs)
      const extraction = await extractPdfTextInBrowser(fileToUpload);

      if (!extraction.success) {
        // Falha recuperável: preserva o arquivo selecionado para nova tentativa sem perda de estado
        isSendingRef.current = false;
        setIsSending(false);
        clearRecoveryTimer();
        setState('error');
        addMessage({
          sender: 'aivo',
          text: extraction.error.message,
        });
        recoveryTimerRef.current = setTimeout(() => {
          setState('idle');
          recoveryTimerRef.current = null;
        }, 4000);
        return;
      }

      // Extração com sucesso: desanexa o arquivo do chip, registra na sessão e limpa input
      setSelectedFile(null);
      setFileValidationWarning(null);
      setInputValue("");
      setActiveDocument({
        name: extraction.data.fileName,
        text: extraction.data.text,
        size: extraction.data.fileSizeBytes,
        pageCount: extraction.data.pageCount,
        fonte: "PDF",
      });

      addMessage({
        sender: 'user',
        text: displayText,
        fileAttachment: {
          name: extraction.data.fileName,
          size: extraction.data.fileSizeBytes,
          pageCount: extraction.data.pageCount,
        },
      });

      // 2. Prepara o payload JSON com o material extraído e metadados informativos
      const preparedPayload = prepareAivuChatPayload({
        text: displayText,
        material_text: extraction.data.text,
        file_info: {
          name: extraction.data.fileName,
          size: extraction.data.fileSizeBytes,
          pageCount: extraction.data.pageCount,
          fonte: "PDF",
        },
        messages,
        activeContext,
        pathname,
      });

      try {
        const response = await fetch("/api/ai/aivu/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preparedPayload),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            reply: string;
            state?: string;
            actionProposal?: AivuActionProposal;
            citations?: AivuCitation[];
          };
          addMessage({
            sender: 'aivo',
            text: data.reply,
            actionProposal: data.actionProposal,
            citations: data.citations,
          });
          clearRecoveryTimer();
          setState('speaking');
          recoveryTimerRef.current = setTimeout(() => {
            setState('idle');
            recoveryTimerRef.current = null;
          }, 3500);
        } else {
          const errData = await response.json().catch(() => ({}));
          let userFacingError = errData.error;
          if (!userFacingError) {
            if (response.status === 401) {
              userFacingError = "Por favor, faça login para conversar com o AIVU.";
            } else if (response.status === 429) {
              userFacingError = "Limite de mensagens atingido. Por favor, aguarde alguns instantes.";
            } else {
              userFacingError = "Instabilidade temporária no processamento do edital. Tente novamente.";
            }
          }
          addMessage({ sender: 'aivo', text: userFacingError });
          clearRecoveryTimer();
          setState('error');
          recoveryTimerRef.current = setTimeout(() => {
            setState('idle');
            recoveryTimerRef.current = null;
          }, 3000);
        }
      } catch {
        addMessage({
          sender: 'aivo',
          text: "Erro de conexão ao enviar os dados para o AIVU. Verifique sua internet e tente novamente.",
        });
        clearRecoveryTimer();
        setState('error');
        recoveryTimerRef.current = setTimeout(() => {
          setState('idle');
          recoveryTimerRef.current = null;
        }, 3000);
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
      return;
    }

    // Fluxo convencional de texto
    addMessage({ sender: 'user', text });

    // Se o usuário colou diretamente um material/edital extenso no chat, mantém na sessão ativa
    if (text.length >= 250) {
      setActiveDocument({
        name: "Material Colado no Chat",
        text: text.slice(0, 40000),
        size: text.length,
        pageCount: 1,
        fonte: "TEXTO",
      });
    }

    // Prepara o payload defensivo separando message, material_text e history sumarizado
    const payload = prepareAivuChatPayload({
      text,
      activeDocument,
      messages,
      activeContext,
      pathname,
    });

    try {
      const response = await fetch("/api/ai/aivu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          reply: string;
          state?: string;
          actionProposal?: AivuActionProposal;
          citations?: AivuCitation[];
        };
        addMessage({
          sender: 'aivo',
          text: data.reply,
          actionProposal: data.actionProposal,
          citations: data.citations,
        });
        clearRecoveryTimer();
        setState('speaking');
        recoveryTimerRef.current = setTimeout(() => {
          setState('idle');
          recoveryTimerRef.current = null;
        }, 3500);
      } else {
        const errData = await response.json().catch(() => ({}));
        let userFacingError = errData.error;
        if (!userFacingError) {
          if (response.status === 401) {
            userFacingError = "Por favor, faça login para conversar com o AIVU.";
          } else if (response.status === 429) {
            userFacingError = "Limite de mensagens atingido. Por favor, aguarde alguns instantes.";
          } else {
            userFacingError = "Instabilidade temporária na comunicação. Tente novamente.";
          }
        }

        // Restaura o texto do usuário para não perder a mensagem em caso de falha
        setInputValue(text);
        addMessage({ sender: 'aivo', text: userFacingError });
        clearRecoveryTimer();
        setState('error');
        recoveryTimerRef.current = setTimeout(() => {
          setState('idle');
          recoveryTimerRef.current = null;
        }, 3000);
      }
    } catch {
      // Restaura o texto do usuário para não perder a mensagem em caso de erro de rede
      setInputValue(text);
      addMessage({
        sender: 'aivo',
        text: "Erro de conexão ao falar com o AIVU. Verifique sua internet e tente novamente.",
      });
      clearRecoveryTimer();
      setState('error');
      recoveryTimerRef.current = setTimeout(() => {
        setState('idle');
        recoveryTimerRef.current = null;
      }, 3000);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.nativeEvent.isComposing && !isSendingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine classes based on context
  let containerClass = styles.defaultPos;
  let mascotState = state;
  let size = isMobile ? 64 : 72;

  if (targetAnchor === 'drawer') {
    containerClass = styles.inDrawer;
    size = 40;
  } else if (quizModeActive) {
    containerClass = styles.minimized;
    size = isMobile ? 42 : 48;
    mascotState = 'sleepy'; // Doesn't distract
  }

  // Estilo dinâmico para teclado virtual mobile (evita extrapolação de altura e protege o desktop)
  const mobileKeyboardStyle: React.CSSProperties | undefined =
    viewportAdjustment.keyboardOffset > 0 && typeof window !== "undefined" && window.innerWidth <= 768
      ? {
          bottom: `${viewportAdjustment.keyboardOffset + 12}px`,
          maxHeight: viewportAdjustment.visualHeight
            ? `${Math.max(0, Math.min(520, viewportAdjustment.visualHeight - 24))}px`
            : undefined,
        }
      : undefined;

  return (
    <div className={`${styles.widgetContainer} ${containerClass}`}>
      <AnimatePresence>
        {isOpen && !isDrawerOpen && !targetAnchor && !quizModeActive && (
          <motion.div 
            className={styles.chatPanel}
            style={mobileKeyboardStyle}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatTitleGroup}>
                <div className={styles.chatTitle}>
                  <span className={styles.brandBadge}>AIVU</span>
                  <span className={styles.statusIndicator} aria-hidden="true" />
                </div>
                <div className={styles.chatSubtitle}>Assistente de Estudos</div>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Fechar chat">
                <X width={18} height={18} />
              </button>
            </div>
            
            <div ref={chatBodyRef} className={styles.chatBody}>
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'aivo' || msg.sender === 'aivu';
                const messageClass = `${styles.message} ${styles[msg.sender] || (msg.sender === 'user' ? styles.user : styles.aivo)}`;
                return (
                  <div key={msg.id} className={messageClass}>
                    {isAssistant ? (
                      <>
                        <div className={styles.messageContent}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={aivuMarkdownComponents}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                        {isAssistant && msg.citations && msg.citations.length > 0 && (
                          <div
                            className={styles.citationsWrap}
                            role="region"
                            aria-label="Fontes consultadas no documento"
                            data-testid="aivu-citations"
                          >
                            <div className={styles.citationsHeader}>
                              <FileText size={13} className="shrink-0 flex-none" />
                              <span>Fontes consultadas ({msg.citations.length})</span>
                            </div>
                            <div className={styles.citationsList}>
                              {msg.citations.map((cit, idx) => (
                                <div key={idx} className={styles.citationCard}>
                                  <div className={styles.citationMeta}>
                                    <span className={styles.citationSource} title={cit.source}>
                                      {cit.source}
                                    </span>
                                    <span className={styles.citationPageBadge}>
                                      {cit.page ? `Pág. ${cit.page}` : "Pág. N/I"}
                                    </span>
                                  </div>
                                  {cit.section && (
                                    <div className={styles.citationSection}>{cit.section}</div>
                                  )}
                                  <p className={styles.citationExcerpt}>“{cit.excerpt}”</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {isAssistant && msg.actionProposal && (
                          <ActionProposalCard
                            proposal={msg.actionProposal}
                            onUpdate={(updated) => updateMessageProposal(msg.id, updated)}
                          />
                        )}
                        <div className={styles.messageFooter}>
                          <CopyMessageButton text={msg.text} />
                        </div>
                      </>
                    ) : (
                      <>
                        {msg.fileAttachment && (
                          <div className={styles.attachedDocCard}>
                            <FileText size={16} className="shrink-0 flex-none text-[#F8FAFC]" />
                            <div className={styles.attachedDocInfo}>
                              <span className={styles.attachedDocName}>{msg.fileAttachment.name}</span>
                              <span className={styles.attachedDocMeta}>
                                {formatPdfFileSize(msg.fileAttachment.size)}
                              </span>
                            </div>
                          </div>
                        )}
                        {msg.text}
                      </>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {fileValidationWarning && (
              <div className={styles.fileWarningBar} role="alert">
                <AlertCircle size={14} className="shrink-0 flex-none" />
                <span className={styles.fileWarningText}>{fileValidationWarning}</span>
                <button
                  type="button"
                  className={styles.fileWarningClose}
                  onClick={() => setFileValidationWarning(null)}
                  aria-label="Fechar aviso de arquivo"
                >
                  <X size={12} className="shrink-0 flex-none" />
                </button>
              </div>
            )}

            {selectedFile && (
              <div className={styles.selectedFileBar}>
                <FileText size={15} className="shrink-0 flex-none text-[var(--aivu-header-sparkle)]" />
                <span className={styles.selectedFileName} title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className={styles.selectedFileSize}>
                  ({formatPdfFileSize(selectedFile.size)})
                </span>
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={handleRemoveFile}
                  aria-label="Remover edital anexado"
                  disabled={isSending}
                >
                  <X size={13} className="shrink-0 flex-none" />
                </button>
              </div>
            )}

            <form
              className={styles.chatInputWrap}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <button
                type="button"
                className={styles.attachBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                aria-label="Anexar edital em PDF"
                title="Anexar edital em PDF (até 15 MB)"
              >
                <Paperclip size={18} className="shrink-0 flex-none" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                tabIndex={-1}
                className={styles.hiddenFileInput}
                onChange={handleFileSelect}
                aria-hidden="true"
              />

              <textarea
                ref={textareaRef}
                className={styles.chatTextarea}
                placeholder={
                  isSending
                    ? (selectedFile ? "AIVU está lendo e analisando o edital..." : "AIVU está pensando...")
                    : (selectedFile ? "Instruções adicionais (opcional)..." : "Pergunte algo ao AIVU...")
                }
                value={inputValue}
                disabled={isSending}
                rows={1}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                aria-label="Mensagem para o AIVU"
              />
              <input 
                type="text" 
                tabIndex={-1}
                aria-hidden="true"
                className={styles.legacyInputCompat}
                placeholder={isSending ? "AIVU está pensando..." : "Pergunte algo ao AIVU..."}
                value={inputValue}
                disabled={isSending}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => textareaRef.current?.focus()}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={(!inputValue.trim() && !selectedFile) || isSending}
                aria-label="Enviar mensagem"
              >
                <Send size={18} className="shrink-0 flex-none" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={styles.mascotWrap} 
        role="button"
        tabIndex={isDrawerOpen ? -1 : 0}
        aria-hidden={isDrawerOpen}
        aria-label="Assistente AIVU"
        onClick={() => {
          if (!isDrawerOpen && !targetAnchor && !quizModeActive) {
            setIsOpen(!isOpen);
            if (!isOpen) setState('greeting');
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isDrawerOpen && !targetAnchor && !quizModeActive) {
            e.preventDefault();
            setIsOpen(!isOpen);
            if (!isOpen) setState('greeting');
          }
        }}
      >
        <Aivo size={size} state={mascotState} />
      </div>
    </div>
  );
}
