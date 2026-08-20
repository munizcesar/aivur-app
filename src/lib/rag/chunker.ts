/**
 * RAG Chunker
 * Responsável por fatiar textos longos, especialmente leis e editais,
 * preservando o contexto semântico de Artigos, Parágrafos e Incisos.
 */

export interface ChunkOptions {
  maxTokens?: number; // Limite de tokens por chunk (padrão: 500)
}

export class RAGChunker {
  // Estimativa simples: 1 token ~= 4 caracteres
  private static readonly CHARS_PER_TOKEN = 4;

  /**
   * Fatiamento inteligente otimizado para Legislação Brasileira (Artigos, Parágrafos)
   */
  static splitLegislation(text: string, options: ChunkOptions = {}): string[] {
    const { maxTokens = 500 } = options;
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;

    // 1. Quebra preliminar por quebras duplas de linha ou inícios de Artigo/Capítulo
    // Isso garante que artigos e seções não sejam cortados no meio da frase.
    const rawBlocks = text.split(/(?=\n\s*(?:Art\.|Capítulo|Seção|Títul[o]))/ig);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const block of rawBlocks) {
      const cleanBlock = block.trim();
      if (!cleanBlock) continue;

      if ((currentChunk.length + cleanBlock.length) > maxChars && currentChunk.length > 0) {
        // Se ultrapassou o limite, fecha o chunk atual e inicia um novo
        chunks.push(currentChunk.trim());
        currentChunk = cleanBlock;
      } else {
        // Senão, acumula no chunk atual
        currentChunk += (currentChunk ? '\n\n' : '') + cleanBlock;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    // Se houver algum chunk gigante (ex: um artigo muito longo), forçamos quebra por parágrafos/incisos
    return chunks.flatMap(chunk => {
      if (chunk.length <= maxChars) return [chunk];
      
      // Quebra secundária por quebras simples de linha (ex: incisos)
      const subBlocks = chunk.split('\n');
      const subChunks: string[] = [];
      let currentSubChunk = '';

      for (const sb of subBlocks) {
        if ((currentSubChunk.length + sb.length) > maxChars && currentSubChunk.length > 0) {
          subChunks.push(currentSubChunk.trim());
          currentSubChunk = sb;
        } else {
          currentSubChunk += (currentSubChunk ? '\n' : '') + sb;
        }
      }
      if (currentSubChunk.trim().length > 0) {
        subChunks.push(currentSubChunk.trim());
      }
      return subChunks;
    });
  }
}
