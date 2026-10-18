import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CriarJornadaView from "@/components/Jornadas/CriarJornadaView";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import { verifySessionCookie } from "@/lib/session";

export const runtime = "edge";

export default async function NovaJornadaPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    redirect("/login?redirect=/jornadas/novo");
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-muted)] text-sm">Carregando...</div>}>
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden pt-[80px]">
          <CriarJornadaView />
        </main>
        <Footer />
        <SideDrawer />
      </div>
    </Suspense>
  );
}
