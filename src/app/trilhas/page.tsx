import type { Metadata } from "next";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import TrilhasCockpitV2 from "@/components/Trilhas/TrilhasCockpitV2";

export const metadata: Metadata = {
  title: "Gerar Trilha Estratégica · AIVUR",
  description:
    "Cole um link do YouTube, texto ou edital e gere flashcards e questões com IA em segundos.",
};

export default function TrilhasPage() {
  return (
    // O background imersivo é aplicado dentro do TrilhasCockpitV2.
    // O shell aqui apenas segura Header/Footer sem sobrepor o design escuro do Cockpit.
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <TrilhasCockpitV2 />
      </main>
      <Footer />
      <SideDrawer />
    </div>
  );
}
