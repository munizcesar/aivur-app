import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import { Sparkles } from "lucide-react";
import { TRILHAS_CATALOG } from "@/data/trilhas/schema";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

const TRILHA_ATIVA = TRILHAS_CATALOG[0];

export default function TrilhasPage() {
  const { title, subtitle, disciplinas } = TRILHA_ATIVA;
  const badge = TRILHA_ATIVA.type === "edital" ? TRILHA_ATIVA.badge : null;

  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "2rem 0", minHeight: "85vh", backgroundColor: "var(--color-bg, #020C14)" }}>
        <div className="container">
          
          {/* ── Hero Section (Ref. Caderno de Questões) ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--elite-cream, #FBEBD0)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }} className="font-semibold tracking-tight">
                Suas Trilhas de Estudo
              </h1>
              <p className="text-slate-400 text-lg mb-6 max-w-xl">
                Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
              </p>
              <button className="mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 w-fit relative z-10 cursor-pointer">
                <Sparkles className="w-5 h-5 shrink-0 flex-none"/>
                <span className="whitespace-nowrap">Gerar Trilha com IA</span>
              </button>
            </div>
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
              {/*eslint-disable-next-line @next/next/no-img-element*/}
              <img 
                src="/images/aivur/trilhas.png" 
                alt="Trilhas de Estudo" 
                style={{ width: '220px', height: 'auto', objectFit: 'contain', background: 'transparent', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))' }} 
              />
            </div>
          </div>

          {/* ── Cabeçalho da Seção de Listagem ── */}
          <section aria-label="Lista de trilhas de estudo" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 min-w-0">
                {badge && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={badge.src}
                    alt={badge.alt}
                    className="w-10 h-10 object-contain flex-shrink-0 dark:brightness-110"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#FBEBD0] truncate m-0">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-[#6B99B3] m-0 font-medium">
                    {subtitle}
                  </p>
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#6B99B3]">
                {disciplinas.length} disciplina{disciplinas.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Accordions ── */}
            <div className="flex flex-col gap-4">
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
      <Footer />
      <SideDrawer />
    </>
  );
}
