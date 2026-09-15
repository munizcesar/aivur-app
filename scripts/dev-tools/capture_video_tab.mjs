import puppeteer from 'puppeteer';
import path from 'path';

const url = 'http://localhost:3000/trilhas-v2/t-002';
const outGallery = path.join(process.cwd(), 'scratch', 't002-v2-video-gallery.png');
const outPlayer = path.join(process.cwd(), 'scratch', 't002-v2-video-player.png');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.setViewport({ width: 430, height: 932 });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  await page.waitForSelector('#v2-acc-trigger-video', { timeout: 15000 });

  console.log('Opening Video section...');
  await page.click('#v2-acc-trigger-video');
  
  console.log('Waiting for video gallery to load (API call)...');
  await page.waitForSelector('.v2-video-card', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000)); // allow images to render

  console.log(`Capturing gallery screenshot to ${outGallery}...`);
  await page.screenshot({ path: outGallery, fullPage: true });

  console.log('Clicking the first video card...');
  await page.click('.v2-video-card');

  console.log('Waiting for iframe to load...');
  await page.waitForSelector('.v2-video-iframe-box iframe', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000)); // wait for player to render

  console.log(`Capturing player screenshot to ${outPlayer}...`);
  await page.screenshot({ path: outPlayer, fullPage: true });

  await browser.close();
  console.log('Done.');
})();
