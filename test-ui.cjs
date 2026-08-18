const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/mentor/gm-hortolandia-2026', { waitUntil: 'networkidle0' });
  
  // Wait for intersection observer lazy load
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'C:/Users/Cesar Victor/.gemini/antigravity/brain/da8e8d33-1cc7-4d5e-9fe6-734fd8bcdd76/screenshot-new-checklist.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshot taken');
})();
