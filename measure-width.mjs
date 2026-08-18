import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';

async function measureWidth() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // Injetar estado para forçar renderização do WizardStep3
    const storeState = {
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
        generatedQuestions: [{id: 1, text: "teste"}],
        answered: 0,
        isDrawerOpen: false,
        editalText: '',
      },
      version: 0,
    };

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate((storeJson) => {
      sessionStorage.setItem('aivur-quiz-storage', JSON.stringify(storeJson));
    }, storeState);

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[class*="quizFullscreenOverlay"]', { timeout: 8000 });
    
    // Obter a largura real do elemento
    const width = await page.evaluate(() => {
      const el = document.querySelector('[class*="qfBody"]');
      return el ? el.getBoundingClientRect().width : null;
    });

    console.log(`Largura calculada: ${width}px`);
  } catch (error) {
    console.error("Erro ao medir largura:", error);
  } finally {
    await browser.close();
  }
}

measureWidth();
