import type { Metadata } from "next";
import Link from "next/link";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

const EDITAL_TRILHAS = [
  {
    id: "gm-hortolandia-port",
    title: "Língua Portuguesa",
    topics: [
      { id: "p1", label: "Interpretação e Compreensão de Textos", done: true },
      { id: "p2", label: "Tipologia e Gêneros Textuais", done: true },
      { id: "p3", label: "Ortografia — Acordo Ortográfico 2009", done: false },
      { id: "p4", label: "Concordância Nominal e Verbal", done: false },
      { id: "p5", label: "Regência Nominal e Verbal", done: false },
      { id: "p6", label: "Crase: regras e casos facultativos", done: false },
      { id: "p7", label: "Pontuação: vírgula, ponto-e-vírgula e dois-pontos", done: false },
      { id: "p8", label: "Semântica: sinonímia, antonímia e polissemia", done: false },
    ],
  },
  {
    id: "gm-hortolandia-mat",
    title: "Matemática e Raciocínio Lógico",
    topics: [
      { id: "m1", label: "Operações com Números Inteiros, Racionais e Reais", done: true },
      { id: "m2", label: "Razão, Proporção e Regra de Três", done: false },
      { id: "m3", label: "Porcentagem e Juros Simples", done: false },
      { id: "m4", label: "Equações do 1° e 2° Grau", done: false },
      { id: "m5", label: "Geometria Plana: perímetro e área", done: false },
      { id: "m6", label: "Lógica Proposicional: conectivos e tabela-verdade", done: false },
      { id: "m7", label: "Sequências e Progressões Aritméticas", done: false },
      { id: "m8", label: "Probabilidade e Estatística Básica", done: false },
    ],
  },
  {
    id: "gm-hortolandia-leg-municipal",
    title: "Legislação Municipal",
    topics: [
      { id: "l1", label: "Lei Orgânica do Município de Hortolândia", done: false },
      { id: "l2", label: "Estatuto da Guarda Municipal (Lei Complementar nº 01/2019)", done: false },
      { id: "l3", label: "Regimento Interno da Guarda Municipal de Hortolândia", done: false },
      { id: "l4", label: "Lei nº 13.022/2014 — Estatuto Nacional das Guardas Municipais", done: false },
      { id: "l5", label: "Código de Posturas e Ética do Servidor Municipal", done: false },
      { id: "l6", label: "Noções do Estatuto dos Servidores Públicos do Município", done: false },
    ],
  },
  {
    id: "gm-hortolandia-especifico",
    title: "Conhecimentos Específicos — Guarda Municipal",
    topics: [
      { id: "e1", label: "Atribuições e Competências da Guarda Municipal", done: false },
      { id: "e2", label: "Noções de Direitos Humanos e Cidadania", done: false },
      { id: "e3", label: "Abordagem, Conduta e Uso Progressivo da Força", done: false },
      { id: "e4", label: "Noções de Primeiros Socorros", done: false },
      { id: "e5", label: "Legislação de Trânsito (CTB — Lei 9.503/97)", done: false },
      { id: "e6", label: "Estatuto do Desarmamento e Porte de Arma", done: false },
      { id: "e7", label: "Noções de Criminologia e Prevenção à Violência", done: false },
    ],
  },
];

export default function TrilhasPage() {
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

          {/* Mascote — travado em 128×128, sem estourar */}
          <div className="flex-shrink-0 self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trilhas.png"
              alt="Mascote AIVUR — Trilhas de Estudo"
              className="w-32 h-32 object-contain drop-shadow-md"
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
              <p className="mt-0.5 text-xs text-slate-500">
                Edital 2025 · {EDITAL_TRILHAS.length} disciplinas mapeadas
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {EDITAL_TRILHAS.length} disciplinas
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {EDITAL_TRILHAS.map((trilha) => (
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
