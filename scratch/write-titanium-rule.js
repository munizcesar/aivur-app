const fs = require('fs');
const content = [
  "# REGRA DE TITANIO (FLEXBOX + SVG) — DIRETRIZ ABSOLUTA",
  "",
  "## Regra #1: Fisica do Flexbox com SVG (OBRIGATORIO SEM EXCECOES)",
  "No Tailwind, qualquer SVG, Icone ou Avatar inserido dentro de um container `flex` sofreh distorcao elastica severa.",
  "E OBRIGATORIO aplicar as classes de trava mecanica (`shrink-0 flex-none`) E dimensoes fixas rigorosas",
  "(ex: `w-5 h-5` ou `w-6 h-6`) no elemento filho ou no seu wrapper direto.",
  "",
  "```tsx",
  "// Correto",
  "<Play className=\"w-5 h-5 shrink-0 flex-none\" />",
  "",
  "// Errado — vai distorcer em containers flex com texto longo",
  "<Play className=\"w-5 h-5\" />",
  "```",
  "",
  "## Regra #2: Isolamento de Contraste (Dark Mode Awareness)",
  "Sempre aplique background isolado (`bg-white`) em componentes injetados em layouts dark-mode.",
  "Container obrigatorio: `rounded-2xl shadow-sm border border-slate-200`.",
  "",
  "## Regra #3: Feedback Tatil Inegociavel",
  "Nunca crie botoes sem: `active:scale-95 transition-all`. E lei.",
  "",
  "## Regra #4: Wrappers de Avatar/Circulo",
  "Qualquer circulo de icone deve ter: `flex-none shrink-0 w-10 h-10 rounded-full flex items-center justify-center`",
  "O SVG interno: `w-5 h-5 shrink-0`.",
  "",
  "**Impacto:** Zero distorcao geometrica, visibilidade garantida em qualquer fundo, dopamina tatil constante.",
].join('\n');

fs.writeFileSync('C:/Users/Cesar Victor/.gemini/config/rules/defensive-ui-guidelines.md', content, 'utf8');
console.log('Regra de Titanio gravada.');
