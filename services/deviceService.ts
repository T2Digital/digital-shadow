import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { registerPlugin } from '@capacitor/core';

export interface ShadowNativePlugin {
  openApp(options: { packageName?: string, action?: string, data?: string }): Promise<{success: boolean, message?: string}>;
  clickNode(options: { text: string }): Promise<{success: boolean, message?: string}>;
  inputText(options: { text: string }): Promise<{success: boolean, message?: string}>;
  scroll(options: { direction: 'UP' | 'DOWN' }): Promise<{success: boolean, message?: string}>;
  globalAction(options: { action: 'BACK' | 'HOME' | 'RECENTS' }): Promise<{success: boolean, message?: string}>;
}

const ShadowNative = registerPlugin<ShadowNativePlugin>('ShadowNative');

export const getDeviceContext = async () => {
    try {
        const [networkStatus, batteryInfo, deviceInfo] = await Promise.all([
            Network.getStatus(),
            Device.getBatteryInfo(),
            Device.getInfo()
        ]);

        let locationStr = "غير متاح";
        try {
            // Request permission first
            const perm = await Geolocation.checkPermissions();
            if (perm.location === 'granted' || perm.location === 'prompt') {
                const pos = await Geolocation.getCurrentPosition({ timeout: 5000 });
                locationStr = `خط العرض: ${pos.coords.latitude}, خط الطول: ${pos.coords.longitude}`;
            }
        } catch (e) {
            console.warn("Location not available", e);
        }

        return `
[حالة الهاتف الحالية]:
- بيئة التشغيل: ${deviceInfo.platform}
- نظام التشغيل: ${deviceInfo.operatingSystem} ${deviceInfo.osVersion}
- الموديل: ${deviceInfo.model}
- البطارية: ${Math.round((batteryInfo.batteryLevel || 0) * 100)}% ${batteryInfo.isCharging ? '(جاري الشحن)' : '(لا يشحن)'}
- الاتصال: ${networkStatus.connected ? 'متصل' : 'غير متصل'} (${networkStatus.connectionType})
- الموقع الجغرافي: ${locationStr}
        `;
    } catch (e) {
        console.error("Error getting device context:", e);
        return "[حالة الهاتف]: غير قادر على الوصول لحساسات الهاتف حالياً.";
    }
};

export const performNativeAction = async (method: keyof ShadowNativePlugin, options: any = {}): Promise<{success: boolean, message: string}> => {
    console.log(`[Bridge] Executing Native Action: ${method}`, options);
    try {
        // @ts-ignore
        const result = await ShadowNative[method](options);
        return { success: true, message: `[Bridge Success]: ${result?.message || 'تم إرسال الأمر للنظام بنجاح'}` };
    } catch (e: any) {
        console.warn(`[Bridge Error] Native plugin not fully compiled yet or unavailable: ${e.message}`);
        // We gracefully fallback so the AI knows we registered the intent, but the APK shell isn't running it yet.
        return { success: false, message: `[Bridge Pending]: أمر "${method}" تم تسجيله في الـ PWA. يحتاج هذا الأمر إلى نسخة الأندرويد المجمعة (APK) بصلاحية Accessibility للعمل فعلياً.` };
    }
}

export const triggerDeviceAction = async (action: string) => {
    try {
        switch (action) {
            case 'vibrate_heavy':
                await Haptics.impact({ style: ImpactStyle.Heavy });
                return "تم تفعيل الاهتزاز القوي.";
            case 'vibrate_success':
                await Haptics.notification({ type: 'SUCCESS' as any });
                return "تم تفعيل اهتزاز النجاح.";
            default:
                return "إجراء غير معروف.";
        }
    } catch (e) {
        return "فشل تنفيذ الإجراء على الهاتف.";
    }
};
