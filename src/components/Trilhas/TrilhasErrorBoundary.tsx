"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class TrilhasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Trilhas components:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-0 mb-12">
          <div className="rounded-xl border border-[var(--color-red)]/30 bg-[var(--color-surface)]/50 p-8 text-center backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-[var(--color-red)]/15 flex items-center justify-center mx-auto mb-4 text-[var(--color-red)]">
              <AlertTriangle className="w-6 h-6 shrink-0" strokeWidth={2.1} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">
              Não foi possível carregar suas trilhas
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-6">
              Ocorreu um erro ao processar os dados das suas trilhas ativas. Isso pode acontecer devido a uma atualização no sistema.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-surface-offset)] hover:bg-[var(--color-bg)] border border-[rgba(107,153,179,0.3)] text-[var(--color-heading)] text-sm font-semibold transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
