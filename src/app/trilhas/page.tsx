import type { Metadata } from "next";
import Image from "next/image";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";

export const metadata: Metadata = {
  title: "Trilhas de Estudo · AIVUR",
  description:
    "Evolua pelo edital com trilhas personalizadas. Acompanhe seu progresso por disciplina e tópico.",
};

const MOCK_TRILHAS = [
  {
    id: "dir-adm",
    title: "Direito Administrativo",
    topics: [
      { id: "t1", label: "Princípios da Administração Pública (LIMPE)", done: true },
      { id: "t2", label: "Atos Administrativos — Elementos e Atributos", done: true },
      { id: "t3", label: "Licitações e Contratos (Lei 14.133/21)", done: false },
      { id: "t4", label: "Servidores Públicos — Regime Jurídico", done: false },
      { id: "t5", label: "Controle da Administração Pública", done: false },
    ],
  },
  {
    id: "lingua-port",
    title: "Língua Portuguesa",
    topics: [
      { id: "p1", label: "Interpretação e Compreensão Textual", done: true },
      { id: "p2", label: "Coesão e Coerência", done: true },
      { id: "p3", label: "Ortografia — Acordo Ortográfico 2009", done: true },
      { id: "p4", label: "Concordância Nominal e Verbal", done: false },
      { id: "p5", label: "Regência Nominal e Verbal", done: false },
      { id: "p6", label: "Pontuação — Vírgula e Ponto-e-vírgula", done: false },
    ],
  },
  {
    id: "dir-const",
    title: "Direito Constitucional",
    topics: [
      { id: "c1", label: "Princípios Fundamentais da CF/88", done: false },
      { id: "c2", label: "Direitos e Garantias Fundamentais", done: false },
      { id: "c3", label: "Organização do Estado — Arts. 18–36", done: false },
      { id: "c4", label: "Poder Legislativo", done: false },
      { id: "c5", label: "Poder Executivo", done: false },
      { id: "c6", label: "Poder Judiciário", done: false },
    ],
  },
];

export default function TrilhasPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">

        {/* ── Hero Section ── */}
        <section className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cockpit · Trilhas de Estudo
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Trilhas de Estudo
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
              Evolua pelo edital com disciplina. Marque tópicos concluídos e acompanhe
              sua taxa de retenção em tempo real.
            </p>
          </div>

          {/* Mascote */}
          <div className="flex-shrink-0 self-center">
            <Image
              src="/images/aivur/icon-trilhas.png"
              alt="Mascote AIVUR — Trilhas de Estudo"
              width={140}
              height={140}
              className="drop-shadow-md"
              priority
            />
          </div>
        </section>

        {/* ── Sessão de Accordion ── */}
        <section aria-label="Lista de trilhas de estudo">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Disciplinas do Edital
            </h2>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {MOCK_TRILHAS.length} disciplinas
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
