import fs from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';

// Carrega variáveis do .env.local
loadEnvConfig(process.cwd());

interface RawData {
  curso: string;
  disciplina: string;
  banca: string;
  tipo_fonte: string;
  conteudo: string;
}

interface BatchLog {
  totalRead: number;
  successCount: number;
  skippedCount: number;
  errors: Array<{ file: string; error: string }>;
  timestamp: string;
}

const RAW_DIR = path.resolve(process.cwd(), 'data/raw');
const LOG_FILE = path.resolve(process.cwd(), 'data/batch_log.json');
const INGEST_URL = process.env.INGEST_URL || 'https://aivur-app.pages.dev/api/rag/ingest';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'aivur-admin-secret-local';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getJsonFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getJsonFiles(fullPath, fileList);
    } else if (file.endsWith('.json') && file !== 'template.json') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function processBatch() {
  console.log(`\n🚀 Iniciando Ingestão em Lote...`);
  console.log(`📂 Diretório alvo: ${RAW_DIR}`);
  console.log(`🔗 Endpoint de Ingestão: ${INGEST_URL}`);

  const files = getJsonFiles(RAW_DIR);
  console.log(`📄 Encontrados ${files.length} arquivos para processar.\n`);

  const log: BatchLog = {
    totalRead: files.length,
    successCount: 0,
    skippedCount: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  for (const file of files) {
    const fileName = path.relative(RAW_DIR, file);
    console.log(`▶ Processando: ${fileName}`);

    try {
      const rawContent = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(rawContent) as Partial<RawData>;

      // Validação de campos obrigatórios
      if (!data.curso || !data.disciplina || !data.banca || !data.tipo_fonte || data.conteudo === undefined) {
        throw new Error('Metadados incompletos. Requer: curso, disciplina, banca, tipo_fonte, conteudo.');
      }

      const conteudo = (data.conteudo || '').trim();

      // Filtro de sanidade local
      if (conteudo.length < 50) {
        console.log(`  ⏭ Pulado: Conteúdo muito curto ou vazio (${conteudo.length} chars).`);
        log.skippedCount++;
        continue;
      }

      // Prepara payload
      const payload = {
        text: conteudo,
        curso: data.curso,
        disciplina: data.disciplina,
        municipio: '', // opcional na nova modelagem ou via metadado extra
        tipo_fonte: data.tipo_fonte,
        banca: data.banca
      };

      // Dispara requisição
      const response = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as { chunksProcessed?: number };
      console.log(`  ✅ Sucesso: ${result.chunksProcessed || 0} chunks processados.`);
      log.successCount++;

    } catch (error: any) {
      console.error(`  ❌ Erro: ${error.message}`);
      log.errors.push({ file: fileName, error: error.message });
    }

    // Delay crítico para evitar Rate Limit no Cloudflare Workers AI
    console.log(`  ⏳ Aguardando 3s para evitar rate limit...`);
    await sleep(3000);
  }

  // Gera relatório
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Relatório Final do Lote`);
  console.log(`   Arquivos Lidos: ${log.totalRead}`);
  console.log(`   Sucessos      : ${log.successCount}`);
  console.log(`   Pulados       : ${log.skippedCount}`);
  console.log(`   Erros         : ${log.errors.length}`);
  console.log(`📁 Salvo em      : ${LOG_FILE}`);
  console.log(`${'═'.repeat(50)}\n`);
}

processBatch().catch((error) => {
  console.error('[FATAL ERROR]', error);
  process.exit(1);
});
