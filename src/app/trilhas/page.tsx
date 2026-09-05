import type { Metadata } from "next";
import Link from "next/link";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import { TRILHAS_CATALOG } from "@/data/trilhas/schema";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

const TRILHA_ATIVA = TRILHAS_CATALOG[0];

export default function TrilhasPage() {
  const { title, subtitle, disciplinas } = TRILHA_ATIVA;

  // badge só existe quando type === "edital"
  const badge = TRILHA_ATIVA.type === "edital" ? TRILHA_ATIVA.badge : null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "896px", margin: "0 auto", padding: "40px 20px 56px" }}>
        
        {/* ── Hero Section (Blindado com Inline Styles) ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 0%", minWidth: "280px" }}>
            <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
              AIVUR • Trilhas de Estudo
            </p>
            <h1 style={{ color: "#1e293b", fontSize: "30px", fontWeight: 800, margin: "0 0 12px 0", lineHeight: 1.2 }}>
              Suas Trilhas de Estudo
            </h1>
            <p style={{ color: "#475569", fontSize: "16px", marginBottom: "24px", maxWidth: "450px", lineHeight: 1.6, margin: "0 0 24px 0" }}>
              Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
            </p>
            <Link
              href="/trilhas/novo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#059669",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              <Plus size={18} />
              Gerar Trilha com IA
            </Link>
          </div>
          
          {/* Mascote restaurado (com o caminho correto do seu projeto antigo) e estilizado rigidamente */}
          <div style={{ flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/aivur/icon-trilhas.png"
              alt="Mascote AIVUR"
              style={{ width: "128px", height: "128px", objectFit: "contain", display: "block" }}
            />
          </div>
        </div>

        {/* ── Cabeçalho da Seção de Listagem ── */}
        <section aria-label="Lista de trilhas de estudo">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              {badge && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.src}
                  alt={badge.alt}
                  style={{ width: "36px", height: "36px", objectFit: "contain", flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {title}
                </h2>
                <p style={{ marginTop: "2px", fontSize: "12px", color: "#64748b", margin: 0 }}>
                  {subtitle}
                </p>
              </div>
            </div>
            <span style={{ flexShrink: 0, borderRadius: "9999px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
              {disciplinas.length} disciplina{disciplinas.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Accordions ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {disciplinas.map((disc) => (
              <TrilhasAccordion
                key={disc.id}
                title={disc.title}
                topics={disc.topics}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
