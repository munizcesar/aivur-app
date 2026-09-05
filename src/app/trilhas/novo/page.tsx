import { Suspense } from "react";
import TrilhasContainer from "@/components/Trilhas/TrilhasContainer";

/**
 * Sub-rota /trilhas/novo — Gerador IA de Trilhas.
 * <Suspense> é obrigatório no App Router quando qualquer componente filho
 * chama useSearchParams() — sem ele o build estático falha no prerender.
 */
export default function NovaTrilhaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020C14] text-[#6B99B3] text-sm">Carregando...</div>}>
      <TrilhasContainer initialView="criar" />
    </Suspense>
  );
}
