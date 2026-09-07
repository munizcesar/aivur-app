import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import TrilhaSelector from "@/components/Cockpit/parts/TrilhaSelector";
import { TRILHAS_CATALOG } from "@/data/trilhas/schema";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

// ── Contraste WCAG AA verificado sobre #0B1929 (todos ≥ 4.5:1) ─────────────
// Mapeamento fica no Client Component (TrilhasAccordion) — não serializar funções.

const TRILHA_ATIVA = TRILHAS_CATALOG[0];

export default function TrilhasPage() {
  const { disciplinas } = TRILHA_ATIVA;

  return (
    <>
      <Header />
      <main style={{ flex: 1, minHeight: "85vh", backgroundColor: "#020C14" }}>

        {/* ══════════════════════════════════════════════════════════════
            HERO BANNER — full-width, gradient, grid 2 colunas
        ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "linear-gradient(135deg, #020C14 50%, #0B1929 100%)",
            borderBottom: "1px solid rgba(201, 168, 76, 0.18)",
          }}
          className="w-full px-4 md:px-8 pt-10 pb-8 md:pt-14 md:pb-10 relative z-40"
        >
          <div className="max-w-7xl mx-auto">

            {/* Flex: copy esquerda + mascote direita (Mascote acima no mobile) */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 md:gap-10">

              {/* ── Esquerda: copy ── */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left flex-1 min-w-0">
                {/* Super-label */}
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[11px] font-bold tracking-widest text-[#C9A84C] uppercase select-none">
                  ✦ Plano de Estudos
                </span>

                <h1
                  className="font-black tracking-tight text-[#FBEBD0] leading-tight mb-3"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                >
                  Suas Trilhas<br className="hidden sm:block" /> de Estudo
                </h1>

                <p className="text-slate-400 text-base md:text-lg max-w-lg mb-6 leading-relaxed">
                  Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
                </p>

                <button className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer relative z-10 w-fit">
                  <Sparkles size={18} className="shrink-0 flex-none" />
                  <span>Gerar Trilha com IA</span>
                </button>
              </div>

              {/* ── Direita: mascote integrado ao flex ── */}
              <div className="flex justify-center shrink-0 w-full md:w-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/aivur/trilhas.png"
                  alt="Mascote AIVUR — Trilhas de Estudo"
                  width={280}
                  height={280}
                  style={{
                    width: "clamp(180px, 25vw, 280px)",
                    height: "auto",
                    objectFit: "contain",
                    filter: "drop-shadow(0 20px 35px rgba(0,0,0,0.55))",
                  }}
                />
              </div>
            </div>

            {/* ── TRILHA ATIVA BAR (Agora Interativa com Dropdown) ── */}
            <TrilhaSelector activeTrilhaId={TRILHA_ATIVA.id} />

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            GRADE DE DISCIPLINAS — coluna única, full-width
        ══════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-5xl mx-auto mt-8 px-4 md:px-0">
          <div className="flex flex-col gap-3">
            {disciplinas.map((disc, idx) => (
                <TrilhasAccordion
                  key={disc.id}
                  title={disc.title}
                  topics={disc.topics}
                  disciplineIndex={idx}
                />
            ))}
          </div>
        </div>

      </main>
      <Footer />
      <SideDrawer />
    </>
  );
}
