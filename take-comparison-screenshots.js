const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 1080 } });
  const page = await browser.newPage();
  
  console.log("Navigating to reference page /trilhas/t-002...");
  await page.goto('http://localhost:3000/trilhas/t-002', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'C:\\Users\\Cesar Victor\\Desktop\\screenshots-trilhas-fix\\ref_t-002.png', fullPage: true });
  console.log("SAVED ref_t-002.png");
  
  console.log("Navigating to problematic page /trilhas...");
  await page.goto('http://localhost:3000/trilhas', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'C:\\Users\\Cesar Victor\\Desktop\\screenshots-trilhas-fix\\prob_trilhas.png', fullPage: true });
  console.log("SAVED prob_trilhas.png");

  await browser.close();
  console.log("DONE");
})();
