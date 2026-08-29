const fs = require('fs');
let code = fs.readFileSync('src/components/Wizard/WizardStep3.tsx', 'utf8');

// The original logic:
// const data = await res.json() as { success?: boolean; userMessage?: string; questions?: unknown[] };
// if (!res.ok) throw new Error(data.userMessage || \Erro HTTP \\);
// if (data.success === false) throw new Error(data.userMessage || 'Falha ao processar requisição.');
// if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) { ... }

// Let's replace the fetch handling block
const oldFetchHandling = \const data = await res.json() as { success?: boolean; userMessage?: string; questions?: unknown[] };
      
      if (!res.ok) throw new Error(data.userMessage || \\\Erro HTTP \\\\\\);
      if (data.success === false) throw new Error(data.userMessage || 'Falha ao processar requisição.');\;

const newFetchHandling = \let rawText = '';
      try {
        rawText = await res.text();
      } catch (e) {
        throw new Error("Falha ao ler resposta da rede.");
      }
      
      let data;
      try {
        data = JSON.parse(rawText) as { success?: boolean; userMessage?: string; questions?: unknown[], error?: string };
      } catch (e) {
        throw new Error(\\\[JSON_PARSE_ERROR]: \\\\\\);
      }
      
      if (!res.ok) throw new Error(data.error || data.userMessage || \\\Erro HTTP \\\ - \\\\\\);
      if (data.success === false) throw new Error(data.error || data.userMessage || 'Falha ao processar requisição.');\;

code = code.replace(oldFetchHandling, newFetchHandling);

const oldCatchBlock = \} catch (err: any) {
      console.error("ERRO NA API DE QUESTÕES:", err);
      if (err.name === 'AbortError') {
        setError('Tempo esgotado (timeout). O servidor demorou muito para responder.');
      } else {
        setError(err.message || 'Erro desconhecido. Tente novamente em instantes.');
      }\;

const newCatchBlock = \} catch (err: any) {
      console.error("ERRO NA API DE QUESTÕES:", err);
      let erroBruto = err.message || String(err);
      if (err.name === 'AbortError') erroBruto = 'Tempo esgotado (timeout).';
      setError(\\\[DEBUG DA API]: \\\\\\);\;

code = code.replace(oldCatchBlock, newCatchBlock);

// Highlight the error
code = code.replace(/<p style=\{\{ color: "var\(--elite-grayblue\)", fontSize: "1\.05rem", marginBottom: "24px" \}\}>\{error\}<\/p>/g, 
  \<pre style={{ color: "#ff4d4d", fontSize: "0.95rem", marginBottom: "24px", padding: "16px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #ff4d4d", textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{error}</pre>\);

fs.writeFileSync('src/components/Wizard/WizardStep3.tsx', code);
console.log('WizardStep3 patched');
