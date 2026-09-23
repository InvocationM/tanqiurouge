# tanqiurouge · 深海弹球

单文件 HTML 游戏，用 Capacitor 打包为 Android APK。推送 `main` 分支会在 GitHub Actions 自动构建。

## 获取 APK

1. 打开 [Actions](https://github.com/InvocationM/tanqiurouge/actions) → **Build Android APK**。
2. 等待运行成功 → **Artifacts** → 下载 `com.zyy.mori-release`（内含 `com.zyy.mori-<版本>-release.apk`，当前为 `com.zyy.mori-1.0.0-release.apk`）。

Android 包名（applicationId）：**`com.zyy.mori`**

也可在 Actions 页点击 **Run workflow** 手动触发。

## 更新游戏

修改 `www/index.html` 后 push 即可重新打包。
