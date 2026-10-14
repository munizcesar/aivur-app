// Casos de regressão — Meu Material / Importação Real (Fase 1).
// Protegem COMPORTAMENTOS e CONTRATOS de importação de PDF e texto colado.
import assert from "node:assert/strict";
import {
  evaluateContentLimits,
  MaterialImportSchema,
  MATERIAL_LIMITS,
} from "../../../src/lib/validations/material.ts";
import {
  validatePDFFile,
  extractPDFContent,
} from "../../../src/utils/materialExtractor.ts";

function createPdfWithText(text) {
  const streamContent = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamContent.length} >> stream
${streamContent}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f\x20
0000000009 00000 n\x20
0000000058 00000 n\x20
0000000115 00000 n\x20
0000000244 00000 n\x20
0000000300 00000 n\x20
trailer << /Size 6 /Root 1 0 R >>
startxref
400
%%EOF`;
}

function createEmptyPdfNoText() {
  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f\x20
0000000009 00000 n\x20
0000000058 00000 n\x20
0000000115 00000 n\x20
trailer << /Size 4 /Root 1 0 R >>
startxref
200
%%EOF`;
}

import { waitHydrated } from "../_support/browser.mjs";

export const cases = [
  {
    id: "REG-MAT-001",
    title: "Validação de limites de texto: vazio, insuficiente (<100) e válido (100-8000)",
    needs: "api",
    async run() {
      // 1. Texto vazio
      const emptyCheck = evaluateContentLimits("");
      assert.equal(emptyCheck.isValid, false, "texto vazio deve ser rejeitado");
      assert.equal(emptyCheck.status, "empty");

      const whitespaceCheck = evaluateContentLimits("   \n\t  ");
      assert.equal(whitespaceCheck.isValid, false, "espaços em branco devem ser tratados como vazio");

      // 2. Texto insuficiente (< 100 caracteres)
      const shortText = "Este é um texto curto demais para estudo.";
      const shortCheck = evaluateContentLimits(shortText);
      assert.equal(shortCheck.isValid, false, "texto com menos de 100 caracteres deve ser rejeitado");
      assert.equal(shortCheck.status, "too_short");
      assert.match(shortCheck.message, /100/, "mensagem deve explicitar o mínimo de 100 caracteres");

      // 3. Texto válido (100 a 8.000 caracteres)
      const validText = "A".repeat(150);
      const validCheck = evaluateContentLimits(validText);
      assert.equal(validCheck.isValid, true, "texto de 150 caracteres deve ser aceito");
      assert.equal(validCheck.status, "valid");
      assert.equal(validCheck.charCount, 150);

      // 4. Validação pelo Zod schema
      const schemaValid = MaterialImportSchema.safeParse({
        origem: "texto",
        titulo: "Artigo 5º Constitucional",
        conteudo: validText,
        metadados: { caracteres: 150 },
      });
      assert.equal(schemaValid.success, true, "Zod deve validar conteúdo estruturado válido");

      const schemaShort = MaterialImportSchema.safeParse({
        origem: "texto",
        titulo: "Título",
        conteudo: "Curto",
        metadados: { caracteres: 5 },
      });
      assert.equal(schemaShort.success, false, "Zod deve rejeitar conteúdo insuficiente");
    },
  },
  {
    id: "REG-MAT-002",
    title: "Prevenção de truncamento silencioso: rejeição clara acima de 8.000 caracteres",
    needs: "api",
    async run() {
      // Texto com 8.500 caracteres
      const oversizedText = "Artigo de lei para concurso público. ".repeat(250); // ~9.250 chars
      assert.ok(oversizedText.length > MATERIAL_LIMITS.MAX_CHARS);

      const check = evaluateContentLimits(oversizedText);
      assert.equal(check.isValid, false, "texto acima de 8.000 caracteres deve ser rejeitado");
      assert.equal(check.status, "too_long");
      assert.match(check.message, /não foi truncado silenciosamente/i, "deve garantir que não trunca silenciosamente");
      assert.equal(check.charCount, oversizedText.trim().length);

      // Verificação pelo Zod Schema
      const schemaCheck = MaterialImportSchema.safeParse({
        origem: "texto",
        titulo: "Material Gigante",
        conteudo: oversizedText,
        metadados: { caracteres: oversizedText.length },
      });
      assert.equal(schemaCheck.success, false, "Zod deve rejeitar conteúdo acima de 8.000 caracteres");
    },
  },
  {
    id: "REG-MAT-003",
    title: "Validação de arquivo: rejeição de formato que não seja PDF ou tamanho > 10MB",
    needs: "api",
    async run() {
      // Arquivo com formato inválido (ex: .docx ou .png)
      const docxCheck = validatePDFFile({ name: "apostila.docx", size: 1024, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      assert.ok(docxCheck !== null, "formato docx deve ser rejeitado");
      assert.equal(docxCheck.code, "INVALID_TYPE");

      const pngCheck = validatePDFFile({ name: "scan.png", size: 2048, type: "image/png" });
      assert.ok(pngCheck !== null, "formato png deve ser rejeitado");
      assert.equal(pngCheck.code, "INVALID_TYPE");

      // Arquivo com tamanho acima de 10MB
      const elevenMb = 11 * 1024 * 1024;
      const oversizedCheck = validatePDFFile({ name: "livro_gigante.pdf", size: elevenMb, type: "application/pdf" });
      assert.ok(oversizedCheck !== null, "arquivo > 10MB deve ser rejeitado");
      assert.equal(oversizedCheck.code, "FILE_TOO_LARGE");

      // Arquivo válido
      const validFileCheck = validatePDFFile({ name: "constitucional.pdf", size: 500 * 1024, type: "application/pdf" });
      assert.equal(validFileCheck, null, "PDF válido deve retornar null (sem erro)");
    },
  },
  {
    id: "REG-MAT-004",
    title: "Extração de PDF válido com contagem real de páginas e caracteres",
    needs: "api",
    async run() {
      const sampleText = "Constituicao Federal de 1988: Direitos e garantias fundamentais da pessoa humana aplicaveis aos concursos publicos.";
      const samplePdfString = createPdfWithText(sampleText);
      const pdfBytes = new TextEncoder().encode(samplePdfString);

      const outcome = await extractPDFContent(pdfBytes);
      assert.equal(outcome.success, true, "extração de PDF válido deve ser bem-sucedida");
      assert.equal(outcome.data.pageCount, 1, "deve reportar 1 página");
      assert.ok(outcome.data.text.includes("Constituicao Federal"), "texto extraído deve conter o conteúdo do PDF");
      assert.equal(outcome.data.charCount, outcome.data.text.length);
      assert.equal(outcome.data.isTooLong, false);
    },
  },
  {
    id: "REG-MAT-005",
    title: "Tratamento defensivo: PDF inválido, vazio ou sem camada de texto (scan)",
    needs: "api",
    async run() {
      // 1. Buffer vazio (0 bytes)
      const emptyOutcome = await extractPDFContent(new Uint8Array(0));
      assert.equal(emptyOutcome.success, false);
      assert.equal(emptyOutcome.error.code, "CORRUPTED_PDF");

      // 2. Dados corrompidos (não é um PDF estruturado)
      const corruptedBytes = new TextEncoder().encode("ESTE ARQUIVO NAO E UM PDF VALIDO");
      const corruptedOutcome = await extractPDFContent(corruptedBytes);
      assert.equal(corruptedOutcome.success, false);
      assert.equal(corruptedOutcome.error.code, "CORRUPTED_PDF");

      // 3. PDF sem texto selecionável (scan/imagem sem stream)
      const noTextPdfString = createEmptyPdfNoText();
      const noTextBytes = new TextEncoder().encode(noTextPdfString);
      const noTextOutcome = await extractPDFContent(noTextBytes);
      assert.equal(noTextOutcome.success, false);
      assert.equal(noTextOutcome.error.code, "NO_TEXT");
      assert.match(noTextOutcome.error.message, /digitalização|scan/i);
    },
  },
  {
    id: "REG-MAT-006",
    title: "Interface de Meu Material (/material): alternância, contador e conferência sem chamadas de IA",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      const networkCalls = [];

      // Monitorar qualquer chamada de rede disparada pela página
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/api/")) {
          networkCalls.push({ url, method: req.method() });
        }
      });

      // 1. Abrir /material
      await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector("h1");
      const titleText = await page.evaluate(() => document.querySelector("h1")?.innerText);
      assert.match(titleText, /Cofre Editorial/i, "deve exibir o título do Cofre Editorial");

      // 2. Alternar para a aba "Colar Texto"
      await waitHydrated(page, "button[role='tab']");
      const tabs = await page.$$("button[role='tab']");
      assert.equal(tabs.length, 2, "deve ter exatamente 2 abas (Upload de PDF e Colar Texto)");

      // Clicar na aba de texto via Puppeteer click
      const textTab = tabs[1];
      await textTab.click();

      await waitHydrated(page, "textarea");

      // 3. Digitar texto curto (< 100 caracteres) e verificar contador
      await page.click("textarea");
      await page.keyboard.type("Texto curto de teste com menos de cem caracteres.", { delay: 5 });
      let counterText = await page.evaluate(() => document.body.innerText);
      assert.match(counterText, /Faltam \d+ caracteres/i, "deve indicar que faltam caracteres para o mínimo");

      // 4. Completar até ultrapassar 100 caracteres
      const remainingSnippet = " Complemento obrigatório para atingir o mínimo de cem caracteres exigido pelo sistema de estudo ativo do AIVUR.";
      await page.keyboard.type(remainingSnippet, { delay: 5 });

      counterText = await page.evaluate(() => document.body.innerText);
      assert.match(counterText, /Tamanho ideal/i, "deve indicar tamanho ideal após 100 caracteres");

      // 5. Clicar no botão de validação
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")];
        const btn = btns.find(b => b.textContent.includes("Validar e Visualizar Texto"));
        btn?.click();
      });

      // 6. Verificar painel de conferência (case-insensitive para suportar text-transform: uppercase)
      await page.waitForFunction(() => /conferência de importação/i.test(document.body.innerText), { timeout: 10_000 });
      const conferenceText = await page.evaluate(() => document.body.innerText);
      assert.match(conferenceText, /Fase 1 Concluída/i, "deve exibir banner de Fase 1 Concluída");
      assert.match(conferenceText, /Texto Colado/i, "deve indicar origem Texto Colado");

      // 7. Confirmar ausência estrita de chamadas a serviços de IA ou persistência nesta fase
      const aiCalls = networkCalls.filter(c => c.url.includes("/api/ai/") || c.url.includes("/api/trilhas/"));
      assert.equal(aiCalls.length, 0, "Fase 1 não deve disparar nenhuma chamada de IA ou de banco");

      // 8. Clicar em "Importar Outro Material" para reiniciar o fluxo
      await page.evaluate(() => {
        const resetBtn = [...document.querySelectorAll("button")].find(b => b.textContent.includes("Importar Outro Material"));
        resetBtn?.click();
      });

      await page.waitForSelector("button[role='tab']", { timeout: 10_000 });
    },
  },
];
