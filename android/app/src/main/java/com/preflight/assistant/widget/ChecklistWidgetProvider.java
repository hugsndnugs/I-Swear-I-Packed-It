package com.preflight.assistant.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import com.preflight.assistant.R;

/**
 * Widget provider for checklist progress
 * Shows current checklist completion status
 */
public class ChecklistWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_checklist);
        
        // Set click intent to open checklist
        Intent intent = new Intent(context, com.preflight.assistant.MainActivity.class);
        intent.putExtra("action", "open_checklist");
        views.setOnClickPendingIntent(R.id.widget_container, 
            android.app.PendingIntent.getActivity(context, 0, intent, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE));
        
        // Update widget text (would be populated from SharedPreferences in real implementation)
        views.setTextViewText(R.id.widget_title, "Pre-Flight Checklist");
        views.setTextViewText(R.id.widget_progress, "0 / 0");
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
