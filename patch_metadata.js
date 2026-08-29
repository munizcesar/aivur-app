const fs = require("fs");
let code = fs.readFileSync("src/app/layout.tsx", "utf8");
code = code.replace(/url:\s*\"\/og-image-wa-v2\.png\"/g, "url: \"/logo-aivur.png\"");
if (code.includes("icons: {")) {
    // just in case
} else {
    code = code.replace(/export const metadata: Metadata = \{/, "export const metadata: Metadata = {\n  icons: {\n    icon: \"/logo-aivur.png\",\n    apple: \"/logo-aivur.png\"\n  },");
}
fs.writeFileSync("src/app/layout.tsx", code);
console.log("Metadata patched");
