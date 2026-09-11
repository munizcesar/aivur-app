import { CheckCircle2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

export default function CockpitHeader() {
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);
  const toggleTopicCompletion = useStudyStore((state) => state.toggleTopicCompletion);
  const modules = useStudyStore((state) => state.modules);

  const activeModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.id === activeModuleId)
  );
  const activeModule = modules[activeModuleIndex];
  const activeTopic = activeModule?.subtópicos.find((t) => t.id === currentTopicId);

  return (
    <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-slate-400">
          <span className="font-medium text-slate-300">{activeModule?.titulo}</span>
          {activeTopic && (
            <>
              <span className="mx-2 text-slate-500">/</span>
              <span>{activeTopic.titulo}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs text-[#9bb3c0] sm:inline-flex">
          {activeModule?.progresso}% concluído
        </span>
        {currentTopicId && (
          <button
            onClick={() => toggleTopicCompletion(currentTopicId)}
            className={
              completedTopicIds.includes(currentTopicId)
                ? "flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all duration-200 active:scale-95"
                : "flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#122338] px-4 py-2 text-sm font-semibold text-[#C9A84C] shadow-sm transition-all duration-200 hover:bg-[#1E3A5F] active:scale-95"
            }
          >
            <CheckCircle2 size={16} className="shrink-0 flex-none" />
            {completedTopicIds.includes(currentTopicId) ? "Tópico Concluído" : "Concluir Tópico"}
          </button>
        )}
      </div>
    </div>
  );
}
