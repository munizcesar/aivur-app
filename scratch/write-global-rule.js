const fs = require('fs');
const path = require('path');
const os = require('os');

const targetDir = path.join(os.homedir(), '.gemini', 'config', 'rules');
const targetFile = path.join(targetDir, 'defensive-ui-guidelines.md');

const content = `# DIRETRIZ DE UI DEFENSIVA (OBRIGATÓRIO)

Você está operando sob um Protocolo de UI Defensiva. Aplique incondicionalmente as seguintes regras arquiteturais e geométricas ao criar ou refatorar componentes visuais:

1. **Flexbox Geométrico:** Sempre use \`shrink-0\` (ou \`flex-none shrink-0\`) em ícones, avatares ou elementos de borda rígida (como letras de alternativas \`A, B, C, D\`) dentro de flex containers para evitar distorção induzida pelo conteúdo vizinho.
2. **Isolamento de Contraste (Dark Mode Awareness):** Sempre aplique background isolado (ex: \`bg-white\`) em componentes tipográficos brancos/leves que possam ser injetados em orquestradores ou _stages_ que possuam fundo escuro ou customizado (ex: \`#020c14\`). Garanta que as bordas do container possuam \`rounded\` ou \`rounded-xl\` para harmonizar com painéis.
3. **Feedback Tátil Inegociável:** Nunca crie botões interativos ou cards _clickable_ sem feedback tátil. É obrigatório o uso de classes ativas de transformação, como \`active:scale-95\` ou \`active:scale-[0.98]\`, associado a \`transition-all\` ou \`transition-transform\`.

**Impacto Almejado:** Zero distorção geométrica em resoluções atípicas, visibilidade absoluta sob qualquer cor de fundo orquestrada, e máxima retenção dopamínica através de feedback tátil constante.
`;

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetFile, content);
console.log('Regra global criada com sucesso em: ' + targetFile);
