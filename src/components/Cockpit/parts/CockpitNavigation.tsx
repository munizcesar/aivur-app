import { BookOpen, Layers3, ListChecks, Play } from "lucide-react";
import { useStudyStore, type StudyTab } from "@/store/useStudyStore";

const tabs: { key: StudyTab; label: string; icon: typeof BookOpen }[] = [
  { key: "video", label: "Aula", icon: Play },
  { key: "resumo", label: "Resumo Express", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", icon: Layers3 },
  { key: "questoes", label: "Questões", icon: ListChecks },
];

export default function CockpitNavigation() {
  const activeTab = useStudyStore((state) => state.activeTab);
  const setActiveTab = useStudyStore((state) => state.setActiveTab);

  return (
    <div className="border-b border-white/10" role="tablist" aria-label="Conteúdo do módulo">
      <div className="flex gap-5 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = key === activeTab;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(key)}
              className={`inline-flex flex-none items-center gap-2 rounded-lg border-b-2 px-1 pb-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
