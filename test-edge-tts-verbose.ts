import WebSocket from 'ws';
import crypto from 'crypto';
import https from 'https';

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
    const parts = d.toUTCString().split(' ');
    const dayName = parts[0].replace(',', '');
    const day = parts[1];
    const month = parts[2];
    const year = parts[3];
    const time = parts[4];
    return `${dayName} ${month} ${day} ${year} ${time} GMT`;
}

function runSingleTest(variantIndex: number, configMsgBuilder: (requestId: string, timestamp: string, payload: string) => string): Promise<boolean> {
    return new Promise(async (resolve) => {
        console.log(`\n--- Starting Variant ${variantIndex} ---`);
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
        let resolved = false;
        let receivedBinary = 0;

        ws.on('open', () => {
            const configPayload = '{"context":{"system":{"name":"Edge","version":"112.0.1722.39","build":"3ped","lang":"en-US"}},"audio":{"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}';
            const timestamp = getXTimestamp();
            const configMsg = configMsgBuilder(requestId, timestamp, configPayload);
            
            ws.send(configMsg, () => {
                const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
                                    `<voice name='ar-EG-ShakirNeural'>` +
                                    `<prosody rate='+10%' pitch='+0Hz'>مرحباً بك في عالم المساعد الشخصي الرقمي</prosody>` +
                                    `</voice>` +
                                    `</speak>`;
                
                // We also build ssml msg with similar style
                const ssmlMsg = `X-RequestId:${requestId}\r\n` +
                                `X-Timestamp:${timestamp}\r\n` +
                                `Content-Type:application/ssml+xml\r\n` +
                                `Path:ssml\r\n\r\n` +
                                ssmlPayload;
                ws.send(ssmlMsg);
            });
        });

        ws.on('message', (data, isBinary) => {
            if (isBinary) {
                receivedBinary += data.length;
            }
        });

        ws.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                console.log(`Variant ${variantIndex} failed with WebSocket error:`, err.message);
                resolve(false);
            }
        });

        ws.on('close', (code, reason) => {
            if (!resolved) {
                resolved = true;
                const reasonStr = reason.toString();
                console.log(`Variant ${variantIndex} closed: code=${code}, reason=${reasonStr}`);
                if (receivedBinary > 0) {
                    console.log(`🎉 SUCCESS! Variant ${variantIndex} received ${receivedBinary} bytes of audio!`);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });

        // Safe timeout of 5s per variant
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.close();
                console.log(`Variant ${variantIndex} timed out.`);
                resolve(false);
            }
        }, 5000);
    });
}

async function runAll() {
    const variants: ((requestId: string, timestamp: string, payload: string) => string)[] = [
        // Variant 0: Python style, no spaces after colons
        (id, ts, pay) => `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${pay}`,
        
        // Variant 1: Space after colon
        (id, ts, pay) => `X-Timestamp: ${ts}\r\nContent-Type: application/json; charset=utf-8\r\nPath: speech.config\r\n\r\n${pay}`,
        
        // Variant 2: Including X-RequestId, no space after colons
        (id, ts, pay) => `X-RequestId:${id}\r\nX-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${pay}`,
        
        // Variant 3: Including X-RequestId, with space after colons
        (id, ts, pay) => `X-RequestId: ${id}\r\nX-Timestamp: ${ts}\r\nContent-Type: application/json; charset=utf-8\r\nPath: speech.config\r\n\r\n${pay}`,
        
        // Variant 4: Path first, no space after colons
        (id, ts, pay) => `Path:speech.config\r\nContent-Type:application/json; charset=utf-8\r\nX-Timestamp:${ts}\r\n\r\n${pay}`,
        
        // Variant 5: Path first, with space after colons
        (id, ts, pay) => `Path: speech.config\r\nContent-Type: application/json; charset=utf-8\r\nX-Timestamp: ${ts}\r\n\r\n${pay}`,
        
        // Variant 6: Minimal headers
        (id, ts, pay) => `Content-Type:application/json\r\nPath:speech.config\r\n\r\n${pay}`,
        
        // Variant 7: Lowercase header names
        (id, ts, pay) => `x-timestamp:${ts}\r\ncontent-type:application/json; charset=utf-8\r\npath:speech.config\r\n\r\n${pay}`,
    ];

    for (let i = 0; i < variants.length; i++) {
        const success = await runSingleTest(i, variants[i]);
        if (success) {
            console.log(`\nFound working configuration at Variant ${i}!`);
            break;
        }
    }
}

runAll();
