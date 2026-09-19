import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');

const DIR_ENTRADA = path.join(process.cwd(), 'content', 'pdfs-entrada');
const DIR_STAGING = path.join(process.cwd(), 'content', 'questoes-staging');
const DIR_PROCESSADOS = path.join(process.cwd(), 'content', 'pdfs-processados-local');

// Configura os diretórios caso não existam
[DIR_ENTRADA, DIR_STAGING, DIR_PROCESSADOS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function extrairMetadados(texto: string) {
  // Limpar texto para facilitar regex
  const textToUpper = texto.toUpperCase();

  // Heurística de Banca
  let banca = null;
  const bancasComuns = ['VUNESP', 'CESPE', 'CEBRASPE', 'FGV', 'FCC', 'SHDI', 'IBFC', 'AVANCA SP'];
  for (const b of bancasComuns) {
    if (textToUpper.includes(b)) {
      banca = b;
      break;
    }
  }

  // Heurística de Ano
  let ano = null;
  const anoMatch = textToUpper.match(/\b(20[1-2][0-9])\b/);
  if (anoMatch) {
    ano = parseInt(anoMatch[1], 10);
  }

  // Heurística de Edital
  let edital_ref = null;
  if (textToUpper.includes('GUARDA MUNICIPAL') || textToUpper.includes('GCM')) {
    edital_ref = ano === 2025 ? 'gm-hortolandia-2025' : 'gm-generico';
  }

  return { banca, ano, edital_ref };
}

async function run() {
  const files = fs.readdirSync(DIR_ENTRADA).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log('Nenhum PDF encontrado em content/pdfs-entrada/');
    return;
  }

  for (const file of files) {
    console.log(`\nProcessando: ${file}...`);
    const inputPath = path.join(DIR_ENTRADA, file);
    
    try {
      const dataBuffer = fs.readFileSync(inputPath);
      const data = await pdfParse(dataBuffer);
      const texto = data.text;

      const metadados = extrairMetadados(texto);

      const rascunho = {
        _arquivo_origem: file,
        banca: metadados.banca,
        ano: metadados.ano,
        edital_ref: metadados.edital_ref,
        texto_bruto: texto
      };

      const outName = path.basename(file, '.pdf') + '-rascunho.json';
      const outPath = path.join(DIR_STAGING, outName);
      
      fs.writeFileSync(outPath, JSON.stringify(rascunho, null, 2), 'utf-8');
      console.log(`✅ Rascunho salvo em: ${outPath}`);

      // Mover original
      const processadoPath = path.join(DIR_PROCESSADOS, file);
      fs.renameSync(inputPath, processadoPath);
      console.log(`📦 Movido para processados: ${processadoPath}`);

      if (!metadados.banca || !metadados.ano || !metadados.edital_ref) {
        console.log(`⚠️  Aviso: Metadados incompletos para ${file}. Revisão manual será necessária no JSON.`);
      }

    } catch (err) {
      console.error(`❌ Erro ao processar ${file}:`, err);
    }
  }
}

run().catch(console.error);
