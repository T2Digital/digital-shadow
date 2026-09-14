import { GoogleGenAI } from "@google/genai";
async function test() {
try {
  const ai = new GoogleGenAI({ apiKey: "" });
  await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hi" });
  console.log("Success");
} catch (e: any) {
  console.error("Error:", e.message);
}
}
test();
