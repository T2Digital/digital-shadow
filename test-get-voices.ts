import https from 'https';

https.get('https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const list = JSON.parse(data);
            const arVoices = list.filter((v: any) => v.Locale.startsWith('ar-') || v.Name.includes('EG'));
            console.log(JSON.stringify(arVoices, null, 2));
        } catch (e: any) {
            console.error("Parse error:", e);
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error("Fetch error:", err);
});
