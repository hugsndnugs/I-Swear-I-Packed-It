package com.preflight.assistant;

import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.android.material.color.DynamicColors;
import com.preflight.assistant.dynamiccolor.DynamicColorPlugin;
import com.preflight.assistant.opmode.OpModePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && DynamicColors.isDynamicColorAvailable()) {
            DynamicColors.applyToActivityIfAvailable(this);
        }
        registerPlugin(OpModePlugin.class);
        registerPlugin(DynamicColorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
