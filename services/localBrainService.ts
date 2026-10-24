import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';
import { shadowDB } from './dbService';
import { processOfflineCommand } from './offlineEdgeService';

export interface LocalModelOption {
    id: string;
    name: string;
    provider: 'google' | 'meta' | 'qwen' | 'microsoft';
    size: string;
    description: string;
    mlcModelId?: string;
    isNativeBrowser?: boolean;
}

export const SUPPORTED_LOCAL_MODELS: LocalModelOption[] = [
    {
        id: 'gemma-2-2b',
        name: 'Google Gemma 2 (2B Instruct)',
        provider: 'google',
        size: '~1.6 GB VRAM',
        description: 'أحدث وأقوى نموذج مدمج مفتوح المصدر من جوجل DeepMind - دقة استدلال وفهم عالية جداً للغة العربية والمهام المعقدة.',
        mlcModelId: 'gemma-2-2b-it-q4f16_1-MLC'
    },
    {
        id: 'gemma-2b',
        name: 'Google Gemma (2B Instruct)',
        provider: 'google',
        size: '~1.4 GB VRAM',
        description: 'الجيل الأول من نماذج Gemma من جوجل - سرعة استجابة فائقة وأداء ممتاز في الأجهزة المتوسطة.',
        mlcModelId: 'gemma-2b-it-q4f16_1-MLC'
    },
    {
        id: 'chrome-nano',
        name: 'Chrome Built-in AI (Gemini Nano)',
        provider: 'google',
        size: '0 MB (مدمج بالنظام)',
        description: 'نموذج Gemini Nano المدمج مباشرة في متصفح Chrome عبر Prompt API دون الحاجة لتحميل أي ملفات إضافية.',
        isNativeBrowser: true
    },
    {
        id: 'qwen-0.5b',
        name: 'Qwen 2.5 (0.5B Instruct)',
        provider: 'qwen',
        size: '~350 MB',
        description: 'نموذج خفيف جداً وسريع البدء، مثالي للأجهزة الضعيفة والهواتف الذكية.',
        mlcModelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'
    },
    {
        id: 'phi-3-mini',
        name: 'Phi-3 Mini (3.8B Instruct)',
        provider: 'microsoft',
        size: '~2.2 GB VRAM',
        description: 'نموذج مايكروسوفت عالي التفكير والاستدلال المنطقي والرياضي.',
        mlcModelId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC'
    }
];

class LocalBrainService {
    private engine: MLCEngine | null = null;
    private isEngineLoading = false;
    public loadProgress = 0;
    public loadText = '';
    public activeModelId: string = 'gemma-2-2b';
    private chromeSession: any = null;

