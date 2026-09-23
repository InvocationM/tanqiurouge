/**
 * 从好游快爆 OperateSDK 压缩包导入防沉迷所需 aar 到 hykb-sdk/libs/。
 * 用法: node scripts/import-hykb-operate-sdk.cjs [/path/to/OperateSDK-*.zip]
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const libsDir = path.join(root, "hykb-sdk", "libs");

/** OperateSDK 1.4.x 包内路径 → libs 文件名 */
const AAR_ENTRIES = [
  ["sdk/aar/hykb-common.aar", "hykb-common.aar"],
  ["sdk/aar/hykb-login.aar", "hykb-login.aar"],
  ["sdk/aar/hykb-anti.aar", "hykb-anti.aar"],
  ["sdk/aar/hykb-single.aar", "hykb-single.aar"],
];

function resolveZipPath(arg) {
  if (arg && fs.existsSync(arg)) return path.resolve(arg);
  const env = process.env.HYKB_OPERATE_SDK_ZIP;
  if (env && fs.existsSync(env)) return path.resolve(env);
  const downloads = path.join(process.env.HOME || "", "Downloads");
  if (fs.existsSync(downloads)) {
    const hits = fs
      .readdirSync(downloads)
      .filter((n) => /^OperateSDK-.*\.zip$/i.test(n))
      .map((n) => path.join(downloads, n))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (hits[0]) return hits[0];
  }
  return "";
}

function main() {
  const zipPath = resolveZipPath(process.argv[2]);
  if (!zipPath) {
    console.error(
      "import-hykb: 未找到 OperateSDK zip。传入路径或设置 HYKB_OPERATE_SDK_ZIP",
    );
    process.exit(1);
  }

  fs.mkdirSync(libsDir, { recursive: true });
  console.log(`import-hykb: ${zipPath}`);

  for (const [entry, destName] of AAR_ENTRIES) {
    const dest = path.join(libsDir, destName);
    const buf = execFileSync("unzip", ["-p", zipPath, entry], {
      maxBuffer: 20 * 1024 * 1024,
    });
    if (!buf || buf.length < 1000) {
      console.error(`import-hykb: zip 内缺少或为空: ${entry}`);
      process.exit(1);
    }
    fs.writeFileSync(dest, buf);
    console.log(`  → libs/${destName} (${buf.length} bytes)`);
  }

  const assetsDir = path.join(root, "hykb-sdk", "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const ini of ["hykb_anti.ini", "hykb_login.ini"]) {
    const entry = `sdk/unity/Assets/Plugins/Android/assets/${ini}`;
    try {
      const buf = execFileSync("unzip", ["-p", zipPath, entry], {
        maxBuffer: 1024 * 1024,
      });
      if (buf && buf.length > 0) {
        fs.writeFileSync(path.join(assetsDir, ini), buf);
        console.log(`  → assets/${ini}`);
      }
    } catch {
      /* SDK 包内 ini 可能为空，gameId 由代码 / hykb.properties 提供 */
    }
  }

  console.log("import-hykb: done");
}

main();
