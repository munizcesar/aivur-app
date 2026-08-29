const fs = require("fs");
let code = fs.readFileSync("src/app/globals.css", "utf8");
code = code.replace(/body\s*\{[^}]+\}/, "body { font-family: var(--font-body); background-color: var(--color-bg, #F1F5F9) !important; color: var(--color-text); line-height: 1.5; }");
fs.writeFileSync("src/app/globals.css", code);
console.log("Body background forced");
