import {
  JornadaEmentaSchema,
  type JornadaEmentaType,
  type DisciplinaDraftType,
  type TopicoDraftType,
} from "@/lib/validations/jornada";

export const SAFE_CHUNK_CHAR_LIMIT = 2800;
export const MAX_DISCIPLINAS_PER_JORNADA = 15;
export const MAX_TOPICOS_PER_DISCIPLINA = 30;

/**
 * Normaliza o título do tópico para fins de deduplicação determinística.
 * Remove numerações iniciais (ex: "1.1 ", "2. ", "a) ") e espaçamento redundante.
 */
export function normalizeTopicTitle(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/^[0-9]+(?:\.[0-9]+)*[\.\-\)\s]*/, "")
    .replace(/^[a-z][\.\-\)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza o nome da disciplina para chave de agregação.
 */
export function normalizeDisciplineName(rawName: string): string {
  return rawName
    .trim()
    .replace(/^disciplina:\s*/i, "")
    .replace(/^matéria:\s*/i, "")
    .replace(/^conteúdo:\s*/i, "")
    .replace(/\s+/g, " ");
}

/**
 * Divide o conteúdo programático do edital em blocos coerentes e seguros,
 * respeitando os limites de tokens de entrada e de saída do modelo.
 *
 * Prioriza fronteiras naturais de disciplinas e tópicos.
 */
export function splitEditalIntoBlocks(
  text: string,
  maxBlockChars: number = SAFE_CHUNK_CHAR_LIMIT
): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= maxBlockChars) {
    return [clean];
  }

  const lines = clean.split("\n");
  const sections: string[] = [];
  let currentLines: string[] = [];

  // Padrões de cabeçalho de disciplinas comuns em editais brasileiros
  const disciplineRegex =
    /^(?:(?:[0-9]{1,2}[\.\-\)]\s*)?(?:disciplina|matéria|conteúdo|conhecimentos|noções de|direito|língua|legislação|raciocínio|informática|administração|atualidades|ética|contabilidade)[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\-\/]{2,60}:?|^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\-\/]{4,50}:?$)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentLines.length > 0) currentLines.push(line);
      continue;
    }

    // Se encontramos um cabeçalho e já acumulamos linhas anteriores
    if (
      disciplineRegex.test(trimmed) &&
      trimmed.length < 70 &&
      !trimmed.endsWith(".")
    ) {
      if (currentLines.length > 0) {
        sections.push(currentLines.join("\n").trim());
        currentLines = [];
      }
      currentLines.push(trimmed);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push(currentLines.join("\n").trim());
  }

  // Se nenhuma seção de disciplina foi identificada, particiona por quebras de parágrafo
  if (sections.length <= 1) {
    const paragraphs = clean.split(/\n\s*\n/);
    const blocks: string[] = [];
    let currentBlock = "";

    for (const p of paragraphs) {
      if (!currentBlock) {
        currentBlock = p;
      } else if (currentBlock.length + p.length + 2 <= maxBlockChars) {
        currentBlock += "\n\n" + p;
      } else {
        blocks.push(currentBlock);
        currentBlock = p;
      }
    }
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }

  // Agrupa seções até atingir maxBlockChars de forma contígua
  const blocks: string[] = [];
  let currentGroup = "";

  for (const sec of sections) {
    if (!currentGroup) {
      currentGroup = sec;
    } else if (currentGroup.length + sec.length + 2 <= maxBlockChars) {
      currentGroup += "\n\n" + sec;
    } else {
      blocks.push(currentGroup);
      currentGroup = sec;
    }
  }
  if (currentGroup) blocks.push(currentGroup);

  // Sub-fatia eventuais seções individuais que ainda excedam maxBlockChars
  const finalBlocks: string[] = [];
  for (const b of blocks) {
    if (b.length <= maxBlockChars) {
      finalBlocks.push(b);
    } else {
      const subLines = b.split("\n");
      let subGroup = "";
      for (const sl of subLines) {
        if (!subGroup) {
          subGroup = sl;
        } else if (subGroup.length + sl.length + 1 <= maxBlockChars) {
          subGroup += "\n" + sl;
        } else {
          finalBlocks.push(subGroup);
          subGroup = sl;
        }
      }
      if (subGroup) finalBlocks.push(subGroup);
    }
  }

  return finalBlocks.filter((b) => b.trim().length > 0);
}

