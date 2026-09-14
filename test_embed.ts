import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || process.env.API_KEY || 'AIza...' });

async function test() {
  try {
    const res = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'test'
    });
    console.log("Success with text-embedding-004", res.embeddings?.[0]?.values?.length);
  } catch(e) {
    console.log("004 error", (e as any).message);
  }
}
test();
