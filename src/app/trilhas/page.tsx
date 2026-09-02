import { Suspense } from "react";
import type { Metadata } from "next";
import TrilhasContainer from "@/components/Trilhas/TrilhasContainer";

export const metadata: Metadata = {
  title: "Trilhas de Estudo com IA — AIVUR",
  description: "Crie e acompanhe suas trilhas de estudo personalizadas baseadas no edital do seu concurso.",
};

export default function TrilhasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020C14] text-[#6B99B3]">
          Carregando trilhas de estudo...
        </div>
      }
    >
      <TrilhasContainer initialView="criar" />
    </Suspense>
  );
}

