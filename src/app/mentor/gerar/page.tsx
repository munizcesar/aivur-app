import type { Metadata } from "next";
import Generator from "@/components/Mentor/Generator";

export const metadata: Metadata = {
  title: "Gerar Trilha com IA | AIVUR Mentor",
  description: "Crie sua trilha de conteúdo personalizada com base em qualquer edital usando IA.",
};

export default function GerarPage() {
  return <Generator />;
}
