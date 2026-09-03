"use client";

import React from "react";

export function FallbackSkeleton() {
  return (
    <div 
      className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased select-none"
      aria-busy="true"
      aria-label="Carregando infraestrutura AIVUR..."
    >
      {/* 1. SLOT DE NAVEGAÇÃO SUPERIOR (HEADER) - CLS: 0px Shift (h-16 estático) */}
      <header className="h-16 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
          <div className="w-36 h-9 rounded-lg bg-slate-800/80 animate-pulse" />
          <div className="hidden md:block w-24 h-6 rounded-md bg-slate-800/40 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 animate-pulse" />
        </div>
      </header>

      {/* BODY CONTAINER COM ESTRUTURA RESERVADA DE GRID/FLEX */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6">
        {/* 2. SLOT DE NAVEGAÇÃO LATERAL (SIDEBAR/NAV) - CLS: 0px Shift (w-64 estático) */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/40 space-y-3">
            <div className="w-24 h-4 rounded bg-slate-800/60 animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="w-full h-10 rounded-xl bg-slate-800/80 animate-pulse" />
              <div className="w-full h-10 rounded-xl bg-slate-800/40 animate-pulse" />
              <div className="w-full h-10 rounded-xl bg-slate-800/40 animate-pulse" />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/40 space-y-3 hidden md:block">
            <div className="w-28 h-4 rounded bg-slate-800/60 animate-pulse" />
            <div className="w-full h-20 rounded-xl bg-slate-800/30 animate-pulse" />
          </div>
        </aside>

        {/* AREA PRINCIPAL - CONTEÚDO E PAINEL DE GERAÇÃO DE TRILHAS */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          {/* 3. SLOT RESERVADO: PAINEL "GERAÇÃO DE TRILHAS" - CLS: 0px (min-h-[220px] exato) */}
          <section className="w-full min-h-[220px] p-6 rounded-2xl border border-indigo-500/10 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Shimmer Overlay Accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-pulse pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-48 h-6 rounded-lg bg-indigo-500/20 animate-pulse" />
                <div className="w-20 h-5 rounded-full bg-slate-800/80 animate-pulse" />
              </div>
              <div className="w-3/4 h-4 rounded bg-slate-800/50 animate-pulse" />
            </div>

            {/* Input & Form Control Placeholder Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="h-11 rounded-xl bg-slate-800/70 animate-pulse" />
              <div className="h-11 rounded-xl bg-slate-800/70 animate-pulse" />
              <div className="h-11 rounded-xl bg-indigo-600/40 animate-pulse" />
            </div>
          </section>

          {/* 4. SLOT RESERVADO: LISTAGEM DE TRILHAS E MATERIAIS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-36 h-6 rounded bg-slate-800/70 animate-pulse" />
              <div className="w-24 h-4 rounded bg-slate-800/40 animate-pulse" />
            </div>

            {/* Cards Skeleton Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((id) => (
                <div 
                  key={id} 
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/30 flex flex-col justify-between gap-4 h-[160px]"
                >
                  <div className="space-y-2">
                    <div className="w-1/2 h-5 rounded bg-slate-800/60 animate-pulse" />
                    <div className="w-4/5 h-4 rounded bg-slate-800/30 animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="w-20 h-4 rounded bg-slate-800/40 animate-pulse" />
                    <div className="w-16 h-4 rounded bg-indigo-500/20 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default FallbackSkeleton;
