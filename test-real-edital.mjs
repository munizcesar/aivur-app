import fs from 'fs';

const text = `LÍNGUA PORTUGUESA Leitura e interpretação de diversos tipos de textos (literários e não literários). Sinônimos e antônimos. Sentido próprio e figurado das palavras. Pontuação. Ortografia. Classes de palavras: substantivo, artigo, adjetivo, numeral, pronome, verbo, advérbio, preposição, conjunção e interjeição: uso e sentido que imprimem às relações que estabelecem. Concordância verbal e nominal. Regência verbal e nominal. Colocação pronominal. Crase. MATEMÁTICA E RACIOCÍNIO LÓGICO Operações com números reais. Mínimo múltiplo comum e máximo divisor comum. Razão e proporção. Porcentagem. Regra de três simples e composta. Média aritmética simples e ponderada. Juro simples. Sistema de equações do 1º grau. Relação entre grandezas: tabelas e gráficos. Sistemas de medidas usuais. Noções de geometria: forma, perímetro, área, volume, ângulo, teorema de Pitágoras. Resolução de situações-problema. Estrutura lógica das relações arbitrárias entre pessoas, lugares, coisas, eventos fictícios; dedução de novas informações das relações fornecidas e avaliação das condições usadas para estabelecer a estrutura daquelas relações. Identificação de regularidades de uma sequência, numérica ou figural, de modo a indicar qual é o elemento de uma dada posição. Estruturas lógicas, lógicas de argumentação, diagramas lógicos, sequências. NOÇÕES DE INFORMÁTICA MS-Windows em sua versão mais recente: conceito de pastas, diretórios, arquivos e atalhos, área de trabalho, área de transferência, manipulação de arquivos e pastas, uso dos menus, programas e aplicativos, interação com o conjunto de aplicativos. MS-Word em sua versão mais recente: estrutura básica dos documentos, edição e formatação de textos, cabeçalhos, parágrafos, fontes, colunas, marcadores simbólicos e numéricos, tabelas, impressão, controle de quebras e numeração de páginas, legendas, índices, inserção de objetos, campos predefinidos, caixas de texto. MS-Excel em sua versão mais recente: estrutura básica das planilhas, conceitos de células, linhas, colunas, pastas e gráficos, elaboração de tabelas e gráficos, uso de fórmulas, funções e macros, impressão, inserção de objetos, campos predefinidos, controle de quebras e numeração de páginas, obtenção de dados externos, classificação de dados. MS-PowerPoint em sua versão mais recente: estrutura básica das apresentações, conceitos de slides, anotações, régua, guias, cabeçalhos e rodapés, noções de edição e formatação de apresentações, inserção de objetos, numeração de páginas, botões de ação, animação e transição entre slides. Correio Eletrônico: uso de correio eletrônico, preparo e envio de mensagens, anexação de arquivos. Internet: navegação internet, conceitos de URL, links, sites, busca e impressão de páginas.

Noções de Direito Administrativo: Estado, governo e Administração Pública: conceitos, elementos, poderes, natureza, fins e princípios. Poderes administrativos. Poderes disciplinares. Poder de polícia. Poderes regulamentares. Ato administrativo: conceito, requisitos, atributos, classificação e espécies. Invalidação, anulação e revogação. Prescrição. Bens públicos: conceito, classificações e regras no Código Civil (artigos 98 a 103). Noções de Direito Constitucional: dos princípios fundamentais (artigos 1º ao 4º). Dos direitos e garantias fundamentais (artigos 5º a 11). Da organização do Estado (artigos 18 a 31; 37 a 41). Da segurança pública (art. 144 – os artigos em referência são da Constituição Federal de 1988). Noções de Direito Penal: dos crimes contra a pessoa e contra o patrimônio (artigos 121 a 183). Dos crimes contra a fé pública. Dos crimes contra a Administração Pública (artigos 312 a 337-A – os artigos em referência são do Código Penal). Dos crimes praticados por funcionários públicos contra a Administração em geral. Funcionário público: conceituação. Dos crimes praticados por particular contra a Administração em geral. Noções de Direito Civil: capacidade jurídica (artigos 1º a 10 do Código Civil). Bens considerados em si mesmos (artigos 79 a 91 do Código Civil). Legislação de trânsito. Código de Trânsito Brasileiro. Sistema Nacional de Trânsito: composição. Registro e licenciamento de veículos. Habilitação. Normas gerais de circulação e conduta. Crimes de trânsito. Infrações e penalidades. Sinalização de trânsito, segurança e velocidade Condutores de veículos – deveres e proibições. Lei nº 13.022, de 08 de agosto de 2014. Leis Federais n.º 10.826/2003, n.º 8.069/1990 (ECA) e n.º 13.869/2019 (Abuso de autoridade). Noções de primeiros socorros; Código de Processo Penal (Fundada Suspeita e Flagrante); Lei nº 9.503/1997 – Código de Trânsito Brasileiro – CTB; Lei nº 10.741/2003 – Estatuto do Idoso; Lei nº 11.340/2006 – Lei Maria da Penha; Lei nº 11.343/2006 – Lei de Drogas; Lei nº 13.060/2014 – Instrumentos de Menor Potencial Ofensivo; Lei nº 13.675/2018 – Sistema Único de Segurança Pública – SUSP.`;

async function main() {
  const formData = new FormData();
  formData.append('title', 'Guarda Municipal de Limeira');
  formData.append('text', text);

  try {
    console.log("Chamando API...");
    const res = await fetch('http://localhost:3000/api/mentor/generate', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error("Erro da API: " + err);
    }

    const data = await res.json();
    fs.writeFileSync('resultado_limeira.json', JSON.stringify(data, null, 2));
    console.log("Concluído! Salvo em resultado_limeira.json");
  } catch (err) {
    console.error(err);
  }
}

main();
