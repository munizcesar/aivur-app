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
    <div
      className="flex items-center justify-start md:justify-center gap-2 p-1.5 bg-[#091422]/80 backdrop-blur-md border border-[#C9A84C]/20 md:rounded-full rounded-2xl w-full md:w-fit mx-auto mb-6 shadow-xl overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Conteúdo do módulo"
    >
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = key === activeTab;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(key)}
            className={`inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/50 ${
              isActive
                ? "bg-[#122338] font-semibold text-[#C9A84C] shadow-md"
                : "font-medium text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon size={17} aria-hidden="true" className="shrink-0 flex-none" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
