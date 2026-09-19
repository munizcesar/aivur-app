import { CheckCircle2, Circle, LockKeyhole } from "lucide-react";
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

  const activeModule = modules.find((module) => module.id === activeModuleId);
  const activeTopic = activeModule?.subtópicos.find((t) => t.id === currentTopicId);
  const activeTopicTitle = activeTopic?.titulo;

  // Guard Clause: evita crash/tela branca enquanto o tópico ainda hidrata
  if (!activeTopic || !activeModuleId || !activeModule) {
    return (
      <div className="mt-6 flex min-h-[320px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-[#C9A84C]/10 backdrop-blur-sm">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
          <p className="text-[#C9A84C] font-semibold tracking-wide">Carregando módulo tático...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-2 flex-1 min-w-0 w-full overflow-y-auto pb-32 custom-scrollbar"
      style={{ paddingBottom: "128px" }}
    >
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-[#C9A84C]/10 backdrop-blur-sm">
        {/* Abas montadas com hidden/block — player de vídeo nunca desmonta */}
        <div className={activeTab === "questoes" ? "block h-full w-full" : "hidden"}>
          <QuestionsTab />
        </div>
        <div className={activeTab === "video" ? "block h-full w-full" : "hidden"}>
          <VideoPlayerHub topicTitle={activeTopicTitle} subjectName={activeModule.titulo} />
        </div>
        <div className={activeTab === "flashcards" ? "block h-full w-full" : "hidden"}>
          <FlashcardsTab topicTitle={activeTopicTitle} subjectName={activeModule.titulo} />
        </div>
        <div className={activeTab === "resumo" ? "block h-full w-full" : "hidden"}>
          <ResumeTab />
        </div>

        <div className="mx-6 mt-2 border-t border-white/5 py-6 md:mx-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b99b3]">
            Tópicos deste módulo
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activeModule.subtópicos.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <span
                  className={`flex-none ${
                    topic.status === "completed"
                      ? "text-emerald-400"
                      : topic.status === "in_progress"
                        ? "text-[#C9A84C]"
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
      </section>
    </div>
  );
}
