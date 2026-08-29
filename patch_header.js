const fs = require("fs");
let code = fs.readFileSync("src/components/Header/Header.tsx", "utf8");

const oldImage = /<Image\s*src="\/logo-aivur\.png"\s*alt="AIVUR Logo"\s*width=\{40\}\s*height=\{40\}\s*className=\{styles\.logoIcon\}\s*priority\s*\/>/;
const newImage = `<Image 
                  src={mounted && theme === "dark" ? "/assets/logo-aivur-light.png" : "/assets/logo-aivur-dark.png"}
                  alt="AIVUR Logo" 
                  width={140} 
                  height={40} 
                  style={{ objectFit: "contain" }}
                  className={styles.logoIcon}
                  priority
                />`;

code = code.replace(oldImage, newImage);
fs.writeFileSync("src/components/Header/Header.tsx", code);
console.log("Header image patched");
