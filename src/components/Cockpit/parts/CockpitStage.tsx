import { BookOpen, CheckCircle2, Circle, Layers3, LockKeyhole } from "lucide-react";
import studyPathMock, { type StudyTopicStatus } from "@/mocks/studyPathMock";
import { useStudyStore } from "@/store/useStudyStore";
import QuestionsTab from "@/components/Cockpit/parts/QuestionsTab";
import VideoPlayerHub from "@/components/Cockpit/VideoPlayerHub";
import FlashcardsTab from "@/components/Cockpit/parts/FlashcardsTab";

const statusLabel: Record<StudyTopicStatus, string> = {
  completed: "Concluído",
  in_progress: "Em andamento",
  locked: "Bloqueado",
};

function getStatusIcon(status: StudyTopicStatus) {
  if (status === "completed") return <CheckCircle2 size={17} aria-hidden="true" />;
  if (status === "locked") return <LockKeyhole size={16} aria-hidden="true" />;
  return <Circle size={16} aria-hidden="true" />;
}

export default function CockpitStage() {
  const activeModuleId = useStudyStore((state) => state.activeModuleId);
  const currentTopicId = useStudyStore((state) => state.currentTopicId);
  const activeTab = useStudyStore((state) => state.activeTab);

  const activeModuleIndex = Math.max(
    0,
    studyPathMock.modulos.findIndex((module) => module.id === activeModuleId)
  );
  const activeModule = studyPathMock.modulos[activeModuleIndex];
  
  const activeTopicTitle = activeModule?.subtópicos.find((t) => t.id === currentTopicId)?.titulo;

  return (
    <div
      className="flex-1 overflow-y-auto pb-32 custom-scrollbar mt-6"
      style={{ paddingBottom: "128px" }}
    >
      {activeTab === "questoes" ? (
        <QuestionsTab />
      ) : activeTab === "video" ? (
        <VideoPlayerHub topicTitle={activeTopicTitle} />
      ) : activeTab === "flashcards" ? (
        <FlashcardsTab />
      ) : (
        <div
          aria-label={`Área reservada para ${activeTab === "resumo" ? "Resumo Express" : "Flashcards"}`}
          className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"
        >
           <div className="mb-4 rounded-full bg-white/5 p-4 text-[#6b99b3]">
              <BookOpen size={32} />
           </div>
           <h3 className="mb-2 text-xl font-bold text-[#fbead0]">
             Resumo Express
           </h3>
           <p className="max-w-md text-sm text-[#9bb3c0]">
             Você está visualizando o módulo correspondente ao tópico selecionado na sua trilha. O motor de {activeTab} carregará o conteúdo inteligente aqui.
           </p>
        </div>
      )}

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
