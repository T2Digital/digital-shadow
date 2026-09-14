import https from 'https';

const url = 'https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/constants.py';

https.get(url, (res) => {
    console.log("Status Code:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("SUCCESS! Fetched length:", data.length);
            console.log(data);
        } else {
            console.log("Failed to fetch constants.py. Trying main branch...");
            const mainUrl = 'https://raw.githubusercontent.com/rany2/edge-tts/main/src/edge_tts/constants.py';
            https.get(mainUrl, (res2) => {
                console.log("Main Status Code:", res2.statusCode);
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    if (res2.statusCode === 200) {
                        console.log("SUCCESS! Fetched length:", data2.length);
                        const lines = data2.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            if (line.includes('mp3') || line.includes('opus') || line.includes('format')) {
                                console.log(`L${i+1}: ${line.trim()}`);
                            }
                        }
                    } else {
                        console.log("Main also failed.");
                    }
                });
            });
        }
    });
}).on('error', err => {
    console.error("Fetch error:", err);
});