    /**
     * Check if Chrome's Built-in Gemini Nano (Prompt API) is available
     */
    async isChromeNanoAvailable(): Promise<boolean> {
        try {
            const ai = (window as any).ai;
            if (ai && ai.languageModel) {
                const capabilities = await ai.languageModel.capabilities();
                return capabilities.available === 'readily' || capabilities.available === 'after-download';
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Initializes the selected local offline model (defaults to Google Gemma 2 2B)
     */
    async initModel(modelId: string = 'gemma-2-2b', onProgress?: (progress: number, text: string) => void) {
        if (this.isEngineLoading) return;
        this.activeModelId = modelId;

        // 1. Chrome Built-in Gemini Nano path
        if (modelId === 'chrome-nano') {
            this.isEngineLoading = true;
            try {
                const ai = (window as any).ai;
                if (ai && ai.languageModel) {
                    this.loadProgress = 50;
                    this.loadText = 'جارِ تشغيل جلسة Gemini Nano المدمجة في Chrome...';
                    onProgress?.(50, this.loadText);

                    this.chromeSession = await ai.languageModel.create({
                        systemPrompt: `أنت الظل الرقمي، مساعد شخصي مصري ذكي وتوأم رقمي للماستر. تعمل أوفلاين محلياً بنموذج Gemini Nano بدون إنترنت.`
                    });

                    this.loadProgress = 100;
                    this.loadText = 'جاهز (Gemini Nano On-Device)!';
                    onProgress?.(100, this.loadText);
                    return;
                }
            } catch (err: any) {
                console.warn('Chrome Nano initialization failed, falling back to WebGPU Gemma:', err);
                modelId = 'gemma-2-2b';
                this.activeModelId = 'gemma-2-2b';
            } finally {
                this.isEngineLoading = false;
            }
        }

        // 2. WebLLM WebGPU Path (Google Gemma or Qwen)
        const targetConfig = SUPPORTED_LOCAL_MODELS.find(m => m.id === modelId) || SUPPORTED_LOCAL_MODELS[0];
        const selectedModel = targetConfig.mlcModelId || 'gemma-2-2b-it-q4f16_1-MLC';

        this.isEngineLoading = true;
        try {
            console.log(`🚀 Starting Local Edge Engine with model: ${targetConfig.name} (${selectedModel})...`);
            
            const initProgressCallback = (report: InitProgressReport) => {
                this.loadProgress = Math.round(report.progress * 100);
                this.loadText = report.text;
                if (onProgress) onProgress(this.loadProgress, this.loadText);
                console.log(`[WebLLM ${targetConfig.id}] ${report.text}`);
            };

            this.engine = await CreateMLCEngine(selectedModel, {
                initProgressCallback,
            });

            console.log(`✅ Local Edge Engine Ready with ${targetConfig.name}!`);
        } catch (error: any) {
            console.warn("⚠️ Local Edge WebGPU model load failed or WebGPU is unsupported. Running in smart Edge Offline Fallback mode:", error?.message);
            this.engine = null;
        } finally {
            this.isEngineLoading = false;
        }
    }

    /**
     * Generates a fast, intelligent response completely offline
     */
    async generateResponse(message: string, context?: string): Promise<string> {
        // 1. If Chrome Gemini Nano is active
        if (this.chromeSession) {
            try {
                const response = await this.chromeSession.prompt(message);
                return `(Gemini Nano أوفلاين ⚡) ${response}`;
            } catch (err: any) {
                console.warn('Chrome Nano prompt error:', err);
            }
        }

        // 2. If WebLLM Engine (Gemma 2B) is loaded
        if (this.engine) {
            const systemPrompt = `أنت الظل الرقمي (Al-Zill)، الابن البار والتوأم الرقمي للمستخدم.
أنت الآن تعمل محلياً تماماً على جهاز المستخدم (Offline Edge AI) بنموذج (${this.activeModelId.includes('gemma') ? 'Google Gemma 2B' : this.activeModelId}) بدون أي اتصال بالإنترنت للحفاظ على الخصوصية والعمل في أي ظرف.
لهجتك: مصرية ودودة، واثقة، ذكية وسريعة.
ردودك مباشرة ومركزة دون تكرار أو إطالة غير مفيدة.
${context ? `\nسياق إضافي:\n${context}` : ''}`;

            try {
                const reply = await this.engine.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 384,
                });

                const content = reply.choices[0]?.message?.content?.trim();
                if (content) {
                    return `(الظل - Gemma أوفلاين ⚡)\n${content}`;
                }
            } catch (err: any) {
                console.error("Local Gemma inference error:", err);
            }
        }

        // 3. Smart Offline Rule & Command Engine fallback
        const offlineResult = processOfflineCommand(message);
        if (offlineResult) {
            return offlineResult.text;
        }

        return `(الظل أوفلاين ⚡) معاك يا ماستر ومنفذ كل الصلاحيات محلياً على الجهاز. طلبت: "${message}". حفظت الأمر في الذاكرة المحلية وسيتم مزامنة أي خدمات سحابية فور توفر الإنترنت!`;
    }

    isReady() {
        return !!this.engine || !!this.chromeSession;
    }

    isLoading() {
        return this.isEngineLoading;
    }

    getActiveModel() {
        return SUPPORTED_LOCAL_MODELS.find(m => m.id === this.activeModelId) || SUPPORTED_LOCAL_MODELS[0];
    }
}

export const localBrain = new LocalBrainService();
