import { GoogleGenAI } from "@google/genai";
async function test() {
    const ai = new GoogleGenAI({});
    const r2 = await ai.models.generateVideos({ model: "veo-2.0-generate-001", prompt: "cat video" });
}
