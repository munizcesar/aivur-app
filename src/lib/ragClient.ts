const RAG_URL = process.env.RAG_WORKER_URL || 'https://aivur-worker.cesarmuniz0816.workers.dev/api/rag-search';

export async function fetchRagContext(query: string): Promise<{ context: string; matchCount: number; topScore: number | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(RAG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[RAG] Erro na API do worker: ${res.status}`);
      return { context: '', matchCount: 0, topScore: null };
    }

    const data = await res.json() as { context?: string; matchCount?: number; topScore?: number | null };
    return {
      context: data.context || '',
      matchCount: data.matchCount ?? 0,
      topScore: data.topScore ?? null,
    };
  } catch (err: any) {
    // Timeout, erro de rede, worker fora do ar — fallback silencioso para zero-shot, por design.
    console.warn(`[RAG] Fallback acionado (Erro ou Timeout): ${err.message}`);
    return { context: '', matchCount: 0, topScore: null };
  } finally {
    clearTimeout(timeout);
  }
}
