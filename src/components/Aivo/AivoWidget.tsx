// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAivoStore } from "@/store/useAivoStore";
import { useQuizStore } from "@/store/useQuizStore";
import { Aivo } from "./AivoMascot";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./AivoWidget.module.css";

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

export default function AivoWidget() {
  const pathname = usePathname();
  const { state, messages, isOpen, targetAnchor, isSending, activeContext, setIsOpen, addMessage, setState, setIsSending } = useAivoStore();
  const isDrawerOpen = useQuizStore(s => s.isDrawerOpen);
  const quizModeActive = useQuizStore(s => s.step === 3 && s.mode !== 'redacao' && s.mode !== 'aivos360'); 

  const [inputValue, setInputValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [viewportAdjustment, setViewportAdjustment] = useState<{
    keyboardOffset: number;
    visualHeight: number | null;
  }>({ keyboardOffset: 0, visualHeight: null });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSendingRef.current) return;
    
    clearRecoveryTimer();
    isSendingRef.current = true;
    setIsSending(true);
    addMessage({ sender: 'user', text });
    setInputValue("");
    setState('thinking');

    // Monta o histórico recente para contexto (máximo 8 mensagens)
    const historyPayload = messages
      .slice(-8)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    // Determina o contexto da página: prioriza activeContext explícito ou infere da rota atual
    let effectiveContext = activeContext;
    if (!effectiveContext && pathname) {
      let derivedModulo: "home" | "jornadas" | "trilhas" | "questoes" | "material" | "redacao" | "auth" | "geral" = "geral";
      if (pathname === "/" || pathname === "/dashboard") derivedModulo = "home";
      else if (pathname.includes("jornada")) derivedModulo = "jornadas";
      else if (pathname.includes("trilha")) derivedModulo = "trilhas";
      else if (pathname.includes("questao") || pathname.includes("questoes")) derivedModulo = "questoes";
      else if (pathname.includes("material")) derivedModulo = "material";
      else if (pathname.includes("redacao")) derivedModulo = "redacao";
      else if (pathname.includes("login") || pathname.includes("register")) derivedModulo = "auth";

      effectiveContext = {
        pathname: pathname.slice(0, 200),
        modulo: derivedModulo,
        atividade: "navegando",
      };
    }

    try {
      const response = await fetch("/api/ai/aivu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: effectiveContext || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json() as { reply: string; state?: string };
        addMessage({ sender: 'aivo', text: data.reply });
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
            
            <div className={styles.chatBody}>
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'aivo' || msg.sender === 'aivu';
                const messageClass = `${styles.message} ${styles[msg.sender] || (msg.sender === 'user' ? styles.user : styles.aivo)}`;
                return (
                  <div key={msg.id} className={messageClass}>
                    {isAssistant ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={aivuMarkdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form
              className={styles.chatInputWrap}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <textarea
                ref={textareaRef}
                className={styles.chatTextarea}
                placeholder={isSending ? "AIVU está pensando..." : "Pergunte algo ao AIVU..."}
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
                disabled={!inputValue.trim() || isSending}
                aria-label="Enviar mensagem"
              >
                <Send width={18} height={18} />
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
