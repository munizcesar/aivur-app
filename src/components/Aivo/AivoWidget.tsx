// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
import { useAivoStore } from "@/store/useAivoStore";
import { useQuizStore } from "@/store/useQuizStore";
import { Aivo } from "./AivoMascot";
import { X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AivoWidget.module.css";

export default function AivoWidget() {
  const { state, messages, isOpen, targetAnchor, setIsOpen, addMessage, setState } = useAivoStore();
  const isDrawerOpen = useQuizStore(s => s.isDrawerOpen);
  const quizModeActive = useQuizStore(s => s.step === 3 && s.mode !== 'redacao' && s.mode !== 'aivos360'); 
  // Se for simulado, modo foco está ativo

  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    addMessage({ sender: 'user', text: inputValue });
    setInputValue("");
    setState('thinking');
    
    // Simulate AI reply
    setTimeout(() => {
      setState('speaking');
      addMessage({ sender: 'aivo', text: 'Esta é uma resposta simulada. A integração completa será feita no back-end!' });
      
      setTimeout(() => {
        setState('idle');
      }, 3000);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
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
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatTitle}>
                <Sparkles width={16} height={16} /> AIVO Assistente
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <X width={16} height={16} />
              </button>
            </div>
            
            <div className={styles.chatBody}>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className={styles.chatInputWrap}>
              <input 
                type="text" 
                className={styles.chatInput}
                placeholder="Pergunte algo ao AIVO..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className={styles.sendBtn} onClick={handleSend} disabled={!inputValue.trim()}>
                <Send width={16} height={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={styles.mascotWrap} 
        onClick={() => {
          if (!targetAnchor && !quizModeActive) {
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
