const fs = require('fs');
let code = fs.readFileSync('src/components/Wizard/WizardStep3.tsx', 'utf8');

code = code.replace(/const handleForceMock = \(\) => \{[\s\S]*?\}\;\n/g, '');
code = code.replace(/<button[^>]*onClick=\{handleForceMock\}[^>]*>[\s\S]*?<\/button>/, '');

fs.writeFileSync('src/components/Wizard/WizardStep3.tsx', code);
