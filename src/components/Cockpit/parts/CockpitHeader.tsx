import { CheckCircle2 } from "lucide-react";
import studyPathMock from "@/mocks/studyPathMock";
import { useStudyStore } from "@/store/useStudyStore";

export default function CockpitHeader() {
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const completedTopicIds = useStudyStore((state) => state.completedTopicIds);
  const toggleTopicCompletion = useStudyStore((state) => state.toggleTopicCompletion);

  const activeModuleIndex = Math.max(
    0,
    studyPathMock.modulos.findIndex((module) => module.id === activeModuleId)
  );
  const activeModule = studyPathMock.modulos[activeModuleIndex];

  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          Conteúdo do módulo
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#fbead0]">{activeModule?.titulo}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs text-[#9bb3c0] sm:inline-flex">
          {activeModule?.progresso}% concluído
        </span>
        {currentTopicId && (
          <button
            onClick={() => toggleTopicCompletion(currentTopicId)}
            className={
              completedTopicIds.includes(currentTopicId)
                ? "flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg shadow-inner text-sm font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all duration-200"
                : "flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all duration-200"
            }
          >
            <CheckCircle2 size={16} />
            {completedTopicIds.includes(currentTopicId) ? "Tópico Concluído" : "Concluir Tópico"}
          </button>
        )}
      </div>
    </div>
  );
}
