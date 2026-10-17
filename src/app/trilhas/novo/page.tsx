import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CriarTrilhaView from "@/components/Trilhas/CriarTrilhaView";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { verifySessionCookie } from "@/lib/session";

export const runtime = "edge";

/**
 * Sub-rota /trilhas/novo — Gerador IA de Trilhas.
 * <Suspense> é obrigatório no App Router quando qualquer componente filho
 * chama useSearchParams() — sem ele o build estático falha no prerender.
 */
export default async function NovaTrilhaPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">Carregando...</div>}>
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col"><Header /><main className="flex-1 overflow-x-hidden pt-[80px]"><CriarTrilhaView /></main><Footer /><SideDrawer /></div>
    </Suspense>
  );
}



