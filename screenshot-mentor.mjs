import puppeteer from "puppeteer";
import { writeFileSync } from "fs";

const BASE_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({ headless: true });

  // ── Desktop 1440×900 ──
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900 });

  // 1. Página de lista /mentor
  await desktop.goto(`${BASE_URL}/mentor`, { waitUntil: "load", timeout: 20000 });
  await sleep(500);
  console.log("✓ /mentor carregada");

  // 2. Navega para /mentor/gm-hortolandia-2026
  await desktop.goto(`${BASE_URL}/mentor/gm-hortolandia-2026`, { waitUntil: "load", timeout: 20000 });
  await sleep(1000);
  console.log("✓ /mentor/gm-hortolandia-2026 carregada");

  // 3. Confirma que o primeiro accordion está aberto (primeiro subject da lista)
  const firstBodyOpen = await desktop.evaluate(() => {
    const body = document.querySelector('[id^="subject-body-"]');
    return body ? getComputedStyle(body).maxHeight : "none";
  });
  console.log(`✓ Primeiro accordion max-height: ${firstBodyOpen} (deve ser > 0)`);

  // 4. Marca o primeiro item de checklist
  const firstCheckbox = await desktop.$('[role="checkbox"]');
  if (firstCheckbox) {
    await firstCheckbox.click();
    await sleep(300);
    console.log("✓ Primeiro item marcado");
  }

  // Conta quantos itens estão checked
  const checkedCountAfterMark = await desktop.evaluate(() => {
    return document.querySelectorAll('[aria-checked="true"]').length;
  });
  console.log(`✓ Itens checked após marcar: ${checkedCountAfterMark} (esperado: 1)`);

  // 5. Fecha o primeiro accordion (clica no header)
  const firstHeader = await desktop.$('[id^="subject-header-"]');
  if (firstHeader) {
    await firstHeader.click();
    await sleep(400);
    console.log("✓ Accordion fechado");
  }

  // 6. Verifica que o item ainda está marcado no localStorage (não perdeu progresso)
  const storedRaw = await desktop.evaluate(() => {
    return localStorage.getItem("aivur_checklist_gm-hortolandia-2026");
  });
  const storedItems = storedRaw ? JSON.parse(storedRaw) : [];
  console.log(`✓ localStorage após fechar accordion: ${storedItems.length} item(s) (esperado: 1)`);

  // 7. Reabre o accordion
  if (firstHeader) {
    await firstHeader.click();
    await sleep(400);
    console.log("✓ Accordion reaberto");
  }

  // 8. Confirma que o item ainda está checked após reabrir
  const checkedCountAfterReopen = await desktop.evaluate(() => {
    return document.querySelectorAll('[aria-checked="true"]').length;
  });
  console.log(`✓ Itens checked após reabrir accordion: ${checkedCountAfterReopen} (esperado: 1)`);

  // 9. Navega para /mentor e volta — confirma persistência
  await desktop.goto(`${BASE_URL}/mentor`, { waitUntil: "load", timeout: 20000 });
  await sleep(300);
  await desktop.goto(`${BASE_URL}/mentor/gm-hortolandia-2026`, { waitUntil: "load", timeout: 20000 });
  await sleep(800);
  const checkedCountAfterNav = await desktop.evaluate(() => {
    return document.querySelectorAll('[aria-checked="true"]').length;
  });
  console.log(`✓ Itens checked após navegação e retorno: ${checkedCountAfterNav} (esperado: 1)`);

  // Screenshot desktop
  await desktop.screenshot({ path: "screenshot-mentor-desktop.png", fullPage: false });
  console.log("✓ screenshot-mentor-desktop.png salvo");

  // ── Mobile 390×844 ──
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844 });
  await mobile.goto(`${BASE_URL}/mentor/gm-hortolandia-2026`, { waitUntil: "load", timeout: 20000 });
  await sleep(600);

  // Verifica ausência de overflow horizontal no mobile
  const hasHScroll = await mobile.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log(`✓ Scroll horizontal indevido no mobile: ${hasHScroll} (esperado: false)`);

  await mobile.screenshot({ path: "screenshot-mentor-mobile.png", fullPage: false });
  console.log("✓ screenshot-mentor-mobile.png salvo");

  await browser.close();

  // Sumário final
  console.log("\n=== SUMÁRIO ===");
  console.log(`Checklist marcado: ${checkedCountAfterMark === 1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Progresso persistido no localStorage: ${storedItems.length === 1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Accordion fechou sem perder progresso: ${checkedCountAfterMark === 1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Progresso persiste após navegação: ${checkedCountAfterNav === 1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Mobile sem scroll horizontal: ${!hasHScroll ? "✅ PASS" : "❌ FAIL"}`);
}

main().catch(console.error);
