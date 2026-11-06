/**
 * Utilitário agnóstico para Detecção de Cargos em Editais.
 * Módulo puramente funcional (regex sobre strings), sem qualquer dependência
 * de PDF.js, Cloudflare Edge ou APIs externas.
 */

export interface CargoAnalysisResult {
  hasMultiple: boolean;
  cargos: string[];
}

/**
 * Analisa o texto para detectar menção a múltiplos cargos no edital.
 */
export function detectMultipleCargosInText(text: string): CargoAnalysisResult {
  const cargosFound = new Set<string>();
  const cargoRegex = /(?:cargo(?:\s*\d+)?(?:\s*:\s*|\s+de\s+)|\bnível\s+[^\n:]+:\s*)([^\n\r,:;.]{3,50})/gi;

  let match: RegExpExecArray | null;
  while ((match = cargoRegex.exec(text)) !== null) {
    const cargoCandidate = match[1].replace(/[\n\r]+/g, " ").replace(/[.,;:]+$/, "").trim();
    if (
      cargoCandidate.length >= 4 &&
      cargoCandidate.length <= 45 &&
      !/^(?:edital|concurso|conteúdo|quadro|inscrição|prova|requisito|jornada)/i.test(cargoCandidate)
    ) {
      cargosFound.add(cargoCandidate);
    }
    if (cargosFound.size >= 5) break;
  }

  const cargos = Array.from(cargosFound);
  return {
    hasMultiple: cargos.length > 1,
    cargos,
  };
}
