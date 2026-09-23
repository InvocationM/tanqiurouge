package com.zyy.mori;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.zyy.mori.hykb.HykbAntiAddiction;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        HykbAntiAddiction.start(this, () -> MainActivity.super.onCreate(savedInstanceState));
    }
}
