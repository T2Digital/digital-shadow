import CryptoJS from 'crypto-js';

const GLOBAL_SECRET = 'shadow_secure_vault_2026';

let customVaultKey: string | null = null;

export const setE2EEVaultKey = (pinOrPassword: string) => {
    customVaultKey = pinOrPassword;
    console.log("[E2EE] Custom vault key activated for AES-256 encryption.");
};

export const hasE2EEVaultKey = () => !!customVaultKey;

const getDerivedKey = (userId: string) => {
    if (customVaultKey) {
        return CryptoJS.SHA256(userId + customVaultKey).toString(CryptoJS.enc.Hex);
    }
    return CryptoJS.SHA256(userId + GLOBAL_SECRET).toString(CryptoJS.enc.Hex);
};

export const encryptData = (data: string, userId: string): string => {
    if (!data) return data;
    try {
        const key = getDerivedKey(userId);
        return CryptoJS.AES.encrypt(data, key).toString();
    } catch (e) {
        console.error('Encryption failed', e);
        return data; 
    }
};

export const decryptData = (cipherText: string, userId: string): string => {
    if (!cipherText) return cipherText;
    
    // First try new AES Decryption
    try {
        const key = getDerivedKey(userId);
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (originalText) {
            return originalText; 
        }
    } catch (e) {}

    // Fallback: try the old base64 custom decoding
    try {
        const oldDecrypted = decodeURIComponent(escape(atob(cipherText)));
        if (oldDecrypted && oldDecrypted !== cipherText && oldDecrypted.includes("SHADOW_CORE_V1")) {
            const splitPoint = oldDecrypted.lastIndexOf("SHADOW_CORE_V1");
            return oldDecrypted.substring(0, splitPoint);
        }
    } catch (e) {}

    return cipherText;
};
