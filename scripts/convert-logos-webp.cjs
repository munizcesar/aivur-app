const sharp = require('sharp');
const fs = require('fs');

const files = [
  ['public/assets/logo-aivur-light.png', 'public/assets/logo-aivur-light.webp'],
  ['public/assets/logo-aivur-dark.png', 'public/assets/logo-aivur-dark.webp'],
];

Promise.all(files.map(async ([input, output]) => {
  await sharp(input).webp({ lossless: true, effort: 6 }).toFile(output);
  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  console.log(`${input}: ${before} bytes -> ${output}: ${after} bytes`);
})).catch((error) => {
  console.error(error);
  process.exit(1);
});
