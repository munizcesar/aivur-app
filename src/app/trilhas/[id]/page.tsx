import type { Metadata } from "next";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import TrilhaSalaV2 from "@/components/Trilhas/TrilhaSalaV2";

interface Props {
  params: Promise<{ id: string }>;
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
  return <TrilhaSalaV2 key={id} />;
}