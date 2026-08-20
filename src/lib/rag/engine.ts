import { RAGOptimizer, Chunk, OptimizeOptions } from './optimizer';

/**
 * Dependências injetadas do Cloudflare (Bindings)
 */
export interface CloudflareEnv {
  D1_DB: any;       // Cloudflare D1
  VECTORIZE: any;   // Cloudflare Vectorize
  RAG_CACHE: any;   // Cloudflare KV
}

export interface RAGQueryOptions {
  query: string;
  queryVector?: number[];
  optimizeOpts?: OptimizeOptions;
  courseId?: string; // Para filtro híbrido no D1
}

/**
 * Interface que conecta D1 (Filtro Híbrido), Vectorize (Busca Semântica) e KV (Cache Semântico)
 */
export class RAGEngine {
  constructor(private env: CloudflareEnv) {}

  /**
   * Gera a chave de cache baseada na query e contexto (curso).
   */
  private getCacheKey(query: string, courseId?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    return `rag:${courseId || 'global'}:${normalizedQuery}`;
  }

  /**
   * Busca no cache semântico (Custo Zero na IA).
   */
  async getCachedResponse(query: string, courseId?: string): Promise<string | null> {
    const key = this.getCacheKey(query, courseId);
    return await this.env.RAG_CACHE.get(key);
  }

  /**
   * Salva a resposta gerada pela IA no cache semântico.
   */
  async cacheResponse(query: string, response: string, courseId?: string, expirationTtl = 86400): Promise<void> {
    const key = this.getCacheKey(query, courseId);
    await this.env.RAG_CACHE.put(key, response, { expirationTtl });
  }

  /**
   * Busca contexto relevante usando busca híbrida e otimiza o uso de tokens.
   */
  async retrieveOptimizedContext(options: RAGQueryOptions): Promise<Chunk[]> {
    const { queryVector, optimizeOpts, courseId } = options;

    if (!queryVector) {
      throw new Error('queryVector é obrigatório para a busca no Vectorize.');
    }

    // 1. Busca Semântica via Vectorize
    // Usamos um topK maior aqui, pois o Optimizer fará o corte por qualidade e tokens depois
    const vectorizeResults = await this.env.VECTORIZE.query(queryVector, { topK: 15 });

    let chunks: Chunk[] = [];

    // 2. Filtro Híbrido: Enriquecer dados dos vetores com meta-dados do D1
    if (vectorizeResults.matches && vectorizeResults.matches.length > 0) {
      const matchIds = vectorizeResults.matches.map((m: any) => m.id);
      
      // Consultar D1 para pegar os textos reais e metadados
      // Exemplo ilustrativo de query:
      // SELECT id, text, metadata FROM documents WHERE id IN (...) AND courseId = ?
      
      // Aqui faríamos a query real no D1. Como é um mockup para a interface:
      // const stmt = this.env.D1_DB.prepare('...');
      // const dbChunks = await stmt.all();

      // Mapeamento mockado combinando Vectorize + D1
      chunks = vectorizeResults.matches.map((match: any) => ({
        id: match.id,
        text: `Texto recuperado do D1 para o chunk ${match.id}`, // Viria do D1
        score: match.score,
        metadata: { courseId } // Viria do D1
      }));
    }

    // 3. Otimização Extrema de Tokens (Redução de Custo)
    const optimizedContext = RAGOptimizer.optimizeContext(chunks, optimizeOpts);

    return optimizedContext;
  }
}
