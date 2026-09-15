import puppeteer from 'puppeteer';
import path from 'path';

const url = 'http://localhost:3000/trilhas-v2/t-002';
const outResumo = path.join(process.cwd(), 'scratch', 't002-v2-resumo.png');
const outQuestoes = path.join(process.cwd(), 'scratch', 't002-v2-questoes.png');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932 }); // iPhone 14 Pro Max viewport for mobile layout

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Wait for the accordion to be available
  await page.waitForSelector('#v2-acc-trigger-resumo', { timeout: 10000 });

  // Open "Resumo"
  console.log('Opening Resumo...');
  await page.click('#v2-acc-trigger-resumo');
  // Wait for animation
  await new Promise(r => setTimeout(r, 1000));
  console.log(`Capturing screenshot to ${outResumo}...`);
  await page.screenshot({ path: outResumo, fullPage: true });

  // Close "Resumo"
  await page.click('#v2-acc-trigger-resumo');
  await new Promise(r => setTimeout(r, 600));

  // Open "Questões"
  console.log('Opening Questões...');
  await page.click('#v2-acc-trigger-questoes');
  // Wait for animation
  await new Promise(r => setTimeout(r, 1000));
  console.log(`Capturing screenshot to ${outQuestoes}...`);
  await page.screenshot({ path: outQuestoes, fullPage: true });

  await browser.close();
  console.log('Done.');
})();
