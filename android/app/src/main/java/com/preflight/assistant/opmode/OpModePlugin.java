package com.preflight.assistant.opmode;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.io.File;
import java.util.concurrent.TimeUnit;

/**
 * Capacitor plugin to sync OpMode state to native and schedule WorkManager
 * so reminders can fire when the app is in background or killed.
 */
@CapacitorPlugin(name = "OpModeBackground")
public class OpModePlugin extends Plugin {
    private static final String WORK_NAME = "OpModeReminderCheck";
    private static final String FILE_NAME = "opmode_state.json";

    @PluginMethod
    public void writeStateAndSchedule(PluginCall call) {
        String stateJson = call.getString("state");
        if (stateJson == null || stateJson.isEmpty()) {
            call.reject("state is required");
            return;
        }
        Context ctx = getContext().getApplicationContext();
        File file = new File(ctx.getFilesDir(), FILE_NAME);
        try {
            java.io.FileWriter w = new java.io.FileWriter(file);
            w.write(stateJson);
            w.close();
        } catch (Exception e) {
            call.reject("Failed to write state", e);
            return;
        }
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(OpModeWorker.class, 15, TimeUnit.MINUTES)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.NOT_REQUIRED).build())
            .build();
        WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request);
        call.resolve();
    }

    @PluginMethod
    public void clearStateAndCancel(PluginCall call) {
        Context ctx = getContext().getApplicationContext();
        File file = new File(ctx.getFilesDir(), FILE_NAME);
        if (file.exists()) file.delete();
        WorkManager.getInstance(ctx).cancelUniqueWork(WORK_NAME);
        call.resolve();
    }
}
