package com.zyy.mori.hykb;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.util.Log;
import com.zyy.mori.BuildConfig;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/** 好游快爆防沉迷：WebView 加载前初始化；无 aar 时不引用 com.m3839，便于 CI 编译。 */
public final class HykbAntiAddiction {

    private static final String TAG = "HykbAntiAddiction";

    private HykbAntiAddiction() {}

    public static void start(Activity activity, Runnable onReady) {
        if (!BuildConfig.HYKB_SDK_ENABLED) {
            onReady.run();
            return;
        }
        String gameId = BuildConfig.HYKB_GAME_ID;
        if (gameId == null || gameId.isEmpty() || "0".equals(gameId)) {
            Log.w(TAG, "HYKB gameId empty, skip");
            onReady.run();
            return;
        }
        if (!initByReflection(activity, gameId, onReady)) {
            Log.e(TAG, "Hykb SDK init failed, enter game without FCM");
            onReady.run();
        }
    }

    private static boolean initByReflection(Activity activity, String gameId, Runnable onReady) {
        try {
            Class<?> listenerClass = Class.forName("com.m3839.sdk.single.UnionV2FcmListener");
            Object listener = Proxy.newProxyInstance(
                listenerClass.getClassLoader(),
                new Class<?>[] { listenerClass },
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) {
                        String name = method.getName();
                        if ("onSucceed".equals(name) || "OnSucceed".equals(name)) {
                            activity.runOnUiThread(onReady);
                        } else if ("onFailed".equals(name) || "OnFailed".equals(name)) {
                            int code = args != null && args.length > 0 ? (Integer) args[0] : 0;
                            String msg = args != null && args.length > 1 ? String.valueOf(args[1]) : "";
                            Log.e(TAG, "FCM failed: " + code + " " + msg);
                            if (code == 2005 || code == 1102 || code == 2003) {
                                activity.finish();
                            } else {
                                activity.runOnUiThread(onReady);
                            }
                        }
                        return null;
                    }
                });

            Class<?> paramClass = Class.forName("com.m3839.sdk.single.UnionFcmParam");
            Class<?> builderClass = Class.forName("com.m3839.sdk.single.UnionFcmParam$Builder");
            Object builder = builderClass.getDeclaredConstructor().newInstance();
            builderClass.getMethod("setGameId", String.class).invoke(builder, gameId);
            builderClass
                .getMethod("setOrientation", int.class)
                .invoke(builder, resolveScreenOrientation());

            Object param = builderClass.getMethod("build").invoke(builder);

            Class<?> sdkClass = Class.forName("com.m3839.sdk.single.UnionFcmSDK");
            Method init = sdkClass.getMethod("init", Activity.class, paramClass, listenerClass);
            init.invoke(null, activity, param, listener);
            return true;
        } catch (Throwable t) {
            Log.e(TAG, "reflection init error", t);
        }
        return false;
    }

    /** 深海弹球为竖屏；OperateSDK 1.4.x 未再提供 ScreenOrientationHelper。 */
    private static int resolveScreenOrientation() {
        return ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
    }
}
