"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Building2,
  Briefcase,
  Plus,
} from "lucide-react";

interface JornadaSummary {
  id: string;
  titulo_concurso: string;
  banca?: string | null;
  ano?: number | null;
  cargo?: string | null;
  total_topicos: number;
  concluidos_count: number;
  progresso_geral: number;
  criado_em: string;
}

export default function UserJornadasSection() {
  const [jornadas, setJornadas] = useState<JornadaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadJornadas() {
      try {
        const res = await fetch("/api/jornadas");
        if (!res.ok) {
          // If 401 or error, user might be guest or offline
          if (isMounted) setJornadas([]);
          return;
        }
        const data = (await res.json()) as { jornadas?: JornadaSummary[] };
        if (isMounted && data.jornadas) {
          setJornadas(data.jornadas);
        }
      } catch (e) {
        console.warn("[UserJornadasSection] Falha ao buscar jornadas:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJornadas();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section aria-labelledby="jornadas-edital-title" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} className="shrink-0 flex-none" />
            Novo Módulo
          </div>
          <h2
            id="jornadas-edital-title"
            className="m-0 text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--color-heading)] tracking-tight"
          >
            Jornadas de Edital
          </h2>
          <p className="m-0 mt-1 text-sm sm:text-base text-[var(--color-text-muted)] max-w-xl">
            Edital verticalizado e estruturado por IA. Domine tópico por tópico do conteúdo programático.
          </p>
        </div>

        <Link
          href="/jornadas/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs md:text-sm font-bold hover:opacity-95 transition-opacity shrink-0 no-underline shadow-xs"
        >
          <Plus size={16} className="shrink-0 flex-none" />
          Importar Novo Edital
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[200px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-28 rounded-full bg-[var(--color-surface-offset)]" />
                <div className="h-6 w-3/4 rounded bg-[var(--color-surface-offset)]" />
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-surface-offset)]" />
            </div>
          ))}
        </div>
      ) : jornadas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jornadas.map((jornada) => (
            <div
              key={jornada.id}
              className="group flex flex-col justify-between p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                    <Compass size={14} className="shrink-0 flex-none" />
                    Edital Ativo
                  </span>
                  {jornada.ano && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="shrink-0 flex-none" />
                      {jornada.ano}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="m-0 text-base md:text-lg font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                    {jornada.titulo_concurso}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)]">
                    {jornada.banca && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} className="shrink-0 flex-none" />
                        {jornada.banca}
                      </span>
                    )}
                    {jornada.cargo && (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase size={12} className="shrink-0 flex-none" />
                        {jornada.cargo}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--color-text-muted)]">
                      {jornada.concluidos_count} de {jornada.total_topicos} tópicos
                    </span>
                    <span className="text-[var(--color-primary)]">
                      {jornada.progresso_geral}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, jornada.progresso_geral))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-[var(--color-border)]/60">
                <Link
                  href={`/jornadas/${jornada.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs md:text-sm font-semibold text-[var(--color-heading)] group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:border-[var(--color-primary)] transition-all no-underline"
                >
                  <span>Abrir Jornada</span>
                  <ArrowRight size={14} className="shrink-0 flex-none transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 md:p-10 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 text-center flex flex-col items-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
            <BookOpen size={24} className="shrink-0 flex-none" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-heading)]">
              Você ainda não importou nenhum edital
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
              Cole o conteúdo programático ou suba o PDF do edital. A inteligência do AIVUR organiza as matérias e tópicos para você estudar com clareza.
            </p>
          </div>
          <Link
            href="/jornadas/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-95 transition-opacity no-underline shadow-xs"
          >
            <Sparkles size={16} className="shrink-0 flex-none" />
            Importar Meu Primeiro Edital
          </Link>
        </div>
      )}
    </section>
  );
}
