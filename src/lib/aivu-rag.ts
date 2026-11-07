/**
 * Motor Determinístico de Chunking e Recuperação Lexical (RAG) para o AIVU (Fase B.1).
 *
 * Características:
 * - 100% puro, síncrono e determinístico (mesma entrada -> mesma saída).
 * - Zero dependências externas ou de Node.js (compatível com Edge V8 Isolate e Browser).
 * - Segmentação estrutural consciente de páginas (`--- Página X ---`), cabeçalhos, artigos e parágrafos.
 * - Ranking BM25 adaptado à língua portuguesa (normalização NFD, remoção de stopwords, sufixação leve)
 *   combinado com boosts determinísticos para referências legais (artigos, leis, súmulas), páginas e termos exatos.
 * - Sanitização estrutural defensiva de delimitadores para tratar trechos recuperados como dados não confiáveis.
 */

export interface ChunkDocumentOptions {
  /** Tamanho alvo máximo de cada bloco em caracteres (padrão: 750) */
  maxChunkChars?: number;
  /** Tamanho aproximado de sobreposição entre blocos adjacentes da mesma página (padrão: 120) */
  overlapChars?: number;
  /** Nome ou identificador opcional da fonte do documento */
  sourceName?: string;
}

export interface DocumentChunk {
  /** Identificador determinístico do bloco (ex: "chunk-1", "chunk-2") */
  id: string;
  /** Índice sequencial baseado em zero (0, 1, 2...) */
  index: number;
  /** Número da página extraído do marcador `--- Página X ---` (quando presente) */
  pageNumber?: number;
  /** Cabeçalho ou seção contextual associada ao trecho (quando detectado) */
  sectionHeader?: string;
  /** Conteúdo textual do bloco preservando marcador de página */
  text: string;
  /** Contagem de caracteres do texto do bloco */
  charCount: number;
  /** Nome opcional da fonte */
  sourceName?: string;
  /** Cache léxico pré-computado opcional (oculto de enumeração JSON/deepEqual) */
  _lexicalCache?: ChunkLexicalStats;
}

interface ChunkLexicalStats {
  length: number;
  tokenFreq: Map<string, number>;
  stemFreq: Map<string, number>;
  normalizedFull: string;
  normalizedNumbersCollapsed: string;
}

export interface RetrieveChunksOptions {
  /** Quantidade máxima de trechos retornados (padrão: 3, teto: 3) */
  maxChunks?: number;
  /** Orçamento máximo acumulado de caracteres somando os trechos retornados (padrão: 2200) */
  maxTotalChars?: number;
  /** Pontuação mínima para considerar um trecho relevante (padrão: 0.85) */
  minScore?: number;
}

export interface RetrievedChunk extends DocumentChunk {
  /** Pontuação de relevância determinística calculada pelo motor BM25 + Boosts */
  score: number;
  /** Termos ou âncoras que justificaram a recuperação */
  matchedTerms: string[];
  /** Texto higienizado para inserção segura em blocos de dados não confiáveis */
  sanitizedText: string;
}

export const DEFAULT_CHUNK_OPTIONS: Required<Omit<ChunkDocumentOptions, "sourceName">> = {
  maxChunkChars: 750,
  overlapChars: 120,
};

export const DEFAULT_RETRIEVE_OPTIONS: Required<RetrieveChunksOptions> = {
  maxChunks: 3,
  maxTotalChars: 2200,
  minScore: 0.85,
};

