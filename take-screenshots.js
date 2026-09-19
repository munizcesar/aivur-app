/**
 * Screenshot script v4 — esconde a sidebar via JS antes de capturar,
 * pois o layout com `fixed` cobre o `main` no headless.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const OUT = 'C:\\Users\\Cesar Victor\\.gemini\\antigravity-ide\\brain\\a6c1f5b7-3504-4d7c-871a-081480e9ee4f\\scratch';
const delay = ms => new Promise(r => setTimeout(r, ms));

async function shotHidingSidebar(page, name) {
  // Esconde a sidebar temporariamente
  await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (aside) aside.style.display = 'none';
  });
  await delay(100);

  const p = path.join(OUT, name + '.png');
  await page.screenshot({ path: p });
  console.log('SAVED:', p);

  // Restaura
  await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (aside) aside.style.display = '';
  });
  return p;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function run(width, height, prefix) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    await page.goto('http://localhost:3000/sala-de-aula', { waitUntil: 'domcontentloaded' });
    await delay(4500);

    // Abre accordion + clica tópico
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button[aria-expanded]')];
      if (btns.length) btns[0].click();
    });
    await delay(600);
    await page.evaluate(() => {
      const aside = document.querySelector('aside');
      if (!aside) return;
      const topicBtns = [...aside.querySelectorAll('button')].filter(b =>
        !b.hasAttribute('aria-expanded') && b.textContent.trim().length > 3
      );
      if (topicBtns.length) topicBtns[0].click();
    });
    await delay(2000);

    // Clica aba Questões
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('button, [role="tab"]')];
      const tab = all.find(b => /quest[oõ]es/i.test(b.textContent.trim()));
      if (tab) tab.click();
    });
    await delay(1500);

    // Gera questões
    const clicked = await page.evaluate(() => {
      const all = [...document.querySelectorAll('button')];
      const btn = all.find(b => /gerar|aprofund|ia/i.test(b.textContent));
      if (btn) { btn.click(); return btn.textContent.trim().substring(0,30); }
      return null;
    });
    if (clicked) console.log(`[${prefix}] Gerar: "${clicked}"`);
    await delay(10000);

    const qText = await page.evaluate(() => {
      const m = document.querySelector('main');
      return m ? m.innerText.substring(0, 300) : '';
    });
    console.log(`[${prefix}] Stage text: ${qText.replace(/\n/g,' ').substring(0,150)}`);

    // Q1 — 4 alternativas (retrocompat)
    await shotHidingSidebar(page, prefix + '_q1_4alt');

    // Q2 — 5 alternativas
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('button')];
      const next = all.find(b => /próxima|proxima|seguinte/i.test(b.textContent.trim()));
      if (next) next.click();
    });
    await delay(700);
    await shotHidingSidebar(page, prefix + '_q2_5alt');

    // Q3 — Certo/Errado (antes de responder)
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('button')];
      const next = all.find(b => /próxima|proxima|seguinte/i.test(b.textContent.trim()));
      if (next) next.click();
    });
    await delay(700);
    await shotHidingSidebar(page, prefix + '_q3_ce_antes');

    // Clica Certo + Responder
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return;
      const certo = [...main.querySelectorAll('*')].find(el =>
        el.childNodes.length === 1 &&
        el.textContent.trim() === 'Certo' &&
        ['BUTTON','DIV','SPAN','LI'].includes(el.tagName)
      );
      if (certo) certo.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const all = [...document.querySelectorAll('button')];
      const resp = all.find(b => /responder/i.test(b.textContent.trim()));
      if (resp) resp.click();
    });
    await delay(1500);
    await shotHidingSidebar(page, prefix + '_q3_ce_depois');

    await page.close();
  }

  try {
    console.log('\n=== DESKTOP 1440x900 ===');
    await run(1440, 900, 'desk');

    console.log('\n=== MOBILE 390x844 ===');
    await run(390, 844, 'mobi');
  } catch(e) {
    console.error('FATAL:', e);
  } finally {
    await browser.close();
  }
  console.log('\nDone.');
})();
