import WebSocket from 'ws';
import crypto from 'crypto';
import https from 'https';
import { spawn } from 'child_process';

export interface SynthesizeOptions {
    text: string;
    voice?: string;
    rate?: string; // e.g. "+0%" or "+10%" or "+20%"
    pitch?: string; // e.g. "+0Hz"
    outputFormat?: string; // e.g. "raw-24khz-16bit-mono-pcm" or "audio-24khz-96kbps-mp3"
}

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = "143";
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

let cachedSkewMs: number | null = null;

function getServerTimeSkew(): Promise<number> {
    return new Promise((resolve) => {
        const req = https.get('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=' + TRUSTED_CLIENT_TOKEN, { timeout: 3000 }, (res) => {
            const serverDateStr = res.headers.date;
            if (!serverDateStr) {
                resolve(0);
                return;
            }
            const serverTime = new Date(serverDateStr).getTime();
            const localTime = Date.now();
            resolve(serverTime - localTime);
        });
        req.on('timeout', () => {
            req.destroy();
            resolve(0);
        });
        req.on('error', () => {
            resolve(0);
        });
    });
}

function generateMuid(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
}

function generateSecMsGec(token: string, skewMs: number): string {
    const WIN_EPOCH = 11644473600n;
    const S_TO_NS = 1000000000n;
    
    const adjustedTimeMs = Date.now() + skewMs;
    const unixTimestamp = BigInt(Math.floor(adjustedTimeMs / 1000));
    
    let ticks = unixTimestamp + WIN_EPOCH;
    ticks -= ticks % 300n;
    ticks *= (S_TO_NS / 100n);
    
    const strToHash = `${ticks.toString()}${token}`;
    return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

function decodeMp3ToPcm(mp3Buffer: Buffer, targetSampleRate: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-f', 's16le',
            '-acodec', 'pcm_s16le',
            '-ar', targetSampleRate.toString(),
            '-ac', '1',
            'pipe:1'
        ]);

        const chunks: Buffer[] = [];
        const errorChunks: Buffer[] = [];

        ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
        ffmpeg.stderr.on('data', (chunk) => errorChunks.push(chunk));

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                const errorStr = Buffer.concat(errorChunks).toString();
                reject(new Error(`FFmpeg MP3-to-PCM decoding failed (code ${code}): ${errorStr}`));
            }
        });

        ffmpeg.stdin.write(mp3Buffer);
        ffmpeg.stdin.end();
    });
}

/**
 * Synthesizes speech using the Microsoft Edge TTS WebSocket service.
 * Returns a Promise that resolves to a Buffer containing the audio data.
 */
export function synthesizeEdgeSpeech(options: SynthesizeOptions): Promise<Buffer> {
    const text = options.text;
    const voice = options.voice || 'ar-EG-ShakirNeural';
    const rate = options.rate || '+0%';
    const pitch = options.pitch || '+0Hz';
    const format = options.outputFormat || 'raw-24khz-16bit-mono-pcm';

    const skewPromise = cachedSkewMs !== null 
        ? Promise.resolve(cachedSkewMs) 
        : getServerTimeSkew().then(skew => {
            cachedSkewMs = skew;
            return skew;
        });

    return skewPromise.then((skewMs) => {
        return new Promise<Buffer>((resolve, reject) => {
            const requestId = crypto.randomUUID().replace(/-/g, '');
            const muid = generateMuid();
            const gec = generateSecMsGec(TRUSTED_CLIENT_TOKEN, skewMs);
            
            const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
                `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
                `&ConnectionId=${requestId}` +
                `&Sec-MS-GEC=${gec}` +
                `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
            
            const headers = {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                'Sec-WebSocket-Version': '13',
                'Cookie': `muid=${muid};`,
                'Accept-Language': 'en-US,en;q=0.9',
            };

            const ws = new WebSocket(wsUrl, { headers });
            const audioChunks: Buffer[] = [];
            let timer: NodeJS.Timeout;
            let completed = false;

            const cleanup = () => {
                clearTimeout(timer);
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            };

            const handleSuccess = () => {
                cleanup();
                if (completed) return;
                completed = true;
                
                if (audioChunks.length > 0) {
                    const completeMp3 = Buffer.concat(audioChunks);
                    if (format.includes('pcm')) {
                        // Decode MP3 to raw PCM at appropriate sample rate (e.g. 24000)
                        const sampleRate = format.includes('16khz') ? 16000 : 24000;
                        decodeMp3ToPcm(completeMp3, sampleRate)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        resolve(completeMp3);
                    }
                } else {
                    reject(new Error("Edge TTS connection closed without audio data"));
                }
            };

            // Set safety timeout of 20 seconds
            timer = setTimeout(() => {
                cleanup();
                if (!completed) {
                    completed = true;
                    reject(new Error("Edge TTS request timed out"));
                }
            }, 20000);

            ws.on('open', () => {
                // Send config message matching Python edge-tts structure perfectly
                const configPayload = JSON.stringify({
                    context: {
                        synthesis: {
                            audio: {
                                metadataoptions: {
                                    sentenceBoundaryEnabled: "false",
                                    wordBoundaryEnabled: "true"
                                },
                                outputFormat: "audio-24khz-48kbitrate-mono-mp3" // Only format supported natively
                            }
                        }
                    }
                });

                const timestamp = new Date().toISOString();
                const configMsg = `X-Timestamp:${timestamp}\r\n` +
                                  `Content-Type:application/json; charset=utf-8\r\n` +
                                  `Path:speech.config\r\n\r\n` +
                                  configPayload + `\r\n`;

                ws.send(configMsg, (err) => {
                    if (err) {
                        cleanup();
                        if (!completed) {
                            completed = true;
                            return reject(err);
                        }
                        return;
                    }

                    // Send SSML payload
                    const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-EG'>` +
                                        `<voice name='${voice}'>` +
                                        `<prosody pitch='${pitch}' rate='${rate}' volume='medium'>${text}</prosody>` +
                                        `</voice>` +
                                        `</speak>`;

                    const ssmlMsg = `X-RequestId:${requestId}\r\n` +
                                    `Content-Type:application/ssml+xml\r\n` +
                                    `X-Timestamp:${timestamp}Z\r\n` +
                                    `Path:ssml\r\n\r\n` +
                                    ssmlPayload;

                    ws.send(ssmlMsg, (ssmlErr) => {
                        if (ssmlErr) {
                            cleanup();
                            if (!completed) {
                                completed = true;
                                return reject(ssmlErr);
                            }
                        }
                    });
                });
            });

            ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
                if (isBinary) {
                    const buffer = data as Buffer;
                    if (buffer.length < 2) return;
                    
                    // Parse 2-byte header length
                    const headerLen = buffer.readUInt16BE(0);
                    if (buffer.length < 2 + headerLen) return;

                    const header = buffer.toString('utf8', 2, 2 + headerLen);
                    if (header.includes('Path:audio')) {
                        // Extract raw audio data
                        const audioChunk = buffer.subarray(2 + headerLen);
                        audioChunks.push(audioChunk);
                    }
                } else {
                    const textMessage = data.toString();
                    if (textMessage.includes('Path:turn.end')) {
                        handleSuccess();
                    }
                }
            });

            ws.on('error', (err) => {
                cleanup();
                if (!completed) {
                    completed = true;
                    reject(err);
                }
            });

            ws.on('close', () => {
                handleSuccess();
            });
        });
    });
}
