import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

async function run() {
    try {
        const ai = new GoogleGenAI({}); 
        console.log("Generating with Imagen 3...");
         const r1 = await ai.models.generateImages({ model: "imagen-3.0-generate-001", prompt: "A cyberpunk city" });
         if(r1.generatedImages?.[0]?.image?.imageBytes) {
              console.log("Imagen 3 Success!");
         }
    } catch (e) {
        console.error("FAIL:", e);
    }
}
run();
