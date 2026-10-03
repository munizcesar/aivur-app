"use client";

import { useState } from "react";
import styles from "./QuizTool.module.css";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

// Mock data
const mockQuestions = [
  {
    id: 1,
    text: "Segundo a Constituição Federal, é garantido o direito de propriedade, desde que:",
    options: [
      { id: "A", text: "Atenda à sua função social." },
      { id: "B", text: "O proprietário pague o IPTU anualmente sem atrasos." },
      { id: "C", text: "Seja destinada exclusivamente para moradia." },
      { id: "D", text: "Haja autorização prévia do município." }
    ],
    correctOptionId: "A",
    explanation: "A Constituição Federal estabelece em seu Art. 5º, inciso XXIII, que a propriedade atenderá a sua função social. Não basta ter o título, ela precisa cumprir um propósito na sociedade."
  },
  {
    id: 2,
    text: "Sobre os direitos políticos, o alistamento eleitoral e o voto são facultativos para:",
    options: [
      { id: "A", text: "Os maiores de dezoito anos e menores de sessenta anos." },
      { id: "B", text: "Os analfabetos, os maiores de setenta anos e os maiores de dezesseis e menores de dezoito anos." },
      { id: "C", text: "Apenas para os analfabetos e maiores de setenta anos." },
      { id: "D", text: "Os militares em serviço ativo." }
    ],
    correctOptionId: "B",
    explanation: "Conforme o Art. 14, § 1º, II da CF, o alistamento e o voto são facultativos para analfabetos, maiores de 70 anos e maiores de 16 e menores de 18 anos."
  }
];

export default function QuizTool() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const question = mockQuestions[currentIndex];

  const handleSelect = (id: string) => {
    if (isConfirmed) return; // Prevent changing after confirmation
    setSelectedOption(id);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  const handleNext = () => {
    setIsConfirmed(false);
    setSelectedOption(null);
    setCurrentIndex((prev) => Math.min(prev + 1, mockQuestions.length - 1));
  };

  return (
    <div className={styles.quizContainer}>
      <header className={styles.quizHeader}>
        <span className={styles.progressCounter}>
          Questão {currentIndex + 1} de {mockQuestions.length}
        </span>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((currentIndex + 1) / mockQuestions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className={styles.questionBlock}>
        <h3 className={styles.questionText}>{question.text}</h3>
        
        <div className={styles.optionsList}>
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === question.correctOptionId;
            const isWrongSelected = isConfirmed && isSelected && !isCorrect;
            const isSuccess = isConfirmed && isCorrect;

            let stateClass = "";
            if (isConfirmed) {
              if (isSuccess) stateClass = styles.optionCorrect;
              else if (isWrongSelected) stateClass = styles.optionWrong;
              else stateClass = styles.optionDimmed;
            } else if (isSelected) {
              stateClass = styles.optionSelected;
            }

            return (
              <button
                key={opt.id}
                className={`${styles.optionCard} ${stateClass}`}
                onClick={() => handleSelect(opt.id)}
                disabled={isConfirmed}
              >
                <div className={styles.optionLetter}>{opt.id}</div>
                <div className={styles.optionText}>{opt.text}</div>
                {isConfirmed && isSuccess && <CheckCircle2 className={styles.resultIconCorrect} />}
                {isConfirmed && isWrongSelected && <XCircle className={styles.resultIconWrong} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.actionArea}>
        {!isConfirmed ? (
          <button 
            className={styles.confirmBtn} 
            disabled={!selectedOption}
            onClick={handleConfirm}
          >
            Confirmar Resposta
          </button>
        ) : (
          <div className={styles.feedbackArea}>
            <div className={styles.mentorExplanation}>
              <div className={styles.mentorHeader}>
                <Lightbulb width={18} height={18} />
                <strong>Explicação do Mentor</strong>
              </div>
              <p>{question.explanation}</p>
            </div>
            
            <button 
              className={styles.nextBtn} 
              onClick={handleNext}
              disabled={currentIndex === mockQuestions.length - 1}
            >
              {currentIndex === mockQuestions.length - 1 ? "Simulado Finalizado" : "Próxima Questão ➔"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
