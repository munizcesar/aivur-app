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
      <div className="max-w-4xl mx-auto px-5 pt-10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">AIVUR • Trilhas de Estudo</p>
          <h1 className="text-slate-800 text-3xl font-bold mb-3">Suas Trilhas de Estudo</h1>
          <p className="text-slate-600 mb-6 max-w-md">Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe sua taxa de retenção em tempo real.</p>
          <Link href="/trilhas/novo" className="flex items-center w-max gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
            <span className="text-lg">+</span> Gerar Trilha com IA
          </Link>
        </div>
        {/* Se a imagem /trilhas.png não existir na pasta public, comente ou remova a tag <img> abaixo temporariamente para evitar o ícone de imagem quebrada */}
        <div className="hidden md:block w-32 h-32 shrink-0 bg-slate-200 rounded-full animate-pulse"></div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-14">
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
