const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = 'C:\\Users\\Cesar Victor\\Desktop\\screenshots-tipo-questao';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  try {
    console.log("Navigating to /trilhas (clean)...");
    await page.goto('http://localhost:3000/trilhas', { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await page.screenshot({ path: path.join(OUT, 'trilhas_clean.png') });
    console.log('SAVED trilhas_clean.png');

    console.log("Injecting corrupt data into localStorage...");
    await page.evaluate(() => {
      // Mocking a corrupt customTrilhas state (missing 'questoes' array)
      const corruptState = {
        state: {
          customTrilhas: [
            {
              id: 'c-old-123',
              titulo: 'Trilha Corrompida Antiga',
              disciplina: 'Teste',
              // missing questoes, flashcards, etc
              subjects: [] // old format
            },
            {
              id: 'c-valid-123',
              titulo: 'Trilha Valida Nova',
              disciplina: 'Teste Válido',
              questoes: [
                { id: 'q1', tipo_questao: 'MULTIPLA_ESCOLHA', correta: 'A', enunciado: 'Test', alternativas: ['A','B','C','D','E'] }
              ],
              flashcards: []
            }
          ],
          progressData: { answers: {} }
        },
        version: 0
      };
      localStorage.setItem('aivur-study-store', JSON.stringify(corruptState));
    });

    console.log("Reloading with corrupt data...");
    await page.reload({ waitUntil: 'domcontentloaded' });
    await delay(3000);
    
    await page.screenshot({ path: path.join(OUT, 'trilhas_corrupt_handled.png') });
    console.log('SAVED trilhas_corrupt_handled.png');
    
    // Check local storage to see if corrupt was deleted
    const updatedStateStr = await page.evaluate(() => localStorage.getItem('aivur-study-store'));
    const updatedState = JSON.parse(updatedStateStr);
    console.log("Updated customTrilhas count:", updatedState.state.customTrilhas.length);
    console.log("Updated customTrilhas IDs:", updatedState.state.customTrilhas.map(t => t.id).join(', '));

    console.log("Clicking 'Gerar Trilha com IA'...");
    const buttons = await page.$$('button, a');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('gerar trilha com ia')) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log("Could not find 'Gerar Trilha com IA' button.");
    }

    await delay(2000);
    await page.screenshot({ path: path.join(OUT, 'trilhas_novo.png') });
    console.log('SAVED trilhas_novo.png');

  } catch (err) {
    console.error(err);
  }

  console.log("DONE");
  await browser.close();
})();
