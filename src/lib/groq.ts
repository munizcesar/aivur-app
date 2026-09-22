import { Groq } from "groq-sdk";

/**
 * Extrai as chaves Groq disponíveis a partir do env resolvido pelo
 * getRequestContext() da rota chamadora (nunca do nível de módulo).
 * Suporta até 5 chaves rotativas + uma chave de fallback legada.
 */
export function getGroqKeysFromEnv(env: Record<string, string | undefined>): string[] {
  const keys: string[] = [];
  if (env.GROQ_API_KEY)        keys.push(env.GROQ_API_KEY);
  if (env.GROQ_API_KEY_2)      keys.push(env.GROQ_API_KEY_2);
  if (env.GROQ_API_KEY_3)      keys.push(env.GROQ_API_KEY_3);
  if (env.GROQ_API_KEY_4)      keys.push(env.GROQ_API_KEY_4);
  if (env.GROQ_API_KEY_5)      keys.push(env.GROQ_API_KEY_5);
  if (env.GROQ_API_KEY_FALLBACK) keys.push(env.GROQ_API_KEY_FALLBACK); // Suporte legado
  return keys;
}

/**
 * Função utilitária para chamar a Groq API com failover automático e retentativas.
 *
 * ATENÇÃO — padrão Edge Runtime / Cloudflare Pages:
 *   As chaves NÃO podem ser lidas de process.env no nível de módulo.
 *   Passe sempre `apiKeys` (obtidas via getGroqKeysFromEnv(env)) OU
 *   `apiKey` (chave única já resolvida pelo chamador via getRequestContext).
 *
 * @param messages  Array de mensagens no formato OpenAI Chat
 * @param options   Opções da geração (model, temperature, etc.) + apiKey/apiKeys
 */
export async function callGroqWithFallback(
  messages: any[],
  options: {
    model?: string;
    temperature?: number;
    response_format?: any;
    max_tokens?: number;
    /** Chave única já resolvida pelo chamador */
    apiKey?: string;
    /** Lista de chaves para failover (geradas via getGroqKeysFromEnv) */
    apiKeys?: string[];
  } = {}
) {
  const model       = options.model       ?? "llama3-70b-8192";
  const temperature = options.temperature ?? 0.3;

  // Monta a lista de clientes a partir da(s) chave(s) fornecidas dinamicamente.
  // Se nenhuma chave for fornecida, falha de forma explícita e imediata.
  let activeKeys: string[] = [];
  if (options.apiKeys && options.apiKeys.length > 0) {
    activeKeys = options.apiKeys;
  } else if (options.apiKey) {
    activeKeys = [options.apiKey];
  }

  if (activeKeys.length === 0) {
    throw new Error(
      "[Groq] Nenhuma GROQ_API_KEY disponível. " +
      "Certifique-se de que o secret foi configurado via `wrangler pages secret put GROQ_API_KEY`."
    );
  }

  const activeClients = activeKeys.map(k => new Groq({ apiKey: k }));

  for (let attempt = 0; attempt < activeClients.length; attempt++) {
    const client = activeClients[attempt];
    try {
      if (attempt > 0) {
        console.log(`[Groq Failover] Iniciando failover para a chave reserva no index ${attempt}...`);
      }

      const response = await client.chat.completions.create({
        messages,
        model,
        temperature,
        response_format: options.response_format,
        max_tokens: options.max_tokens,
      });

      console.log(`[Groq Success] Resposta gerada com sucesso utilizando chave no index ${attempt}.`);
      return response.choices[0]?.message?.content;

    } catch (error: any) {
      const status = error.status || (error.response?.status) || 500;
      console.warn(`[Groq API Error] Falha na chave index ${attempt} (Status: ${status}): ${error.message}`);

      // Só executa failover se for problema com a chave (401), rate limit (429) ou erro 5xx
      const isRetryable = status === 401 || status === 429 || status >= 500;

      if (!isRetryable || attempt >= activeClients.length - 1) {
        throw new Error(`All Groq API attempts failed. Last error: ${error.message}`);
      }

      // Pequeno delay antes de tentar a próxima chave
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
