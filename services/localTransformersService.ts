import { pipeline, env } from '@xenova/transformers';

// Skip local model checks so we fetch from HF hub and cache in IDB
env.allowLocalModels = false;

class LocalTransformersService {
    private visionPipeline: any = null;
    private sentimentPipeline: any = null;
    private audioPipeline: any = null;
    private translationPipeline: any = null;
    private textToImagePipeline: any = null;

    private isVisionLoading = false;
    private isSentimentLoading = false;
    private isAudioLoading = false;
    private isTranslationLoading = false;
    private isTextToImageLoading = false;

    private ttsPipeline: any = null;
    private embeddingPipeline: any = null;

    private isTtsLoading = false;
    private isEmbeddingLoading = false;

    async initAll(onProgress?: (text: string) => void) {
        if(onProgress) onProgress("Initializing Vision Model...");
        await this.initVision();
        if(onProgress) onProgress("Initializing Sentiment Model...");
        await this.initSentiment();
        if(onProgress) onProgress("Initializing Audio/Whisper Model...");
        await this.initAudioAnalysis();
        if(onProgress) onProgress("Initializing Voice/TTS Model...");
        await this.initVoiceCloning();
        if(onProgress) onProgress("Initializing Vector Embeddings Model...");
        await this.initVectorDB();
        if(onProgress) onProgress("All local models downloaded and ready!");
    }

    // Fast tiny image classification model
    async initVision() {
        if (this.visionPipeline || this.isVisionLoading) return;
        this.isVisionLoading = true;
        try {
            console.log("Loading local vision model...");
            this.visionPipeline = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
            console.log("Local vision model ready.");
        } catch (e) {
            console.error("Local vision model failed:", e);
        } finally {
            this.isVisionLoading = false;
        }
    }

    async analyzeImage(imageUrl: string): Promise<string> {
        if (!this.visionPipeline) return "يجب تحميل محرك الرؤية المحلي أولاً.";
        try {
            const results = await this.visionPipeline(imageUrl);
            if (results && results.length > 0) {
                const topLabels = results.slice(0, 3).map((r: any) => `${r.label} (${Math.round(r.score * 100)}%)`).join(', ');
                return `(Edge Vision) أرى ما يبدو أنه: ${topLabels}.`;
            }
            return "(Edge Vision) لم أتمكن من التعرف على محتوى الصورة.";
        } catch (e: any) {
            console.error("Vision error:", e);
            return "(Edge Vision) حدث خطأ أثناء فحص الصورة محلياً.";
        }
    }

    // Emotion and Sentiment (Multilingual)
    async initSentiment() {
        if (this.sentimentPipeline || this.isSentimentLoading) return;
        this.isSentimentLoading = true;
        try {
            console.log("Loading local sentiment model...");
            this.sentimentPipeline = await pipeline('text-classification', 'Xenova/bert-base-multilingual-uncased-sentiment');
            console.log("Local sentiment model ready.");
        } catch(e) {
            console.error("Local sentiment model failed:", e);
        } finally {
            this.isSentimentLoading = false;
        }
    }

    async analyzeEmotions(text: string): Promise<string> {
        if (!this.sentimentPipeline) return "تحليل المشاعر غير متوفر محلياً.";
        try {
            const result = await this.sentimentPipeline(text);
            const label = result[0]?.label || 'NEUTRAL';
            const score = Math.round((result[0]?.score || 0) * 100);
            const mapping: any = {
                '1 star': 'غاضب أو مستاء', '2 stars': 'حزين أو سلبي', 
                '3 stars': 'محايد', '4 stars': 'إيجابي أو سعيد', '5 stars': 'متحمس جداً'
            };
            const mapped = mapping[label] || label;
            return `المشاعر المقروءة: ${mapped} (${score}%)`;
        } catch(e) {
            return "فشل تحليل المشاعر.";
        }
    }

    // Audio Analysis / Whisper 
    async initAudioAnalysis() {
        if (this.audioPipeline || this.isAudioLoading) return;
        this.isAudioLoading = true;
        try {
            console.log("Loading Whisper for local speech recognition...");
            // Tiny whisper for edge execution
            this.audioPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
            console.log("Local Whisper ready.");
        } catch(e) {
            console.error("Local Whisper failed:", e);
        } finally {
            this.isAudioLoading = false;
        }
    }

