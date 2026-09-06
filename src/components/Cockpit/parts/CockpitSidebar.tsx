import { X } from "lucide-react";
import studyPathMock from "@/mocks/studyPathMock";
import { useStudyStore } from "@/store/useStudyStore";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";

export default function CockpitSidebar() {
  const isSidebarOpen = useStudyStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useStudyStore((state) => state.setIsSidebarOpen);

  return (
    <>
      {/* Backdrop Mobile */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* 1. SIDEBAR (TRILHAS) - FIXA NA ESQUERDA, EXATAMENTE 320px */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 shrink-0 bg-white border-r border-slate-200 overflow-y-auto shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                Modo Flow
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-800">Trilhas</h2>
            </div>
            <button
              type="button"
              aria-label="Fechar trilha"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {studyPathMock.modulos.map((module) => (
              <TrilhasAccordion
                key={module.id}
                title={module.titulo}
                progressPercent={module.progresso}
                topics={module.subtópicos.map((t) => ({
                  id: t.id,
                  label: t.titulo,
                  done: t.status === "completed",
                }))}
              />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
