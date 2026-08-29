const fs = require("fs");
let code = fs.readFileSync("src/components/Wizard/WizardStep3.tsx", "utf8");

// Restore catch block
const oldCatch = "let erroBruto = err.message || String(err);\n      if (err.name === \\x27AbortError\\x27) erroBruto = \\x27Tempo esgotado (timeout).\\x27;\n      setError(`[DEBUG DA API]: ${erroBruto}`);";
const newCatch = "if (err.name === \\x27AbortError\\x27) {\\n        setError(\\x27Tempo esgotado (timeout). O servidor demorou muito para responder.\\x27);\\n      } else {\\n        setError(\\x27Ocorreu uma instabilidade na conex\xE3o com a IA. Tente novamente em instantes.\\x27);\\n      }";
code = code.replace(oldCatch, newCatch);

// Restore UI render
const oldPre = "<pre style={{ color: \"#ff4d4d\", fontSize: \"0.95rem\", marginBottom: \"24px\", padding: \"16px\", background: \"#1a1a1a\", borderRadius: \"8px\", border: \"1px solid #ff4d4d\", textAlign: \"left\", whiteSpace: \"pre-wrap\", wordBreak: \"break-all\" }}>{error}</pre>";
const newP = "<p style={{ color: \"var(--elite-grayblue)\", fontSize: \"1.05rem\", marginBottom: \"24px\" }}>{error}</p>";
code = code.replace(oldPre, newP);

fs.writeFileSync("src/components/Wizard/WizardStep3.tsx", code);
console.log("UI Restored");
