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

// Trilha ativa exibida nesta página.
// Para trocar: altere o id abaixo. O restante do layout se adapta automaticamente.
const TRILHA_ATIVA = TRILHAS_CATALOG[0];

export default function TrilhasPage() {
  const { title, subtitle, disciplinas } = TRILHA_ATIVA;

  // badge só existe quando type === "edital" — a tipagem garante isso em tempo de compilação.
  const badge = TRILHA_ATIVA.type === "edital" ? TRILHA_ATIVA.badge : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">

        {/* ── Hero Section ── */}
        <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              AIVUR · Trilhas de Estudo
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 md:text-4xl">
              Suas Trilhas de Estudo
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
              Evolua pelo edital com disciplina. Marque tópicos concluídos e
              acompanhe sua taxa de retenção em tempo real.
            </p>
            <div className="mt-5">
              <Link
                href="/trilhas/novo"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Gerar Trilha com IA
              </Link>
            </div>
          </div>

          {/* Mascote — fixo 128×128 */}
          <div className="flex-shrink-0 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trilhas.png"
              alt="Mascote AIVUR — Trilhas de Estudo"
              className="w-32 h-32 object-contain drop-shadow-md"
            />
          </div>
        </section>

        {/* ── Cabeçalho da Seção de Listagem ── */}
        <section aria-label="Lista de trilhas de estudo">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/*
               * BRASÃO — só renderiza quando a trilha é do tipo "edital".
               * Matérias avulsas (type="materia") nunca exibem este elemento.
               * A regra é garantida tanto pela tipagem TypeScript quanto pelo
               * condicional abaixo — dupla proteção.
               */}
              {badge && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.src}
                  alt={badge.alt}
                  className="w-9 h-9 flex-shrink-0 object-contain"
                />
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800 truncate">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
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
