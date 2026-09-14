import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadow.os',
  appName: 'Shadow OS (الظل)',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  // Enable running as an iOS/Android background service if a specific plugin is added
  server: {
    androidScheme: 'https'
  }
};

export default config;
