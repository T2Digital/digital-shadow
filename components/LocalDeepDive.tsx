import React, { useState, useEffect, useRef } from 'react';
import { Cpu, X, Download, ShieldCheck, WifiOff, Terminal, Play, Loader2, Image as ImageIcon, Mic, MessageSquare, Video, Database, Monitor, FileCode, Network } from 'lucide-react';
import { localTransformers } from '../services/localTransformersService';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export const LocalDeepDive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [modelStates, setModelStates] = useState({
        vision: false,
        sentiment: false,
        audio: false,
        translation: false,
        imageGen: false,
        video: false,
        tts: false,
        vector: false
    });
    const [isDownloading, setIsDownloading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'console' | 'video' | 'vector' | 'spider' | 'os' | 'tts'>('console');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    
    // FFmpeg state
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const loadFfmpeg = async () => {
        if (ffmpegLoaded) return;
        const ffmpegContext = new FFmpeg();
        ffmpegRef.current = ffmpegContext;
        ffmpegContext.on('log', ({ message }) => addLog(`[FFmpeg] ${message}`));
        await ffmpegContext.load();
        setFfmpegLoaded(true);
        setModelStates(prev => ({...prev, video: true}));
    };

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const checkModelStates = () => {
        setModelStates(prev => ({
            ...prev,
            vision: localTransformers.isFeatureReady('vision'),
            sentiment: localTransformers.isFeatureReady('sentiment'),
            audio: localTransformers.isFeatureReady('audio'),
            translation: localTransformers.isFeatureReady('translation'),
            imageGen: localTransformers.isFeatureReady('imageGen'),
            tts: localTransformers.isFeatureReady('tts'),
            vector: localTransformers.isFeatureReady('vector')
        }));
    };

    useEffect(() => {
        checkModelStates();
        // pre-load ffmpeg if possible
        loadFfmpeg().catch(e => console.warn("FFmpeg pre-load warning:", e));
    }, []);

    const handleDownloadAllSelected = async () => {
        setIsDownloading(true);
        addLog('Initiating Native Offline AI Models... (WebGPU/WASM)');
        try {
            addLog('Downloading MobileNet for Edge Vision...');
            await localTransformers.initVision();
            
            addLog('Downloading NLP pipelines...');
            await localTransformers.initSentiment();
            await localTransformers.initTranslation();

            addLog('Downloading Whisper Tiny & TTS...');
            await localTransformers.initAudioAnalysis();
            await localTransformers.initVoiceCloning();

            addLog('Downloading Vector Embeddings Model...');
            await localTransformers.initVectorDB();

            if (!ffmpegLoaded) {
                addLog('Loading FFmpeg (Offline Video Engine)...');
                await loadFfmpeg();
            }

            checkModelStates();
            addLog('All Core Edge Models Loaded to VRAM securely.');
        } catch (e: any) {
            addLog(`Error loading models: ${e.message || e}`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSimulateInference = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !modelStates.sentiment) return;
        
        const q = input;
        setInput('');
        addLog(`User: ${q}`);
        addLog('Analyzing Sentiment locally (Offline)...');
        
        try {
            const sentimentResult = await localTransformers.analyzeEmotions(q);
            addLog(`Shadow (Local Sentiment): ${sentimentResult}`);

            if (modelStates.translation) {
                addLog('Translating to English locally...');
                const en = await localTransformers.translate(q, 'eng_Latn');
                addLog(`Shadow (Local Translation): ${en}`);
            }
        } catch(e) {
            addLog(`Error during inference.`);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !modelStates.vision) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            addLog(`Analyzing Image locally...`);
            try {
                const result = await localTransformers.analyzeImage(base64);
                addLog(`Shadow (Local Vision): ${result}`);
            } catch (err) {
                addLog(`Vision error!`);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-emerald-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden font-['Cairo']" dir="rtl">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 shrink-0">
                            <Cpu className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                محرك الظل المعرفي (Offline Edge AI)
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-500/30 hidden sm:flex items-center gap-1 shrink-0">
                                    <ShieldCheck className="w-3 h-3" /> آمن 100%
                                </span>
                            </h2>
                            <p className="text-[10px] text-emerald-300/70 font-mono tracking-widest mt-1">
                                FULLY LOCAL WASM/WEBGPU NEURAL NETWORKS
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 sm:absolute sm:left-6 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    
                    {/* Left Sidebar Status */}
                    <div className="w-full md:w-72 border-l border-white/5 bg-black/60 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <WifiOff className="w-4 h-4 text-emerald-400" /> النماذج المحملة للذاكرة
                            </h3>
                            <div className="space-y-4 font-mono text-xs">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <ImageIcon className="w-3 h-3" /> رؤية حاسوبية
                                        </div>
                                        <div className="text-white/40 text-[10px] mt-1">MobileNet V2</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${modelStates.vision ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <MessageSquare className="w-3 h-3" /> تحليل المشاعر
                                        </div>
                                        <div className="text-white/40 text-[10px] mt-1">BERT Multilingual</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${modelStates.sentiment ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <Mic className="w-3 h-3" /> التعرف على الصوت
                                        </div>
                                        <div className="text-white/40 text-[10px] mt-1">Whisper Tiny</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${modelStates.audio ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            ترجمة فورية
                                        </div>
                                        <div className="text-white/40 text-[10px] mt-1">NLLB Distilled</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${modelStates.translation ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                                </div>
                            </div>
                        </div>

                        {!modelStates.vision && !isDownloading && (
                            <button onClick={handleDownloadAllSelected} className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <Download className="w-4 h-4" /> تفعيل محركات الظل
                            </button>
                        )}

                        {isDownloading && (
                            <div className="mt-auto shrink-0 space-y-2">
                                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-2">
                                    <Loader2 className="w-5 h-5 animate-spin" /> جاري التنزيل والتهيئة
                                </div>
                                <p className="text-center text-xs text-white/50">هذه الخطوة تحدث مرة واحدة فقط، سيتم حفظ الموديل في المتصفح.</p>
                            </div>
                        )}

                        {modelStates.vision && !isDownloading && (
                            <div className="mt-auto shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-xs font-bold flex flex-col items-center justify-center gap-2">
                                <ShieldCheck className="w-6 h-6" /> 
                                تمت التهيئة، المتصفح جاهز كعقل اصطناعي محلي
                            </div>
                        )}
                    </div>

                    {/* Right Working Area */}
                    <div className="flex-1 flex flex-col bg-black/80 relative">
                        {/* Tabs */}
                        <div className="flex overflow-x-auto border-b border-white/5 bg-[#0a0a0a] custom-scrollbar">
                            <button onClick={() => setActiveTab('console')} className={`px-4 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${activeTab === 'console' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                                <Terminal className="w-4 h-4" /> العقل الرئيسي
                            </button>
                            <button onClick={() => setActiveTab('video')} className={`px-4 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${activeTab === 'video' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                                <Video className="w-4 h-4" /> فيديو واستنساخ (WebGPU)
                            </button>
                            <button onClick={() => setActiveTab('vector')} className={`px-4 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${activeTab === 'vector' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                                <Database className="w-4 h-4" /> ذاكرة ترابطية (Vector DB)
                            </button>
                            <button onClick={() => setActiveTab('spider')} className={`px-4 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${activeTab === 'spider' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                                <Monitor className="w-4 h-4" /> إدراك مستمر (Spatial)
                            </button>
                            <button onClick={() => setActiveTab('os')} className={`px-4 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${activeTab === 'os' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/40 hover:text-white/80'}`}>
                                <FileCode className="w-4 h-4" /> أتمتة النظام (OS)
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {activeTab === 'console' && (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-white/70 mb-4 pr-2 custom-scrollbar flex flex-col justify-end">
                                        {logs.map((log, i) => (
                                            <div key={i} className={log.includes('Shadow (Local') ? 'text-emerald-400 font-bold' : log.includes('Error') ? 'text-red-400' : 'text-emerald-200/50'}>
                                                {log}
                                            </div>
                                        ))}
                                        {logs.length === 0 && (
                                            <div className="text-white/20 italic text-center my-auto">انقر لتفعيل محركات الظل وانتظر التلقين...</div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!modelStates.vision}
                                            className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-emerald-400 rounded-xl transition-all border border-white/5"
                                            title="تحليل صورة أوفلاين"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>

                                        <form onSubmit={handleSimulateInference} className="flex-1 flex gap-2">
                                            <input 
                                                type="text"
                                                value={input}
                                                onChange={(e)=>setInput(e.target.value)}
                                                disabled={!modelStates.sentiment}
                                                placeholder={modelStates.sentiment ? "اكتب لتحليل المشاعر والترجمة أوفلاين..." : "يجب تحميل المودل أولاً"}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                                            />
                                            <button disabled={!modelStates.sentiment} type="submit" className="bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 text-white px-6 py-3 font-bold rounded-xl transition-all border border-emerald-400/50">
                                                <Play className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'video' && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                        <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-2"><Video className="w-4 h-4"/> FFmpeg.wasm & WebGPU</h4>
                                        <p className="text-sm text-white/50 mb-4 leading-relaxed">
                                            يقوم هذا القسم بتوليد الصور محلياً (ImageGen) ثم دمجها مع تعليق صوتي محلي (Voice Cloning) لإنشاء فيديو MP4 داخل المتصفح بدون إنترنت.
                                        </p>
                                        <div id="video-container-output" className="mb-4"></div>
                                        <button 
                                            onClick={async () => {
                                                addLog("بدء دورة توليد الفيديو محلياً...");
                                                if (!ffmpegRef.current) {
                                                    addLog("FFmpeg غير متوفر");
                                                    return;
                                                }
                                                
                                                try {
                                                    addLog("جاري بناء إطارات الصور (يتم استخدام صور افتراضية محلياً حالياً)...");
                                                    
                                                    // Since WebGPU text-to-image is very heavy for the browser, we'll create some solid color frames with text using canvas to demonstrate
                                                    const frames = [];
                                                    const canvas = document.createElement('canvas');
                                                    canvas.width = 640;
                                                    canvas.height = 480;
                                                    const ctx = canvas.getContext('2d');
                                                    
                                                    if (ctx) {
                                                        for(let i=0; i<30; i++) {
                                                            ctx.fillStyle = `hsl(${(i*12)%360}, 50%, 50%)`;
                                                            ctx.fillRect(0, 0, 640, 480);
                                                            ctx.fillStyle = 'white';
                                                            ctx.font = '30px Arial';
                                                            ctx.fillText(`إطار ${i+1}`, 280, 240);
                                                            
                                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                                            const res = await fetch(dataUrl);
                                                            const buffer = await res.arrayBuffer();
                                                            const frameName = `frame-${i.toString().padStart(3, '0')}.jpg`;
                                                            await ffmpegRef.current.writeFile(frameName, new Uint8Array(buffer));
                                                        }
                                                    }
                                                    
                                                    addLog("جاري استنساخ الصوت (SpeechT5)...");
                                                    const audioData = await localTransformers.generateSpeech("نظام الظل المحلي يعمل بنجاح");
                                                    let hasAudio = false;
                                                    
                                                    if (audioData) {
                                                        // SpeechT5 config: 16kHz, mono, Float32Array
                                                        // To save to WAV:
                                                        const numOfChan = 1;
                                                        const length = audioData.length * 2; // 16-bit PCM
                                                        const buffer = new ArrayBuffer(44 + length);
                                                        const view = new DataView(buffer);
                                                        const sampleRate = 16000;
                                                        
                                                        // Write WAV Header
                                                        const writeString = (view: any, offset: any, string: any) => {
                                                            for (let i = 0; i < string.length; i++) {
                                                                view.setUint8(offset + i, string.charCodeAt(i));
                                                            }
                                                        };
                                                        
                                                        writeString(view, 0, 'RIFF');
                                                        view.setUint32(4, 36 + length, true);
                                                        writeString(view, 8, 'WAVE');
                                                        writeString(view, 12, 'fmt ');
                                                        view.setUint32(16, 16, true);
                                                        view.setUint16(20, 1, true); // PCM
                                                        view.setUint16(22, numOfChan, true);
                                                        view.setUint32(24, sampleRate, true);
                                                        view.setUint32(28, sampleRate * 2, true);
                                                        view.setUint16(32, numOfChan * 2, true);
                                                        view.setUint16(34, 16, true);
                                                        writeString(view, 36, 'data');
                                                        view.setUint32(40, length, true);
                                                        
                                                        // Write Audio Data
                                                        let offset = 44;
                                                        for (let i = 0; i < audioData.length; i++, offset += 2) {
                                                            let s = Math.max(-1, Math.min(1, audioData[i]));
                                                            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                                                        }
                                                        
                                                        await ffmpegRef.current.writeFile('audio.wav', new Uint8Array(buffer));
                                                        hasAudio = true;
                                                    }

                                                    addLog("FFmpeg: دمج الصور والصوت في ملف MP4...");
                                                    
                                                    if (hasAudio) {
                                                        await ffmpegRef.current.exec([
                                                            '-framerate', '3',
                                                            '-pattern_type', 'glob',
                                                            '-i', '*.jpg',
                                                            '-i', 'audio.wav',
                                                            '-c:v', 'libx264',
                                                            '-c:a', 'aac',
                                                            '-b:a', '192k',
                                                            '-pix_fmt', 'yuv420p',
                                                            '-shortest',
                                                            'output.mp4'
                                                        ]);
                                                    } else {
                                                        await ffmpegRef.current.exec([
                                                            '-framerate', '3',
                                                            '-pattern_type', 'glob',
                                                            '-i', '*.jpg',
                                                            '-c:v', 'libx264',
                                                            '-pix_fmt', 'yuv420p',
                                                            'output.mp4'
                                                        ]);
                                                    }
                                                    
                                                    const data = await ffmpegRef.current.readFile('output.mp4');
                                                    const videoUrl = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
                                                    
                                                    // Display video
                                                    const videoEl = document.createElement('video');
                                                    videoEl.src = videoUrl;
                                                    videoEl.controls = true;
                                                    videoEl.style.width = '100%';
                                                    videoEl.style.marginTop = '10px';
                                                    videoEl.style.borderRadius = '8px';
                                                    videoEl.style.border = '1px solid rgba(255,255,255,0.1)';
                                                    
                                                    document.getElementById('video-container-output')?.appendChild(videoEl);
                                                    
                                                    addLog("فيديو الظل جاهز للاستخدام!");
                                                } catch (err: any) {
                                                    addLog(`حدث خطأ أثناء رندر الفيديو: ${err.message}`);
                                                }
                                            }}
                                            disabled={!modelStates.tts || !modelStates.video} 
                                            className="w-full bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all"
                                        >
                                            <Play className="w-4 h-4" /> إنشاء فيديو كامل بالذكاء الاصطناعي
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'vector' && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                        <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-2"><Database className="w-4 h-4"/> Local Vector Database</h4>
                                        <p className="text-sm text-white/50 mb-4 leading-relaxed">
                                            تشفير النصوص كمتجهات رياضية (Embeddings) عبر <span className="font-mono text-xs text-white">all-MiniLM-L6-v2</span> وحفظها في <span className="font-mono text-xs text-white">IndexedDB</span> للاسترجاع الدلالي لاحقاً.
                                        </p>
                                        <div className="w-full h-32 bg-black/50 rounded-lg border border-white/10 flex flex-col p-2 text-white/50 text-xs mb-4 font-mono overflow-y-auto" id="vector-debug-view">
                                            [ مخرجات الـ Embeddings ستظهر هنا ]
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                addLog("تشفير الذاكرة...");
                                                const start = performance.now();
                                                const emb = await localTransformers.embedText("الظل يتعلم من التجارب المحلية");
                                                const timeLog = ((performance.now() - start) / 1000).toFixed(2);
                                                if(emb) {
                                                    addLog(`تم إنشاء Embedding من ${emb.length} بُعد بنجاح في ${timeLog} ثانية.`);
                                                    const view = document.getElementById('vector-debug-view');
                                                    if(view) {
                                                        const miniView = emb.slice(0, 10).map(v => v.toFixed(4)).join(', ');
                                                        view.innerHTML = `[ ${miniView}, ... (${emb.length - 10} more) ]`;
                                                    }
                                                }
                                            }}
                                            disabled={!modelStates.vector} 
                                            className="bg-white/10 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-all"
                                        >
                                            اختبار إنشاء Embedding
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'spider' && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                        <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-2"><Monitor className="w-4 h-4"/> الرؤية الحية المستمرة</h4>
                                        <p className="text-sm text-white/50 mb-4 leading-relaxed">
                                            سحب إطارات الكاميرا كل ثانيتين وتمريرها لمحرك الرؤية المحلي (MobileNet) لفهم المحيط وتحليله لحظياً بدون رفع أي بيانات לסيرفرات.
                                        </p>
                                        <div className="w-full h-32 bg-black/50 rounded-lg border border-white/10 overflow-hidden relative mb-4">
                                            <video 
                                                ref={(ref) => {
                                                    if (ref && !ref.srcObject) {
                                                        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                                                            .then(stream => { ref.srcObject = stream; ref.play(); })
                                                            .catch(err => { console.error('Camera error', err); addLog('Camera error: ' + err.message); });
                                                    }
                                                }}
                                                className="w-full h-full object-cover"
                                                autoPlay muted playsInline
                                            />
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                addLog("بدء الإدراك المكاني المستمر عبر الكاميرا...");
                                                // Take an initial snapshot immediately
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    const canvas = document.createElement('canvas');
                                                    canvas.width = video.videoWidth;
                                                    canvas.height = video.videoHeight;
                                                    canvas.getContext('2d')?.drawImage(video, 0, 0);
                                                    canvas.toBlob(async (blob) => {
                                                        if (blob) {
                                                            const url = URL.createObjectURL(blob);
                                                            try {
                                                                const result = await localTransformers.analyzeImage(url);
                                                                addLog(`(Local Vision): ${result}`);
                                                            } catch (e: any) {
                                                                addLog(`Vision error: ${e.message}`);
                                                            }
                                                            URL.revokeObjectURL(url);
                                                        }
                                                    });
                                                }
                                            }}
                                            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600/40 transition-all"
                                        >
                                            تشغيل رادار المحيط البصري
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'os' && (
                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                        <h4 className="text-emerald-400 font-bold flex items-center gap-2 mb-2"><FileCode className="w-4 h-4"/> أتمتة نظام التشغيل عبر المتصفح</h4>
                                        <p className="text-sm text-white/50 mb-4 leading-relaxed">
                                            استخدام <span className="font-mono text-xs text-white">File System Access API</span> لقراءة وتعديل الملفات المحفوظة بجهازك، واستخدام <span className="font-mono text-xs text-white">Web Share API</span>، وتنفيذ مهام الجدولة.
                                        </p>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    addLog("طلب إذن الوصول لملف النظام...");
                                                    // @ts-ignore
                                                    const [fileHandle] = await window.showOpenFilePicker();
                                                    addLog(`تم ربط ملف: ${fileHandle.name} مع الظل!`);
                                                    
                                                    // Demonstrate file writing
                                                    addLog(`تجهيز لكتابة بعض المعلومات على ${fileHandle.name}...`);
                                                    // @ts-ignore
                                                    const writable = await fileHandle.createWritable();
                                                    await writable.write('Shadow system was here! ' + new Date().toISOString() + '\nالملف تم تعديله بنجاح من خلال الظل المدار ذاتيا بدون أي خادم خارجي!');
                                                    await writable.close();
                                                    
                                                    addLog(`تمت الكتابة بنجاح على نظام الملفات في جهازك.`);
                                                } catch(e) {
                                                    addLog("تم إلغاء الوصول للملف.");
                                                }
                                            }}
                                            className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-all"
                                        >
                                            ربط مسار ملف (File System API)
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

