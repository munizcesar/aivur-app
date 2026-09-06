import { useState } from "react";
import { CheckCircle2, ChevronRight, Info, RotateCcw, XCircle } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";

interface Option {
  texto: string;
  isCorreta: boolean;
}

interface Question {
  id: string;
  banca: string;
  ano: string;
  enunciado: string;
  alternativas: Option[];
  comentario: string;
}

const mockQuestions: Question[] = [
  {
    id: "q-1",
    banca: "VUNESP",
    ano: "2024",
    enunciado: "De acordo com a Lei nº 8.112/1990, a investidura em cargo público ocorrerá com a:",
    alternativas: [
      { texto: "Nomeação.", isCorreta: false },
      { texto: "Posse.", isCorreta: true },
      { texto: "Homologação do concurso.", isCorreta: false },
      { texto: "Aprovação em estágio probatório.", isCorreta: false },
    ],
    comentario: "A investidura em cargo público ocorre com a posse (Art. 7º da Lei 8.112/90). A nomeação é apenas o provimento, e o exercício é o efetivo desempenho das atribuições.",
  },
  {
    id: "q-2",
    banca: "CESPE/CEBRASPE",
    ano: "2023",
    enunciado: "O princípio administrativo que impõe ao agente público o dever de buscar os melhores resultados com o menor custo possível é o princípio da:",
    alternativas: [
      { texto: "Legalidade.", isCorreta: false },
      { texto: "Impessoalidade.", isCorreta: false },
      { texto: "Publicidade.", isCorreta: false },
      { texto: "Eficiência.", isCorreta: true },
    ],
    comentario: "O Princípio da Eficiência (incluído pela EC 19/98) exige que a atividade administrativa seja exercida com presteza, perfeição e rendimento funcional.",
  }
];

const letters = ["A", "B", "C", "D", "E"];

export default function QuestionsTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Removido o fetchQuestions para focar na lógica do mock local do simulador Premium.
  // const isLoading = useStudyStore((state) => state.isLoading);

  const question = mockQuestions[currentIndex];
  const isFinished = currentIndex >= mockQuestions.length;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (isFinished) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center mt-8">
        <div className="mb-4 rounded-full bg-indigo-500/10 p-4 text-indigo-400">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-[#fbead0]">Simulador Concluído!</h3>
        <p className="max-w-md text-sm text-[#9bb3c0] mb-6">
          Você finalizou todas as questões de alto foco para este tópico.
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-medium transition-colors"
        >
          <RotateCcw size={16} />
          Fazer Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 pb-10">
      {/* Cabeçalho da Questão */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
          Questão {currentIndex + 1} de {mockQuestions.length}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {question.banca} - {question.ano}
        </span>
      </div>

      {/* Enunciado */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
        <p className="text-lg text-slate-800 font-medium leading-relaxed">
          {question.enunciado}
        </p>
      </div>

      {/* Alternativas (Botões Táteis) */}
      <div className="flex flex-col gap-3">
        {question.alternativas.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = opt.isCorreta;

          let buttonClass = "w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex gap-4 items-start";
          let letterClass = "w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold shrink-0";
          let icon = null;

          if (isAnswered) {
            buttonClass += " pointer-events-none"; // Trava após resposta
            
            if (isCorrect) {
              buttonClass = "w-full text-left p-4 rounded-xl flex gap-4 items-start transition-all pointer-events-none bg-emerald-50 border border-emerald-500 text-emerald-900 ring-1 ring-emerald-500";
              letterClass = "w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 text-white font-bold shrink-0";
              icon = <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-1" />;
            } else if (isSelected && !isCorrect) {
              buttonClass = "w-full text-left p-4 rounded-xl flex gap-4 items-start transition-all pointer-events-none bg-rose-50 border border-rose-500 text-rose-900";
              letterClass = "w-8 h-8 rounded-full flex items-center justify-center bg-rose-500 text-white font-bold shrink-0";
              icon = <XCircle size={20} className="text-rose-600 shrink-0 mt-1" />;
            } else {
              buttonClass = "w-full text-left p-4 rounded-xl border border-slate-200 bg-white opacity-50 flex gap-4 items-start pointer-events-none";
            }
          } else if (isSelected) {
            buttonClass = "w-full text-left p-4 rounded-xl border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 flex gap-4 items-start";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              className={buttonClass}
              type="button"
              aria-pressed={isSelected}
              disabled={isAnswered}
            >
              <div className={letterClass}>{letters[idx]}</div>
              <span className="flex-1 mt-1 text-base">{opt.texto}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Painel de Resolução (Gabarito Comentado) */}
      {isAnswered && (
        <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <Info className="shrink-0 text-indigo-500 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-indigo-900 mb-2">Comentário do Professor</h4>
              <p className="text-indigo-800/90 leading-relaxed text-sm">
                {question.comentario}
              </p>
            </div>
          </div>
          
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-semibold transition-all active:scale-95"
            >
              Próxima Questão
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
