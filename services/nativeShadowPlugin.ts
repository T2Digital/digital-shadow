import { registerPlugin } from '@capacitor/core';

export interface NativeShadowPlugin {
  /**
   * Starts an Android Foreground Service to keep the wake-word engine listening
   * even when the app is swiped away or the screen is off.
   */
  startForegroundService(options: { title: string, body: string }): Promise<{ success: boolean }>;
  
  /**
   * Stops the foreground service.
   */
  stopForegroundService(): Promise<{ success: boolean }>;

  /**
   * Requests SYSTEM_ALERT_WINDOW permission on Android.
   */
  requestOverlayPermission(): Promise<{ granted: boolean }>;

  /**
   * Shows the AssistantWidget natively over other apps.
   */
  showSystemOverlay(): Promise<{ success: boolean }>;

  /**
   * Hides the system overlay.
   */
  hideSystemOverlay(): Promise<{ success: boolean }>;

  /**
   * Initializes local offline Whisper STT.
   */
  initOfflineWhisper(options: { language: string }): Promise<{ success: boolean }>;

  /**
   * Initializes the Hybrid AI architecture (Gemma 2B via MediaPipe + Cloud Gemini).
   */
  initHybridAI(): Promise<{ success: boolean }>;

  /**
   * Fast native TTS bypassing network.
   */
  fastNativeTTS(options: { text: string }): Promise<{ success: boolean }>;
}

export const NativeShadow = registerPlugin<NativeShadowPlugin>('NativeShadow', {
  web: () => ({
    startForegroundService: async () => {
      console.log('[NativeShadow] Foreground service simulated on web. Fallback to Web Workers if needed.');
      return { success: true };
    },
    stopForegroundService: async () => {
      console.log('[NativeShadow] Foreground service stopped simulated on web.');
      return { success: true };
    },
    requestOverlayPermission: async () => {
      console.log('[NativeShadow] Overlay permission simulated on web.');
      return { granted: true };
    },
    showSystemOverlay: async () => {
      console.log('[NativeShadow] System overlay simulated on web.');
      // Web Fallback: Just open the widget in a new small popup if allowed
      try {
        window.open(window.location.origin + '?mode=widget', 'ShadowWidget', 'width=350,height=150,top=50,left=50,menubar=no,toolbar=no,location=no,status=no');
      } catch (e) {
        console.warn('Popup blocked.');
      }
      return { success: true };
    },
    hideSystemOverlay: async () => {
      console.log('[NativeShadow] System overlay hide simulated on web.');
      return { success: true };
    },
    initOfflineWhisper: async () => {
      console.log('[NativeShadow] Offline whisper simulated on web. Fallback to standard Web Speech API.');
      return { success: true };
    },
    initHybridAI: async () => {
      console.log('[NativeShadow] Initiating Hybrid AI (Local Gemma + Cloud Gemini) via WebAssembly MediaPipe fallback.');
      return { success: true };
    },
    fastNativeTTS: async (opts: { text: string }) => {
      console.log('[NativeShadow] Native TTS playing:', opts.text);
      if ('speechSynthesis' in window) {
          const m = new SpeechSynthesisUtterance(opts.text);
          m.lang = 'ar-EG';
          window.speechSynthesis.speak(m);
      }
      return { success: true };
    }
  }),
});
