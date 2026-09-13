import TrilhaCriadorMicro from "@/components/Trilhas/TrilhaCriadorMicro";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Trilha de Microlearning · AIVUR",
  description: "Crie trilhas personalizadas de microlearning com video, flashcards e questoes.",
};

export default function TrilhaCriarPage() {
  return <TrilhaCriadorMicro />;
}