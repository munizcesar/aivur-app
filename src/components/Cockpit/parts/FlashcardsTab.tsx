import { useState } from "react";
import { XCircle, ThumbsUp, CheckCircle2, RotateCcw } from "lucide-react";

interface Flashcard {
  id: string;
  pergunta: string;
  resposta: string;
}

const mockFlashcards: Flashcard[] = [
  {
    id: "fc-1",
    pergunta: "O que é o princípio da Anterioridade Tributária?",
    resposta: "Nenhum tributo será cobrado no mesmo exercício financeiro em que haja sido publicada a lei que os instituiu ou aumentou.",
  },
  {
    id: "fc-2",
    pergunta: "Quais são os elementos constitutivos do Estado?",
    resposta: "Povo, Território e Governo Soberano.",
  },
  {
    id: "fc-3",
    pergunta: "O que caracteriza o dolo eventual no Direito Penal?",
    resposta: "Quando o agente, embora não querendo diretamente o resultado, assume o risco de produzi-lo.",
  }
];

export default function FlashcardsTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = mockFlashcards[currentIndex];
  const isFinished = currentIndex >= mockFlashcards.length;

  const handleFeedback = (feedback: "errei" | "bom" | "facil") => {
    // Aqui no futuro será injetada a lógica de repetição espaçada no backend
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 150); // Aguarda o card voltar para frente antes de trocar o texto
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (isFinished) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center mt-8">
        <div className="mb-4 rounded-full bg-emerald-500/10 p-4 text-emerald-400">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-[#fbead0]">Sessão Concluída!</h3>
        <p className="max-w-md text-sm text-[#9bb3c0] mb-6">
          Você revisou todos os flashcards programados para hoje neste tópico.
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-medium transition-colors"
        >
          <RotateCcw size={16} />
          Revisar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pb-10">
      {/* Container do Card 3D */}
      <div 
        className="w-full max-w-2xl mx-auto h-[400px] perspective-[1000px] cursor-pointer group mt-8"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* Face Frontal (Pergunta) */}
          <div className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-2xl shadow-sm [backface-visibility:hidden] flex flex-col items-center justify-center p-8 text-center group-hover:shadow-md transition-shadow">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-6">
              Pergunta {currentIndex + 1} de {mockFlashcards.length}
            </span>
            <h3 className="text-2xl font-medium text-slate-800 leading-snug">
              {card.pergunta}
            </h3>
            <p className="absolute bottom-6 text-sm font-medium text-slate-400">
              Clique para revelar a resposta
            </p>
          </div>

          {/* Face Traseira (Resposta) */}
          <div className="absolute inset-0 w-full h-full bg-slate-50 border border-slate-200 rounded-2xl shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-6">
              Resposta
            </span>
            <h3 className="text-xl font-medium text-slate-800 leading-relaxed">
              {card.resposta}
            </h3>
          </div>
        </div>
      </div>

      {/* Painel de Feedback (Repetição Espaçada) */}
      <div className={`mt-8 flex items-center justify-center gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFeedback("errei");
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-200 rounded-lg shadow-sm text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-95 transition-all duration-200"
        >
          <XCircle size={18} />
          Errei (1m)
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFeedback("bom");
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-indigo-200 rounded-lg shadow-sm text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all duration-200"
        >
          <ThumbsUp size={18} />
          Bom (10m)
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFeedback("facil");
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-emerald-200 rounded-lg shadow-sm text-sm font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all duration-200"
        >
          <CheckCircle2 size={18} />
          Fácil (4d)
        </button>
      </div>
    </div>
  );
}
