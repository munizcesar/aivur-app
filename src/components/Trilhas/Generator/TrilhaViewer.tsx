"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Zap, BookOpen, Layers } from "lucide-react";

export interface Flashcard {
  // O tipo inferido da string
}

export interface Subject {
  name: string;
  flashcards: string[];
}

export interface Module {
  title: string;
  subjects: Subject[];
}

export interface TrilhaData {
  modules: Module[];
}

interface TrilhaViewerProps {
  data?: TrilhaData | null;
  onReset?: () => void;
}

export function TrilhaViewer({ data, onReset }: TrilhaViewerProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(0); // Primeiro aberto por padrão

  // Resiliência Visual: Tratamento de Fallback para payload vazio ou inválido
  if (!data || !data.modules || data.modules.length === 0) {
    return (
      <div className="w-full p-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-inner">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-slate-300">Nenhum conteúdo encontrado</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Não foi possível renderizar a trilha. O payload retornou vazio ou em formato inválido.
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="mt-4 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Trilha Estratégica Forjada
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sua rota de estudos otimizada baseada na IA.</p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Nova Trilha
          </button>
        )}
      </div>

      <div className="space-y-4">
        {data.modules.map((mod, modIdx) => {
          const isExpanded = expandedModule === modIdx;

          return (
            <motion.div
              key={modIdx}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: modIdx * 0.1 }}
              className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                isExpanded
                  ? "bg-slate-900/80 border-indigo-500/40 shadow-[0_4px_30px_rgba(99,102,241,0.1)]"
                  : "bg-slate-900/40 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Header do Módulo */}
              <button
                onClick={() => setExpandedModule(isExpanded ? null : modIdx)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      isExpanded
                        ? "bg-indigo-500/20 text-indigo-400 shadow-inner shadow-indigo-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Módulo {modIdx + 1}
                    </h4>
                    <h3 className="text-lg font-bold text-slate-200">{mod.title}</h3>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              {/* Corpo do Módulo (Assuntos e Flashcards) */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div
                    className={`p-5 pt-0 border-t border-white/5 transition-opacity duration-300 delay-100 ${
                      isExpanded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="space-y-8 mt-5">
                      {(mod.subjects || []).map((subject, subIdx) => (
                        <div key={subIdx} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <h5 className="font-semibold text-slate-200 text-base">{subject?.name || "Tópico de Estudo"}</h5>
                          </div>
                          
                          {/* Grid de Flashcards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-7">
                            {(subject?.flashcards || []).map((card, cardIdx) => (
                              <div
                                key={cardIdx}
                                className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl flex items-start gap-3 group transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-slate-600/80 hover:bg-slate-800"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                                <span className="text-sm text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                                  {card}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
