const fs = require('fs');

async function test() {
  const queries = [
    'Concursos Direito Constitucional Direitos e Garantias Fundamentais',
    'Concursos Direito Administrativo Licitações',
    'Concursos Português Crase',
    'Concursos Informática Redes',
    'Concursos Direito Penal Crimes contra a Administração'
  ];
  
  function getTokens(str) {
    return new Set(str.toLowerCase().replace(/[^a-z0-9áéíóúâêôãõç]/g, ' ').split(' ').filter(Boolean));
  }

  function jaccard(s1, s2) {
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  for (const q of queries) {
    console.log('\n--- Query:', q);
    const res = await fetch('https://studymaster-worker.cesarmuniz0816.workers.dev/api/rag-search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: q})
    }).catch(() => null);

    if (!res || !res.ok) {
      console.log('Erro na requisição');
      continue;
    }
    const data = await res.json();
    if (!data.context) {
      console.log('Sem contexto.');
      continue;
    }

    const chunks = data.context.split('\n---\n').map(s => s.trim()).filter(Boolean);
    console.log('Encontrados', chunks.length, 'chunks.');
    
    let maxOverlap = 0;
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const t1 = getTokens(chunks[i]);
        const t2 = getTokens(chunks[j]);
        const overlap = jaccard(t1, t2);
        if (overlap > maxOverlap) maxOverlap = overlap;
        console.log(`Overlap C${i+1} x C${j+1}: ${(overlap*100).toFixed(1)}%`);
      }
    }
    console.log('Max Overlap:', (maxOverlap*100).toFixed(1) + '%');
  }
}
test();
