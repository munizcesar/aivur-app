import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleLogs.push(`[PAGE ERROR] ${err.toString()}`);
  });

  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to Trilhas...");
  await page.goto('http://localhost:3000/trilhas/t-001', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'scratch/trilhas_video.png' });
  
  console.log("Clicking Flashcards tab...");
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('flashcards')) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/trilhas_flashcards.png' });
  
  console.log("Flipping Flashcard...");
  const flashcardArea = await page.$('.group'); // The group class used in cursor-pointer
  if (flashcardArea) {
    await flashcardArea.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: 'scratch/trilhas_flashcard_flipped.png' });
  }

  console.log("Clicking Questoes tab...");
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Questões')) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/trilhas_questoes.png' });

  // Helper: clica via JavaScript para evitar problemas de coordenadas
  async function clickByText(txt) {
    return page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(t) && !b.disabled);
      if (btn) { btn.click(); return true; }
      return false;
    }, txt);
  }

  console.log("Driving through all questions to reach End State...");
  // Ciclo: responde + confirma + avança — até aparecer End State (botão 'Aprofundar')
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));

    // Verifica se já estamos no End State
    const atEndState = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Aprofundar'))
    );
    if (atEndState) {
      console.log(`End state reached after ${i} iterations.`);
      await page.screenshot({ path: 'scratch/trilhas_endstate.png' });
      break;
    }

    // Se há opção disponível (questão não respondida), seleciona a primeira
    const optClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.classList.contains('w-full') && b.classList.contains('flex') && !b.disabled
      );
      if (btn) { btn.click(); return true; }
      return false;
    });

    await new Promise(r => setTimeout(r, 300));

    // Confirma a resposta
    const conferiu = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Conferir Resposta' && !b.disabled);
      if (btn) { btn.click(); return true; }
      return false;
    });

    await new Promise(r => setTimeout(r, 600));
    
    // Avança para próxima questão
    const avancou = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Próxima'));
      if (btn) { btn.click(); return true; }
      return false;
    });

    console.log(`Iter ${i+1}: optClicked=${optClicked} conferiu=${conferiu} avancou=${avancou}`);
  }
  await page.screenshot({ path: 'scratch/trilhas_questao_respondida.png' });

  console.log("Clicking Aprofundar com IA...");
  
  // Dump buttons to see what's on screen
  const allBtns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent));
  console.log("Available buttons in DOM:", allBtns);

  const iaBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Aprofundar'));
  });
  
  const isIaElement = await page.evaluate(el => el instanceof Element, iaBtn);
  if (isIaElement) {
    console.log("iaBtn is a valid element. Clicking...");
    await iaBtn.click();
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'scratch/trilhas_ia_resultado.png' });
    console.log("Click successful and screenshot taken.");
  } else {
    console.log("iaBtn was NOT found in the DOM!");
  }

  console.log("--- CONSOLE LOGS ---");
  console.log(consoleLogs.join("\n"));
  
  await browser.close();
})();
