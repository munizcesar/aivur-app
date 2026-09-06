import { Menu } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

export default function CockpitMobileTrigger() {
  const setIsSidebarOpen = useStudyStore((state) => state.setIsSidebarOpen);

  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Abrir trilha do edital"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
