// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI } from "./aiClient";
let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// Streaming Audio Queue for Real-Time Sentence Synthesis
class AudioStreamQueue {
    private queue: { index: number; base64: string }[] = [];
    private nextPlayIndex: number = 0;
    private totalEnqueued: number = 0;
    private isPlaying: boolean = false;
    private currentSessionId: number = 0;
    private isStreamCompleted: boolean = false;
    private onQueueEnded?: () => void;

    public startSession(onEnded?: () => void) {
        this.currentSessionId = Date.now();
        this.queue = [];
        this.nextPlayIndex = 0;
        this.totalEnqueued = 0;
        this.isPlaying = false;
        this.isStreamCompleted = false;
        this.onQueueEnded = onEnded;
        if (currentSource) {
            try { currentSource.stop(); } catch {}
            currentSource = null;
        }
        return this.currentSessionId;
    }

    public stop() {
        this.currentSessionId = 0;
        this.queue = [];
        this.nextPlayIndex = 0;
        this.totalEnqueued = 0;
        this.isPlaying = false;
        this.isStreamCompleted = false;
        if (currentSource) {
            try { currentSource.stop(); } catch {}
            currentSource = null;
        }
        window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
        window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
    }

    public markCompleted(sessionId: number) {
        if (this.currentSessionId !== sessionId) return;
        this.isStreamCompleted = true;
        if (!this.isPlaying && this.queue.length === 0) {
            this.onQueueEnded?.();
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
        }
    }

    public async enqueueSentence(text: string, voice: string, sessionId: number) {
        if (this.currentSessionId !== sessionId || !text.trim()) return;
        const itemIndex = this.totalEnqueued++;

        // Fetch audio immediately in parallel
        const base64 = await getShadowVoice(text, voice);
        if (this.currentSessionId !== sessionId) return;

        if (base64) {
            this.queue.push({ index: itemIndex, base64 });
            this.queue.sort((a, b) => a.index - b.index);
        } else {
            // If synthesis failed, advance index so playback does not stall
            if (this.nextPlayIndex === itemIndex) {
                this.nextPlayIndex++;
            }
        }

        if (!this.isPlaying) {
            this.playNext(voice, sessionId);
        }
    }

    private async playNext(voice: string, sessionId: number) {
        if (this.currentSessionId !== sessionId) return;

        // Find next sequential sentence
        const nextItemIndex = this.queue.findIndex(item => item.index === this.nextPlayIndex);

        if (nextItemIndex === -1) {
            if (this.isStreamCompleted && this.nextPlayIndex >= this.totalEnqueued) {
                this.isPlaying = false;
                this.onQueueEnded?.();
                window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            } else {
                this.isPlaying = false;
            }
            return;
        }

        this.isPlaying = true;
        const nextItem = this.queue.splice(nextItemIndex, 1)[0];
        this.nextPlayIndex++;

        const ctx = resumeAudioContext();
        if (!ctx) {
            this.isPlaying = false;
            return;
        }

        try {
            const u8 = new Uint8Array(base64ToArrayBuffer(nextItem.base64));
            const buffer = await decodeAudioData(u8, ctx);
            if (this.currentSessionId !== sessionId) return;

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(ctx.destination);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let animFrame: number;

            const updateLevel = () => {
                if (!currentSource) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: Math.min(1, avg / 128) } }));
                animFrame = requestAnimationFrame(updateLevel);
            };

            source.onended = () => {
                currentSource = null;
                cancelAnimationFrame(animFrame);
                window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
                this.playNext(voice, sessionId);
            };

            source.start(0);
            currentSource = source;
            updateLevel();
        } catch (e) {
            console.error("[StreamQueue Playback Error]", e);
            this.playNext(voice, sessionId);
        }
    }
}

export const audioStreamQueue = new AudioStreamQueue();

export function resumeAudioContext() {
    try {
        if (!audioCtx) {
            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
        }
        if (audioCtx && (audioCtx.state === "suspended" || (audioCtx.state as string) === "interrupted")) {
            audioCtx.resume().catch(() => {});
        }
        if ("speechSynthesis" in window && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        return audioCtx;
    } catch (e) { return null; }
}

export const audioCache = new Map<string, string>();

// GLOBAL STATE FOR TTS
// @ts-ignore
window.shadowUtterance = null;
let resumeInterval: any = null;

export const stopVoice = async () => { 
    audioStreamQueue.stop();
    if (currentSource) { try { currentSource.stop(); } catch {} currentSource = null; } 
    if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
    
    if (Capacitor.isNativePlatform()) {
        try { await TextToSpeech.stop(); } catch {}
    } else if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
    }
    
    // @ts-ignore
    window.shadowUtterance = null;
};

