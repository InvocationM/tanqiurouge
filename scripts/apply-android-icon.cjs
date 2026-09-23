/**
 * 将 android-native/android-res 合并进 Capacitor 生成的 res/（launcher 图标）。
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const androidDir = path.join(root, "android");
const srcRes = path.join(root, "android-native", "android-res");
const destRes = path.join(androidDir, "app", "src", "main", "res");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.startsWith(".")) continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
  return true;
}

function main() {
  if (!fs.existsSync(androidDir)) {
    console.warn("apply-android-icon: android/ missing, skip");
    return;
  }
  if (!copyDir(srcRes, destRes)) {
    console.warn("apply-android-icon: android-native/android-res missing, skip");
    return;
  }
  console.log("apply-android-icon: merged launcher icons into android/app/src/main/res");
}

main();
