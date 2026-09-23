# 好游快爆 OperateSDK — 防沉迷（与 client_cn 一致，并覆盖 user 包名）
-keep class com.m3839.sdk.common.** { *; }
-keep class com.m3839.sdk.anti.** { *; }
-keep class com.m3839.sdk.user.** { *; }
-keep class com.m3839.sdk.login.** { *; }
-keep class com.m3839.sdk.single.** { *; }
-keepclasseswithmembernames class com.m3839.sdk.common.js.JsInterface {
    <methods>;
}
