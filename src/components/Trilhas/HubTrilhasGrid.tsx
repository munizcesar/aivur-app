"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, FileText, FileUp, Link2, Sparkles, BookMarked } from "lucide-react";
import type { TrilhaSourceType } from "@/mocks/trilhasMock";

interface HubTrilha {
  id: string;
  titulo: string;
  disciplina: string;
  sourceType: TrilhaSourceType;
  isPublic: boolean;
  createdAt: number;
  progresso?: number;
}

type TabType = "minhas" | "oficiais";

const SOURCE_ICONS: Record<TrilhaSourceType, React.ElementType> = {
  youtube: Link2,
  text: FileText,
  edital: FileUp,
  system: Sparkles,
};

function SkeletonCard() {
  return (
    <div className="hub-card animate-pulse pointer-events-none flex flex-col gap-3">
      <div className="h-4 w-1/3 bg-white/10 rounded-full" />
      <div className="h-5 w-3/4 bg-white/10 rounded-full mt-1" />
      <div className="mt-auto pt-4 flex justify-between items-center">
        <div className="h-4 w-1/4 bg-white/10 rounded-full" />
        <div className="h-8 w-8 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

export default function HubTrilhasGrid() {
  const [activeTab, setActiveTab] = useState<TabType>("minhas");
  const [minhasTrilhas, setMinhasTrilhas] = useState<HubTrilha[]>([]);
  const [cursosOficiais, setCursosOficiais] = useState<HubTrilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHub() {
      try {
        setLoading(true);
        const res = await fetch("/api/trilhas/hub");
        if (!res.ok) throw new Error("Erro ao carregar o Hub");
        const data = await res.json() as { minhasTrilhas?: HubTrilha[], cursosOficiais?: HubTrilha[] };
        setMinhasTrilhas(data.minhasTrilhas || []);
        setCursosOficiais(data.cursosOficiais || []);
      } catch (err: any) {
        setError(err.message || "Erro desconhecido ao carregar as trilhas.");
      } finally {
        setLoading(false);
      }
    }
    fetchHub();
  }, []);

  const activeData = activeTab === "minhas" ? minhasTrilhas : cursosOficiais;

  return (
    <div className="w-full max-w-[1040px] mx-auto flex flex-col gap-8 pb-20 px-4">
      <style>{`
        .hub-tab {
          position: relative;
          padding: 0.6rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
        }
        .hub-tab:hover { color: rgba(255,255,255,0.8); }
        .hub-tab.active { color: #fff; }
        .hub-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 10%;
          width: 80%;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px;
        }
        .hub-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .hub-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(255,255,255,0.05), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .hub-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .hub-card:hover::before { opacity: 1; }
        .hub-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.2s ease;
        }
        .hub-card:hover .hub-btn {
          background: var(--color-primary);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(217,107,84,0.4);
        }
      `}</style>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 w-fit">
        <button
          className={`hub-tab ${activeTab === "minhas" ? "active" : ""}`}
          onClick={() => setActiveTab("minhas")}
        >
          Minhas Trilhas
        </button>
        <button
          className={`hub-tab ${activeTab === "oficiais" ? "active" : ""}`}
          onClick={() => setActiveTab("oficiais")}
        >
          Cursos Aivur
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {error ? (
          <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5">
            <p className="text-white/70">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : activeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-3xl bg-white/[0.02]">
            <BookMarked size={40} className="text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white/80">Nenhuma trilha encontrada</h3>
            <p className="text-sm text-white/40 mt-1 max-w-sm">
              {activeTab === "minhas" 
                ? "Você ainda não gerou nenhuma trilha de estudos." 
                : "Os cursos oficiais estão sendo preparados."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {activeData.map((trilha) => {
              const Icon = SOURCE_ICONS[trilha.sourceType || "system"] || BookMarked;
              return (
                <Link key={trilha.id} href={`/trilhas/${trilha.id}`} className="hub-card group outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[0.65rem] font-bold tracking-wider uppercase text-white/60">
                      <Icon size={10} />
                      {trilha.disciplina || "Geral"}
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white leading-snug line-clamp-2 mt-1 relative z-10">
                    {trilha.titulo}
                  </h4>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${trilha.progresso || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white/40">
                        {Math.round(trilha.progresso || 0)}%
                      </span>
                    </div>
                    <div className="hub-btn">
                      <Play size={14} className="ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
