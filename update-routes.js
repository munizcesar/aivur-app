const fs = require('fs');
const path = require('path');

function updateRoute(routePath, type) {
  const fullPath = path.join(__dirname, routePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Add imports
  if (!content.includes('getRequestContext')) {
    content = content.replace(
      'import { callGroqWithFallback }',
      `import { callGroqWithFallback } from "@/lib/groq";\nimport { getRequestContext } from "@cloudflare/next-on-pages";\nimport { RAGEngine } from "@/lib/rag/engine";\nimport { RAGOptimizer } from "@/lib/rag/optimizer";`
    );
    content = content.replace('import { callGroqWithFallback } from "@/lib/groq";\nimport { callGroqWithFallback }', 'import { callGroqWithFallback }');
  }

  // Inject RAGEngine cache check
  const cacheKeyStr = type === 'flashcards' 
    ? '`flashcards:${subject}:${label}:${nicho||""}`'
    : type === 'questoes'
    ? '`questoes:${subject}:${label}:${dificuldade||""}:${banca||""}`'
    : '`teoria:${subject}:${label}:${nicho||""}`';

  const cacheCheck = `
    let engine = null;
    try {
      const env = (process.env.NODE_ENV === 'development' ? process.env : getRequestContext()?.env) as any;
      if (env?.RAG_CACHE) {
        engine = new RAGEngine(env);
      }
    } catch (e) {
      // Fallback in local dev if needed
    }

    if (engine) {
      const cacheKey = ${cacheKeyStr};
      const cached = await engine.getCachedResponse(cacheKey);
      if (cached) {
        console.log(\`[RAG_CACHE] Hit para ${type}: \${label}\`);
        return NextResponse.json(${type === 'teoria' ? '{ teoria: cached }' : 'JSON.parse(cached)'});
      }
    }
`;

  // Find the exact place to insert cache check - right after validation
  if (type === 'flashcards') {
    content = content.replace('if (!label) {\n      return NextResponse.json({ error: "Falta label" }, { status: 400 });\n    }', 'if (!label) {\n      return NextResponse.json({ error: "Falta label" }, { status: 400 });\n    }\n' + cacheCheck);
  } else if (type === 'questoes') {
    content = content.replace('if (!label) {\n      return NextResponse.json({ error: "Falta label" }, { status: 400 });\n    }', 'if (!label) {\n      return NextResponse.json({ error: "Falta label" }, { status: 400 });\n    }\n' + cacheCheck);
  } else {
    content = content.replace('if (!label || !subject) {\n      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });\n    }', 'if (!label || !subject) {\n      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });\n    }\n' + cacheCheck);
  }

  // Modify context mapping to use RAGOptimizer
  if (type === 'teoria' || type === 'questoes') {
    const oldContext = `const chunks = rag.context.split('\\n---\\n').filter(Boolean);\n      const xmlContext = \`<referencias_teoricas>\\n\` + chunks.map((c, i) => \`  <trecho id="\${i+1}">\\n\${c.trim()}\\n  </trecho>\`).join('\\n') + \`\\n</referencias_teoricas>\`;`;
    const newContext = `const rawChunks = rag.context.split('\\n---\\n').filter(Boolean);\n      const chunkObjs = rawChunks.map((text, i) => ({ id: String(i), text, score: 1 }));\n      const optimizedChunks = RAGOptimizer.optimizeContext(chunkObjs, { maxTokens: 1500 });\n      const xmlContext = \`<referencias_teoricas>\\n\` + optimizedChunks.map((c, i) => \`  <trecho id="\${i+1}">\\n\${c.text.trim()}\\n  </trecho>\`).join('\\n') + \`\\n</referencias_teoricas>\`;`;
    content = content.replace(oldContext, newContext);
  } else if (type === 'flashcards') {
    // Flashcards doesn't currently call fetchRagContext, let's add it before systemPrompt
    const ragFetch = `
    const rag = await fetchRagContext(\`\${label} \${subject}\`);
    let xmlContext = "";
    if (rag.context) {
      const rawChunks = rag.context.split('\\n---\\n').filter(Boolean);
      const chunkObjs = rawChunks.map((text, i) => ({ id: String(i), text, score: 1 }));
      const optimizedChunks = RAGOptimizer.optimizeContext(chunkObjs, { maxTokens: 1500 });
      if (optimizedChunks.length > 0) {
        xmlContext = \`<referencias_teoricas>\\n\` + optimizedChunks.map((c, i) => \`  <trecho id="\${i+1}">\\n\${c.text.trim()}\\n  </trecho>\`).join('\\n') + \`\\n</referencias_teoricas>\\n\\nCONTEXTO EXTRAÍDO OBRIGATÓRIO (baseie-se estritamente nestes trechos):\\n\`;
      }
    }
`;
    content = content.replace('const systemPrompt = `Você é um criador', ragFetch + 'const systemPrompt = `Você é um criador');
    content = content.replace('${context ? `Contexto Base: ${context}` : ""}', '${context ? `Contexto Base: ${context}` : ""}\n${xmlContext}');
    
    // add import for fetchRagContext
    if (!content.includes('fetchRagContext')) {
      content = content.replace('import { getRequestContext }', 'import { fetchRagContext } from "@/lib/ragClient";\nimport { getRequestContext }');
    }
  }

  // Inject Cache save
  if (type === 'teoria') {
    content = content.replace('return NextResponse.json({ teoria: result });', `if (engine) {\n      const cacheKey = \`teoria:\${subject}:\${label}:\${nicho||""}\`;\n      await engine.cacheResponse(cacheKey, result);\n    }\n    return NextResponse.json({ teoria: result });`);
  } else {
    content = content.replace('return NextResponse.json(json);', `if (engine) {\n      const cacheKey = ${cacheKeyStr};\n      await engine.cacheResponse(cacheKey, result);\n    }\n    return NextResponse.json(json);`);
  }

  fs.writeFileSync(fullPath, content, 'utf8');
}

updateRoute('src/app/api/mentor/teoria/route.ts', 'teoria');
updateRoute('src/app/api/mentor/questoes/route.ts', 'questoes');
updateRoute('src/app/api/mentor/flashcards/route.ts', 'flashcards');