/**
 * Consolida múltiplos retornos parciais de blocos da IA,
 * mesclando disciplinas de mesmo nome e deduplicando tópicos com ordenação estável.
 */
export function consolidateDisciplinas(
  blocksOutput: Array<{ disciplinas?: any[] }>
): DisciplinaDraftType[] {
  const discMap = new Map<
    string,
    {
      nome: string;
      topicos: TopicoDraftType[];
      seenTopics: Set<string>;
    }
  >();

  for (const block of blocksOutput) {
    if (!block?.disciplinas || !Array.isArray(block.disciplinas)) continue;

    for (const d of block.disciplinas) {
      if (!d?.nome || typeof d.nome !== "string") continue;
      const cleanName = normalizeDisciplineName(d.nome);
      if (cleanName.length < 2) continue;
      const key = cleanName.toLowerCase();

      if (!discMap.has(key)) {
        discMap.set(key, {
          nome: cleanName,
          topicos: [],
          seenTopics: new Set(),
        });
      }

      const discRecord = discMap.get(key)!;
      const topicsList = Array.isArray(d.topicos) ? d.topicos : [];

      for (const t of topicsList) {
        if (!t?.titulo || typeof t.titulo !== "string") continue;
        const rawTitle = t.titulo.trim();
        if (rawTitle.length < 3) continue;

        const normTitle = normalizeTopicTitle(rawTitle);
        if (discRecord.seenTopics.has(normTitle)) continue;

        discRecord.seenTopics.add(normTitle);
        discRecord.topicos.push({
          titulo: rawTitle.slice(0, 180),
          ...(t.edital_item_ref
            ? { edital_item_ref: String(t.edital_item_ref).trim().slice(0, 60) }
            : {}),
        });

        // Limite defensivo do Zod: máximo 30 tópicos por disciplina
        if (discRecord.topicos.length >= MAX_TOPICOS_PER_DISCIPLINA) break;
      }
    }
  }

  const result: DisciplinaDraftType[] = [];
  for (const [, disc] of discMap.entries()) {
    if (disc.topicos.length > 0) {
      result.push({
        nome: disc.nome.slice(0, 100),
        topicos: disc.topicos,
      });
    }
    // Teto defensivo do Zod: máximo 15 disciplinas por jornada
    if (result.length >= MAX_DISCIPLINAS_PER_JORNADA) break;
  }

  return result;
}

/**
 * Gera hash SHA-256 determinístico para vinculação e integridade do edital.
 * Normaliza quebras de linha CRLF para LF e remove espaços redundantes das extremidades.
 */
export async function computeEditalHash(text: string): Promise<string> {
  const enc = new TextEncoder();
  const clean = text.replace(/\r\n/g, "\n").trim();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(clean));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Consolida e valida estruturalmente o resultado final da Jornada.
 */
export function consolidateEmenta(
  blocksOutput: Array<{ disciplinas?: any[] }>,
  metadata: {
    title: string;
    banca?: string;
    ano?: number;
    cargo?: string;
    edital_hash?: string;
  }
): JornadaEmentaType {
  const disciplinas = consolidateDisciplinas(blocksOutput);

  const candidate = {
    titulo_concurso: metadata.title,
    ...(metadata.banca ? { banca: metadata.banca } : {}),
    ...(metadata.ano ? { ano: metadata.ano } : { ano: new Date().getFullYear() }),
    ...(metadata.cargo ? { cargo: metadata.cargo } : {}),
    ...(metadata.edital_hash ? { edital_hash: metadata.edital_hash } : {}),
    disciplinas,
  };

  return JornadaEmentaSchema.parse(candidate);
}

