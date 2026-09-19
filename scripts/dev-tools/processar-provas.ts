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

function getPdfFilesRecursively(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getPdfFilesRecursively(filePath, fileList);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

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
  const pdfPaths = getPdfFilesRecursively(DIR_ENTRADA);

  if (pdfPaths.length === 0) {
    console.log('Nenhum PDF encontrado em content/pdfs-entrada/');
    return;
  }

  for (const inputPath of pdfPaths) {
    const relativePath = path.relative(DIR_ENTRADA, inputPath);
    const parsedPath = path.parse(relativePath);
    
    let pastaOrigem = parsedPath.dir;
    // Normalizar separadores de pasta (para manter json consistente no Windows e Linux)
    pastaOrigem = pastaOrigem.split(path.sep).join('/');

    console.log(`\nProcessando: ${relativePath}...`);
    
      const outNamePrefix = pastaOrigem ? pastaOrigem.replace(/\//g, '_') + '_' : '';
      const outName = `${outNamePrefix}${parsedPath.name}-rascunho.json`;
      const outPath = path.join(DIR_STAGING, outName);
      
      const processadoPath = path.join(DIR_PROCESSADOS, relativePath);

      if (fs.existsSync(outPath) || fs.existsSync(processadoPath)) {
        console.log(`⚠️  Já existe: ${relativePath} — pulado`);
        continue;
      }
      
      try {
        const dataBuffer = fs.readFileSync(inputPath);
      const data = await pdfParse(dataBuffer);
      const texto = data.text;

      if (!texto || texto.trim().length === 0) {
        console.log(`⚠️  Sem texto extraível (possível PDF escaneado): ${relativePath}`);
        continue;
      }

      const metadados = extrairMetadados(texto);

      const rascunho = {
        _arquivo_origem: parsedPath.base,
        _pasta_origem: pastaOrigem || null,
        banca: metadados.banca,
        ano: metadados.ano,
        edital_ref: metadados.edital_ref,
        texto_bruto: texto
      };

      fs.writeFileSync(outPath, JSON.stringify(rascunho, null, 2), 'utf-8');
      console.log(`✅ Rascunho salvo em: ${outPath}`);

      // Mover original recriando estrutura de subpastas
      const processadoDir = path.dirname(processadoPath);
      if (!fs.existsSync(processadoDir)) {
        fs.mkdirSync(processadoDir, { recursive: true });
      }

      fs.renameSync(inputPath, processadoPath);
      console.log(`📦 Movido para processados: ${processadoPath}`);

      if (!metadados.banca || !metadados.ano || !metadados.edital_ref) {
        console.log(`⚠️  Aviso: Metadados incompletos para ${relativePath}. Revisão manual será necessária no JSON.`);
      }

    } catch (err) {
      console.error(`❌ Erro ao processar ${relativePath}:`, err);
    }
  }
}

run().catch(console.error);
