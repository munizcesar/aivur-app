import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';

const MOCK_QUESTIONS = [
  {
    id: 1,
    statement: "Segundo o Art. 1º da CF/88, quais são os fundamentos da República Federativa do Brasil?",
    text: "Segundo o Art. 1º da CF/88, quais são os fundamentos da República Federativa do Brasil?",
    options: [
      { key: "A", text: "Soberania e cidadania apenas" },
      { key: "B", text: "Soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e pluralismo político" },
      { key: "C", text: "Federalismo e separação dos poderes" },
      { key: "D", text: "Democracia direta e sufrágio universal" },
    ],
    correctAnswer: "B", answer: "B",
    explanation: "O Art. 1º da CF/88 elenca os cinco fundamentos: I - soberania; II - cidadania; III - dignidade da pessoa humana; IV - valores sociais do trabalho e da livre iniciativa; V - pluralismo político.",
    feedback: "O Art. 1º da CF/88 elenca os cinco fundamentos: I - soberania; II - cidadania; III - dignidade da pessoa humana; IV - valores sociais do trabalho e da livre iniciativa; V - pluralismo político.",
    fonte: "Fragmento 1 do contexto RAG — Art. 1°, CF/88",
    qualityBadge: { level: "high", label: "🟢 Alta", color: "green" }, ragScore: 0.629,
  },
  {
    id: 2,
    statement: "De acordo com o Art. 2º da CF/88, como são os Poderes da União: Legislativo, Executivo e Judiciário?",
    text: "De acordo com o Art. 2º da CF/88, como são os Poderes da União: Legislativo, Executivo e Judiciário?",
    options: [
      { key: "A", text: "Dependentes e hierárquicos" },
      { key: "B", text: "Independentes e soberanos" },
      { key: "C", text: "Independentes e harmônicos entre si" },
      { key: "D", text: "Harmonizados sob a chefia do Executivo" },
    ],
    correctAnswer: "C", answer: "C",
    explanation: "O Art. 2º da CF/88 dispõe que os Poderes da União são independentes e harmônicos entre si.",
    feedback: "O Art. 2º da CF/88 dispõe que os Poderes da União são independentes e harmônicos entre si.",
    fonte: "Fragmento 1 do contexto RAG — Art. 2°, CF/88",
    qualityBadge: { level: "high", label: "🟢 Alta", color: "green" }, ragScore: 0.615,
  },
  {
    id: 3,
    statement: "O Art. 3º da CF/88 estabelece os objetivos fundamentais da República. Qual das opções NÃO é um desses objetivos?",
    text: "O Art. 3º da CF/88 estabelece os objetivos fundamentais da República. Qual das opções NÃO é um desses objetivos?",
    options: [
      { key: "A", text: "Construir uma sociedade livre, justa e solidária" },
      { key: "B", text: "Garantir o desenvolvimento nacional" },
      { key: "C", text: "Promover o bem de todos sem discriminação" },
      { key: "D", text: "Assegurar a autonomia plena dos municípios" },
    ],
    correctAnswer: "D", answer: "D",
    explanation: "Os objetivos do Art. 3º são: I - construir sociedade livre, justa e solidária; II - garantir o desenvolvimento nacional; III - erradicar a pobreza; IV - promover o bem de todos.",
    feedback: "Os objetivos do Art. 3º são: I - construir sociedade livre, justa e solidária; II - garantir o desenvolvimento nacional; III - erradicar a pobreza; IV - promover o bem de todos.",
    fonte: "Fragmento 2 do contexto RAG — Art. 3°, CF/88",
    qualityBadge: { level: "medium", label: "🟡 Média", color: "yellow" }, ragScore: 0.604,
  },
];

// The Zustand Persist key + shape expected by the store
const STORE_STATE = {
  state: {
    step: 3,
    mode: 'concurso',
    filters: {
      materia: 'direito_constitucional',
      assunto: 'Todos',
      banca: 'Todas',
      cargo: 'Todos',
      dificuldade: 'medium',
      ano: 'Todos',
      orgao: 'Todos',
      nivel: 'Todos',
      quantidade: 3,
      tipoQuestao: 'mc',
      alternativas: 4,
    },
    freeStudy: { text: '', qtd: 3, tipo: 'multipla' },
    generatedQuestions: MOCK_QUESTIONS,
    answered: 0,
    isDrawerOpen: false,
    editalText: '',
  },
  version: 0,
};

async function captureViewport({ label, width, height, deviceScaleFactor, outputFile }) {
  console.log(`\n📸 Capturando ${label} (${width}×${height})...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor });

  // 1. Load a blank page in the same origin so we can write sessionStorage
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // 2. Inject Zustand persist state into sessionStorage BEFORE navigation completes
  await page.evaluate((storeJson) => {
    sessionStorage.setItem('aivur-quiz-storage', JSON.stringify(storeJson));
  }, STORE_STATE);

  // 3. Reload so Next.js and Zustand Persist hydrate from the seeded sessionStorage
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // 4. Wait for the quiz fullscreen overlay to appear (WizardStep3 renders it)
  try {
    await page.waitForSelector('[class*="quizFullscreenOverlay"]', { timeout: 8000 });
    console.log(`  ✅ quizFullscreenOverlay detectado`);
  } catch {
    console.log(`  ⚠️  quizFullscreenOverlay não encontrado — capturando página como está`);
  }

  // 5. Extra settle time for CSS transitions
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: outputFile, fullPage: false });
  console.log(`  💾 Salvo: ${outputFile}`);

  await browser.close();
}

async function main() {
  await captureViewport({
    label: 'Desktop 1440px',
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    outputFile: path.join(__dirname, 'screenshot-desktop.png'),
  });

  await captureViewport({
    label: 'Mobile 390px',
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    outputFile: path.join(__dirname, 'screenshot-mobile.png'),
  });

  console.log('\n✅ Ambas as screenshots geradas com sucesso.');
  console.log('   📁 screenshot-desktop.png — desktop 1440×900');
  console.log('   📁 screenshot-mobile.png  — mobile 390×844 @2x');
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
