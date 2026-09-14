export class WakeWordEngine {
    private recognition: any;
    private isListening: boolean = false;
    private onWakeWordDetected: () => void;
    private wakeWords = ['يا ظل', 'يا شادو', 'ظل', 'shadow', 'يا تيتو', 'تيتو', 'tito'];
    
    // Ambient Mode
    private audioContext: AudioContext | null = null;
    private analyzer: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private ambientFrames: number = 0;
    private isAmbientEnv: boolean = false;
    private ambientInterval: any = null;

    constructor(onWakeWordDetected: () => void) {
        this.onWakeWordDetected = onWakeWordDetected;
        this.init();
    }

    private init() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        // @ts-ignore
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'ar-EG';

        this.recognition.onresult = (event: any) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
            
            console.log("Wake Word Engine heard:", transcript);

            for (const word of this.wakeWords) {
                if (transcript.includes(word)) {
                    console.log("WAKE WORD DETECTED:", word);
                    this.stop(); 
                    this.onWakeWordDetected();
                    break;
                }
            }
        };

        this.recognition.onerror = (event: any) => {
            console.warn("Wake Word Engine Error:", event.error);
            if (event.error !== 'not-allowed' && this.isListening) {
                setTimeout(() => this.start(), 1000);
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };
    }

    private async startAmbientAnalyzer() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext();
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 256;
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyzer);
            
            const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
            
            this.ambientInterval = setInterval(() => {
                this.analyzer?.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i=0; i<dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                
                // If average volume is very high for 10 consecutive ticks (approx 10 seconds),
                // we assume we are in a crowded/loud place.
                if (average > 80) {
                     this.ambientFrames++;
                } else {
                     this.ambientFrames = Math.max(0, this.ambientFrames - 1);
                }

                if (this.ambientFrames > 10 && !this.isAmbientEnv) {
                    this.isAmbientEnv = true;
                    console.log("[Ambient Mode] High noise detected. Activating discreet mode.");
                    // We could dispatch an event here.
                } else if (this.ambientFrames === 0 && this.isAmbientEnv) {
                    this.isAmbientEnv = false;
                    console.log("[Ambient Mode] Environment quieted down.");
                }

            }, 1000);
        } catch (e) {
            console.warn("Ambient analyzer failed to start", e);
        }
    }

    public start() {
        if (!this.recognition || this.isListening) return;
        this.isListening = true;
        try {
            this.recognition.start();
            console.log("Wake Word Engine Started.");
            
            // Start ambient checking alongside Wake Word if not already running
            if (!this.audioContext) {
                this.startAmbientAnalyzer();
            }
            
        } catch (e) {
            console.warn("Wake Word Engine start failed:", e);
        }
    }

    public stop() {
        if (!this.recognition || !this.isListening) return;
        this.isListening = false;
        try {
            this.recognition.stop();
            console.log("Wake Word Engine Stopped.");
        } catch (e) {}
    }
}
