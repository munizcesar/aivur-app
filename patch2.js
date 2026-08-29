const fs = require('fs');
let code = fs.readFileSync('src/components/Wizard/WizardStep3.tsx', 'utf8');

const startIdx = code.indexOf('const handleForceMock = () => {');
if (startIdx !== -1) {
  let depth = 0;
  let endIdx = -1;
  let foundStart = false;
  
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
      depth++;
      foundStart = true;
    } else if (code[i] === '}') {
      depth--;
    }
    
    if (foundStart && depth === 0) {
      endIdx = i;
      break;
    }
  }
  
  if (endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx + 1);
    fs.writeFileSync('src/components/Wizard/WizardStep3.tsx', code);
    console.log('Removed handleForceMock completely.');
  }
}