const PORTUGUESE_STOPWORDS = new Set([
  "a", "ao", "aos", "aquela", "aquelas", "aquele", "aqueles", "aquilo", "as", "ate",
  "com", "como", "da", "das", "de", "dela", "delas", "dele", "deles", "depois",
  "do", "dos", "e", "ela", "elas", "ele", "eles", "em", "entre", "era", "eram",
  "essa", "essas", "esse", "esses", "esta", "estas", "este", "estes", "eu", "foi",
  "for", "foram", "fosse", "fossem", "ha", "isso", "isto", "ja", "la", "lhe", "lhes",
  "lo", "mas", "me", "mesmo", "meu", "meus", "minha", "minhas", "muito", "na", "nas",
  "nao", "nem", "no", "nos", "nossa", "nossas", "nosso", "nossos", "num", "numa",
  "o", "os", "ou", "para", "pela", "pelas", "pelo", "pelos", "por", "qual", "quais",
  "quando", "quanto", "que", "quem", "sao", "se", "seja", "sejam", "sem", "ser",
  "sera", "seu", "seus", "so", "sob", "sobre", "sua", "suas", "tal", "tambem", "te",
  "tem", "tendo", "tenha", "ter", "teu", "teus", "tinha", "todos", "tu", "tua", "tuas",
  "tudo", "um", "uma", "umas", "uns", "vai", "voce", "voces", "vos",
  // Verbos e palavras funcionais comuns em perguntas que não carregam tópico específico
  "explique", "explica", "diga", "fale", "qual", "quais", "como", "funciona",
  "segundo", "conforme", "acordo", "texto", "material", "documento", "pdf", "edital",
  "pode", "podem", "deve", "devem", "existe", "existem", "trata", "diz", "fala",
]);

/**
 * Remove acentos/diacríticos (NFD), converte para minúsculas e normaliza espaços.
 */