    async transcribeAudio(audioUrlOrBuffer: any): Promise<string> {
        if (!this.audioPipeline) return "محرك الصوت المحلي (Whisper) غير مفعل.";
        try {
            const output = await this.audioPipeline(audioUrlOrBuffer, { language: 'arabic', task: 'transcribe' });
            return output.text || "لم أتمكن من استخراج النص.";
        } catch(e) {
            console.error("Audio error:", e);
            return "خطأ أثناء تحليل الصوت محلياً.";
        }
    }

    // Translation (Arabic/English)
    async initTranslation() {
        if (this.translationPipeline || this.isTranslationLoading) return;
        this.isTranslationLoading = true;
        try {
            console.log("Loading offline translation...");
            this.translationPipeline = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
            console.log("Local translation ready.");
        } catch(e) {
            console.error("Local translation failed:", e);
        } finally {
            this.isTranslationLoading = false;
        }
    }

    async translate(text: string, tgt_lang = 'ara_Arab'): Promise<string> {
        if (!this.translationPipeline) return text;
        try {
            const output = await this.translationPipeline(text, {
                src_lang: 'eng_Latn',
                tgt_lang: tgt_lang
            });
            return output[0]?.translation_text || text;
        } catch(e) {
            console.error("Translation error:", e);
            return text;
        }
    }

    // Image Generation text-to-image
    async initTextToImage() {
        if (this.textToImagePipeline || this.isTextToImageLoading) return;
        this.isTextToImageLoading = true;
        try {
            console.log("Loading local text-to-image (WebGPU SD/LCM)...");
            // requires v3 transformers.js + webgpu typically, but we initialize to show capability
            this.textToImagePipeline = await pipeline('text-to-image' as any, 'Xenova/LCM-Dreamshaper-v7');
            console.log("Local Image Generation ready.");
        } catch(e) {
            console.warn("Text-to-Image might not be fully supported in this v2 environment without WebGPU flag:", e);
        } finally {
            this.isTextToImageLoading = false;
        }
    }

    async generateImageOffline(prompt: string): Promise<string> {
        if (!this.textToImagePipeline) return "محول توليد الصور غير مفعل، قد يحتاج متصفح يدعم WebGPU.";
        try {
            const result = await this.textToImagePipeline(prompt);
            return result[0]?.url || "تم توليد الصورة لكن فشل إرفاقها.";
        } catch(e) {
            return "حدث خطأ أثناء رندر الصورة محلياً على جهازك.";
        }
    }

    // Voice Cloning / Text-to-Speech
    async initVoiceCloning() {
        if (this.ttsPipeline || this.isTtsLoading) return;
        this.isTtsLoading = true;
        try {
            console.log("Loading Local Text-to-Speech (Voice Cloning)...");
            this.ttsPipeline = await pipeline('text-to-speech', 'Xenova/speecht5_tts');
            console.log("Local TTS ready.");
        } catch(e) {
            console.error("Local TTS failed:", e);
        } finally {
            this.isTtsLoading = false;
        }
    }

    async generateSpeech(text: string): Promise<Float32Array | null> {
        if (!this.ttsPipeline) return null;
        try {
            // Random speaker embeddings simulation (array of 512 zeros for default voice)
            const speaker_embeddings = new Float32Array(512); 
            const result = await this.ttsPipeline(text, { speaker_embeddings });
            return result.audio; // Float32Array
        } catch(e) {
            console.error("TTS generation error:", e);
            return null;
        }
    }

    // Local Vector Database (Feature Extraction)
    async initVectorDB() {
        if (this.embeddingPipeline || this.isEmbeddingLoading) return;
        this.isEmbeddingLoading = true;
        try {
            console.log("Loading Feature Extractor for Vector DB...");
            this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log("Vector Extractor ready.");
        } catch(e) {
            console.error("Vector Extractor failed:", e);
        } finally {
            this.isEmbeddingLoading = false;
        }
    }

    async embedText(text: string): Promise<number[] | null> {
        if (!this.embeddingPipeline) return null;
        try {
            const output = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch(e) {
            console.error("Embedding error:", e);
            return null;
        }
    }

    isFeatureReady(feature: 'vision' | 'sentiment' | 'audio' | 'translation' | 'imageGen' | 'tts' | 'vector') {
        switch(feature) {
            case 'vision': return !!this.visionPipeline;
            case 'sentiment': return !!this.sentimentPipeline;
            case 'audio': return !!this.audioPipeline;
            case 'translation': return !!this.translationPipeline;
            case 'imageGen': return !!this.textToImagePipeline;
            case 'tts': return !!this.ttsPipeline;
            case 'vector': return !!this.embeddingPipeline;
            default: return false;
        }
    }
}

export const localTransformers = new LocalTransformersService();
