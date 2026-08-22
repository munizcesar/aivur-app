import Link from "next/link";
import { Brain, ArrowLeft, Sparkles } from "lucide-react";

export default function RedacaoPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0B0F17",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "rgba(217, 107, 84, 0.1)",
          border: "1px solid rgba(217, 107, 84, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
          color: "#F4A261",
        }}
      >
        <Brain width={36} height={36} />
      </div>

      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "rgba(217, 107, 84, 0.08)",
          border: "1px solid rgba(217, 107, 84, 0.25)",
          color: "#F4A261",
          padding: "0.3rem 0.85rem",
          borderRadius: 9999,
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        <Sparkles width={12} height={12} /> Em breve
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700,
          color: "#F9F6F0",
          marginBottom: "1rem",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        Redação Coach
      </h1>

      {/* Description */}
      <p
        style={{
          color: "#A3A9B2",
          fontSize: "1.05rem",
          lineHeight: 1.6,
          maxWidth: 480,
          marginBottom: "2.5rem",
        }}
      >
        Este módulo está passando por uma atualização para integrar a nova IA
        examinadora. Em breve você terá acesso a feedback estruturado e
        reescrita otimizada para atingir nota máxima.
      </p>

      {/* Back Button */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#F9F6F0",
          padding: "0.7rem 1.5rem",
          borderRadius: 9999,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          transition: "all 0.2s ease",
        }}
      >
        <ArrowLeft width={16} height={16} />
        Voltar para a Home
      </Link>
    </div>
  );
}
