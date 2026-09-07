const query = '"Noções de Direitos Humanos e Cidadania" Conhecimentos Específicos — Guarda Municipal concurso';
const topicMatch = query.match(/"([^"]+)"/);
const strictTopic = topicMatch ? topicMatch[1].toLowerCase() : query.toLowerCase();
const topicWords = strictTopic.split(' ').filter(w => w.length >= 4);

console.log('Words:', topicWords);

const isRelevant = (title) => {
  const t = title.toLowerCase();
  return topicWords.some(w => t.includes(w));
};

console.log("LEGISLAÇÃO DE TRÂNSITO:", isRelevant("LEGISLAÇÃO DE TRÂNSITO | PARA GUARDA MUNICIPAL | DISPOSIÇÕES PRELIMINARES [2024]"));
console.log("Direitos Humanos #01:", isRelevant("Direitos Humanos #01 Origem, Conceito e Por Que Você Precisa Dominar Isso para Concursos?"));
