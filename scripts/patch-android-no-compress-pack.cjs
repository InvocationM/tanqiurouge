/** 音频/大图随包打进 APK 时尽量不二次压缩，体积更接近文件总和。 */
const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");

function main() {
  if (!fs.existsSync(gradlePath)) {
    console.warn("patch-no-compress-pack: android/app/build.gradle missing, skip");
    return;
  }
  const noCompress = "noCompress 'ogg', 'flac', 'wav', 'mp3', 'png'";
  let g = fs.readFileSync(gradlePath, "utf8");
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
  console.log("patch-no-compress-pack:", noCompress);
}

main();
