import TrilhasContainer from "@/components/Trilhas/TrilhasContainer";

/**
 * Sub-rota /trilhas/novo — Gerador IA de Trilhas.
 * Isola o formulário de criação sem conflitar com o dashboard em /trilhas.
 */
export default function NovaTrilhaPage() {
  return <TrilhasContainer initialView="criar" />;
}
