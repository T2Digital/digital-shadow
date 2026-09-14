import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';
import { useAppStore } from './store';

class LocalBrainService {
    private engine: MLCEngine | null = null;
    private isEngineLoading = false;
    public loadProgress = 0;
    public loadText = '';

    /**
     * Initializes the WebLLM engine with a tiny, fast offline model (Llama-3-8B is 4GB, we might want Qwen or Phi3 for web to save space & RAM).
     * We'll default to Phi-3-mini-4k-instruct-q4f16_1-MLC or similar lightweight model.
     */
    async initModel(onProgress?: (progress: number, text: string) => void) {
        if (this.engine) return;
        if (this.isEngineLoading) return;
        this.isEngineLoading = true;

        const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC"; // Efficient local model approx 2.2GB

        try {
            console.log("🚀 Starting Local Edge AI Engine...");
            
            const initProgressCallback = (report: InitProgressReport) => {
                this.loadProgress = Math.round(report.progress * 100);
                this.loadText = report.text;
                if (onProgress) onProgress(this.loadProgress, this.loadText);
                console.log(`[WebLLM] ${report.text}`);
            };

            this.engine = await CreateMLCEngine(selectedModel, {
                initProgressCallback,
            });

            console.log("✅ Local Edge AI Engine Ready!");
        } catch (error: any) {
            console.warn("⚠️ Local Edge AI is not available in this environment (likely due to network configuration or cache limitations). Running in fallback mode.");
            this.engine = null;
        } finally {
            this.isEngineLoading = false;
        }
    }

    async generateResponse(message: string, context?: string): Promise<string> {
        if (!this.engine) {
            return "(الظل مغلق محلياً) برجاء تفعيل نموذج الذكاء الاصطناعي المحلي أو الاتصال بالإنترنت.";
        }

        const systemPrompt = `أنت الظل الرقمي، مساعد صمم ليعمل حتى بدون اتصال بالإنترنت (Offline Mode). 
أنت الآن تعمل محلياً على جهاز المستخدم للحفاظ على خصوصيته ولتلبية طلباته فوراً.
ردودك يجب أن تكون ذكية، سريعة، ومباشرة.
المهام التي تتطلب بحث سحابي سيتم جدولتها لتعمل لاحقاً عند عودة الإنترنت.
${context ? `\nمعلومات إضافية:\n${context}` : ''}`;

        try {
            const reply = await this.engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 512, // Keep generation fast
            });

            return reply.choices[0].message.content || "(استجابة فارغة من النموذج المحلي)";
        } catch (err: any) {
            console.error("Local inference error:", err);
            return `خطأ أثناء معالجة الطلب محلياً: ${err.message}`;
        }
    }

    isReady() {
        return !!this.engine;
    }
}

export const localBrain = new LocalBrainService();
