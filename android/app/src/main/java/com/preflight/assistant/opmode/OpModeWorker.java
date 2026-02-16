package com.preflight.assistant.opmode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * WorkManager worker that checks OpMode state file and shows reminders when due.
 * Runs periodically so reminders can fire when the app is in background or killed.
 */
public class OpModeWorker extends Worker {
    private static final String FILE_NAME = "opmode_state.json";
    private static final String CHANNEL_ID = "preflight-opmode";
    private static final int NOTIFICATION_ID_BASE = 2000;
    private static final String[] REMINDER_TYPES = {"restock", "hydrate", "refuel"};
    private static final String[] REMINDER_LABELS = {"Restock", "Hydrate", "Refuel"};

    public OpModeWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        File file = new File(ctx.getFilesDir(), FILE_NAME);
        if (!file.exists()) return Result.success();

        try {
            StringBuilder sb = new StringBuilder();
            try (InputStreamReader r = new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8)) {
                char[] buf = new char[4096];
                int n;
                while ((n = r.read(buf)) >= 0) sb.append(buf, 0, n);
            }
            JSONObject root = new JSONObject(sb.toString());
            long now = System.currentTimeMillis();
            boolean notificationsEnabled = root.optBoolean("notificationsEnabled", false);
            if (!notificationsEnabled) return Result.success();

            long startedAt = root.getLong("startedAt");
            JSONObject lastFired = root.getJSONObject("lastFired");
            int restockMin = root.optInt("restockIntervalMin", 45);
            int hydrateMin = root.optInt("hydrateIntervalMin", 30);
            int refuelMin = root.optInt("refuelIntervalMin", 60);
            int[] intervalMins = {restockMin, hydrateMin, refuelMin};

            ensureChannel(ctx);
            boolean updated = false;
            JSONObject newLastFired = new JSONObject();
            for (int i = 0; i < 3; i++) {
                String type = REMINDER_TYPES[i];
                long last = lastFired.has(type) ? lastFired.getLong(type) : startedAt;
                long nextAt = last + intervalMins[i] * 60L * 1000L;
                if (now >= nextAt) {
                    showNotification(ctx, REMINDER_LABELS[i], i);
                    newLastFired.put(type, now);
                    updated = true;
                } else {
                    newLastFired.put(type, last);
                }
            }

            if (updated) {
                root.put("lastFired", newLastFired);
                try (FileWriter w = new FileWriter(file)) {
                    w.write(root.toString(2));
                }
            }
        } catch (Exception e) {
            android.util.Log.e("OpModeWorker", "Error processing opmode state", e);
            return Result.retry();
        }
        return Result.success();
    }

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                "Op Mode Reminders",
                NotificationManager.IMPORTANCE_HIGH);
            ctx.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private static void showNotification(Context ctx, String label, int typeIndex) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Pre-Flight")
            .setContentText("Time to " + label.toLowerCase() + ".")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true);
        try {
            NotificationManagerCompat.from(ctx).notify(NOTIFICATION_ID_BASE + typeIndex, builder.build());
        } catch (SecurityException ignored) {}
    }
}
