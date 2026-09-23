/**
 * 将 hykb-sdk + android-native 合并进 Capacitor 生成的 android/ 工程。
 * 支持 OperateSDK 1.4.x（hykb-*.aar）与旧文档命名（common/login/anti/single.aar）。
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const androidDir = path.join(root, "android");
const hykbRoot = path.join(root, "hykb-sdk");
const nativeRoot = path.join(root, "android-native");

const AAR_SETS = {
  operate: {
    files: [
      "hykb-common.aar",
      "hykb-login.aar",
      "hykb-anti.aar",
      "hykb-single.aar",
    ],
    gradle: `
    implementation(name:'hykb-common', ext:'aar')
    implementation(name:'hykb-login', ext:'aar')
    implementation(name:'hykb-anti', ext:'aar')
    implementation(name:'hykb-single', ext:'aar')`,
  },
  legacy: {
    files: ["common.aar", "login.aar", "anti.aar", "single.aar"],
    gradle: `
    implementation(name:'common', ext:'aar')
    implementation(name:'login', ext:'aar')
    implementation(name:'anti', ext:'aar')
    implementation(name:'single', ext:'aar')`,
  },
};

function readGameId() {
  if (process.env.HYKB_GAME_ID && String(process.env.HYKB_GAME_ID).trim()) {
    return String(process.env.HYKB_GAME_ID).trim();
  }
  const propFile = path.join(hykbRoot, "hykb.properties");
  if (!fs.existsSync(propFile)) return "";
  const text = fs.readFileSync(propFile, "utf8");
  const m = text.match(/^\s*hykb\.gameId\s*=\s*(\S+)/m);
  return m ? m[1].trim() : "";
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.startsWith(".")) continue;
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyNativeSources() {
  const javaDest = path.join(androidDir, "app/src/main/java");
  const srcBase = path.join(nativeRoot, "com/zyy/mori");
  for (const rel of ["MainActivity.java", "hykb/HykbAntiAddiction.java"]) {
    const src = path.join(srcBase, rel);
    const dest = path.join(javaDest, "com/zyy/mori", rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function detectAarSet() {
  const libs = path.join(hykbRoot, "libs");
  if (!fs.existsSync(libs)) {
    return { key: null, missing: AAR_SETS.operate.files };
  }
  for (const [key, set] of Object.entries(AAR_SETS)) {
    const missing = set.files.filter((f) => !fs.existsSync(path.join(libs, f)));
    if (missing.length === 0) return { key, missing: [] };
  }
  const missing = AAR_SETS.operate.files.filter(
    (f) => !fs.existsSync(path.join(libs, f)),
  );
  return { key: null, missing };
}

function stripOldHykbGradle(g) {
  return g
    .replace(/\n\s*implementation fileTree\(dir: 'libs', include: \[[^\]]+\]\)/g, "")
    .replace(/\n\s*implementation\(name:'hykb-common', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'hykb-login', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'hykb-anti', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'hykb-single', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'common', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'login', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'anti', ext:'aar'\)/g, "")
    .replace(/\n\s*implementation\(name:'single', ext:'aar'\)/g, "")
    .replace(
      /\nrepositories \{\s*\n\s*flatDir \{\s*\n\s*dirs 'libs'\s*\n\s*\}\s*\n\}/g,
      "",
    )
    .replace(/\n\s*proguardFiles[^\n]*proguard-hykb\.pro[^\n]*/g, "");
}

function patchBuildGradle(gameId, sdkEnabled, aarKey) {
  const gradlePath = path.join(androidDir, "app/build.gradle");
  let g = fs.readFileSync(gradlePath, "utf8");
  g = stripOldHykbGradle(g);

  if (!/buildFeatures\s*\{/.test(g)) {
    g = g.replace(
      /android\s*\{/,
      "android {\n    buildFeatures {\n        buildConfig true\n    }",
    );
  } else if (!/buildConfig\s+true/.test(g)) {
    g = g.replace(/buildFeatures\s*\{/, "buildFeatures {\n        buildConfig true");
  }

  const escapedId = gameId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const fields = `
        buildConfigField "boolean", "HYKB_SDK_ENABLED", "${sdkEnabled}"
        buildConfigField "String", "HYKB_GAME_ID", "\\"${escapedId || "0"}\\""`;

  if (/HYKB_SDK_ENABLED/.test(g)) {
    g = g.replace(
      /buildConfigField "boolean", "HYKB_SDK_ENABLED", "[^"]*"/,
      `buildConfigField "boolean", "HYKB_SDK_ENABLED", "${sdkEnabled}"`,
    );
    g = g.replace(
      /buildConfigField "String", "HYKB_GAME_ID", "[^"]*"/,
      `buildConfigField "String", "HYKB_GAME_ID", "\\"${escapedId || "0"}\\""`,
    );
  } else {
    g = g.replace(/(defaultConfig\s*\{)/, `$1${fields}`);
  }

  const hykbPro = path.join(hykbRoot, "proguard-hykb.pro");
  if (sdkEnabled && fs.existsSync(hykbPro)) {
    const relPro = "../../hykb-sdk/proguard-hykb.pro";
    if (!g.includes("proguard-hykb.pro")) {
      g = g.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{)/,
        `$1\n            proguardFiles getDefaultProguardFile('proguard-android.txt'), '${relPro}'`,
      );
    }
  }

  if (sdkEnabled && aarKey) {
    const deps = AAR_SETS[aarKey].gradle;
    if (!/flatDir\s*\{[\s\S]*?dirs\s*'libs'/.test(g)) {
      g = g.replace(
        /dependencies\s*\{/,
        `repositories {\n    flatDir {\n        dirs 'libs'\n    }\n}\n\ndependencies {${deps}`,
      );
    } else if (!/implementation\(name:'hykb-anti'|implementation\(name:'anti'/.test(g)) {
      g = g.replace(/dependencies\s*\{/, `dependencies {${deps}`);
    }
  }

  fs.writeFileSync(gradlePath, g, "utf8");
}

function main() {
  if (!fs.existsSync(androidDir)) {
    console.warn("integrate-hykb: android/ missing, skip");
    return;
  }

  const { key: aarKey, missing } = detectAarSet();
  const sdkEnabled = aarKey != null;
  const gameId = readGameId();

  if (!sdkEnabled && missing.length < AAR_SETS.operate.files.length) {
    console.warn(
      `integrate-hykb: incomplete aar set, missing: ${missing.join(", ")} — SDK disabled`,
    );
  }

  console.log(
    `integrate-hykb: sdkEnabled=${sdkEnabled}, aarSet=${aarKey || "none"}, gameId=${gameId ? "(set)" : "(empty)"}`,
  );

  copyNativeSources();

  if (sdkEnabled) {
    const libsDest = path.join(androidDir, "app/libs");
    fs.mkdirSync(libsDest, { recursive: true });
    copyDir(path.join(hykbRoot, "libs"), libsDest);
    copyDir(
      path.join(hykbRoot, "assets"),
      path.join(androidDir, "app/src/main/assets"),
    );
  }

  patchBuildGradle(gameId, sdkEnabled, aarKey);
}

main();
