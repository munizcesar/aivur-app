interface TrilhaProgressBarProps {
  /** Valor já calculado pelo chamador (0–100). Este componente NÃO calcula progresso. */
  percent: number;
  label: string;
  /** Texto exibido no lugar do percentual quando percent === 0 (ex.: "Não iniciado"). */
  emptyLabel?: string;
}

/**
 * Barra de progresso puramente visual, compartilhada entre "Minhas trilhas"
 * (client) e "Exemplos de trilhas" (server). Sem hooks — segura nos dois contextos.
 */
export default function TrilhaProgressBar({ percent, label, emptyLabel }: TrilhaProgressBarProps) {
  const safe = Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.round(percent))) : 0;
  const showEmpty = safe === 0 && emptyLabel;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
        <span className="font-semibold text-[var(--color-text-muted)]">{label}</span>
        <span
          className={`font-bold tabular-nums ${
            showEmpty ? "text-[var(--color-text-muted)]" : "text-[var(--color-heading)]"
          }`}
        >
          {showEmpty ? emptyLabel : `${safe}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-offset)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
