/**
 * AIVUR — Esteira de Ingestão Autônoma (rag:auto)
 *
 * Fluxo por item da fila:
 *  1. Lê rag_queue.json
 *  2. Extrai texto (tipo: 'texto' inline | 'url' via fetch)
 *  3. Filtro de Sanidade (Groq) — ARCHITECTURE_RULES.md DIRETRIZ DOIS
 *  4. RAGChunker → fatiamento inteligente
 *  5. POST /api/rag/ingest → Workers AI (bge-base) + D1 + Vectorize
 *
 * Uso: npx tsx scripts/autonomous_ingest.ts
 * Ou via npm: npm run rag:auto
 */

import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { RAGChunker } from '../src/lib/rag/chunker';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

// ──────────────────────────── Tipos ────────────────────────────


interface QueueItem {
  id: string;
  tipo: 'texto' | 'url';
  texto?: string;
  fonte?: string;
  curso: string;
  disciplina: string;
  municipio: string;
  tipo_fonte: string;
  banca: string;
}

interface SanityResult {
  valido: boolean;
  motivo?: string;
}

interface IngestLog {
  processados: number;
  aceitos: number;
  rejeitados: number;
  erros: Array<{ id: string; motivo: string }>;
  sucessos: Array<{ id: string; chunks: number }>;
  timestamp: string;
}

// ──────────────────────────── Configuração ────────────────────────────

const QUEUE_PATH = path.resolve(__dirname, '../data/rag_queue.json');
const LOG_PATH   = path.resolve(__dirname, '../data/ingest_log.json');

const INGEST_URL    = process.env.INGEST_URL    || 'http://localhost:3000/api/rag/ingest';
const ADMIN_SECRET  = process.env.ADMIN_SECRET  || 'aivur-admin-secret-local';
const GROQ_API_KEY  = process.env.GROQ_API_KEY  || '';

// ──────────────────────────── Helpers ────────────────────────────

async function extractText(item: QueueItem): Promise<string> {
  if (item.tipo === 'texto' && item.texto) {
    return item.texto;
  }

  if (item.tipo === 'url' && item.fonte) {
    const res = await fetch(item.fonte, { 
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${item.fonte}`);
    const html = await res.text();
    // Strip HTML básico — a Diretriz Dois garante que HTML sujo será rejeitado pelo LLM
    return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  throw new Error(`Item ${item.id} não tem tipo ou conteúdo válido`);
}

async function runSanityFilter(sample: string, groq: Groq): Promise<SanityResult> {
  const SAMPLE_CHARS = 1500; // Amostra para custo mínimo
  const sampleText = sample.slice(0, SAMPLE_CHARS);

  const chat = await groq.chat.completions.create({
    model: 'qwen/qwen3.6-27b',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'Você é um validador de qualidade de dados para uma base jurídica/educacional. ' +
          'Analise o texto recebido e determine se ele é um documento jurídico legítimo ' +
          '(lei, edital, portaria, súmula, conteúdo educacional de qualidade) ou lixo ' +
          '(erro de firewall, captcha, HTML sujo, OCR quebrado, texto aleatório, spam). ' +
          'Responda APENAS com JSON no formato: {"valido": true} ou {"valido": false, "motivo": "razao breve"}',
      },
      {
        role: 'user',
        content: `Valide este texto:\n\n${sampleText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = chat.choices[0]?.message?.content || '{"valido": false}';
  return JSON.parse(content) as SanityResult;
}

async function callIngestAPI(text: string, item: QueueItem): Promise<{ chunksProcessed: number }> {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_SECRET}`,
    },
    body: JSON.stringify({
      text,
      curso:       item.curso,
      disciplina:  item.disciplina,
      municipio:   item.municipio,
      tipo_fonte:  item.tipo_fonte,
      banca:       item.banca,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ingest API retornou ${res.status}: ${err}`);
  }

  return res.json();
}

// ──────────────────────────── Main ────────────────────────────

async function main() {
  if (!GROQ_API_KEY) {
    console.error('[ERROR] GROQ_API_KEY não definida. Defina no .env.local ou como variável de ambiente.');
    process.exit(1);
  }

  if (!fs.existsSync(QUEUE_PATH)) {
    console.error(`[ERROR] Arquivo de fila não encontrado: ${QUEUE_PATH}`);
    process.exit(1);
  }

  const queue: QueueItem[] = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const log: IngestLog = {
    processados: queue.length,
    aceitos: 0,
    rejeitados: 0,
    erros: [],
    sucessos: [],
    timestamp: new Date().toISOString(),
  };

  console.log(`\n🚀 Esteira Autônoma Iniciada — ${queue.length} itens na fila\n${'─'.repeat(55)}`);

  for (const item of queue) {
    console.log(`\n📄 [${item.id}] ${item.disciplina} / ${item.tipo_fonte}`);

    try {
      // ── Etapa 1: Extração
      console.log('   → Extraindo texto...');
      const rawText = await extractText(item);

      if (rawText.length < 50) {
        throw new Error('Texto muito curto para ser válido');
      }

      // ── Etapa 2: Filtro de Sanidade (DIRETRIZ DOIS)
      console.log('   → Filtro de Sanidade (LLM)...');
      const sanity = await runSanityFilter(rawText, groq);

      if (!sanity.valido) {
        const motivo = sanity.motivo || 'Texto inválido conforme LLM';
        console.log(`   ❌ REJEITADO: ${motivo}`);
        log.rejeitados++;
        log.erros.push({ id: item.id, motivo });
        continue;
      }

      console.log('   ✅ Sanidade aprovada. Iniciando ingestão...');

      // ── Etapa 3: Chunking local (pré-visualização)
      const chunks = RAGChunker.splitLegislation(rawText, { maxTokens: 400 });
      console.log(`   → ${chunks.length} chunk(s) gerados pelo chunker`);

      // ── Etapa 4: Pipeline completa (Chunker → Workers AI → D1 → Vectorize)
      const result = await callIngestAPI(rawText, item);
      console.log(`   ✅ Ingestão concluída — ${result.chunksProcessed} chunks vetorizados`);

      log.aceitos++;
      log.sucessos.push({ id: item.id, chunks: result.chunksProcessed });

    } catch (err: any) {
      console.log(`   💥 ERRO: ${err.message}`);
      log.rejeitados++;
      log.erros.push({ id: item.id, motivo: err.message });
    }
  }

  // ── Relatório Final
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`📊 Relatório Final`);
  console.log(`   Total processados : ${log.processados}`);
  console.log(`   ✅ Aceitos         : ${log.aceitos}`);
  console.log(`   ❌ Rejeitados      : ${log.rejeitados}`);
  console.log(`   📁 Log salvo em    : ${LOG_PATH}`);
  console.log(`${'═'.repeat(55)}\n`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
