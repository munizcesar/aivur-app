import type { Metadata } from "next";
import { TRILHAS_MOCK } from "@/mocks/trilhasMock";
import TrilhaSalaV2 from "@/components/Trilhas/TrilhaSalaV2";

interface Props {
  params: Promise<{ id: string }>;
}

/** Allows pre-rendering the static mock trilhas at build time. */
export async function generateStaticParams() {
  return TRILHAS_MOCK.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trilha = TRILHAS_MOCK.find((t) => t.id === id);
  if (!trilha) return { title: "Trilha não encontrada — AIVUR" };
  return {
    title: `${trilha.titulo} (V2) — AIVUR`,
    description: `Cockpit V2 — Estude ${trilha.titulo} com vídeo, resumo, flashcards e questões em layout accordion.`,
  };
}

export default async function TrilhaSalaV2Page({ params }: Props) {
  const { id } = await params;
  // Client component handles its own notFound logic via the store
  return <TrilhaSalaV2 key={id} />;
}
