import https from 'https';
import fs from 'fs';

function fetchUrl(url: string, fallbackUrls: string[]) {
    console.log("Attempting fetch of:", url);
    https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log("Redirecting to:", res.headers.location);
            fetchUrl(res.headers.location!, fallbackUrls);
            return;
        }
        
        if (res.statusCode !== 200) {
            console.log(`Failed (Status ${res.statusCode})`);
            if (fallbackUrls.length > 0) {
                fetchUrl(fallbackUrls[0], fallbackUrls.slice(1));
            } else {
                console.log("No more fallback URLs to try.");
            }
            return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log("SUCCESS! Fetched length:", data.length);
            fs.writeFileSync('communicator.py', data);
            console.log("Saved to communicator.py");
        });
    }).on('error', err => {
        console.error("Fetch error:", err);
        if (fallbackUrls.length > 0) {
            fetchUrl(fallbackUrls[0], fallbackUrls.slice(1));
        }
    });
}

const urls = [
    'https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/communicate.py',
    'https://raw.githubusercontent.com/rany2/edge-tts/main/src/edge_tts/communicate.py',
    'https://raw.githubusercontent.com/rany2/edge-tts/master/edge_tts/communicate.py',
    'https://raw.githubusercontent.com/rany2/edge-tts/main/edge_tts/communicate.py',
];

fetchUrl(urls[0], urls.slice(1));


