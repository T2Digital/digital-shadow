const CryptoJS = require('crypto-js');

const GLOBAL_SECRET = 'shadow_secure_vault_2026';
const getDerivedKey = (userId) => {
    return CryptoJS.SHA256(userId + GLOBAL_SECRET).toString();
};

const decryptData = (cipherText, userId) => {
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
    const GLOBAL_SALT = "SHADOW_CORE_V1";
    try {
        const oldDecrypted = decodeURIComponent(escape(atob(cipherText))).replace(GLOBAL_SALT + userId, '');
        if (oldDecrypted && oldDecrypted !== cipherText && !oldDecrypted.includes("SHADOW_CORE_V1")) {
            return oldDecrypted;
        }
    } catch (e) {}

    return cipherText; // Likely plain text
};

// create old encrypted message
const text = "مرحبا هذا اختبار";
const userId = "ahmed.atya.daif@gmail.com";
const GLOBAL_SALT = "SHADOW_CORE_V1";
const oldEncrypted = btoa(unescape(encodeURIComponent(text + GLOBAL_SALT + userId)));

console.log("old enc = " + oldEncrypted)
console.log("decrypted = " + decryptData(oldEncrypted, userId));
