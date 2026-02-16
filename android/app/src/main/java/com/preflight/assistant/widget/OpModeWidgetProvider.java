package com.preflight.assistant.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import com.preflight.assistant.R;

/**
 * Widget provider for OpMode timers
 * Shows next reminder time
 */
public class OpModeWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_opmode);
        
        // Set click intent to open OpMode
        Intent intent = new Intent(context, com.preflight.assistant.MainActivity.class);
        intent.putExtra("action", "open_opmode");
        views.setOnClickPendingIntent(R.id.widget_container, 
            android.app.PendingIntent.getActivity(context, 1, intent, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE));
        
        // Update widget text (would be populated from SharedPreferences in real implementation)
        views.setTextViewText(R.id.widget_title, "Op Mode");
        views.setTextViewText(R.id.widget_next, "No active timers");
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
