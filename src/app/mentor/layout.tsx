import type { Metadata } from "next";
import Header from "@/components/Header/Header";

export const metadata: Metadata = {
  title: "Trilha de Curso — AIVUR",
  description:
    "Acompanhe seu progresso de estudos com trilhas de conteúdo organizadas por matéria e tópico, baseadas no edital do seu concurso.",
};

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
