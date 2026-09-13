import { Suspense } from "react";
import CriarTrilhaView from "@/components/Trilhas/CriarTrilhaView";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";

/**
 * Sub-rota /trilhas/novo — Gerador IA de Trilhas.
 * <Suspense> é obrigatório no App Router quando qualquer componente filho
 * chama useSearchParams() — sem ele o build estático falha no prerender.
 */
export default function NovaTrilhaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[#6B99B3] text-sm">Carregando...</div>}>
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col"><Header /><main className="flex-1 overflow-x-hidden pt-[116px]"><CriarTrilhaView /></main><Footer /><SideDrawer /></div>
    </Suspense>
  );
}



