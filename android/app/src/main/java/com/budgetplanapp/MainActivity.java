package com.budgetplanapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import com.budgetplanapp.plugins.notificationlistener.NotificationListenerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Los plugins locales deben registrarse ANTES de super.onCreate()
    registerPlugin(GoogleAuth.class);
    registerPlugin(NotificationListenerPlugin.class);

    super.onCreate(savedInstanceState);

    // Crear canal de notificaciones para FCM (requerido en Android 8+)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel = new NotificationChannel(
        "default_channel",
        "Notificaciones",
        NotificationManager.IMPORTANCE_HIGH
      );
      channel.setDescription("Notificaciones de BudgetPlan");
      NotificationManager manager = getSystemService(NotificationManager.class);
      if (manager != null) {
        manager.createNotificationChannel(channel);
      }
    }
  }
}
