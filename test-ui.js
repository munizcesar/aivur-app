const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  const errors = [];

  const takeScreenshots = async (viewport, prefix) => {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`Console error [${prefix}]:`, msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`Page error [${prefix}]:`, error.message);
    });

    try {
      await page.goto('http://localhost:3000/sala-de-aula?tab=questoes&topic=t_agente_infracao', { waitUntil: 'domcontentloaded' });
      
      const delay = ms => new Promise(r => setTimeout(r, ms));
      await delay(4000);
      
      await page.screenshot({ path: `scratch/screenshot-${prefix}-antiga.png`, fullPage: true });

      const nextBtn = await page.$$('button:has(svg.lucide-chevron-right)');
      if (nextBtn.length > 0) {
        await nextBtn[0].click();
        await delay(1000);
        await page.screenshot({ path: `scratch/screenshot-${prefix}-5-alt.png`, fullPage: true });

        await nextBtn[0].click();
        await delay(1000);
        await page.screenshot({ path: `scratch/screenshot-${prefix}-ce-antes.png`, fullPage: true });

        const certoBtn = await page.$x("//span[contains(., 'Certo')]");
        if (certoBtn.length > 0) {
          await certoBtn[0].click();
          await delay(500);
          
          const responderBtn = await page.$x("//button[contains(., 'Responder')]");
          if (responderBtn.length > 0) {
            await responderBtn[0].click();
            await delay(1000);
            await page.screenshot({ path: `scratch/screenshot-${prefix}-ce-acerto.png`, fullPage: true });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    await page.close();
  };

  try {
    console.log("Taking desktop screenshots...");
    await takeScreenshots({ width: 1280, height: 800, deviceScaleFactor: 2 }, 'desktop');
    
    console.log("Taking mobile screenshots...");
    await takeScreenshots({ width: 390, height: 844, deviceScaleFactor: 2 }, 'mobile');
    
    if (errors.length > 0) {
      console.log("TEST FINISHED WITH CONSOLE ERRORS:", errors);
    } else {
      console.log("TEST FINISHED SUCCESSFULLY: No console errors.");
    }
  } catch (err) {
    console.error("Script failed:", err);
  } finally {
    await browser.close();
  }
})();
