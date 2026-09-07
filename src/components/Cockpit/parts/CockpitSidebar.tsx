import { X } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import TrilhasAccordion from "@/components/Cockpit/TrilhasAccordion";

export default function CockpitSidebar() {
  const isMobileDrawerOpen = useStudyStore((state) => state.isMobileDrawerOpen);
  const toggleMobileDrawer = useStudyStore((state) => state.toggleMobileDrawer);
  const modules = useStudyStore((state) => state.modules);

  return (
    <aside
      className={`
        fixed inset-y-0 right-0 z-50 flex h-screen w-full flex-col
        bg-[#091422] border-l border-[#C9A84C]/20
        transform transition-transform duration-300 md:w-96
        lg:relative lg:inset-auto lg:h-screen lg:w-full lg:translate-x-0 lg:shrink-0 lg:flex-none lg:border-l
        ${ isMobileDrawerOpen ? 'translate-x-0' : 'translate-x-full' }
      `}
    >
        <div className="flex h-full min-w-0 flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C]">
                Modo Flow
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#FBEBD0]">Trilhas</h2>
            </div>
            <button
              type="button"
              aria-label="Fechar trilha"
              onClick={toggleMobileDrawer}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 lg:hidden"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-6">
            {modules.map((module, idx) => (
              <TrilhasAccordion
                key={module.id}
                moduleId={module.id}
                title={module.titulo}
                disciplineIndex={idx}
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
  );
}
