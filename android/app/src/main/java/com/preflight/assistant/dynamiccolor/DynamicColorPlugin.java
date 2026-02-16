package com.preflight.assistant.dynamiccolor;

import android.os.Build;
import android.util.TypedValue;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

/**
 * Capacitor plugin to read Android 12+ Material You / system accent color
 * and pass it to the web layer for dynamic theming.
 */
@CapacitorPlugin(name = "DynamicColor")
public class DynamicColorPlugin extends Plugin {

    private static String colorToHex(int color) {
        int a = (color >> 24) & 0xff;
        int r = (color >> 16) & 0xff;
        int g = (color >> 8) & 0xff;
        int b = color & 0xff;
        return String.format("#%02x%02x%02x", r, g, b);
    }

    /**
     * Returns the system primary (accent) color when available (Android 12+).
     * Falls back to null on older API or when theme does not provide it.
     */
    @PluginMethod
    public void getSystemAccentColor(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            call.resolve(new com.getcapacitor.JSObject().put("primary", (String) null));
            return;
        }
        try {
            android.content.Context ctx = getContext();
            if (ctx == null) {
                call.resolve(new com.getcapacitor.JSObject().put("primary", (String) null));
                return;
            }
            TypedValue typedValue = new TypedValue();
            boolean resolved = ctx.getTheme().resolveAttribute(android.R.attr.colorPrimary, typedValue, true);
            if (!resolved && ctx.getApplicationContext() != null) {
                resolved = ctx.getApplicationContext().getTheme().resolveAttribute(android.R.attr.colorPrimary, typedValue, true);
            }
            if (!resolved) {
                call.resolve(new com.getcapacitor.JSObject().put("primary", (String) null));
                return;
            }
            int color = typedValue.data;
            if (color == 0) {
                call.resolve(new com.getcapacitor.JSObject().put("primary", (String) null));
                return;
            }
            String hex = colorToHex(color);
            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("primary", hex);
            call.resolve(ret);
        } catch (Exception e) {
            call.resolve(new com.getcapacitor.JSObject().put("primary", (String) null));
        }
    }
}
