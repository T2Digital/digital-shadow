import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export const getAI = (): GoogleGenAI => {
    if (!_ai) {
        let rawKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
        const key = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : undefined;
        if (!key) {
             _ai = new GoogleGenAI({ apiKey: "MISSING_KEY_ERROR_WILL_BE_THROWN_ON_USE", apiVersion: 'v1beta' });
             return _ai;
        }
        _ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });
    }
    return _ai;
};