// --- ROBUST NATIVE TTS ENGINE ---

export const speakNative = async (text: string, voice: string = 'male', onEnd?: () => void) => {
    const hasTags = /\[(whisper|laughs|angry|scared|normal)\]/i.test(text);

    if (hasTags && !Capacitor.isNativePlatform() && ('speechSynthesis' in window)) {
        const emotionRegex = /(\[whisper\]|\[laughs\]|\[angry\]|\[scared\]|\[normal\])/gi;
        const parts = text.split(emotionRegex);
        let segments: { text: string; emotion: string }[] = [];
        let currentEmotion = 'normal';
        
        for (const part of parts) {
            if (!part) continue;
            if (part.startsWith('[') && part.endsWith(']')) {
                currentEmotion = part.slice(1, -1).toLowerCase();
            } else {
                const cleanedPart = part.replace(/[*_#\-`]/g, ' ').replace(/http\S+/g, '').trim();
                if (cleanedPart.length > 0) {
                    segments.push({ text: cleanedPart, emotion: currentEmotion });
                }
            }
        }
        
        if (segments.length === 0) {
            onEnd?.();
            return;
        }
        
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        
        let index = 0;
        const speakNextSegment = () => {
            if (index >= segments.length) {
                window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
                onEnd?.();
                return;
            }
            
            const seg = segments[index];
            const utter = new SpeechSynthesisUtterance(seg.text);
            // @ts-ignore
            window.shadowUtterance = utter;
            
            let rate = 1.0;
            let pitch = voice === 'female' ? 1.2 : 1.0;
            
            switch (seg.emotion) {
                case 'whisper':
                    rate = 0.70;
                    pitch = voice === 'female' ? 0.95 : 0.80;
                    break;
                case 'laughs':
                    rate = 1.15;
                    pitch = voice === 'female' ? 1.35 : 1.15;
                    break;
                case 'angry':
                    rate = 1.25;
                    pitch = voice === 'female' ? 1.40 : 1.25;
                    break;
                case 'scared':
                    rate = 1.20;
                    pitch = voice === 'female' ? 1.45 : 1.35;
                    break;
                default:
                    rate = 1.0;
                    pitch = voice === 'female' ? 1.2 : 1.0;
                    break;
            }
            
            utter.rate = rate;
            utter.pitch = pitch;
            utter.lang = 'ar-EG';
            utter.volume = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const arVoices = voices.filter(v => v.lang.toLowerCase().includes('ar'));
            if (arVoices.length > 0) {
                let selectedVoice: SpeechSynthesisVoice | undefined;
                if (voice === 'female') {
                    selectedVoice = arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name) && v.lang.includes('EG')) ||
                                    arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name)) ||
                                    arVoices.find(v => v.lang === 'ar-EG');
                } else {
                    selectedVoice = arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name) && v.lang.includes('EG')) ||
                                    arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name)) ||
                                    arVoices.find(v => v.lang === 'ar-EG');
                }
                if (selectedVoice) utter.voice = selectedVoice;
            }
            
            utter.onend = () => {
                index++;
                speakNextSegment();
            };
            
            utter.onerror = (e) => {
                if (e.error !== 'canceled' && e.error !== 'interrupted') {
                    index++;
                    speakNextSegment();
                } else {
                    // @ts-ignore
                    window.shadowUtterance = null;
                }
            };
            
            window.speechSynthesis.speak(utter);
        };
        
        speakNextSegment();
        return;
    }

    const cleanText = text.replace(/[*_#\-`]/g, ' ').replace(/http\S+/g, '').trim();
    if (!cleanText || cleanText.length < 1) { onEnd?.(); return; }

    if (Capacitor.isNativePlatform()) {
        try {
            let selectedVoiceUrl;
            try {
                const { voices } = await TextToSpeech.getSupportedVoices();
                const arVoices = voices.filter((v: any) => v.lang.toLowerCase().includes('ar'));
                if (arVoices.length > 0) {
                    if (voice === 'female') {
                        const fb = arVoices.find((v: any) => /(laila|salma|zeina|female)/i.test(v.name) && v.lang.includes('EG')) || arVoices.find((v: any) => /(laila|salma|zeina|female)/i.test(v.name)) || arVoices.find((v: any) => v.lang === 'ar-EG');
                        if (fb) selectedVoiceUrl = fb.voiceURI || (fb as any).id;
                    } else {
                        const mb = arVoices.find((v: any) => /(maged|tariq|male|majed)/i.test(v.name) && v.lang.includes('EG')) || arVoices.find((v: any) => /(maged|tariq|male|majed)/i.test(v.name)) || arVoices.find((v: any) => v.lang === 'ar-EG');
                        if (mb) selectedVoiceUrl = mb.voiceURI || (mb as any).id;
                    }
                }
            } catch (e) {
                console.warn("Could not fetch native voices", e);
            }

            await TextToSpeech.speak({
                text: cleanText,
                lang: 'ar-EG',
                rate: 0.98,
                pitch: 1.0,
                volume: 1.0,
                category: 'ambient',
                voice: selectedVoiceUrl,
            });
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnd?.();
            return;
        } catch (e) {
            console.warn("Capacitor TTS Failed:", e);
            // fallback to web if possible
        }
    }

    if (!('speechSynthesis' in window)) { 
        (window as any).dispatchEvent(new CustomEvent('shadow_voice_ended'));
        onEnd?.(); 
        return; 
    }
    
    // 1. Force Cancel & Resume State
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    // 3. Create Utterance
    const utter = new SpeechSynthesisUtterance(cleanText);
    // @ts-ignore
    window.shadowUtterance = utter; // Global ref to prevent GC

    utter.rate = 1.0; 
    utter.pitch = voice === 'female' ? 1.2 : 1.0; // Slightly higher pitch for female as fallback
    utter.lang = 'ar-EG'; 
    utter.volume = 1.0;

    // Try finding an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const arVoices = voices.filter(v => v.lang.toLowerCase().includes('ar'));
    
    // Advanced Voice Selection: Prioritize high-quality, local, Egyptian human-like voices
    if (arVoices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;

        if (voice === 'female') {
            // Priority: Laila, Salma, Zeina (Apple/Google high quality female), then ar-EG local
            selectedVoice = arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name) && v.lang.includes('EG')) ||
                            arVoices.find(v => /(laila|salma|zeina|female)/i.test(v.name)) ||
                            arVoices.find(v => /(local|-x-)/i.test(v.name) && v.lang.includes('EG')) || // Android HQ local
                            arVoices.find(v => v.lang === 'ar-EG') ||
                            arVoices[0];
        } else {
            // Priority: Maged, Tariq (Apple high quality male), then ar-EG local
            selectedVoice = arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name) && v.lang.includes('EG')) ||
                            arVoices.find(v => /(maged|tariq|male|majed)/i.test(v.name)) ||
                            arVoices.find(v => /(local|-x-)/i.test(v.name) && v.lang.includes('EG') && !/female|zeina|salma/i.test(v.name)) ||
                            arVoices.find(v => v.lang === 'ar-EG') ||
                            arVoices[arVoices.length - 1];
        }

        if (selectedVoice) {
            utter.voice = selectedVoice;
            console.log(`[Offline TTS] Selected Edge Voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
    }

    // 4. Handlers
    utter.onend = () => {
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
        onEnd?.();
    };

    utter.onerror = (e) => {
        // Ignore interruption errors which happen when we cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn("TTS Error:", e);
        }
        // @ts-ignore
        window.shadowUtterance = null;
        if (resumeInterval) { clearInterval(resumeInterval); resumeInterval = null; }
        
        // Only trigger onEnd if it wasn't cancelled intentionally
        if (e.error !== 'canceled' && e.error !== 'interrupted') onEnd?.();
    };

    // 5. Execution Logic
    let spoken = false;
    const executeSpeak = () => {
        if (spoken) return;
        spoken = true;

        const voices = window.speechSynthesis.getVoices();
        // Try to find a good Arabic voice (Google preferred for quality)
        const preferred = voices.find(v => v.lang.includes('ar') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.includes('ar'));
        
        if (preferred) utter.voice = preferred;

        // Double check pause state
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        
        window.speechSynthesis.speak(utter);
        
        // Chrome Long Text Fix: Periodically pause/resume to keep the engine alive
        if (cleanText.length > 80) {
            if (resumeInterval) clearInterval(resumeInterval);
            resumeInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(resumeInterval);
                    resumeInterval = null;
                } else {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000); // 10s keep-alive
        }
    };

    // 6. Voice Loading Strategy
    // Chrome loads voices asynchronously. We must wait if the list is empty.
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            executeSpeak();
            window.speechSynthesis.onvoiceschanged = null;
        };
        // Fallback: If event never fires (some mobile browsers), speak anyway after 1s
        setTimeout(executeSpeak, 1000);
    } else {
        // Slight delay to ensure the previous 'cancel()' has propagated
        setTimeout(executeSpeak, 50);
    }
};

// --- TOOLS DEFINITION ---
import { actionTools } from './toolsConfig';


function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function decodeAudioData(d: Uint8Array, c: AudioContext): Promise<AudioBuffer> { 
    // 1. Try standard browser native audio decoder (instant for MP3, WAV, OGG, WebM)
    try {
        const copy = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
        const decoded = await c.decodeAudioData(copy);
        if (decoded) return decoded;
    } catch (e) {
        // Not a container format, fall through to raw PCM
    }

    // 2. Fallback: Raw PCM 24kHz 16-bit Mono (e.g. from Gemini TTS preview)
    const byteLength = d.length % 2 === 0 ? d.length : d.length - 1;
    const i16 = new Int16Array(d.buffer, d.byteOffset, byteLength / 2); 
    const b = c.createBuffer(1, i16.length, 24000); 
    const cd = b.getChannelData(0); 
    for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0; 
    return b; 
}

export const generateMp3FromShadowVoice = async (text: string, voice: string): Promise<{file: File, base64: string} | null> => {
    let base64 = audioCache.get(text);
    if (!base64) {
        base64 = await shadowDB.getAudioSegment(text) || undefined;
    }
    if (!base64) {
        base64 = await getShadowVoice(text, voice);
        if (base64) {
            audioCache.set(text, base64);
            shadowDB.saveAudioSegment(text, base64);
        }
    }
    if (!base64) return null;

    const arrayBuffer = base64ToArrayBuffer(base64);
    const u8 = new Uint8Array(arrayBuffer);
    
    // Check if it has ID3 or MP3 sync header (0x49 0x44 0x33 or 0xFF)
    const isMp3 = (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) || (u8[0] === 0xFF && (u8[1] & 0xE0) === 0xE0);
    if (isMp3) {
        const parsedFile = new File([new Blob([arrayBuffer], { type: 'audio/mp3' })], 'shadow-voice.mp3', { type: 'audio/mp3' });
        return { file: parsedFile, base64 };
    }

    // Fallback: Return WAV container
    const dataBytes = u8.length % 2 === 0 ? u8.length : u8.length - 1;
    const u8Even = new Uint8Array(u8.buffer, 0, dataBytes);
    const bufferWav = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(bufferWav);
    
    const setUint16 = (pos: number, data: number) => view.setUint16(pos, data, true);
    const setUint32 = (pos: number, data: number) => view.setUint32(pos, data, true);
    
    setUint32(0, 0x46464952); setUint32(4, 36 + dataBytes); setUint32(8, 0x45564157);
    setUint32(12, 0x20746d66); setUint32(16, 16); setUint16(20, 1); setUint16(22, 1);
    setUint32(24, 24000); setUint32(28, 24000 * 2); setUint16(32, 2); setUint16(34, 16);
    setUint32(36, 0x61746164); setUint32(40, dataBytes);
    new Uint8Array(bufferWav, 44).set(u8Even);
    
    const parsedFile = new File([new Blob([bufferWav], { type: 'audio/wav' })], 'shadow-voice.wav', { type: 'audio/wav' });
    return { file: parsedFile, base64 };
};

export const playShadowVoice = async (
    text: string, 
    voice: string, 
    existing?: string, 
    onEnded?: () => void,
    onVoiceLoaded?: (base64: string) => void
) => {
    stopVoice();
    const ctx = resumeAudioContext();
    
    if (!ctx) { 
        speakNative(text, voice, onEnded);
        return; 
    }

    try {
        let base64 = existing;
        if (!base64 && audioCache.has(text)) base64 = audioCache.get(text);
        if (!base64) base64 = await shadowDB.getAudioSegment(text) || undefined;
        
        if (!base64) {
            base64 = await getShadowVoice(text, voice);
            if (base64) {
                if (audioCache.size >= 100) {
                    const firstKey = audioCache.keys().next().value;
                    if (firstKey) audioCache.delete(firstKey);
                }
                audioCache.set(text, base64);
                shadowDB.saveAudioSegment(text, base64).catch(() => {});
                onVoiceLoaded?.(base64);
            }
        } else {
            onVoiceLoaded?.(base64);
        }

        if (!base64) { 
            speakNative(text, voice, onEnded);
            return; 
        }
        
        const u8 = new Uint8Array(base64ToArrayBuffer(base64));
        const buffer = await decodeAudioData(u8, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Add Analyser for lip-sync and face reactivity
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrame: number;
        
        const updateAudioLevel = () => {
            if (!currentSource) return;
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average level
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalizedLevel = Math.min(1, average / 128); // 0 to 1
            
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: normalizedLevel } }));
            animationFrame = requestAnimationFrame(updateAudioLevel);
        };
        
        source.onended = () => { 
            currentSource = null; 
            cancelAnimationFrame(animationFrame);
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
            window.dispatchEvent(new CustomEvent('shadow_voice_ended'));
            onEnded?.(); 
        };
        
        source.start(0);
        currentSource = source;
        updateAudioLevel();
    } catch (e) { 
        console.error("Voice Playback Error:", e); 
        speakNative(text, voice, onEnded);
    }
};

export const getShadowVoice = async (text: string, voice: string): Promise<string | null> => {
    // 1. FAST PATH: Server-side Edge Neural Egyptian TTS (Ultra fast response < 250ms, natural voice)
    try {
        const cleanText = text
            .replace(/[*_#\-`~>]/g, ' ')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\{.*?\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanText.length > 0) {
            const edgeVoiceName = voice === 'female' ? 'ar-EG-SalmaNeural' : 'ar-EG-ShakirNeural';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout max

            const resp = await fetch('/api/tts/edge-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: cleanText.substring(0, 1500),
                    voice: edgeVoiceName,
                    rate: '+10%',
                    pitch: '+0Hz',
                    format: 'audio-24khz-48kbitrate-mono-mp3'
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (resp.ok) {
                const arrayBuffer = await resp.arrayBuffer();
                if (arrayBuffer.byteLength > 100) {
                    let binary = '';
                    const bytes = new Uint8Array(arrayBuffer);
                    const len = bytes.byteLength;
                    const chunkSize = 8192;
                    for (let i = 0; i < len; i += chunkSize) {
                        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
                        binary += String.fromCharCode.apply(null, chunk as any);
                    }
                    const base64Audio = btoa(binary);
                    if (base64Audio && base64Audio.length > 100) {
                        return base64Audio;
                    }
                }
            }
        }
    } catch (e: any) {
        console.warn("[TTS] Edge proxy fallback:", e?.message);
    }

    // 2. SECOND PATH: Gemini TTS Preview Engine
    try {
        const res = await getAI().models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text }] }],
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice === 'female' ? 'Kore' : 'Puck' } } } 
            }
        });
        return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e: any) { 
        console.warn(`[TTS] Voice generation fallback to native UI voice.`);
        return null; 
    }
};

