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

    await page.goto('http://localhost:3000/trilhas/t-001', { waitUntil: 'domcontentloaded' });
    await delay(4000);

    // Abre accordion Questoes
    await page.evaluate(() => {
      const btn = document.querySelector('#v2-acc-trigger-questoes');
      if (btn) btn.click();
    });
    await delay(1000);

    // screenshot Q1 (4 alternativas, default)
    await page.screenshot({ path: path.join(OUT, 'desk_q1_4alt.png') });
    console.log('SAVED Q1');

    // avanca para Q2
    await page.evaluate(() => {
      const btn = document.querySelector('#v2-q-next');
      if (btn) btn.click();
    });
    await delay(500);

    // screenshot Q2 (5 alternativas)
    await page.screenshot({ path: path.join(OUT, 'desk_q2_5alt.png') });
    console.log('SAVED Q2');

    // avanca para Q3
    await page.evaluate(() => {
      const btn = document.querySelector('#v2-q-next');
      if (btn) btn.click();
    });
    await delay(500);

    // screenshot Q3 Certo/Errado ANTES
    await page.screenshot({ path: path.join(OUT, 'desk_q3_ce_antes.png') });
    console.log('SAVED Q3 (Antes)');

    // responde a Q3
    await page.evaluate(() => {
      const opt = document.querySelector('#v2-q-opt-2-1'); // clica em "Errado"
      if (opt) opt.click();
    });
    await delay(200);

    // click check
    await page.evaluate(() => {
      const chk = document.querySelector('.v2-q-check-btn');
      if (chk) chk.click();
    });
    await delay(500);

    // screenshot Q3 Certo/Errado DEPOIS
    await page.screenshot({ path: path.join(OUT, 'desk_q3_ce_depois.png') });
    console.log('SAVED Q3 (Depois)');

    await page.close();
  }

  await run();
  console.log("DONE");
  await browser.close();
})();
