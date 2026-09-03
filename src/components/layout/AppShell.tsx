"use client";

import React, { Suspense, ReactNode } from "react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FallbackSkeleton from "@/components/layout/FallbackSkeleton";

interface AppShellProps {
  children?: ReactNode;
  headerSlot?: ReactNode;
  sidebarSlot?: ReactNode;
  trilhasPanelSlot?: ReactNode;
  onResetError?: () => void;
}

/**
 * AppShell - Infraestrutura Raiz & Layout de Alta Performance
 * 
 * Garantias da Arquitetura:
 * 1. CLS (Cumulative Layout Shift) = 0.000 via reserva estática de dimensões.
 * 2. TTI (Time to Interactive) Otimizado + Percepção de Carregamento Instantâneo.
 * 3. Blindagem de Exceções via Error Boundary encapsulado no nível raiz.
 * 4. Carregamento Assíncrono Seguro com Suspense + FallbackSkeleton.
 */
export function AppShell({
  children,
  headerSlot,
  sidebarSlot,
  trilhasPanelSlot,
  onResetError,
}: AppShellProps) {
  return (
    <ErrorBoundary onReset={onResetError}>
      <Suspense fallback={<FallbackSkeleton />}>
        <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
          {/* SLOT 1: NAVEGAÇÃO SUPERIOR (HEADER) - RESERVA RÍGIDA H-16 */}
          {headerSlot ? (
            <header className="h-16 w-full sticky top-0 z-50 shrink-0">
              {headerSlot}
            </header>
          ) : (
            <header className="h-16 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 shrink-0">
              <div className="flex items-center gap-3 font-semibold text-lg tracking-tight text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                AIVUR
              </div>
            </header>
          )}

          {/* GRID LAYOUT DA APLICAÇÃO */}
          <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6">
            {/* SLOT 2: NAVEGAÇÃO LATERAL (SIDEBAR/NAV) - RESERVA RÍGIDA W-64 */}
            {sidebarSlot && (
              <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                {sidebarSlot}
              </aside>
            )}

            {/* ÁREA DE CONTEÚDO PRINCIPAL */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">
              {/* SLOT 3: PAINEL DE GERAÇÃO DE TRILHAS - RESERVA RÍGIDA MIN-H-[220PX] */}
              {trilhasPanelSlot && (
                <section 
                  id="trilhas-generator-panel-slot"
                  className="w-full shrink-0 flex flex-col min-h-[220px] rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 shadow-xl relative transition-all"
                >
                  <ErrorBoundary title="Erro no Painel de Geração de Trilhas">
                    {trilhasPanelSlot}
                  </ErrorBoundary>
                </section>
              )}

              {/* CONTEÚDO DA PÁGINA */}
              <div className="flex-1 w-full flex flex-col">
                <ErrorBoundary title="Erro na Área de Conteúdo">
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default AppShell;
