import { GoogleGenAI } from "@google/genai";
async function test() {
    const ai = new GoogleGenAI({});
    const r1 = await ai.models.generateImages({ model: "imagen-3.0-generate-002", prompt: "cat" });
    const imgBytes = r1.generatedImages[0].image.imageBytes; // base64 string
    const r2 = await ai.models.generateVideos({ model: "veo-2.0-generate-001", prompt: "cat video" });
}
