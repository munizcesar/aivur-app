import puppeteer from 'puppeteer';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log("Iniciando verificação da Fase 3 (Teoria, Flashcards e Questões)...");
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Navegar para o curso (com retry para contornar ERR_ABORTED do Turbopack)
    for (let i = 0; i < 3; i++) {
        try {
            await page.goto(`${BASE_URL}/mentor/gm-hortolandia-2026`, { waitUntil: "domcontentloaded", timeout: 60000 });
            break;
        } catch (e) {
            if (i === 2) throw e;
            await sleep(2000);
        }
    }
    
    // Limpar IndexedDB para garantir estado limpo
    await page.evaluate(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }
    });
    // Recarregar após limpar
    await page.reload({ waitUntil: "domcontentloaded" });
    await sleep(2000);
    console.log("✓ Página recarregada");

    // 2. Abrir o primeiro accordion
    await page.waitForSelector('button[aria-expanded]');
    const firstSubjectBtn = await page.$('button[aria-expanded]');
    await firstSubjectBtn.click();
    await sleep(1000);
    console.log("✓ Primeiro accordion aberto");

    // 3. Abrir os Detalhes do Tópico
    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('span[class*="itemLabel"]'));
        if (labels.length > 0) labels[0].click();
    });
    await sleep(2000);
    console.log("✓ Tópico expandido");

    // Aguardar os botões aparecerem (TopicDetails renderizou)
    await page.waitForSelector('button[class*="tabBtn"]', { timeout: 10000 });
    await page.screenshot({ path: "debug-expand.png", fullPage: true });

    // 4. Gerar Teoria
    const gerarTeoriaBtn = await page.$('button[class*="generateBtn"]');
    if (gerarTeoriaBtn) {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button[class*="generateBtn"]'));
            if (btns.length > 0) btns[0].click();
        });
        console.log("Aguardando geração de teoria (pode demorar alguns segundos)...");
        await page.waitForSelector('div[class*="teoriaContent"]', { timeout: 60000 });
        console.log("✓ Teoria gerada");
    }

    // 5. Mudar para Aba Flashcards
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button[class*="tabBtn"]'));
        if (tabs.length > 1) tabs[1].click();
    });
    await sleep(500);
    
    // Gerar Flashcards
    const gerarFlashcardsBtn = await page.$('button[class*="generateBtn"]');
    if (gerarFlashcardsBtn) {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button[class*="generateBtn"]'));
            if (btns.length > 0) btns[0].click();
        });
        console.log("Aguardando geração de flashcards...");
        await page.waitForSelector('div[class*="flashcard"]', { timeout: 60000 });
        console.log("✓ Flashcards gerados");
        
        // Marcar o primeiro como "Sei"
        await page.evaluate(() => {
            const fc = document.querySelector('div[class*="flashcard"]:not([class*="flashcardList"])');
            if (fc) fc.click();
        });
        await sleep(500);
        
        // Clica no botão 'Sei'
        await page.evaluate(() => {
            const seiBtn = document.querySelector('button[class*="btnSei"]');
            if (seiBtn) seiBtn.click();
        });
        console.log("✓ Flashcard marcado como 'Sei'");
    }

    // 6. Mudar para Aba Questões
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button[class*="tabBtn"]'));
        if (tabs.length > 2) tabs[2].click();
    });
    await sleep(500);
    
    // Gerar Questões
    const gerarQuestoesBtn = await page.$('button[class*="generateBtn"]');
    if (gerarQuestoesBtn) {
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button[class*="generateBtn"]'));
            if (btns.length > 0) btns[0].click();
        });
        console.log("Aguardando geração de questões...");
        await page.waitForSelector('div[class*="questaoCard"]', { timeout: 60000 });
        console.log("✓ Questões geradas");
        
        // Responder a primeira alternativa da primeira questão
        await page.evaluate(() => {
            const alt = document.querySelector('button[class*="alternativa"]');
            if (alt) alt.click();
        });
        await sleep(500);
        console.log("✓ Questão respondida");
    }

    // 7. Recarregar a página para testar a persistência do IndexedDB
    console.log("Recarregando página para testar persistência...");
    await page.reload({ waitUntil: "domcontentloaded" });
    await sleep(2000);

    // Reabrir accordion e tópico
    await page.waitForSelector('button[aria-expanded]');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button[aria-expanded]'));
        if (btns.length > 0) btns[0].click();
    });
    await sleep(1000);

    await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('span[class*="itemLabel"]'));
        if (labels.length > 0) labels[0].click();
    });
    await sleep(2000);

    // Verificar se Teoria está lá sem precisar gerar de novo
    const teoriaExistente = await page.$('div[class*="teoriaContent"]');
    if (teoriaExistente) {
        console.log("✓ Persistência: Teoria carregada do IndexedDB com sucesso!");
    } else {
        throw new Error("Falha na persistência da Teoria");
    }

    // Screenshot
    await page.screenshot({ path: "screenshot-mentor-phase3-real.png", fullPage: true });
    console.log("✓ screenshot-mentor-phase3-real.png salva");

  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  } finally {
    await browser.close();
  }
}

main();
