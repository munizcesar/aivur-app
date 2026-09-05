import type { Metadata } from "next";
import Link from "next/link";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

const MOCK_TRILHAS = [
  {
    id: "gm-hortolandia-dir-adm",
    title: "Direito Administrativo",
    topics: [
      { id: "t1", label: "Princípios da Administração Pública (LIMPE — art. 37 CF)", done: true },
      { id: "t2", label: "Atos Administrativos: conceito, elementos, atributos e extinção", done: true },
      { id: "t3", label: "Poderes Administrativos: hierárquico, disciplinar, regulamentar e de polícia", done: true },
      { id: "t4", label: "Licitações e Contratos Administrativos (Lei 14.133/21)", done: false },
      { id: "t5", label: "Servidores Públicos: regime jurídico, direitos e deveres", done: false },
      { id: "t6", label: "Controle da Administração Pública: interno, externo e popular", done: false },
      { id: "t7", label: "Responsabilidade Civil do Estado", done: false },
    ],
  },
  {
    id: "gm-hortolandia-port",
    title: "Língua Portuguesa",
    topics: [
      { id: "p1", label: "Interpretação e Compreensão de Textos", done: true },
      { id: "p2", label: "Coesão e Coerência Textual", done: true },
      { id: "p3", label: "Ortografia — Acordo Ortográfico 2009", done: true },
      { id: "p4", label: "Concordância Nominal e Verbal", done: false },
      { id: "p5", label: "Regência Nominal e Verbal", done: false },
      { id: "p6", label: "Crase: regras e casos facultativos", done: false },
      { id: "p7", label: "Pontuação: vírgula, ponto-e-vírgula e dois-pontos", done: false },
      { id: "p8", label: "Figuras de Linguagem e Estilística", done: false },
    ],
  },
  {
    id: "gm-hortolandia-dir-const",
    title: "Direito Constitucional",
    topics: [
      { id: "c1", label: "Princípios Fundamentais e Objetivos da República (arts. 1°–4°)", done: false },
      { id: "c2", label: "Direitos e Garantias Individuais e Coletivos (art. 5°)", done: false },
      { id: "c3", label: "Direitos Sociais (arts. 6°–11)", done: false },
      { id: "c4", label: "Organização do Estado: União, Estados, DF e Municípios", done: false },
      { id: "c5", label: "Administração Pública — arts. 37–41", done: false },
      { id: "c6", label: "Poder Executivo, Legislativo e Judiciário", done: false },
    ],
  },
  {
    id: "gm-hortolandia-informatica",
    title: "Informática",
    topics: [
      { id: "i1", label: "Internet e Navegadores: Chrome, Firefox, Edge", done: true },
      { id: "i2", label: "Segurança da Informação: vírus, phishing, firewall", done: false },
      { id: "i3", label: "Microsoft Word: formatação, mala direta e revisão", done: false },
      { id: "i4", label: "Microsoft Excel: fórmulas, gráficos e tabelas dinâmicas", done: false },
      { id: "i5", label: "Sistema Operacional Windows 10/11", done: false },
    ],
  },
  {
    id: "gm-hortolandia-leg-municipal",
    title: "Legislação Municipal — Hortolândia",
    topics: [
      { id: "l1", label: "Lei Orgânica do Município de Hortolândia", done: false },
      { id: "l2", label: "Estatuto da Guarda Municipal (Lei Complementar nº 01/2019)", done: false },
      { id: "l3", label: "Regimento Interno da Guarda Municipal", done: false },
      { id: "l4", label: "Código de Conduta e Ética do Servidor Municipal", done: false },
    ],
  },
];

export default function TrilhasPage() {
  const totalDisciplinas = MOCK_TRILHAS.length;

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
              Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe
              sua taxa de retenção em tempo real.
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

          {/* Mascote */}
          <div className="flex-shrink-0 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/aivur/icon-trilhas.png"
              alt="Mascote AIVUR — Trilhas de Estudo"
              className="w-32 h-auto drop-shadow-md"
            />
          </div>
        </section>

        {/* ── Lista de Trilhas ── */}
        <section aria-label="Lista de trilhas de estudo">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Guarda Municipal — Hortolândia
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Edital 2025 · Mapeamento completo</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {totalDisciplinas} disciplinas
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {MOCK_TRILHAS.map((trilha) => (
              <TrilhasAccordion
                key={trilha.id}
                title={trilha.title}
                topics={trilha.topics}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
