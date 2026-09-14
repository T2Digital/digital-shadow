import { Capacitor } from '@capacitor/core';
import { encryptData, decryptData } from './cryptoService';

// Fallback logic for Web, Native uses Hardware Keystore (Capacitor Secure Storage)
class SecureKeystore {
    private isNative = Capacitor.isNativePlatform();

    async setSecret(key: string, value: string, userId: string) {
        if (this.isNative) {
            try {
                const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
                await SecureStoragePlugin.set({ key: `${userId}_${key}`, value });
                console.log(`[Hardware Keystore] Secured ${key} in OS Keychain/Keystore.`);
            } catch (e) {
                console.warn("[Hardware Keystore] Plugin failed, using web fallback.", e);
                this.webFallbackSet(key, value, userId);
            }
        } else {
            this.webFallbackSet(key, value, userId);
        }
    }

    async getSecret(key: string, userId: string): Promise<string | null> {
        if (this.isNative) {
            try {
                const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
                const result = await SecureStoragePlugin.get({ key: `${userId}_${key}` });
                console.log(`[Hardware Keystore] Retrieved ${key} from OS Keychain/Keystore.`);
                return result.value;
            } catch (e) {
                return this.webFallbackGet(key, userId);
            }
        } else {
            return this.webFallbackGet(key, userId);
        }
    }

    private webFallbackSet(key: string, value: string, userId: string) {
        const encrypted = encryptData(value, userId);
        localStorage.setItem(`secure_box_${userId}_${key}`, encrypted);
    }

    private webFallbackGet(key: string, userId: string): string | null {
        const encrypted = localStorage.getItem(`secure_box_${userId}_${key}`);
        if (!encrypted) return null;
        return decryptData(encrypted, userId);
    }
}

export const keystore = new SecureKeystore();
