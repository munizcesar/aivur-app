async function test() {
  const query = encodeURIComponent('"Noções de Direitos Humanos e Cidadania" Conhecimentos Específicos — Guarda Municipal concurso');
  const res = await fetch('http://localhost:3000/api/youtube-search?query=' + query);
  const data = await res.json();
  console.log('Resultados Rigorosos:');
  data.items?.forEach((v, i) => {
    console.log('[' + (i+1) + '] Views: ' + v.viewCount + ' - Title: ' + v.title);
  });
}
test();
