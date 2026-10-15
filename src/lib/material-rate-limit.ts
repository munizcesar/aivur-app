/**
 * Rate limiting em memória para o módulo Meu Material (Fase 2, Passo 2.2).
 *
 * LIMITAÇÕES ARQUITETURAIS NO EDGE DISTRIBUÍDO:
 * O contador em memória reside no isolate V8 de uma instância específica no Cloudflare Pages.
 * Em um ambiente distribuído com múltiplos PoPs ou instâncias recém-iniciadas, o estado da memória
 * não é compartilhado globalmente. Esta proteção atua como contenção defensiva contra rajadas e
 * abusos direcionados a uma mesma instância, não substituindo uma infraestrutura centralizada.
 *
 * POLÍTICA DE IDENTIDADE CONFIÁVEL:
 * 1. 'cf-connecting-ip' (fornecido pela infraestrutura confiável da Cloudflare) é preservado
 *    como chave confiável do cliente ('ip:<cf-ip>').
 * 2. 'x-forwarded-for' é DESCARTADO por ser vulnerável a spoofing por clientes não confiáveis.
 * 3. O cookie 'aivur_session' NÃO é utilizado como identificador de cota na ausência de IP,
 *    pois não há validação criptográfica ou persistida de sessão no sistema, permitindo que atacantes
 *    forjem novos cookies arbitrariamente para burlar a cota.
 * 4. Na ausência de IP confiável da Cloudflare, adota-se a cota compartilhada 'fallback:unknown'.
 *    Todas as requisições sem IP confiável naquele isolate compartilham a mesma cota.
 *
 * POLÍTICA DE CONTENÇÃO DO MAP (PROTEÇÃO CONTRA EVICÇÃO INDEVIDA DE COTAS ATIVAS):
 * - Risco de evicção de contadores ativos (FIFO / LRU):
 *   Remover registros em FIFO quando o teto de entradas (maxEntries) é atingido apaga contadores
 *   de clientes que ainda estão ATIVOS dentro de sua janela de tempo. Isso criaria uma vulnerabilidade
 *   crítica de 'quota reset': um invasor poderia deliberadamente inundar o mapa com novas chaves para
 *   forçar a evicção precoce de seu próprio contador e zerar sua cota. Portanto, FIFO NÃO preserva cotas.
 * - Política conservadora implementada:
 *   1. Poda determinística: apenas registros comprovadamente EXPIRADOS (now > resetTime) são expurgados.
 *   2. Se o teto máximo de entradas (maxEntries) for atingido e todos os registros contidos forem de
 *      cotas ativas (nenhum registro expirado disponível para remoção), o limitador RECUSA com segurança
 *      a admissão de novas chaves (check retorna false -> HTTP 429).
 *   3. Contadores ativos NUNCA são apagados silenciosamente para abrir espaço a novas chaves.
 *   4. Chaves ativas já admitidas continuam sendo avaliadas normalmente contra seus limites.
 */

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  maxEntries: number;
}

export const DEFAULT_MATERIAL_RATE_LIMIT_CONFIG: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 60 * 1000, // Janela de 1 hora
  maxEntries: 500, // Teto máximo defensivo por isolate
};

export class InMemoryRateLimiter {
  private map = new Map<string, RateLimitEntry>();
  readonly config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_MATERIAL_RATE_LIMIT_CONFIG, ...config };
  }

  get size(): number {
    return this.map.size;
  }

  getEntry(key: string): RateLimitEntry | undefined {
    return this.map.get(key);
  }

  setEntry(key: string, entry: RateLimitEntry): void {
    this.map.set(key, entry);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  /**
   * Remove determinísticamente apenas registros que já expiraram (now > resetTime).
   * Nunca remove registros com cotas ainda ativas.
   * Retorna a quantidade de registros expurgados.
   */
  pruneExpired(now = Date.now()): number {
    let pruned = 0;
    for (const [key, record] of this.map.entries()) {
      if (now > record.resetTime) {
        this.map.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Avalia a cota da chave informada.
   * - Para chaves já existentes:
   *     - se expirada, reseta a contagem para 1 e atualiza resetTime;
   *     - se ativa e count >= limit, rejeita (retorna false);
   *     - se ativa e count < limit, incrementa e aceita (retorna true).
   * - Para novas chaves:
   *     - executa pruneExpired(now) para liberar espaço expirado;
   *     - se após o prune o mapa ainda estiver em maxEntries (todos ativos),
   *       recusa a admissão da nova chave (retorna false) para não apagar cotas ativas;
   *     - caso contrário, cadastra a nova chave e aceita (retorna true).
   */
  check(key: string, now = Date.now()): boolean {
    const record = this.map.get(key);

    if (record) {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + this.config.windowMs;
        return true;
      }

      if (record.count >= this.config.limit) {
        return false;
      }

      record.count++;
      return true;
    }

    // Limpeza de chaves expiradas antes de admitir nova chave
    this.pruneExpired(now);

    // Contenção conservadora: recusa novas admissões se saturado com cotas ativas
    if (this.map.size >= this.config.maxEntries) {
      return false;
    }

    this.map.set(key, {
      count: 1,
      resetTime: now + this.config.windowMs,
    });
    return true;
  }
}

/**
 * Instância singleton compartilhada no isolate da rota Meu Material.
 */
export const materialRateLimiter = new InMemoryRateLimiter();

/**
 * Resolve a identidade confiável do cliente para rate limit:
 * - 'cf-connecting-ip' é preservado quando presente e não-vazio.
 * - 'x-forwarded-for' é sempre descartado.
 * - Fallback conservador 'fallback:unknown' na ausência de IP confiável.
 */
export function resolveClientRateLimitKey(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) {
    return `ip:${cfIp.trim()}`;
  }
  return "fallback:unknown";
}
