package com.shadow.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class ShadowService extends Service {
    private static final String CHANNEL_ID = "ShadowCoreServiceChannel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("الظل متصل (Autonomous Mode)")
                .setContentText("العميل يعمل في الخلفية لمعالجة المهام وحماية المحفظة...")
                // In a real app, use R.drawable.ic_notification
                .setSmallIcon(android.R.drawable.ic_dialog_info) 
                .build();

        // Keep the service alive in the foreground (24/7 Autonomy)
        startForeground(1, notification);

        // Start background autonomous tasks (e.g., polling WebSocket, running agents)
        startAutonomousWorker();

        return START_STICKY;
    }

    private void startAutonomousWorker() {
        // Implementation for the P2P connection or WebSocket to listen for tasks 
        // even when the app is killed by the OS.
        new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(60000); // Polling every minute
                    // Execute background LLM processing calling the Bridge
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }).start();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION.SDK_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Shadow Autonomous Core",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
