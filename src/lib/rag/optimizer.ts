/**
 * RAG Optimizer
 * Responsável por gerenciar e limitar o tamanho do contexto enviado para a IA,
 * otimizando o consumo de tokens e reduzindo custos desnecessários.
 */

export interface Chunk {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  score?: number; // Similaridade do Vectorize
}

export interface OptimizeOptions {
  maxTokens?: number; // Limite máximo de tokens permitido para o contexto
  minScore?: number; // Similaridade mínima para aceitar um chunk
}

export class RAGOptimizer {
  // Estimativa simples: 1 token ~= 4 caracteres em português
  private static readonly CHARS_PER_TOKEN = 4;

  /**
   * Filtra e seleciona os chunks de forma a maximizar a relevância
   * dentro de um limite estrito de tokens.
   */
  static optimizeContext(chunks: Chunk[], options: OptimizeOptions = {}): Chunk[] {
    const { maxTokens = 2000, minScore = 0.75 } = options;
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    
    // 1. Filtrar por relevância mínima (corte de ruído)
    let filtered = chunks.filter(c => c.score === undefined || c.score >= minScore);

    // 2. Ordenar por relevância (maior para menor)
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0));

    const selectedChunks: Chunk[] = [];
    let currentChars = 0;

    // 3. Fatiar contexto até atingir o limite de tokens
    for (const chunk of filtered) {
      const chunkLen = chunk.text.length;
      if (currentChars + chunkLen <= maxChars) {
        selectedChunks.push(chunk);
        currentChars += chunkLen;
      } else {
        // Se este chunk ultrapassa o limite, interrompemos
        // (priorizamos chunks inteiros para manter sentido completo)
        break;
      }
    }

    return selectedChunks;
  }
}
