"use client";

import { useEffect, useState } from "react";
import QuestionSkeleton from "@/components/UI/QuestionSkeleton";
import QuestionCard from "@/components/Cockpit/QuestionCard";
import CockpitStats from "@/components/Cockpit/CockpitStats";
import { cockpitQuestions } from "@/mocks/cockpitQuestionsMock";
import { useStudyStore } from "@/store/useStudyStore";

export default function QuestionList() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const isLoading = useStudyStore((state) => state.isLoading);
  const fetchQuestions = useStudyStore((state) => state.fetchQuestions);
  const registerAnswer = useStudyStore((state) => state.registerAnswer);
  const answeredCount = useStudyStore((state) => state.progressData.answered);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const selectAnswer = (questionId: string, optionId: string) => {
    if (answeredQuestions[questionId]) return;
    setSelectedAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  const confirmAnswer = (questionId: string, correctAnswer: string) => {
    const selected = selectedAnswers[questionId];
    if (!selected) return;
    registerAnswer(questionId, selected === correctAnswer);
    setAnsweredQuestions((current) => ({ ...current, [questionId]: true }));
  };

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b99b3]">
            Questões do módulo
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#fbead0]">Pratique antes de avançar</h3>
        </div>
        <span className="hidden text-xs text-[#9bb3c0] sm:block">
          {answeredCount}/{cockpitQuestions.length} respondidas
        </span>
      </div>

      <CockpitStats />

      {isLoading
        ? Array.from({ length: 4 }, (_, index) => <QuestionSkeleton key={`question-skeleton-${index}`} />)
        : cockpitQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              selected={selectedAnswers[question.id] ?? null}
              answered={Boolean(answeredQuestions[question.id])}
              onSelect={(optionId) => selectAnswer(question.id, optionId)}
              onConfirm={() => confirmAnswer(question.id, question.correta)}
            />
          ))}
    </div>
  );
}
