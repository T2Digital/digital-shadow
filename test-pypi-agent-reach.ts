import https from 'https';

const packageName = 'agent-reach';

https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
    console.log("Status Code:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const info = JSON.parse(data);
                console.log("NPM Package Info found!");
                console.log("Name:", info.name);
                console.log("Description:", info.description);
                
                // Get latest version readme
                const latestVersion = info['dist-tags'].latest;
                console.log("Latest Version:", latestVersion);
                const latestInfo = info.versions[latestVersion];
                
                console.log("Readme:", info.readme ? info.readme.substring(0, 3000) : "No readme found");
            } catch (e) {
                console.log("Parse error:", e);
            }
        } else {
            console.log(`Package not found on NPM. Code: ${res.statusCode}`);
        }
    });
}).on('error', err => {
    console.error("Request Error:", err);
});
