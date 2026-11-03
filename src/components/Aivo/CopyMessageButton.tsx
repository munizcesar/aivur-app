"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import styles from "./AivoWidget.module.css";

interface CopyMessageButtonProps {
  text: string;
}

export function CopyMessageButton({ text }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!text || !text.trim()) {
    return null;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
      onClick={handleCopy}
      aria-label={copied ? "Mensagem copiada para a área de transferência" : "Copiar resposta do AIVU"}
      title={copied ? "Copiado!" : "Copiar resposta"}
      data-testid="aivu-copy-btn"
    >
      {copied ? (
        <>
          <Check size={13} className="shrink-0 flex-none text-emerald-400" />
          <span className={styles.copyFeedback}>Copiado!</span>
        </>
      ) : (
        <>
          <Copy size={13} className="shrink-0 flex-none" />
          <span className={styles.copyLabel}>Copiar</span>
        </>
      )}
      <span className={styles.srOnly} role="status" aria-live="polite">
        {copied ? "Conteúdo da resposta copiado para a área de transferência" : ""}
      </span>
    </button>
  );
}
