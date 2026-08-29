// src/lib/ai-protocols.ts
// Protocolo Central de Confiabilidade de IA — Arquitetura DRY (Don't Repeat Yourself)
// Todas as rotas que usam LLM devem importar daqui.

/**
 * Retorna as regras estritas de domínio para blindar o LLM contra alucinações.
 * Use no systemPrompt via: `\n\n=== PROTOCOLO DE CONFIABILIDADE ===\n${getDomainRules(subject)}`
 */
export function getDomainRules(subject: string = ""): string {
  const materia = subject.toLowerCase();

  if (materia.includes("redação") || materia.includes("discursiva")) {
    return "ATUE COMO CORRETOR EXAMINADOR SÊNIOR. Avalie estritamente com base nos critérios oficiais da banca. Justifique cada ponto descontado com regras gramaticais ou estruturais sólidas. Não seja genérico.";
  }
  if (materia.includes("português") || materia.includes("portuguesa")) {
    return "ATUE COMO GRAMÁTICO EXAMINADOR. Baseie-se exclusivamente nas gramáticas normativas (Cegalla, Bechara) e no Acordo Ortográfico vigente. Foque em morfossintaxe e exceções.";
  }
  if (materia.includes("matemática") || materia.includes("raciocínio") || materia.includes("lógico") || materia.includes("rlm")) {
    return "ATUE COMO MATEMÁTICO EXAMINADOR. O foco absoluto deve ser o raciocínio passo a passo inquebrável, sem pular etapas de cálculo. Criatividade zero; exatidão total.";
  }
  if (materia.includes("informática") || materia.includes("tecnologia")) {
    return "ATUE COMO ENGENHEIRO DE TECNOLOGIA EXAMINADOR. Baseie-se em documentações oficiais e cartilhas do CERT.br.";
  }

  return "ATUE COMO JURISTA EXAMINADOR. O universo do modelo se resume à CF, Vade Mecum e leis vigentes. É TERMINANTEMENTE PROIBIDO inventar números de leis, artigos, penas ou prazos. Na dúvida, explique o princípio e alerte para a leitura da lei seca.";
}

/**
 * Extrai um objeto JSON limpo ignorando tags <think> cortadas ou sujeira markdown.
 * Use para rotas que devolvem JSON estruturado (questoes, flashcards, generate).
 */
export function extractCleanJson(rawContent: string): string {
  const clean = rawContent || "";
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1) {
    return clean.substring(jsonStart, jsonEnd + 1);
  }
  return clean;
}

/**
 * Remove a tag <think> de respostas baseadas em texto/markdown puro.
 * Use para rotas que devolvem texto livre (teoria).
 */
export function extractCleanMarkdown(rawContent: string): string {
  let clean = rawContent || "";
  const thinkStart = clean.indexOf('<think>');

  if (thinkStart !== -1) {
    const thinkEnd = clean.indexOf('</think>');
    if (thinkEnd !== -1) {
      clean = (clean.substring(0, thinkStart) + clean.substring(thinkEnd + 8)).trim();
    } else {
      // Se a tag não foi fechada (estouro de token), corta do início da tag em diante
      clean = clean.substring(0, thinkStart).trim();
    }
  }
  return clean;
}
