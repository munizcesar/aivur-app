import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import TrilhaSala from "@/components/Trilhas/TrilhaSala";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return TRILHAS_MOCK.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trilha = TRILHAS_MOCK.find((t) => t.id === id);
  if (!trilha) return { title: "Trilha nao encontrada · AIVUR" };
  return {
    title: `${trilha.titulo} · AIVUR`,
    description: `Estude ${trilha.titulo} com video, flashcards e questoes na plataforma AIVUR.`,
  };
}

export default async function TrilhaSalaPage({ params }: Props) {
  const { id } = await params;
  const trilha = TRILHAS_MOCK.find((t) => t.id === id);
  if (!trilha) notFound();
  return <TrilhaSala />;
}