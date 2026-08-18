import fs from 'fs';
import path from 'path';

async function auditRag() {
  console.log("🚀 Iniciando Auditoria de Cobertura do RAG...");
  const rawData = fs.readFileSync('resultado_limeira.json', 'utf8');
  const course = JSON.parse(rawData);

  const results = [];
  const stats = {};

  for (const subject of course.subjects) {
    console.log(`\n📚 Auditando matéria: ${subject.subject}`);
    stats[subject.subject] = { total: 0, failed: 0, failedTopics: [] };

    for (const nicho of subject.nichos) {
      for (const item of nicho.items) {
        stats[subject.subject].total++;
        const query = `${item.label} ${subject.subject}`;
        
        try {
          const res = await fetch("https://studymaster-worker.cesarmuniz0816.workers.dev/api/rag-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
          });
          
          if (!res.ok) {
            console.error(`  ❌ Erro HTTP ${res.status} no tópico: ${item.label}`);
            stats[subject.subject].failed++;
            stats[subject.subject].failedTopics.push(item.label);
            continue;
          }

          const data = await res.json();
          const matchCount = data.matchCount || 0;
          
          if (matchCount === 0) {
            console.log(`  ❌ Falha (Match 0): ${item.label}`);
            stats[subject.subject].failed++;
            stats[subject.subject].failedTopics.push(item.label);
          } else {
            console.log(`  ✅ Sucesso (Match ${matchCount}): ${item.label}`);
          }
          
          results.push({
            materia: subject.subject,
            topico: item.label,
            matchCount: matchCount,
            topScore: data.topScore || null
          });

        } catch (err) {
          console.error(`  ❌ Erro de conexão no tópico: ${item.label}`, err.message);
          stats[subject.subject].failed++;
          stats[subject.subject].failedTopics.push(item.label);
        }

        // Delay para evitar Rate Limiting do Cloudflare/Vectorize
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  // Gera o Markdown
  let md = `# Auditoria de Cobertura do RAG (Vectorize)\n\n`;
  md += `**Data:** ${new Date().toLocaleString()}\n**Índice testado:** \`studymaster-knowledge\` (Leis Secas)\n\n`;
  md += `## 📊 Resumo por Matéria\n\n`;
  
  for (const [materia, stat] of Object.entries(stats)) {
    const pct = ((stat.failed / stat.total) * 100).toFixed(1);
    md += `- **${materia}**: ${stat.total - stat.failed}/${stat.total} encontrados (${pct}% de falha)\n`;
  }

  md += `\n## ⚠️ Tópicos Sem Cobertura (Match = 0)\n\n`;
  for (const [materia, stat] of Object.entries(stats)) {
    if (stat.failed > 0) {
      md += `### ${materia}\n`;
      stat.failedTopics.forEach(t => {
        md += `- ${t}\n`;
      });
      md += `\n`;
    }
  }

  fs.writeFileSync('rag-coverage-audit.md', md);
  fs.writeFileSync('results-raw.json', JSON.stringify(results, null, 2));
  console.log("\n✅ Auditoria concluída! Relatório salvo em rag-coverage-audit.md");
}

auditRag();
