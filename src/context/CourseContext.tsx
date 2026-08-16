"use client";

import React, { createContext, useContext, useState } from "react";

export type Tab = "teoria" | "flashcards" | "questoes";

interface CourseContextValue {
  courseId: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  dificuldade: string;
  setDificuldade: (dif: string) => void;
  banca: string;
  setBanca: (banca: string) => void;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ courseId, children }: { courseId: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("teoria");
  const [dificuldade, setDificuldade] = useState("Média");
  const [banca, setBanca] = useState("Padrão/Geral");

  return (
    <CourseContext.Provider value={{ courseId, activeTab, setActiveTab, dificuldade, setDificuldade, banca, setBanca }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseContext() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseContext must be used within a CourseProvider");
  }
  return context;
}
