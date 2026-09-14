import https from 'https';

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

https.get('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=' + TRUSTED_CLIENT_TOKEN, (res) => {
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const list = JSON.parse(data);
            console.log(`Successfully fetched ${list.length} voices!`);
            const arVoice = list.find((v: any) => v.Name.includes('Shakir'));
            console.log("Arabic Shakir Voice:", arVoice);
        } catch (e) {
            console.log("Failed to parse JSON, first 200 chars:", data.substring(0, 200));
        }
    });
}).on('error', err => {
    console.error("HTTP request error:", err);
});