/**
 * Splits text into low-latency sentence chunks and starts streaming audio playback immediately
 * from the very first sentence without waiting for the complete text synthesis.
 */
export const playShadowVoiceStreaming = async (
    text: string,
    voice: string = 'male',
    onSentenceStart?: (sentence: string) => void,
    onEnded?: () => void
): Promise<number> => {
    stopVoice();
    const ctx = resumeAudioContext();
    if (!ctx) {
        speakNative(text, voice, onEnded);
        return 0;
    }

    const sessionId = audioStreamQueue.startSession(onEnded);

    // Natural sentence delimiter regex (periods, exclamation, question marks, Arabic commas, semicolons, linebreaks)
    const rawSegments = text
        .split(/([.!؟،؛\n]+)/)
        .reduce((acc: string[], curr: string, idx: number) => {
            if (idx % 2 === 0) {
                if (curr.trim()) acc.push(curr.trim());
            } else if (acc.length > 0) {
                acc[acc.length - 1] += curr;
            }
            return acc;
        }, [])
        .map(s => s.trim())
        .filter(s => s.length > 0);

    if (rawSegments.length === 0) {
        audioStreamQueue.markCompleted(sessionId);
        onEnded?.();
        return sessionId;
    }

    // Fire off synthesis for all sentences in parallel; the sequenced queue will play them in order
    Promise.all(
        rawSegments.map((sentence) => {
            onSentenceStart?.(sentence);
            return audioStreamQueue.enqueueSentence(sentence, voice, sessionId);
        })
    ).then(() => {
        audioStreamQueue.markCompleted(sessionId);
    }).catch((err) => {
        console.warn("[Streaming TTS Pipeline Error]", err);
        audioStreamQueue.markCompleted(sessionId);
    });

    return sessionId;
};



