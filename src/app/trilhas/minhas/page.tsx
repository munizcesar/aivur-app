import { Suspense } from "react";
import type { Metadata } from "next";
import TrilhasContainer from "@/components/Trilhas/TrilhasContainer";

export const metadata: Metadata = {
  title: "Minhas Trilhas — AIVUR",
  description: "Acompanhe o progresso das suas trilhas de estudo.",
};

export default function MinhasTrilhasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020C14] text-[#6B99B3]">
          Carregando trilhas de estudo...
        </div>
      }
    >
      <TrilhasContainer initialView="minhas" />
    </Suspense>
  );
}

