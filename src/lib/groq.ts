import { Groq } from "groq-sdk";

// Extrai múltiplas chaves do ambiente (Next.js Edge resolve essas envs estaticamente)
const getGroqKeys = (): string[] => {
  const keys: string[] = [];
  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEY_2) keys.push(process.env.GROQ_API_KEY_2);
  if (process.env.GROQ_API_KEY_3) keys.push(process.env.GROQ_API_KEY_3);
  if (process.env.GROQ_API_KEY_4) keys.push(process.env.GROQ_API_KEY_4);
  if (process.env.GROQ_API_KEY_5) keys.push(process.env.GROQ_API_KEY_5);
  if (process.env.GROQ_API_KEY_FALLBACK) keys.push(process.env.GROQ_API_KEY_FALLBACK); // Suporte legado
  
  // Garante ao menos uma chave vazia para evitar crash na inicialização do SDK
  return keys.length > 0 ? keys : [""]; 
};

const keys = getGroqKeys();
const clients = keys.map(apiKey => new Groq({ apiKey }));

/**
 * Função utilitária para chamar a Groq API com failover automático e retentativas.
 * Suporta múltiplas chaves via GROQ_API_KEY, GROQ_API_KEY_2, etc.
 */
export async function callGroqWithFallback(
  messages: any[],
  options: { model?: string; temperature?: number; response_format?: any; max_tokens?: number; apiKey?: string } = {},
  explicitApiKey?: string
) {
  const model = options.model || "llama3-70b-8192";
  const temperature = options.temperature ?? 0.3;

  const finalKey = explicitApiKey || options.apiKey;
  // Usa chave dinâmica se fornecida explicitamente (ex: input do usuário), senão usa a fila de failover do ambiente
  const activeClients = finalKey ? [new Groq({ apiKey: finalKey })] : clients;

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
      // Extrai o status HTTP do erro (Groq SDK usa error.status)
      const status = error.status || (error.response?.status) || 500;
      console.warn(`[Groq API Error] Falha na chave index ${attempt} (Status: ${status}): ${error.message}`);
      
      // Só executa failover se for problema com a chave (401), limite de taxa (429) ou erro do servidor (5xx)
      const isRetryable = status === 401 || status === 429 || status >= 500;
      
      if (!isRetryable || attempt >= activeClients.length - 1) {
         throw new Error(`All Groq API attempts failed. Last error: ${error.message}`);
      }
      
      // Pequeno delay antes de tentar a próxima chave
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
