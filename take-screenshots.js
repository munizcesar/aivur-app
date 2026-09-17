const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const url = 'https://aivur-app.pages.dev/trilhas';
  const outDir = 'C:\\Users\\Cesar Victor\\.gemini\\antigravity-ide\\brain\\a498e279-020b-4e3f-81de-b105bc1a6a98\\scratch';
  
  if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir, { recursive: true });
  }

  await page.goto(url, { waitUntil: 'networkidle0' });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    
    // Light mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await new Promise(r => setTimeout(r, 1000)); // wait for transitions
    await page.screenshot({ path: path.join(outDir, `trilhas-${vp.name}-light.png`), fullPage: true });

    // Dark mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, `trilhas-${vp.name}-dark.png`), fullPage: true });
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
}

run();
