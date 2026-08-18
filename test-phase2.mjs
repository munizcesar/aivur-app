import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log("Iniciando verificação da Fase 2 (Geração de Curso)...");
    const browser = await puppeteer.launch({
        headless: true, // true para rodar em background
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Captura os logs do console do navegador para debugar
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    try {
        console.log("Navegando para /mentor/gerar...");
        let success = false;
        for (let i = 0; i < 5; i++) {
            try {
                await page.goto('http://localhost:3000/mentor/gerar', { waitUntil: 'networkidle0', timeout: 15000 });
                success = true;
                break;
            } catch (err) {
                console.log(`Tentativa ${i+1} falhou, tentando novamente...`);
                await sleep(2000);
            }
        }
        
        if (!success) throw new Error("Não foi possível acessar localhost:3000/mentor/gerar");
        
        console.log("✓ Página carregada");

        // 1. Preencher form
        await page.type('input[type="text"]', 'Edital Teste Automatizado Puppeteer');
        
        const mockEditalText = `
        1. LÍNGUA PORTUGUESA: Compreensão e interpretação de textos. Ortografia oficial.
        2. RACIOCÍNIO LÓGICO: Estruturas lógicas. Lógica de argumentação.
        `;
        
        await page.type('textarea', mockEditalText);
        console.log("✓ Formulário preenchido");

        // 2. Clicar em Gerar Trilha
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
        });
        
        console.log("Aguardando geração do curso pela Groq (pode demorar alguns segundos)...");
        
        // Aguarda a tela de revisão aparecer (botão "Salvar e Iniciar Trilha" tem onClick = handleSave)
        // O h2 de revisão contém "Revisão da Trilha"
        await page.waitForFunction(
            () => document.body.innerText.includes('Revisão da Trilha'),
            { timeout: 60000 }
        );
        console.log("✓ Curso gerado. Tela de revisão exibida.");
        
        await page.screenshot({ path: "screenshot-mentor-phase2-review.png", fullPage: true });

        // 3. Salvar
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const saveBtn = btns.find(b => b.innerText.includes('Salvar e Iniciar Trilha'));
            if (saveBtn) saveBtn.click();
        });
        
        console.log("Aguardando redirecionamento para /mentor...");
        await page.waitForFunction(
            () => window.location.pathname === '/mentor',
            { timeout: 10000 }
        );
        
        await sleep(1000); // Aguardar hidratação e re-render do IDB
        console.log("✓ Redirecionado para /mentor");

        // 4. Verificar se o curso apareceu na listagem
        const hasCourse = await page.evaluate(() => {
            return document.body.innerText.includes('Edital Teste Automatizado Puppeteer');
        });
        
        if (!hasCourse) {
            throw new Error("Curso gerado não apareceu na listagem Meus Cursos Gerados!");
        }
        
        console.log("✓ Curso listado em 'Meus Cursos Gerados'");
        
        // 5. Entrar no curso local (SSG Fallback Test)
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const courseLink = links.find(a => a.href.includes('/mentor/local-'));
            if (courseLink) courseLink.click();
        });
        
        console.log("Aguardando página da trilha local...");
        await page.waitForFunction(
            () => document.body.innerText.includes('Edital Teste Automatizado Puppeteer') &&
                  document.body.innerText.includes('Zerar progresso deste curso'),
            { timeout: 30000 }
        );
        
        console.log("✓ Trilha local carregada com sucesso sem erro 404!");
        await page.screenshot({ path: "screenshot-mentor-phase2-course.png", fullPage: true });

        console.log("✓ FASE 2 VERIFICADA COM SUCESSO!");

    } catch (error) {
        console.error("❌ Erro durante o teste:", error);
        await page.screenshot({ path: "error-debug-phase2.png", fullPage: true });
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
