import WebSocket from 'ws';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = "143";
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

function getServerTimeSkew(): Promise<number> {
    return new Promise((resolve) => {
        https.get('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=' + TRUSTED_CLIENT_TOKEN, (res) => {
            const serverDateStr = res.headers.date;
            if (!serverDateStr) { resolve(0); return; }
            resolve(new Date(serverDateStr).getTime() - Date.now());
        }).on('error', () => resolve(0));
    });
}

function getXTimestamp(): string {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[d.getUTCDay()];
    const monthName = months[d.getUTCMonth()];
    const day = d.getUTCDate().toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const seconds = d.getUTCSeconds().toString().padStart(2, '0');
    
    return `${dayName} ${monthName} ${day} ${year} ${hours}:${minutes}:${seconds} GMT+0000 (Coordinated Universal Time)`;
}

async function test() {
    console.log("Starting Fixed Edge Speech Synthesis test...");
    const skewMs = await getServerTimeSkew();
    const requestId = crypto.randomUUID().replace(/-/g, '');
    const muid = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    const WIN_EPOCH = 11644473600n;
    const S_TO_NS = 1000000000n;
    const adjustedTimeMs = Date.now() + skewMs;
    const unixTimestamp = BigInt(Math.floor(adjustedTimeMs / 1000));
    let ticks = unixTimestamp + WIN_EPOCH;
    ticks -= ticks % 300n;
    ticks *= (S_TO_NS / 100n);
    const strToHash = `${ticks.toString()}${TRUSTED_CLIENT_TOKEN}`;
    const gec = crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();

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
    let completed = false;

    ws.on('open', () => {
        const configPayload = JSON.stringify({
            context: {
                synthesis: {
                    audio: {
                        metadataoptions: {
                            sentenceBoundaryEnabled: "false",
                            wordBoundaryEnabled: "true"
                        },
                        outputFormat: "raw-24khz-16bit-mono-pcm"
                    }
                }
            }
        });
        
        const timestamp = getXTimestamp();
        
        const configMsg = `X-Timestamp:${timestamp}\r\n` +
                          `Content-Type:application/json; charset=utf-8\r\n` +
                          `Path:speech.config\r\n\r\n` +
                          configPayload + `\r\n`;
        
        ws.send(configMsg, (err) => {
            if (err) {
                console.error("Failed to send config:", err);
                ws.close();
                return;
            }
            
            const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-EG'>` +
                                `<voice name='ar-EG-ShakirNeural'>` +
                                `<prosody pitch='+0Hz' rate='+10%' volume='medium'>` +
                                `يا مرحب بيك يا صاحبي في عالم الظل الرقمي المساعد الشخصي الذكي` +
                                `</prosody>` +
                                `</voice>` +
                                `</speak>`;
            
            const ssmlMsg = `X-RequestId:${requestId}\r\n` +
                            `Content-Type:application/ssml+xml\r\n` +
                            `X-Timestamp:${timestamp}Z\r\n` +
                            `Path:ssml\r\n\r\n` +
                            ssmlPayload;
            
            ws.send(ssmlMsg, (ssmlErr) => {
                if (ssmlErr) {
                    console.error("Failed to send SSML:", ssmlErr);
                    ws.close();
                }
            });
        });
    });

    ws.on('message', (data, isBinary) => {
        if (isBinary) {
            const buffer = data as Buffer;
            if (buffer.length >= 2) {
                const headerLen = buffer.readUInt16BE(0);
                const header = buffer.toString('utf8', 2, 2 + headerLen);
                if (header.includes('Path:audio')) {
                    const audioChunk = buffer.subarray(2 + headerLen);
                    audioChunks.push(audioChunk);
                }
            }
        } else {
            const textMessage = data.toString();
            if (textMessage.includes('Path:turn.end')) {
                completed = true;
                ws.close();
            }
        }
    });

    ws.on('error', (err) => {
        console.error("WS error:", err.message);
    });

    ws.on('close', (code, reason) => {
        console.log(`WS Closed: code=${code}, reason=${reason.toString()}`);
        if (audioChunks.length > 0) {
            const finalAudio = Buffer.concat(audioChunks);
            console.log(`🎉 SUCCESS! Generated ${finalAudio.length} bytes of MP3 audio!`);
            fs.writeFileSync('test_fixed.mp3', finalAudio);
        } else {
            console.log("Failed to generate audio.");
        }
    });
}

test();
