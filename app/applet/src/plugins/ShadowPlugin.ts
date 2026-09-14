import { registerPlugin } from '@capacitor/core';

export interface ShadowPluginType {
  clickText(options: { text: string }): Promise<{ success: boolean }>;
  openApp(options: { packageName: string }): Promise<void>;
  speak(options: { text: string }): Promise<void>;
}

export const ShadowPlugin = registerPlugin<ShadowPluginType>('ShadowPlugin');