export function normalizeTextForSearch(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Redutor morfológico leve e determinístico para português (stemming conservador).
 * Agrupa plurais e variações nominais/verbais comuns sem distorcer termos curtos.
 */
export function stemPortugueseToken(token: string): string {
  if (!token || token.length <= 3) return token;
  if (/^\d+$/.test(token)) return token;

  let t = token;

  // Sufixos longos frequentes em textos jurídicos/acadêmicos
  if (t.length > 6) {
    if (t.endsWith("amentos")) return t.slice(0, -7) + "ar";
    if (t.endsWith("imento")) return t.slice(0, -6) + "ir";
    if (t.endsWith("amento")) return t.slice(0, -6) + "ar";
    if (t.endsWith("acoes")) return t.slice(0, -5) + "cao";
    if (t.endsWith("icoes")) return t.slice(0, -5) + "icao";
    if (t.endsWith("idades")) return t.slice(0, -6) + "idade";
    if (t.endsWith("mente")) return t.slice(0, -5);
  }

  // Plurais em português
  if (t.length > 4) {
    if (t.endsWith("oes")) return t.slice(0, -3) + "ao";
    if (t.endsWith("aes")) return t.slice(0, -3) + "ao";
    if (t.endsWith("ais")) return t.slice(0, -3) + "al";
    if (t.endsWith("eis")) return t.slice(0, -3) + "el";
    if (t.endsWith("ois")) return t.slice(0, -3) + "ol";
    if (t.endsWith("uis")) return t.slice(0, -3) + "ul";
    if (t.endsWith("les")) return t.slice(0, -3) + "l";
    if (t.endsWith("res")) return t.slice(0, -2);
    if (t.endsWith("zes")) return t.slice(0, -2);
    if (t.endsWith("ns")) return t.slice(0, -2) + "m";
    if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  }

  // Normalização de gênero básico em adjetivos/substantivos longos (ex: administrativo/administrativa)
  if (t.length > 5 && (t.endsWith("ivo") || t.endsWith("iva") || t.endsWith("ico") || t.endsWith("ica"))) {
    return t.slice(0, -1);
  }

  return t;
}

/**
 * Tokeniza um texto em termos significativos normalizados e seus radicais (stems).
 */
export function tokenizePortuguese(text: string): {
  tokens: string[];
  stems: string[];
} {
  const norm = normalizeTextForSearch(text);
  if (!norm) return { tokens: [], stems: [] };

  const rawWords = norm.split(" ");
  const tokens: string[] = [];
  const stems: string[] = [];

  for (const w of rawWords) {
    if (!w) continue;
    // Preserva números (ex: "5", "37", "8112", "14133") ou palavras com >= 2 caracteres fora das stopwords
    const isNumber = /^\d+$/.test(w);
    if (!isNumber && (w.length < 2 || PORTUGUESE_STOPWORDS.has(w))) {
      continue;
    }
    tokens.push(w);
    stems.push(stemPortugueseToken(w));
  }

  return { tokens, stems };
}

/**
 * Neutraliza delimitadores estruturais e sequências que tentem escapar do bloco de dados
 * não confiáveis no prompt do modelo.
 *
 * Nota de Segurança: Trata o texto estritamente como dado bruto não confiável.
 * Esta função remove/neutraliza delimitadores sintáticos (aspas triplas, cercas markdown,
 * tags XML/HTML de sistema e cabeçalhos de protocolo internos), devendo atuar em conjunto
 * com instruções de sistema e validação de saída.
 */
export function sanitizeUntrustedChunk(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // Remove caracteres de controle invisíveis (exceto \n e \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Neutraliza aspas triplas usadas como delimitador em prompts
      .replace(/"""/g, "'''")
      // Neutraliza cercas de código markdown triplas que possam fechar blocos
      .replace(/```/g, "'''")
      // Neutraliza tags XML/HTML de fechamento ou abertura reservadas ao isolamento do prompt e tags de modelo
      .replace(/<\/?\s*(?:documento_nao_confiavel|system|user|assistant|prompt|instruction|context|think)\b[^>]*>/gi, "[tag_removida]")
      // Neutraliza tokens especiais de controle de chat templates (ChatML / Llama / GPT)
      .replace(/<\|(?:im_start|im_end|system|user|assistant|endoftext|eot_id|start_header_id|end_header_id)\|>/gi, "[token_removido]")
      // Neutraliza divisores de seção internos do prompt do AIVU (ex: === DIRETRIZ ... ===)
      .replace(/={3,}\s*([A-ZÀ-ÖØ-Þ0-9\s_\-\(\)]+?)\s*={3,}/g, "[$1]")
      // Neutraliza padrões explícitos clássicos de tentativa de override direto de instruções
      .replace(
        /\b(?:ignore\s+(?:all\s+|todas\s+as\s+)?(?:previous|prior|above|anteriores|suas)\s+(?:instructions|prompts|rules|instrucoes|regras)|esqueça\s+todas\s+as\s+instrucoes|system\s+override|modo\s+desenvolvedor)\b/gi,
        "[instrucao_externa_ignorada]"
      )
      .trim()
  );
}

/**
 * Identifica se uma linha é um cabeçalho estrutural (disciplina, capítulo, seção, título ou artigo).
 */
function isStructuralHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 140) return false;
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  if (/^(?:CAP[IÍ]TULO|SE[CÇ][AÃ]O|T[IÍ]TULO|ANEXO|BLOCO|M[OÓ]DULO|DISCIPLINA)\s+[IVXLCDM0-9]+/i.test(trimmed)) {
    return true;
  }
  if (/^[0-9]{1,2}(?:\.[0-9]{1,2})*\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3,}/.test(trimmed)) {
    return true;
  }
  // Linha toda em maiúsculas (com letras) entre 4 e 90 caracteres
  if (
    trimmed.length >= 4 &&
    trimmed.length <= 90 &&
    /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(trimmed) &&
    trimmed === trimmed.toUpperCase() &&
    !/^---\s*P[AÁ]GINA/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

/**
 * Divide um parágrafo ou bloco longo que excede `maxChars` tentando respeitar limites de frases
 * ou cláusulas (; / . / \n) antes de recorrer a corte por espaço.
 */
function splitOversizedUnit(unit: string, maxChars: number, overlapChars: number): string[] {
  const results: string[] = [];
  const clean = unit.trim();
  if (clean.length <= maxChars) return [clean];

  const stepOverlap = Math.min(Math.max(0, overlapChars), Math.floor(maxChars / 3));
  let start = 0;

  while (start < clean.length) {
    const remaining = clean.length - start;
    if (remaining <= maxChars) {
      results.push(clean.slice(start).trim());
      break;
    }

    const sliceEnd = start + maxChars;
    const windowText = clean.slice(start, sliceEnd);

    // Procura o melhor ponto de quebra nos últimos 35% da janela
    const minBreakOffset = Math.floor(maxChars * 0.65);
    let breakPos = -1;

    // 1. Quebra de linha ou fim de sentença (. ! ? ;)
    for (let i = windowText.length - 1; i >= minBreakOffset; i--) {
      const ch = windowText[i];
      const nextCh = windowText[i + 1] || " ";
      if (ch === "\n" || ((ch === "." || ch === ";" || ch === "!" || ch === "?") && /\s/.test(nextCh))) {
        breakPos = start + i + 1;
        break;
      }
    }

    // 2. Vírgula ou espaço em branco
    if (breakPos === -1) {
      for (let i = windowText.length - 1; i >= minBreakOffset; i--) {
        if (/\s/.test(windowText[i])) {
          breakPos = start + i;
          break;
        }
      }
    }

    // 3. Corte rígido caso seja uma string contínua sem espaços
    if (breakPos === -1 || breakPos <= start) {
      breakPos = sliceEnd;
    }

    const piece = clean.slice(start, breakPos).trim();
    if (piece) {
      results.push(piece);
    }

    if (breakPos >= clean.length) break;

    // Recua pelo overlap buscando início de palavra
    let nextStart = Math.max(start + 1, breakPos - stepOverlap);
    while (nextStart < breakPos && nextStart > start + 1 && !/\s/.test(clean[nextStart - 1])) {
      nextStart--;
    }
    start = nextStart;
  }

  return results.filter(Boolean);
}

/**
 * Calcula sufixo de sobreposição (overlap) preservando frases ou palavras inteiras.
 */
function computeOverlapTail(text: string, overlapChars: number): string {
  if (overlapChars <= 0 || !text) return "";
  // Remove marcador de página inicial do cálculo de cauda
  const withoutPageMarker = text.replace(/^---\s*P[áa]gina\s+\d+\s*---\s*/i, "").trim();
  if (!withoutPageMarker) return "";
  if (withoutPageMarker.length <= overlapChars) return withoutPageMarker;

  const rawTail = withoutPageMarker.slice(withoutPageMarker.length - overlapChars);
  const firstSpace = rawTail.search(/\s/);
  if (firstSpace > 0 && firstSpace < rawTail.length - 10) {
    return rawTail.slice(firstSpace + 1).trim();
  }
  return rawTail.trim();
}

/**
 * Segmenta um documento em blocos semânticos determinísticos de até ~750 caracteres
 * com sobreposição (~120 caracteres), preservando marcadores `--- Página X ---` e evitando
 * cortar artigos (`Art. X`), cabeçalhos e parágrafos.
 */
export function chunkDocumentWithPages(
  text: string,
  options: ChunkDocumentOptions = {}
): DocumentChunk[] {
  if (!text || typeof text !== "string") return [];

  const normalizedInput = text.replace(/\r\n/g, "\n").trim();
  if (!normalizedInput) return [];

  const maxChunkChars = Math.max(200, options.maxChunkChars ?? DEFAULT_CHUNK_OPTIONS.maxChunkChars);
  const overlapChars = Math.max(
    0,
    Math.min(options.overlapChars ?? DEFAULT_CHUNK_OPTIONS.overlapChars, Math.floor(maxChunkChars / 2))
  );
  const sourceName = options.sourceName?.trim() || undefined;

  // 1. Separa o documento por seções de página caso existam marcadores `--- Página X ---`
  const pageRegex = /(?:^|\n)---\s*P[áa]gina\s+(\d+)\s*---(?=\s|\n|$)/gi;
  const pageSegments: Array<{ pageNumber?: number; content: string }> = [];

  let lastIndex = 0;
  let currentPageNumber: number | undefined = undefined;
  let match: RegExpExecArray | null;

  while ((match = pageRegex.exec(normalizedInput)) !== null) {
    const preText = normalizedInput.slice(lastIndex, match.index).trim();
    if (preText) {
      pageSegments.push({ pageNumber: currentPageNumber, content: preText });
    }
    currentPageNumber = parseInt(match[1], 10);
    lastIndex = match.index + match[0].length;
  }

  const remainingText = normalizedInput.slice(lastIndex).trim();
  if (remainingText || pageSegments.length === 0) {
    pageSegments.push({ pageNumber: currentPageNumber, content: remainingText });
  }

  const chunks: DocumentChunk[] = [];
  let activeHeader: string | undefined = undefined;

  for (const segment of pageSegments) {
    const pagePrefix = segment.pageNumber !== undefined ? `--- Página ${segment.pageNumber} ---\n` : "";
    const availableBodyChars = Math.max(120, maxChunkChars - pagePrefix.length);

    // 2. Quebra o conteúdo da página em unidades atômicas (parágrafos, artigos de lei, cabeçalhos)
    // Preserva artigos ("Art. 1º", "Art. 37.") juntos ao seu caput/incisos sempre que couberem
    const rawParagraphs = segment.content
      .split(/\n{2,}|(?=\n\s*(?:Art\.?\s*\d+|Artigo\s+\d+|CAP[IÍ]TULO\s+[IVXLCDM\d]+|SE[CÇ][AÃ]O\s+[IVXLCDM\d]+|#{1,4}\s+))/i)
      .map((p) => p.trim())
      .filter(Boolean);

    // Agrupa cabeçalhos soltos (muito curtos) com o parágrafo imediatamente seguinte para não criar chunk órfão
    const semanticUnits: Array<{ text: string; header?: string }> = [];
    for (let i = 0; i < rawParagraphs.length; i++) {
      const para = rawParagraphs[i];
      const lines = para.split("\n");
      if (lines.length === 1 && isStructuralHeaderLine(lines[0])) {
        activeHeader = lines[0].replace(/^#+\s*/, "").trim();
        if (i + 1 < rawParagraphs.length) {
          const combined = `${para}\n${rawParagraphs[i + 1]}`;
          if (combined.length <= availableBodyChars) {
            semanticUnits.push({ text: combined, header: activeHeader });
            i++;
            continue;
          }
        }
      } else if (isStructuralHeaderLine(lines[0])) {
        activeHeader = lines[0].replace(/^#+\s*/, "").trim();
      }
      semanticUnits.push({ text: para, header: activeHeader });
    }

    // Expande qualquer unidade que individualmente ultrapasse `availableBodyChars`
    const boundedUnits: Array<{ text: string; header?: string }> = [];
    for (const u of semanticUnits) {
      if (u.text.length <= availableBodyChars) {
        boundedUnits.push(u);
      } else {
        const subPieces = splitOversizedUnit(u.text, availableBodyChars, overlapChars);
        for (const sp of subPieces) {
          boundedUnits.push({ text: sp, header: u.header });
        }
      }
    }

    // 3. Monta os chunks da página respeitando `availableBodyChars` e injetando `overlapChars`
    let currentBody = "";
    let currentChunkHeader: string | undefined = activeHeader;

    const flushCurrentChunk = () => {
      const trimmedBody = currentBody.trim();
      if (!trimmedBody) return;
      const fullText = `${pagePrefix}${trimmedBody}`.trim();
      const idx = chunks.length;
      chunks.push({
        id: `chunk-${idx + 1}`,
        index: idx,
        pageNumber: segment.pageNumber,
        sectionHeader: currentChunkHeader,
        text: fullText,
        charCount: fullText.length,
        sourceName,
      });
    };

    for (let i = 0; i < boundedUnits.length; i++) {
      const unit = boundedUnits[i];
      if (!currentBody) {
        currentBody = unit.text;
        currentChunkHeader = unit.header ?? activeHeader;
        continue;
      }

      const candidate = `${currentBody}\n\n${unit.text}`;
      if (candidate.length <= availableBodyChars) {
        currentBody = candidate;
        if (unit.header) currentChunkHeader = unit.header;
      } else {
        // Fecha o chunk atual e inicia o próximo com overlap
        const tail = computeOverlapTail(currentBody, overlapChars);
        flushCurrentChunk();

        if (tail && `${tail}\n\n${unit.text}`.length <= availableBodyChars) {
          currentBody = `${tail}\n\n${unit.text}`;
        } else {
          currentBody = unit.text;
        }
        currentChunkHeader = unit.header ?? activeHeader;
      }
    }

    if (currentBody) {
      flushCurrentChunk();
    }
  }

  return chunks;
}

function getOrComputeChunkLexicalStats(chunk: DocumentChunk): ChunkLexicalStats {
  if (chunk._lexicalCache) return chunk._lexicalCache;

  const headerAndText = chunk.sectionHeader ? `${chunk.sectionHeader} ${chunk.text}` : chunk.text;
  // Pré-colapsa separadores de milhar numéricos (ex: "8.112" -> "8112", "14.133" -> "14133") antes de normalizar
  const numberNormalizedSource = headerAndText.replace(/(\d)\.(\d{3})\b/g, "$1$2");
  const normalizedFull = normalizeTextForSearch(numberNormalizedSource);
  const normalizedNumbersCollapsed = normalizedFull.replace(/(\d)\s+(\d)/g, "$1$2");

  const tokenFreq = new Map<string, number>();
  const stemFreq = new Map<string, number>();
  let validStemsCount = 0;

  if (normalizedFull) {
    const rawWords = normalizedFull.split(" ");
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      if (!w) continue;
      const c0 = w.charCodeAt(0);
      const isNumber = c0 >= 48 && c0 <= 57 && /^\d+$/.test(w);
      if (!isNumber && (w.length < 2 || PORTUGUESE_STOPWORDS.has(w))) {
        continue;
      }
      tokenFreq.set(w, (tokenFreq.get(w) || 0) + 1);
      const stem = isNumber ? w : stemPortugueseToken(w);
      stemFreq.set(stem, (stemFreq.get(stem) || 0) + 1);
      validStemsCount++;
    }
  }

  const stats: ChunkLexicalStats = {
    length: Math.max(1, validStemsCount),
    tokenFreq,
    stemFreq,
    normalizedFull,
    normalizedNumbersCollapsed,
  };

  Object.defineProperty(chunk, "_lexicalCache", {
    value: stats,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  return stats;
}

interface ExtractedQueryAnchors {
  pageNumbers: number[];
  articleNumbers: string[];
  lawNumbers: string[];
  exactPhrases: string[];
}

/**
 * Extrai âncoras estruturais explícitas da pergunta do usuário:
 * - Números de página (ex: "página 4", "pag. 12", "p. 3")
 * - Números de artigo (ex: "art. 5º", "artigo 37", "art 144")
 * - Números de leis, decretos ou súmulas (ex: "lei 8.112", "lei 14133", "súmula 473")
 * - Termos exatos entre aspas (ex: '"estágio probatório"')
 */
function extractQueryAnchors(query: string): ExtractedQueryAnchors {
  const norm = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const pageNumbers: number[] = [];
  const pageRegex = /\b(?:pagina|pag\.?|p\.?|fls\.?)\s*(\d{1,4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = pageRegex.exec(norm)) !== null) {
    const num = parseInt(m[1], 10);
    if (!Number.isNaN(num) && !pageNumbers.includes(num)) {
      pageNumbers.push(num);
    }
  }

  const articleNumbers: string[] = [];
  const artRegex = /\b(?:artigo|art\.?)\s*(\d{1,4})\b/g;
  while ((m = artRegex.exec(norm)) !== null) {
    if (!articleNumbers.includes(m[1])) {
      articleNumbers.push(m[1]);
    }
  }

  const lawNumbers: string[] = [];
  const lawRegex = /\b(?:lei|decreto|sumula|portaria|resolucao|emenda)\s*(?:n[ºo°\.]?\s*)?(\d{1,3}\.\d{3}|\d{1,6})\b/g;
  while ((m = lawRegex.exec(norm)) !== null) {
    const cleanNum = m[1].replace(/\./g, "");
    if (cleanNum && !lawNumbers.includes(cleanNum)) {
      lawNumbers.push(cleanNum);
    }
  }

  const exactPhrases: string[] = [];
  const quoteRegex = /["“”'‘’]([^"“”'‘’]{3,80})["“”'‘’]/g;
  while ((m = quoteRegex.exec(query)) !== null) {
    const normalizedPhrase = normalizeTextForSearch(m[1]);
    if (normalizedPhrase && normalizedPhrase.length >= 3 && !exactPhrases.includes(normalizedPhrase)) {
      exactPhrases.push(normalizedPhrase);
    }
  }

  return {
    pageNumbers,
    articleNumbers,
    lawNumbers,
    exactPhrases,
  };
}

/**
 * Recupera de forma determinística os trechos mais relevantes (máximo de 3) para a pergunta
 * utilizando BM25 adaptado ao português + boosts para artigos, leis, páginas e frases exatas.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  options: RetrieveChunksOptions = {}
): RetrievedChunk[] {
  if (!query || typeof query !== "string" || !Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  const maxChunks = Math.max(1, Math.min(3, options.maxChunks ?? DEFAULT_RETRIEVE_OPTIONS.maxChunks));
  const maxTotalChars = Math.max(200, options.maxTotalChars ?? DEFAULT_RETRIEVE_OPTIONS.maxTotalChars);
  const minScore = options.minScore ?? DEFAULT_RETRIEVE_OPTIONS.minScore;

  const { tokens: queryTokens, stems: queryStems } = tokenizePortuguese(query);
  const anchors = extractQueryAnchors(query);

  const hasAnySignal =
    queryStems.length > 0 ||
    anchors.pageNumbers.length > 0 ||
    anchors.articleNumbers.length > 0 ||
    anchors.lawNumbers.length > 0 ||
    anchors.exactPhrases.length > 0;

  if (!hasAnySignal) {
    return [];
  }

  // Pré-processamento léxico de cada chunk para cálculo do BM25 (reutilizando cache se disponível)
  const N = chunks.length;
  const k1 = 1.5;
  const b = 0.75;

  const docStats = chunks.map((chunk) => getOrComputeChunkLexicalStats(chunk));

  const avgDl = docStats.reduce((sum, d) => sum + d.length, 0) / Math.max(1, N);

  // Frequência de documentos (DF) por stem e token único da query
  const uniqueQueryPairs: Array<{ token: string; stem: string }> = [];
  const seenStems = new Set<string>();
  for (let i = 0; i < queryStems.length; i++) {
    const stem = queryStems[i];
    if (!seenStems.has(stem)) {
      seenStems.add(stem);
      uniqueQueryPairs.push({ token: queryTokens[i], stem });
    }
  }

  const stemDocFreq = new Map<string, number>();
  for (const { stem } of uniqueQueryPairs) {
    let df = 0;
    for (const ds of docStats) {
      if ((ds.stemFreq.get(stem) || 0) > 0) {
        df++;
      }
    }
    stemDocFreq.set(stem, df);
  }

  // Pré-compila expressões regulares de artigos e leis da pergunta fora do loop de chunks
  const compiledArtPatterns = anchors.articleNumbers.map((artNum) => ({
    artNum,
    regex: new RegExp(`\\b(?:artigo|art)\\s*0*${artNum}\\b`),
  }));
  const compiledLawPatterns = anchors.lawNumbers.map((lawNum) => ({
    lawNum,
    regex: new RegExp(`\\b${lawNum}\\b`),
  }));

  const rawCandidates: Array<{ chunk: DocumentChunk; score: number; matchedTerms: string[] }> = [];

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const ds = docStats[idx];
    let score = 0;
    const matchedTerms: string[] = [];

    // 1. Pontuação BM25 por termos e radicais da pergunta
    for (const { token, stem } of uniqueQueryPairs) {
      const tfStem = ds.stemFreq.get(stem) || 0;
      const tfExact = ds.tokenFreq.get(token) || 0;

      if (tfStem > 0) {
        const df = stemDocFreq.get(stem) || 1;
        // IDF suavizado positivo (Robertson-Spärck Jones modificado para coleções pequenas e grandes)
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5)) + 0.35;
        const normTf = (tfStem * (k1 + 1)) / (tfStem + k1 * (1 - b + b * (ds.length / avgDl)));
        let termScore = idf * normTf;

        // Bônus se houve match exato da palavra além do radical
        if (tfExact > 0) {
          termScore *= 1.15;
        }

        score += termScore;
        matchedTerms.push(token);
      }
    }

    // Bônus de cobertura: quando o chunk casa múltiplos termos distintos da pergunta
    if (matchedTerms.length >= 2 && uniqueQueryPairs.length >= 2) {
      const coverageRatio = matchedTerms.length / uniqueQueryPairs.length;
      score += coverageRatio * 1.25;
    }

    // 2. Boost de Âncora: Número de Página explícito
    if (anchors.pageNumbers.length > 0 && chunk.pageNumber !== undefined) {
      if (anchors.pageNumbers.includes(chunk.pageNumber)) {
        score += 5.0;
        matchedTerms.push(`pagina:${chunk.pageNumber}`);
      }
    }

    // 3. Boost de Âncora: Artigo de Lei explícito (ex: "Art. 5", "Artigo 37")
    for (const { artNum, regex } of compiledArtPatterns) {
      if (regex.test(ds.normalizedFull)) {
        score += 6.0;
        matchedTerms.push(`art:${artNum}`);
      }
    }

    // 4. Boost de Âncora: Número de Lei / Decreto / Súmula (ex: "8.112" ou "8112")
    for (const { lawNum, regex } of compiledLawPatterns) {
      if (
        ds.tokenFreq.has(lawNum) ||
        regex.test(ds.normalizedFull) ||
        regex.test(ds.normalizedNumbersCollapsed)
      ) {
        score += 6.0;
        matchedTerms.push(`lei:${lawNum}`);
      }
    }

    // 5. Boost de Âncora: Frases exatas entre aspas ou bigramas consecutivos
    for (const phrase of anchors.exactPhrases) {
      if (ds.normalizedFull.includes(phrase)) {
        score += 4.5;
        matchedTerms.push(`"${phrase}"`);
      }
    }

    if (queryTokens.length >= 2) {
      for (let i = 0; i < queryTokens.length - 1; i++) {
        const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
        if (bigram.length >= 6 && ds.normalizedFull.includes(bigram)) {
          score += 1.2;
        }
      }
    }

    // Arredondamento determinístico de 4 casas decimais para estabilidade numérica
    const finalScore = Math.round(score * 10000) / 10000;

    if (finalScore >= minScore && matchedTerms.length > 0) {
      rawCandidates.push({
        chunk,
        score: finalScore,
        matchedTerms,
      });
    }
  }

  // Ordenação determinística: maior score primeiro; em caso de empate, menor índice (ordem no documento)
  rawCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunk.index - b.chunk.index;
  });

  // Seleção Top-K respeitando o orçamento de caracteres (`maxTotalChars`) e limite de 3 chunks
  const selected: RetrievedChunk[] = [];
  let accumulatedChars = 0;

  for (const candidate of rawCandidates) {
    if (selected.length >= maxChunks) break;

    const sanitized = sanitizeUntrustedChunk(candidate.chunk.text);
    const candidateLen = sanitized.length;
    if (accumulatedChars + candidateLen <= maxTotalChars) {
      selected.push({
        ...candidate.chunk,
        score: candidate.score,
        matchedTerms: candidate.matchedTerms,
        sanitizedText: sanitized,
      });
      accumulatedChars += candidateLen;
    } else if (selected.length === 0 && maxTotalChars > 0) {
      // Se mesmo o 1º chunk mais relevante exceder um orçamento muito restrito,
      // trunca de forma determinística no limite exato configurado para respeitar o orçamento
      const truncatedSanitized = sanitized.slice(0, maxTotalChars).trim();
      if (truncatedSanitized.length > 0) {
        selected.push({
          ...candidate.chunk,
          score: candidate.score,
          matchedTerms: candidate.matchedTerms,
          text: candidate.chunk.text.slice(0, maxTotalChars).trim(),
          sanitizedText: truncatedSanitized,
          charCount: truncatedSanitized.length,
        });
        accumulatedChars += truncatedSanitized.length;
      }
      break;
    }
  }

  return selected;
}
