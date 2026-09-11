const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    const outputDir = 'C:\\Users\\Cesar Victor\\.gemini\\antigravity\\brain\\b30e88e7-4529-47c2-93c7-7b49dc84ee9b';
    
    console.log('Capturando Aba de Vídeo...');
    page.goto('http://localhost:3000/sala-de-aula?topic=port-01&tab=video').catch(e => console.log("goto error ignored:", e.message));
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({ path: `${outputDir}\\video.png` });
    console.log('Aba de Vídeo capturada.');

    console.log('Capturando Aba de Resumo...');
    page.goto('http://localhost:3000/sala-de-aula?topic=port-01&tab=resumo').catch(e => console.log("goto error ignored:", e.message));
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({ path: `${outputDir}\\resumo.png` });
    console.log('Aba de Resumo capturada.');

    console.log('Capturando Aba de Flashcards...');
    page.goto('http://localhost:3000/sala-de-aula?topic=port-01&tab=flashcards').catch(e => console.log("goto error ignored:", e.message));
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({ path: `${outputDir}\\flashcards.png` });
    console.log('Aba de Flashcards capturada.');

    await browser.close();
    console.log('Todas as capturas concluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao capturar telas:', error);
    process.exit(1);
  }
})();
