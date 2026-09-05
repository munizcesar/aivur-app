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
  const badge = TRILHA_ATIVA.type === "edital" ? TRILHA_ATIVA.badge : null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#020C14] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-5 pt-10 pb-14">
        
        {/* ── Hero Section ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex-1 min-w-[280px]">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">
              AIVUR • Trilhas de Estudo
            </p>
            <h1 className="text-slate-800 dark:text-slate-100 text-3xl font-extrabold mb-3 leading-tight">
              Suas Trilhas de Estudo
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base mb-6 max-w-md leading-relaxed">
              Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.
            </p>
            <Link
              href="/trilhas/novo"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors gap-2 text-sm shadow-sm"
            >
              <span>+</span> Gerar Trilha com IA
            </Link>
          </div>
        </div>

        {/* ── Cabeçalho da Seção de Listagem ── */}
        <section aria-label="Lista de trilhas de estudo">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              {badge && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.src}
                  alt={badge.alt}
                  className="w-9 h-9 object-contain flex-shrink-0 dark:brightness-110"
                />
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate m-0">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 m-0">
                  {subtitle}
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F3A53] px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
              {disciplinas.length} disciplina{disciplinas.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Accordions ── */}
          <div className="flex flex-col gap-3">
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
