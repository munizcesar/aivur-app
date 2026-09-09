import { BookOpen, CheckCircle2, Circle, Layers3, LockKeyhole } from "lucide-react";
import type { StudyTopicStatus } from "@/mocks/studyPathMock";
import { useStudyStore } from "@/store/useStudyStore";
import QuestionsTab from "@/components/Cockpit/parts/QuestionsTab";
import VideoPlayerHub from "@/components/Cockpit/VideoPlayerHub";
import FlashcardsTab from "@/components/Cockpit/parts/FlashcardsTab";
import ResumeTab from "@/components/Cockpit/parts/ResumeTab";

const statusLabel: Record<StudyTopicStatus, string> = {
  completed: "Concluído",
  in_progress: "Em andamento",
  locked: "Bloqueado",
};

function getStatusIcon(status: StudyTopicStatus) {
  if (status === "completed") return <CheckCircle2 size={17} aria-hidden="true" className="shrink-0 flex-none" />;
  if (status === "locked") return <LockKeyhole size={16} aria-hidden="true" className="shrink-0 flex-none" />;
  return <Circle size={16} aria-hidden="true" className="shrink-0 flex-none" />;
}

export default function CockpitStage() {
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const activeTab = useStudyStore((state) => state.activeTab);
  const modules = useStudyStore((state) => state.modules);

  const activeModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.id === activeModuleId)
  );
  const activeModule = modules[activeModuleIndex];
  
  const activeTopicTitle = activeModule?.subtópicos.find((t) => t.id === currentTopicId)?.titulo;

  return (
    <div
      className="mt-6 flex-1 min-w-0 overflow-y-auto pb-32 custom-scrollbar w-full"
      style={{ paddingBottom: "128px" }}
    >
      <div className={activeTab === "questoes" ? "block h-full" : "hidden"}>
        <QuestionsTab />
      </div>
      <div className={activeTab === "video" ? "block h-full" : "hidden"}>
        <VideoPlayerHub topicTitle={activeTopicTitle} subjectName={activeModule?.titulo} />
      </div>
      <div className={activeTab === "flashcards" ? "block h-full" : "hidden"}>
        <FlashcardsTab topicTitle={activeTopicTitle} subjectName={activeModule?.titulo} />
      </div>
      <div className={activeTab === "resumo" ? "block h-full" : "hidden"}>
        <ResumeTab />
      </div>

      <div className="mt-8 border-t border-white/10 pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b99b3]">
        Tópicos deste módulo
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {activeModule?.subtópicos.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"
          >
            <span
              className={`flex-none ${
                topic.status === "completed"
                  ? "text-emerald-400"
                  : topic.status === "in_progress"
                    ? "text-[var(--color-primary)]"
                    : "text-[#6b99b3]"
              }`}
              title={statusLabel[topic.status]}
            >
              {getStatusIcon(topic.status)}
            </span>
            <span className="min-w-0 flex-1 text-sm text-[#dce8ed]">{topic.titulo}</span>
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b99b3]">
              {statusLabel[topic.status]}
            </span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
