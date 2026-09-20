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
    console.log("Navigating to /trilhas...");
    await page.goto('http://localhost:3000/trilhas', { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await page.screenshot({ path: path.join(OUT, 'trilhas_dashboard.png') });
    console.log('SAVED trilhas_dashboard.png');

    // Trying to click "Gerar Trilha com IA"
    // Usually it's a button, let's find it by text or try to find links
    const buttons = await page.$$('button, a');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('gerar trilha')) {
        console.log("Clicking 'Gerar Trilha com IA'...");
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log("Could not find 'Gerar Trilha' button.");
    }

    await delay(2000);
    await page.screenshot({ path: path.join(OUT, 'trilhas_after_click.png') });
    console.log('SAVED trilhas_after_click.png');

  } catch (err) {
    console.error(err);
  }

  console.log("DONE");
  await browser.close();
})();
