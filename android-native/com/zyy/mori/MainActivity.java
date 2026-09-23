package com.zyy.mori;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.zyy.mori.hykb.HykbAntiAddiction;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.HYKB_SDK_ENABLED) {
            setBridgeWebViewVisible(false);
        }
        HykbAntiAddiction.start(
            this,
            () -> {
                if (BuildConfig.HYKB_SDK_ENABLED) {
                    setBridgeWebViewVisible(true);
                }
            });
    }

    private void setBridgeWebViewVisible(boolean visible) {
        runOnUiThread(
            () -> {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    return;
                }
                getBridge()
                    .getWebView()
                    .setVisibility(visible ? View.VISIBLE : View.INVISIBLE);
            });
    }
}
