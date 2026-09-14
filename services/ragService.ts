// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI, resumeAudioContext } from "./geminiService";


export const generateEmbedding = async (text: string): Promise<number[]> => {
    if (!text || !text.trim()) return [];
    try {
        const result = await getAI().models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: text
        });
        return result.embeddings?.[0]?.values || [];
    } catch (e: any) {
        console.warn("[Shadow Core] Embedding error:", e?.message || e);
        return [];
    }
};

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};


export const memorizeFact = async (userId: string, factText: string) => {
    const memEmbedding = await generateEmbedding(factText);
    const factObj = {
        userId,
        fact: factText,
        timestamp: Date.now(),
        embedding: memEmbedding.length > 0 ? memEmbedding : undefined 
    };
    const id = await shadowDB.saveFact(factObj);
    
    if (memEmbedding.length > 0) {
        // True Local Vector Search: We only store locally, no more Pinecone syncing
        console.log("[Vector DB] Fact embedded locally 100%");
    }
};


export const getRelevantMemories = async (query: string, userId: string): Promise<string> => {
    // Generate embedding for current query
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) {
        // Fallback to local DB if embedding generation fails
        const allMemories = await shadowDB.getMemory(userId);
        return allMemories.slice(-5).map(m => m.fact).join(" | ");
    }

    // Try Pinecone First (Sci-Fi Level Vector DB)
    // const pineconeResults = await queryPinecone(queryEmbedding, userId, 5);
    // if (pineconeResults.length > 0) {
    //     console.log("Vector DB (Pinecone) responded with:", pineconeResults.length, "facts");
    //     return pineconeResults.join(" | ");
    // }

    // Fallback to IndexedDB local Cosine Similarity
    const allMemories = await shadowDB.getMemory(userId);
    if (allMemories.length === 0) return "";

    const scoredMemories = [];
    for (const mem of allMemories) {
        let memEmbedding = mem.embedding;
        // Lazy generation for old facts
        if (!memEmbedding || memEmbedding.length === 0) {
            memEmbedding = await generateEmbedding(mem.fact);
            if (memEmbedding.length > 0) {
                mem.embedding = memEmbedding;
                await shadowDB.saveFact(mem);
                console.log("[Vector DB] Backfilled missing embedding for fact locally.");
            }
        }
        const score = cosineSimilarity(queryEmbedding, memEmbedding || []);
        scoredMemories.push({ fact: mem.fact, score });
    }

    scoredMemories.sort((a, b) => b.score - a.score);
    return scoredMemories.slice(0, 5).map(m => m.fact).join(" | ");
};


export const analyzeMediaForArchive = async (base64Data: string, mimeType: string): Promise<{ title: string, summary: string, keywords: string[] }> => {
    try {
        const ai = getAI();
        const b64Str = base64Data.split(',')[1] || base64Data;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "أنت مساعد ذكي متخصص في أرشفة الملفات. قم بتحليل هذه الصورة/الفيديو بدقة واستخرج اسم مختصر معبر (لا تضع الامتداد)، ووصف قصير جداً، و3 إلى 5 كلمات مفتاحية (keywords). اجعل ردك بصيغة JSON فقط كالتالي:\n{\n  \"title\": \"اسم الملف\",\n  \"summary\": \"ملخص للمحتوى\",\n  \"keywords\": [\"كلمة1\", \"كلمة2\"]\n}" },
                        { inlineData: { data: b64Str, mimeType: mimeType } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const text = response.text;
        if(text) {
             return JSON.parse(text);
        }
    } catch(err) {
        console.error("Failed to analyze media for archive:", err);
    }
    return { title: 'ميديا_مجهولة', summary: 'صورة/فيديو تم التقاطه من مساحة العمل', keywords: ['كاميرا', 'الظل'] };
};

import { getContextData, analyzeEmotionFromText } from './sensorService';

import { localBrain } from './localBrainService';

// --- MAIN RESPONSE FUNCTION ---

