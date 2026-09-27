import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasCockpitV2 from "@/components/Trilhas/TrilhasCockpitV2";
import HubTrilhasGrid from "@/components/Trilhas/HubTrilhasGrid";

export const metadata: Metadata = {
  title: "Gerar Trilha Estratégica · AIVUR",
  description:
    "Cole um link do YouTube, texto ou edital e gere flashcards e questões com IA em segundos.",
};

export default function TrilhasPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-bg)]">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-12">
        <TrilhasCockpitV2 />
        <hr className="border-t border-white/10" />
        <HubTrilhasGrid />
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
