const fs = require("fs");
let code = fs.readFileSync("src/app/globals.css", "utf8");
code = code.replace(/--color-bg:\s*#F9F6F0;/, "--color-bg:             #F1F5F9;");
fs.writeFileSync("src/app/globals.css", code);
console.log("CSS patched");
