// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI, resumeAudioContext } from "./geminiService";
import axios from 'axios';

export const generateImageNative = async (prompt: string, userKey?: string): Promise<string> => {
    try {
        let key = userKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey: key || 'dummy', apiVersion: 'v1beta' });
        
        try {
            const r2 = await ai.models.generateImages({ model: "imagen-3.0-generate-002", prompt });
            if (r2.generatedImages && r2.generatedImages.length > 0) {
                const img = r2.generatedImages[0];
                return `data:${img.image.mimeType};base64,${img.image.imageBytes}`;
            }
        } catch (e) {
            console.log("Failed to generate with imagen-3.0-generate-002, trying fallback", e);
            const r = await ai.models.generateImages({ model: "gemini-3.1-flash-image-preview", prompt });
            if (r.generatedImages && r.generatedImages.length > 0) {
                const img = r.generatedImages[0];
                return `data:${img.image.mimeType};base64,${img.image.imageBytes}`;
            }
        }
    } catch (finalError) {
        console.error("Gemini image generation failed, falling back to pollinations:", finalError);
    }
    
    // Final fallback
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
};


export const startVideoGenerationNative = async (prompt: string, userKey?: string): Promise<any> => {
    let key = userKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) {
        throw new Error("API Key is required for Veo 3 / Veo 2 generation.");
    }
    const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });
    const op = await ai.models.generateVideos({
        model: "veo-2.0-generate-001",
        prompt
    });
    return op;
};


