/**
 * 生成打进 APK 的大体积附属资源（默认约 31MB，与本体合计 ~35MB）。
 * 环境变量：APK_BULK_MB（默认 31，设为 0 可关闭）
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outFile = path.join(root, "www", "assets", "game_resources.pack");

function main() {
  const bulkMb = parseInt(process.env.APK_BULK_MB ?? "31", 10);
  if (!Number.isFinite(bulkMb) || bulkMb <= 0) {
    console.log("ensure-apk-bulk: APK_BULK_MB<=0, skip");
    return;
  }

  const targetBytes = bulkMb * 1024 * 1024;
  if (fs.existsSync(outFile)) {
    const size = fs.statSync(outFile).size;
    if (size >= targetBytes) {
      console.log(`ensure-apk-bulk: keep existing ${size} bytes`);
      return;
    }
    fs.unlinkSync(outFile);
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const fd = fs.openSync(outFile, "w");
  const chunk = crypto.randomBytes(1024 * 1024);
  let written = 0;
  try {
    while (written < targetBytes) {
      const n = Math.min(chunk.length, targetBytes - written);
      fs.writeSync(fd, chunk, 0, n);
      written += n;
    }
  } finally {
    fs.closeSync(fd);
  }
  console.log(`ensure-apk-bulk: wrote ${written} bytes (~${bulkMb} MiB) → www/assets/game_resources.pack`);
}

main();
