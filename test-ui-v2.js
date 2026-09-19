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

  async function run() {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    await page.goto('http://localhost:3000/trilhas/t-001', { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    await page.waitForSelector('#v2-acc-trigger-questoes', { timeout: 15000 });
    await delay(1000);
    
    // Abre accordion Questoes
    await page.click('#v2-acc-trigger-questoes');
    
    await page.waitForSelector('.v2-q-opt-text', { timeout: 5000 });
    await delay(1000);

    // Q1 screenshot
    await page.screenshot({ path: path.join(OUT, 'desk_q1_4alt.png') });
    console.log('SAVED Q1');

    // avanca para Q2
    await page.click('#v2-q-opt-0-0');
    await delay(500);
    await page.click('#v2-conferir-btn');
    await delay(1000);
    await page.click('#v2-next-q-btn');
    await delay(1000);

    // Q2 screenshot
    await page.screenshot({ path: path.join(OUT, 'desk_q2_5alt.png') });
    console.log('SAVED Q2');

    // avanca para Q3
    await page.click('#v2-q-opt-1-0');
    await delay(500);
    await page.click('#v2-conferir-btn');
    await delay(1000);
    await page.click('#v2-next-q-btn');
    await delay(1000);

    // Q3 screenshot ANTES
    await page.screenshot({ path: path.join(OUT, 'desk_q3_ce_antes.png') });
    console.log('SAVED Q3 (Antes)');

    // responde a Q3
    await page.click('#v2-q-opt-2-1'); // clica Errado
    await delay(500);
    await page.click('#v2-conferir-btn');
    await delay(1000);

    // Q3 screenshot DEPOIS
    await page.screenshot({ path: path.join(OUT, 'desk_q3_ce_depois.png') });
    console.log('SAVED Q3 (Depois)');

    await page.close();
  }

  await run();
  console.log("DONE");
  await browser.close();
})();
