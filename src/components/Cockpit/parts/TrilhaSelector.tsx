"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Plus, GraduationCap } from "lucide-react";
import { TRILHAS_CATALOG, type TrilhaConfig } from "@/data/trilhas/schema";

interface TrilhaSelectorProps {
  activeTrilhaId: string;
}

export default function TrilhaSelector({ activeTrilhaId }: TrilhaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTrilha = TRILHAS_CATALOG.find((t) => t.id === activeTrilhaId) || TRILHAS_CATALOG[0];
  const badge = activeTrilha.type === "edital" ? activeTrilha.badge : null;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mt-8 pt-6 border-t border-[#C9A84C]/15 relative z-30" ref={dropdownRef}>
      
      {/* ── Trigger: Trilha Ativa ── */}
      <div 
        className="flex items-center justify-between gap-4 flex-wrap p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {badge ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={badge.src} alt={badge.alt} width={36} height={36} className="w-9 h-9 object-contain shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
              <GraduationCap size={18} className="text-[#C9A84C]" />
            </div>
          )}
          
          <div className="min-w-0 flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-[#FBEBD0] truncate leading-tight flex items-center gap-2">
                {activeTrilha.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {activeTrilha.subtitle}
              </p>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-slate-500 shrink-0 ml-2 transition-transform duration-200 group-hover:text-[#C9A84C] ${isOpen ? "rotate-180" : ""}`} 
            />
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-xs font-semibold text-[#C9A84C]">
          {activeTrilha.disciplinas.length} disciplina{activeTrilha.disciplinas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Dropdown Menu Premium ── */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-[#0B1929] border border-[#1E3A5F] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <h3 className="px-3 pt-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Suas Trilhas
            </h3>
            
            <div className="flex flex-col gap-1 mt-1">
              {TRILHAS_CATALOG.filter(t => t.disciplinas.length > 0).map((trilha) => {
                const isSelected = trilha.id === activeTrilha.id;
                // Simulação de % para trilhas do catálogo que não são a ativa
                const progress = isSelected ? "42%" : "0%";
                
                return (
                  <button
                    key={trilha.id}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-colors ${
                      isSelected ? "bg-[#1E3A5F]/40 border border-[#1E3A5F]" : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {trilha.type === "edital" && trilha.badge ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trilha.badge.src} alt="" width={32} height={32} className="w-8 h-8 object-contain shrink-0 opacity-80" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <GraduationCap size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-semibold truncate ${isSelected ? "text-[#C9A84C]" : "text-slate-300"}`}>
                          {trilha.title}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {trilha.subtitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black tabular-nums text-emerald-500 shrink-0 ml-3">
                      {progress}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-[#1E3A5F]/60 my-2 mx-2" />

            {/* CTA IA */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full p-3 rounded-xl text-left hover:bg-emerald-900/20 group transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-colors">
                <Sparkles size={14} className="text-emerald-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  Gerar Nova Trilha com IA
                </span>
                <span className="text-[11px] text-slate-500">
                  Faça o upload do seu edital ou edital verticalizado
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
