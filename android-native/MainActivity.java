package com.shadow.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Start the autonomous foreground service when the app launches
        Intent serviceIntent = new Intent(this, ShadowService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION.SDK_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
