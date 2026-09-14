import { Capacitor, registerPlugin } from '@capacitor/core';

// This is an interface for a hypothetical native plugin we would build in Java/Kotlin.
export interface AndroidNativePlugin {
    checkAccessibilityPermission(): Promise<{ granted: boolean }>;
    requestAccessibilityPermission(): Promise<void>;
    performClick(options: { x: number, y: number }): Promise<{ success: boolean }>;
    readWhatsAppNotifications(): Promise<{ messages: any[] }>;
    replyToWhatsApp(options: { contact: string, message: string }): Promise<{ success: boolean }>;
}

export const AndroidNative = registerPlugin<AndroidNativePlugin>('AndroidNative');

export class AndroidBridgeService {
    static async isNative() {
        return Capacitor.isNativePlatform();
    }

    static async getWhatsAppMessages() {
        if (Capacitor.isNativePlatform()) {
            try {
                const result = await AndroidNative.readWhatsAppNotifications();
                return result.messages;
            } catch (e) {
                console.error("Native Bridge Error:", e);
                return [];
            }
        } else {
            console.warn("Not running natively, simulating WhatsApp sync...");
            return [
                 { type: 'whatsapp', contact: 'العميل X', text: 'بكام المنتج يا فندم؟', time: new Date().toISOString() }
            ];
        }
    }

    static async autoClick(x: number, y: number) {
        if (Capacitor.isNativePlatform()) {
            await AndroidNative.performClick({ x, y });
        } else {
            console.log(`[NATIVE BRIDGE] Simulating accessibility auto-click at coords: (${x}, ${y})`);
        }
    }

    static async replyToWhatsApp(contact: string, message: string) {
        if (Capacitor.isNativePlatform()) {
            await AndroidNative.replyToWhatsApp({ contact, message });
        } else {
            console.log(`[NATIVE BRIDGE] Simulating WhatsApp reply to ${contact}: ${message}`);
        }
    }
}
