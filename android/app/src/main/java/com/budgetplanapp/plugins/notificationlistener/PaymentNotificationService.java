package com.budgetplanapp.plugins.notificationlistener;

import android.content.Intent;
import android.os.IBinder;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.util.Log;

import java.util.HashSet;
import java.util.Set;

public class PaymentNotificationService extends NotificationListenerService {

    private static final String TAG = "PaymentNotifService";
    private static PaymentNotificationService instance;
    private static NotificationCallback callback;
    private static final Set<String> monitoredPackages = new HashSet<>();
    private boolean isConnected = false;

    public interface NotificationCallback {
        void onNotificationReceived(String packageName, String title, String text, long timestamp);
    }

    public static PaymentNotificationService getInstance() {
        return instance;
    }

    public static void setCallback(NotificationCallback cb) {
        callback = cb;
    }

    public static void setMonitoredPackages(Set<String> packages) {
        monitoredPackages.clear();
        monitoredPackages.addAll(packages);
    }

    public static boolean isServiceConnected() {
        return instance != null && instance.isConnected;
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        instance = this;
        isConnected = true;
        Log.d(TAG, "NotificationListener connected");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        isConnected = false;
        Log.d(TAG, "NotificationListener disconnected");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();

        // Only process notifications from monitored banking apps
        if (monitoredPackages.isEmpty() || !monitoredPackages.contains(packageName)) {
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null || notification.extras == null) return;

        Bundle extras = notification.extras;
        String title = extras.containsKey(Notification.EXTRA_TITLE)
                ? String.valueOf(extras.get(Notification.EXTRA_TITLE))
                : "";
        String text = extras.containsKey(Notification.EXTRA_TEXT)
                ? String.valueOf(extras.get(Notification.EXTRA_TEXT))
                : "";
        String bigText = extras.containsKey(Notification.EXTRA_BIG_TEXT)
                ? String.valueOf(extras.get(Notification.EXTRA_BIG_TEXT))
                : "";

        // Prefer bigText if available (more complete)
        String fullText = bigText.isEmpty() ? text : bigText;

        if (fullText.isEmpty() && title.isEmpty()) return;

        long timestamp = sbn.getPostTime();

        Log.d(TAG, "Bank notification from " + packageName + ": " + title + " - " + fullText);

        if (callback != null) {
            callback.onNotificationReceived(packageName, title, fullText, timestamp);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return super.onBind(intent);
    }
}
