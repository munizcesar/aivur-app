// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAivoStore } from "@/store/useAivoStore";
import { useQuizStore } from "@/store/useQuizStore";
import { Aivo } from "./AivoMascot";
import { X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AivoWidget.module.css";

export default function AivoWidget() {
  const pathname = usePathname();
  const { state, messages, isOpen, targetAnchor, isSending, activeContext, setIsOpen, addMessage, setState, setIsSending } = useAivoStore();
  const isDrawerOpen = useQuizStore(s => s.isDrawerOpen);
  const quizModeActive = useQuizStore(s => s.step === 3 && s.mode !== 'redacao' && s.mode !== 'aivos360'); 

  const [inputValue, setInputValue] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Acompanha a abertura do teclado virtual no mobile para ajustar a ancoragem
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (!vv) return;
      const offset = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
      setKeyboardOffset(offset);
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

  // Sync anchor with drawer
  useEffect(() => {
    if (isDrawerOpen) {
      useAivoStore.getState().setTargetAnchor('drawer');
      setIsOpen(false);
    } else {
      useAivoStore.getState().setTargetAnchor(null);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSendingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine classes based on context
  let containerClass = styles.defaultPos;
  let mascotState = state;
  let size = 80; // default mdish

  if (targetAnchor === 'drawer') {
    containerClass = styles.inDrawer;
    size = 40;
  } else if (quizModeActive) {
    containerClass = styles.minimized;
    mascotState = 'sleepy'; // Doesn't distract
  }

  return (
    <div className={`${styles.widgetContainer} ${containerClass}`}>
      <AnimatePresence>
        {isOpen && !targetAnchor && !quizModeActive && (
          <motion.div 
            className={styles.chatPanel}
            style={keyboardOffset > 0 ? { bottom: `${keyboardOffset + 12}px` } : undefined}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatTitle}>
                <Sparkles width={16} height={16} className={styles.sparkleIcon} /> AIVU Assistente
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Fechar chat">
                <X width={20} height={20} />
              </button>
            </div>
            
            <div className={styles.chatBody}>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${styles[msg.sender] || (msg.sender === 'user' ? styles.user : styles.aivo)}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              className={styles.chatInputWrap}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input 
                type="text" 
                className={styles.chatInput}
                placeholder={isSending ? "AIVU está pensando..." : "Pergunte algo ao AIVU..."}
                value={inputValue}
                disabled={isSending}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
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
        tabIndex={0}
        aria-label="Assistente AIVU"
        onClick={() => {
          if (!targetAnchor && !quizModeActive) {
            setIsOpen(!isOpen);
            if (!isOpen) setState('greeting');
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !targetAnchor && !quizModeActive) {
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
