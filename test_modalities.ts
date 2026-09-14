import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const run = async () => {
    // try to get key
    const envFile = fs.readFileSync('.env', 'utf8');
    const keyMatch = envFile.match(/GEMINI_API_KEY=(.*)/);
    const key = process.env.GEMINI_API_KEY || (keyMatch ? keyMatch[1] : undefined);
    
    const ai = new GoogleGenAI({ apiKey: key });
    
    try {
        const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: ["Hello! Respond in arabic"],
            config: {
                responseModalities: ["TEXT", "AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
            }
        });
        const text = res.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        const audio = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
        
        console.log("TEXT:", text ? text.substring(0, 20) : null);
        console.log("AUDIO:", !!audio);
    } catch (e) {
        console.error("ERR", e);
    }
}
run();
