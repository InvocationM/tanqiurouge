/** 让 .pack 进 APK 时不被 aapt 再压缩，体积才接近期望值。 */
const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");

function main() {
  if (!fs.existsSync(gradlePath)) {
    console.warn("patch-no-compress-pack: android/app/build.gradle missing, skip");
    return;
  }
  let g = fs.readFileSync(gradlePath, "utf8");
  const noCompress = "noCompress 'ogg', 'png', 'pack'";
  if (g.includes("noCompress 'ogg'")) {
    console.log("patch-no-compress-pack: already patched");
    return;
  }
  if (/androidResources\s*\{/.test(g)) {
    g = g.replace(/androidResources\s*\{/, `androidResources {\n        ${noCompress}`);
  } else {
    g = g.replace(
      /android\s*\{/,
      `android {\n    androidResources {\n        ${noCompress}\n    }`,
    );
  }
  fs.writeFileSync(gradlePath, g, "utf8");
  console.log("patch-no-compress-pack: added androidResources", noCompress);
}

main();
