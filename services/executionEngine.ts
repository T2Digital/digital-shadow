import { shadowDB } from "./dbService";

export const executionEngine = {
    // 1. Binance Service: Real API Call
    getBinancePrice: async (symbol: string, userEmail: string) => {
        try {
            const profile = await shadowDB.getProfile(userEmail);
            const apiKey = profile?.personalKeys?.binanceApiKey;
            const secretKey = profile?.personalKeys?.binanceSecretKey;

            if (!apiKey || !secretKey) {
                return { success: false, message: "مفاتيح بينانس غير متوفرة في API Vault." };
            }

            // Using public endpoint for price just as a demonstration of execution.
            // In a real execution, we would sign the request with HMAC SHA256 using the secretKey
            const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`);
            if (!res.ok) throw new Error("فشل الاتصال بـ Binance");
            
            const data = await res.json();
            return { success: true, message: `سعر ${symbol} الحالي هو ${data.price} USDT` };
        } catch (e: any) {
            console.error("Binance error:", e);
            return { success: false, message: e.message };
        }
    },

    // 2. Vercel Sandbox Deploy Trigger
    deployToVercel: async (projectId: string, userEmail: string) => {
        try {
            const profile = await shadowDB.getProfile(userEmail);
            const token = profile?.personalKeys?.vercelToken;

            if (!token) {
                return { success: false, message: "مفتاح Vercel غير متوفر." };
            }

            const res = await fetch(`https://api.vercel.com/v13/deployments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: projectId || 'shadow-auto-deploy',
                    // This is a minimal sandbox deploy payload
                    files: [
                        { file: 'index.html', data: '<h1>Deployed by Shadow OS</h1>' }
                    ],
                    target: 'production'
                })
            });

            if (!res.ok) throw new Error("مفتاح Vercel غير صالح أو فشل النشر.");
            
            const data = await res.json();
            return { success: true, message: `تم النشر بنجاح! الرابط: ${data.url}` };
        } catch (e: any) {
            console.error("Vercel error:", e);
            return { success: false, message: e.message };
        }
    },

    // 3. GitHub Actions Execution (repository dispatch or commit)
    createGithubIssue: async (repo: string, title: string, body: string, userEmail: string) => {
        try {
            const profile = await shadowDB.getProfile(userEmail);
            const token = profile?.personalKeys?.githubToken;

            if (!token) {
                return { success: false, message: "مفتاح GitHub غير متوفر." };
            }

            const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    body: body + "\n\n---\n*Created by Shadow OS Autonomous Agent*"
                })
            });

            if (!res.ok) throw new Error("فشل الإنشاء، تأكد من صلاحيات مفتاح GitHub.");
            
            const data = await res.json();
            return { success: true, message: `تم إنشاء الـ Issue! الرابط: ${data.html_url}` };
        } catch (e: any) {
            console.error("Github error:", e);
            return { success: false, message: e.message };
        }
    }
};
