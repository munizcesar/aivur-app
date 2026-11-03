"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { AivuActionProposal } from "@/lib/validations/aivu-chat";
import styles from "./ActionProposalCard.module.css";

interface ActionProposalCardProps {
  proposal: AivuActionProposal;
  onUpdate?: (updatedProposal: Partial<AivuActionProposal>) => void;
}

export default function ActionProposalCard({
  proposal,
  onUpdate,
}: ActionProposalCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirmCreation = async () => {
    if (isSubmitting || proposal.status === "concluida") return;

    setIsSubmitting(true);
    setErrorMessage(null);

    onUpdate?.({ status: "executando" });

    try {
      const response = await fetch("/api/jornadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal.payload_preparado),
      });

      const data = ((await response.json().catch(() => ({}))) || {}) as Record<string, any>;

      if (response.ok && data.id) {
        const redirectUrl = `/jornadas/${data.id}`;
        onUpdate?.({
          status: "concluida",
          resultado: {
            id: data.id,
            redirect_url: redirectUrl,
            mensagem: data.is_existing || data.reused
              ? "Jornada já existente localizada com sucesso!"
              : "Jornada de Estudos criada com sucesso!",
          },
        });
      } else {
        const errorMsg =
          data.error ||
          (response.status === 401
            ? "Faça login para salvar a Jornada de Estudos."
            : "Falha ao criar a Jornada de Estudos. Tente novamente.");
        setErrorMessage(errorMsg);
        onUpdate?.({ status: "erro" });
      }
    } catch {
      setErrorMessage("Erro de conexão ao salvar a Jornada. Verifique sua rede.");
      onUpdate?.({ status: "erro" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = proposal.status === "concluida" && proposal.resultado?.redirect_url;

  return (
    <div className={styles.card} role="region" aria-label="Proposta de Jornada de Estudos">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.badge}>
            <Compass size={12} className="shrink-0 flex-none" />
            Jornada de Estudos
          </span>
          <h4 className={styles.title}>{proposal.titulo}</h4>
          {proposal.subtitulo && (
            <p className={styles.subtitulo}>{proposal.subtitulo}</p>
          )}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <BookOpen size={14} className="shrink-0 flex-none" />
          <span>{proposal.resumo_dados.disciplinas_count} disciplinas</span>
        </div>
        <span>•</span>
        <div className={styles.statItem}>
          <Sparkles size={14} className="shrink-0 flex-none" />
          <span>{proposal.resumo_dados.topicos_count} tópicos</span>
        </div>
      </div>

      <div className={styles.previewList}>
        {proposal.resumo_dados.preview_disciplinas.map((disc, idx) => (
          <div key={idx} className={styles.previewItem}>
            <span className={styles.previewBullet} />
            <span>{disc}</span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={14} className="shrink-0 flex-none" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className={styles.actions}>
        {isCompleted ? (
          <div className={styles.successBox}>
            <p className={styles.successText}>
              <CheckCircle2 size={16} className="shrink-0 flex-none" />
              <span>{proposal.resultado?.mensagem || "Jornada criada com sucesso!"}</span>
            </p>
            <Link
              href={proposal.resultado!.redirect_url}
              className={styles.accessBtn}
            >
              <span>Acessar Minha Jornada de Estudos</span>
              <ArrowRight size={14} className="shrink-0 flex-none" />
            </Link>
          </div>
        ) : (
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirmCreation}
            disabled={isSubmitting}
            aria-label="Confirmar e criar jornada de estudos"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="shrink-0 flex-none animate-spin" />
                <span>Criando sua Jornada...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="shrink-0 flex-none" />
                <span>Confirmar e Criar Jornada</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
