import { synthesizeEdgeSpeech } from './services/edgeSpeechSynthesizer';
import fs from 'fs';

async function test() {
    try {
        console.log("Starting Edge Speech Synthesis test...");
        const buffer = await synthesizeEdgeSpeech({
            text: "مرحباً بك في عالم المساعد الشخصي الرقمي",
            voice: "ar-EG-ShakirNeural",
            rate: "+10%",
            pitch: "+0Hz",
            outputFormat: "raw-24khz-16bit-mono-pcm"
        });
        console.log("Success! Received buffer of size:", buffer.length);
        fs.writeFileSync('test_out.pcm', buffer);
    } catch (err: any) {
        console.error("Error occurred during synthesis:", err);
    }
}

test();
