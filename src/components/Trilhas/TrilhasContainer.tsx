"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import CriarTrilhaView from "./CriarTrilhaView";
import MinhasTrilhasView from "./MinhasTrilhasView";
import type { CourseTemplate } from "@/data/courses/templates";

interface TrilhasContainerProps {
  initialView?: "criar" | "minhas";
}

export default function TrilhasContainer({ initialView }: TrilhasContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determina a view inicial respeitando prioridade: query param > prop > padrão "criar"
  const getParamView = useCallback((): "criar" | "minhas" => {
    const v = searchParams.get("view");
    if (v === "minhas") return "minhas";
    if (v === "criar") return "criar";
    return initialView || "criar";
  }, [searchParams, initialView]);

  const [currentView, setCurrentView] = useState<"criar" | "minhas">(getParamView);

  // Estados para carregar templates selecionados na tela de criação
  const [prefilledTitle, setPrefilledTitle] = useState("");
  const [prefilledText, setPrefilledText] = useState("");

  // Sincroniza com mudanças de query param do histórico do navegador (back/forward)
  useEffect(() => {
    const viewFromParam = getParamView();
    setCurrentView(viewFromParam);
  }, [getParamView]);

  // Transição de visualização com roteamento client-side seguro (sem reload)
  const handleNavigateToMinhas = () => {
    setCurrentView("minhas");
    router.push("/trilhas?view=minhas", { scroll: false });
  };

  const handleNavigateToCriar = () => {
    setCurrentView("criar");
    router.push("/trilhas", { scroll: false });
  };

  // Gatilho rápido ao escolher um modelo pré-configurado
  const handleSelectTemplate = (template: CourseTemplate) => {
    setPrefilledTitle(template.title);
    setPrefilledText(template.suggestedPrompt || template.description);
    setCurrentView("criar");
    router.push("/trilhas", { scroll: false });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020C14] text-[#F8FAFC]">
      <Header />

      <main className="flex-1 transition-opacity duration-200">
        {currentView === "criar" ? (
          <CriarTrilhaView
            onNavigateToMinhas={handleNavigateToMinhas}
            initialTitle={prefilledTitle}
            initialText={prefilledText}
          />
        ) : (
          <MinhasTrilhasView
            onNavigateToCriar={handleNavigateToCriar}
            onSelectTemplate={handleSelectTemplate}
          />
        )}
      </main>

      <Footer />
      <SideDrawer />
    </div>
  );
}

