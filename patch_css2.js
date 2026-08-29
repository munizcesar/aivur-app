const fs = require("fs");
let code = fs.readFileSync("src/app/globals.css", "utf8");
code = code.replace(/--color-bg:\s*#F8FAFC; \/\* Fundo prim.*? \*\//g, "--color-bg:             #F1F5F9; /* Fundo mais denso para contraste */");
code = code.replace(/--hero-bg:\s*#F8FAFC;/g, "--hero-bg:              #F1F5F9;");
fs.writeFileSync("src/app/globals.css", code);
console.log("Light theme CSS fully patched");
