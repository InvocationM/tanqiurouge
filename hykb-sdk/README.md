# 好游快爆 · OperateSDK 防沉迷（Android 壳）

Capacitor 仅在 **Android 原生壳** 接入防沉迷，**不修改** `www/index.html`。

## 1. 导入 SDK（OperateSDK 1.4.x）

从控制台下载 **OperateSDK-*.zip**，执行：

```bash
npm run import:hykb -- "/path/to/OperateSDK-1.4.4.4-20260415.zip"
```

或把 zip 放在 `~/Downloads/` 且命名为 `OperateSDK-*.zip`，直接 `npm run import:hykb`。

脚本会写入 `libs/`：

| 文件 | 说明 |
|------|------|
| `hykb-common.aar` | 公共库 |
| `hykb-login.aar` | 登录 |
| `hykb-anti.aar` | 防沉迷 |
| `hykb-single.aar` | 单机防沉迷 API（`UnionFcmSDK`） |

上述四个 aar **已允许提交 Git**，CI 无需再下载 zip。若仍使用旧文档里的 `common.aar` 等命名，`integrate-hykb-android.cjs` 也兼容。

## 2. gameId

已写在仓库 **`hykb.properties`**（当前 `45381`）。改 ID 时编辑该文件即可；环境变量 `HYKB_GAME_ID` 若存在则优先。

## 3. 构建

`cap sync` 之后：

```bash
node scripts/integrate-hykb-android.cjs
```

- **四个 aar 齐全** → 启用防沉迷，`MainActivity` 在 SDK 回调成功后再加载 WebView  
- **缺文件** → 不链 SDK，与纯 WebView 包相同  

Release 混淆规则见 `proguard-hykb.pro`（与 [client_cn](https://open.3839.com/console/docs/#/service/anti/client_cn) 一致）。

## 4. 过审

- Web 内 **适龄提示**（CADPA 12+）  
- 真机 **实名/防沉迷** 录屏  
- 包名 **`com.zyy.mori`** 与后台一致  

初始化代码：`android-native/com/zyy/mori/hykb/HykbAntiAddiction.java`（`UnionFcmParam` + `UnionFcmSDK.init` + `UnionV2FcmListener`）。
