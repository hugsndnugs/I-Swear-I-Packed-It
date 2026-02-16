package com.preflight.assistant;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.preflight.assistant.opmode.OpModePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OpModePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
