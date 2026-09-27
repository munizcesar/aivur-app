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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header />
      <main 
        style={{ 
          flex: 1, 
          background: "linear-gradient(160deg, #091422 0%, #0E1F30 45%, #0A1018 100%)" 
        }}
      >
        <TrilhasCockpitV2 />
        
        {/* Separador elegante com fade */}
        <div className="w-full max-w-[1040px] mx-auto h-[1px] my-4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <HubTrilhasGrid />
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
