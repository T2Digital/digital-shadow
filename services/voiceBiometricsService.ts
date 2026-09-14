export interface VoiceProfile {
    id: string;
    name: string;
    data: number[];
}

export class VoiceBiometrics {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private signatures: VoiceProfile[] = [];

    constructor() {
        this.loadSignatures();
    }

    private loadSignatures() {
        const saved = localStorage.getItem('voice_signatures');
        if (saved) {
            try {
                this.signatures = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse voice signatures", e);
            }
        } else {
            // Migration from old single signature format
            const oldSaved = localStorage.getItem('voice_signature');
            if (oldSaved) {
                try {
                    const data = JSON.parse(oldSaved);
                    this.signatures = [{ id: 'default', name: 'البصمة الأساسية', data }];
                    this.saveSignatures();
                    localStorage.removeItem('voice_signature');
                } catch(e){}
            }
        }
    }

    private saveSignatures() {
        localStorage.setItem('voice_signatures', JSON.stringify(this.signatures));
    }

    public getSignatures(): VoiceProfile[] {
        return this.signatures;
    }

    public hasSignature(): boolean {
        return this.signatures.length > 0;
    }

    public async enroll(stream: MediaStream, name: string = 'بصمة جديدة', durationMs: number = 3000): Promise<boolean> {
        return new Promise((resolve) => {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const accumulatedData = new Float32Array(bufferLength);
            let frames = 0;

            const interval = setInterval(() => {
                this.analyser!.getByteFrequencyData(dataArray);
                for (let i = 0; i < bufferLength; i++) {
                    accumulatedData[i] += dataArray[i];
                }
                frames++;
            }, 50);

            setTimeout(() => {
                clearInterval(interval);
                // Average the data to create a frequency profile
                const signatureData = Array.from(accumulatedData).map(val => val / frames);
                
                this.signatures.push({
                    id: Date.now().toString(),
                    name,
                    data: signatureData
                });
                this.saveSignatures();
                
                source.disconnect();
                if (this.audioContext?.state !== 'closed') {
                    this.audioContext?.close();
                }
                resolve(true);
            }, durationMs);
        });
    }

    public async verify(stream: MediaStream, durationMs: number = 2000): Promise<{ verified: boolean, bestMatch: VoiceProfile | null, maxSimilarity: number }> {
        if (this.signatures.length === 0) return { verified: true, bestMatch: null, maxSimilarity: 1 }; // Allow by default if no signatures

        return new Promise((resolve) => {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const accumulatedData = new Float32Array(bufferLength);
            let frames = 0;

            const interval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                for (let i = 0; i < bufferLength; i++) {
                    accumulatedData[i] += dataArray[i];
                }
                frames++;
            }, 50);

            setTimeout(() => {
                clearInterval(interval);
                const currentSignature = Array.from(accumulatedData).map(val => val / frames);
                
                let maxSimilarity = 0;
                let bestMatch: VoiceProfile | null = null;

                for (const sig of this.signatures) {
                    const similarity = this.cosineSimilarity(sig.data, currentSignature);
                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        bestMatch = sig;
                    }
                }
                
                source.disconnect();
                if (ctx.state !== 'closed') {
                    ctx.close();
                }
                resolve({ verified: maxSimilarity >= 0.85, bestMatch, maxSimilarity });
            }, durationMs);
        });
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    public clearSignatures() {
        this.signatures = [];
        this.saveSignatures();
    }
    
    public deleteSignature(id: string) {
        this.signatures = this.signatures.filter(s => s.id !== id);
        this.saveSignatures();
    }
    
    public updateSignatureName(id: string, name: string) {
        const sig = this.signatures.find(s => s.id === id);
        if (sig) {
            sig.name = name;
            this.saveSignatures();
        }
    }
}

export const voiceBiometrics = new VoiceBiometrics();
