import CryptoJS from 'crypto-js';

const VAULT_KEY_STORAGE = 'shadow_vault_e2ee_key';

export const VaultCrypto = {
    // Generates a unique 256-bit key specific to this device
    generateDeviceKey: (): string => {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(VAULT_KEY_STORAGE, key);
        return key;
    },

    getDeviceKey: (): string | null => {
        return localStorage.getItem(VAULT_KEY_STORAGE);
    },

    ensureDeviceKey: (): string => {
        return VaultCrypto.getDeviceKey() || VaultCrypto.generateDeviceKey();
    },

    encryptE2E: (text: string): string => {
        if (!text) return text;
        const key = VaultCrypto.ensureDeviceKey();
        return CryptoJS.AES.encrypt(text, key).toString();
    },

    decryptE2E: (cipherText: string): string => {
        if (!cipherText) return cipherText;
        const key = VaultCrypto.ensureDeviceKey();
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, key);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted || cipherText; // Return original if decryption fails or returns empty
        } catch (e) {
            return cipherText; // Return original if decryption fails
        }
    }
};
