package com.budgetplanapp.plugins.notificationlistener;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "NotificationListener")
public class NotificationListenerPlugin extends Plugin {

    private static final String TAG = "NotifListenerPlugin";

    @Override
    public void load() {
        super.load();

        // Set up callback from the NotificationListenerService to emit events to JS
        PaymentNotificationService.setCallback((packageName, title, text, timestamp) -> {
            JSObject data = new JSObject();
            data.put("packageName", packageName);
            data.put("title", title);
            data.put("text", text);
            data.put("timestamp", timestamp);
            notifyListeners("notificationReceived", data);
        });
    }

    @PluginMethod
    public void isPermissionGranted(PluginCall call) {
        boolean granted = isNotificationListenerEnabled();
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open notification listener settings", e);
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!isNotificationListenerEnabled()) {
            call.reject("Notification listener permission not granted");
            return;
        }

        JSONArray packagesArray = call.getArray("packageNames");
        if (packagesArray == null || packagesArray.length() == 0) {
            call.reject("packageNames array is required");
            return;
        }

        Set<String> packages = new HashSet<>();
        try {
            for (int i = 0; i < packagesArray.length(); i++) {
                packages.add(packagesArray.getString(i));
            }
        } catch (JSONException e) {
            call.reject("Invalid packageNames format", e);
            return;
        }

        PaymentNotificationService.setMonitoredPackages(packages);
        Log.d(TAG, "Started listening to " + packages.size() + " packages");

        JSObject result = new JSObject();
        result.put("listening", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        PaymentNotificationService.setMonitoredPackages(new HashSet<>());
        Log.d(TAG, "Stopped listening");

        JSObject result = new JSObject();
        result.put("listening", false);
        call.resolve(result);
    }

    @PluginMethod
    public void isListening(PluginCall call) {
        JSObject result = new JSObject();
        result.put("connected", PaymentNotificationService.isServiceConnected());
        call.resolve(result);
    }

    private boolean isNotificationListenerEnabled() {
        String packageName = getContext().getPackageName();
        String flat = Settings.Secure.getString(
                getContext().getContentResolver(),
                "enabled_notification_listeners"
        );
        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(packageName, cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }
}
