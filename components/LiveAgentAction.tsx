import React, { useEffect, useState, useRef } from 'react';
import { Terminal, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { shadowDB, SystemKeys, UserProfile } from '../services/dbService';

interface Props {
    actionType: string;
    args: any;
    userProfile?: UserProfile;
    onComplete?: (resultText: string) => void;
}

const LiveAgentAction: React.FC<Props> = ({ actionType, args, userProfile, onComplete }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error' | 'awaiting_confirmation'>('pending');
    const hasRun = useRef(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        
        if (['auto_deployer', 'crypto_trader', 'social_poster'].includes(actionType)) {
            setStatus('awaiting_confirmation');
            // Do not execute automatically. Wait for user.
        } else {
            executeAction();
        }
    }, [actionType]);

    const handleApprove = () => {
        setStatus('pending');
        executeAction();
    };

    const handleReject = () => {
        setStatus('error');
        addLog("تم إلغاء التنفيذ من قبل المستخدم (Rejected by User).");
        if (onComplete) onComplete("استجابة المنفذ: تم إلغاء التنفيذ بناءً على رغبتك.");
    };

    const executeAction = async () => {
        setStatus('running');
        addLog(`Initializing True Autonomous Mode: [${actionType}]...`);

        try {
            const systemKeys = await shadowDB.getSystemKeys();
            
            // Combine System Keys with User's Personal Keys
            // Personal keys take precedence over System keys
            const keys: any = { ...systemKeys };
            if (userProfile?.personalKeys) {
                if (userProfile.personalKeys.githubToken) keys.githubToken = userProfile.personalKeys.githubToken;
                if (userProfile.personalKeys.vercelToken) keys.vercelToken = userProfile.personalKeys.vercelToken;
                if (userProfile.personalKeys.binanceApiKey) keys.binanceApiKey = userProfile.personalKeys.binanceApiKey;
                if (userProfile.personalKeys.binanceSecretKey) keys.binanceSecretKey = userProfile.personalKeys.binanceSecretKey;
                if (userProfile.personalKeys.metaAccessToken) keys.metaToken = userProfile.personalKeys.metaAccessToken;
            }

            if (!keys.githubToken && !keys.vercelToken && !keys.binanceApiKey && !keys.metaToken) {
                throw new Error("مفاتيح النظام مفقودة. يرجى إضافتها من قائمة مفاتيحي الخاصة (الترس أعلى الشاشة) أو من صفحة الإعدادات.");
            }

            let resultData = "";

            if (actionType === 'auto_deployer') {
                resultData = await deployToGitHubAndVercel(args, keys);
            } else if (actionType === 'crypto_trader') {
                resultData = await executeBinanceTrade(args, keys);
            } else if (actionType === 'social_poster') {
                resultData = await postToMeta(args, keys);
            } else {
                throw new Error(`Unknown action type: ${actionType}`);
            }

            setStatus('success');
            addLog(`\n>> [ACTION TERMINATED] Task Completed Successfully.`);
            
            if (onComplete) {
                setTimeout(() => onComplete(`[${actionType.toUpperCase()}_RESULT]\n${resultData || "تمت العملية بنجاح."}\n\n[INSTRUCTION]: بناءً على هذه النتيجة، أجب المستخدم أو تابع المهمة.`), 500);
            }
        } catch (error: any) {
            setStatus('error');
            const errMsg = error.message || 'Unknown network error';
            addLog(`\n>> [FATAL ERROR] ${errMsg}`);
            addLog(`>> Operation aborted. Check API keys and network CORS constraints.`);
            
            if (onComplete) {
                setTimeout(() => onComplete(`[${actionType.toUpperCase()}_RESULT]\nفشلت العملية. السبب: ${errMsg}\n\n[INSTRUCTION]: أخبر المستخدم بالفشل وسببه.`), 500);
            }
        }
    };

    // --- META LOGIC ---
    const postToMeta = async (args: any, keys: SystemKeys) => {
        if (!keys.metaToken || !keys.metaPageId) throw new Error("Missing Meta Page ID or Access Token.");
        addLog(`Connecting to Meta Graph API for Page: ${keys.metaPageId}...`);
        
        const url = `https://graph.facebook.com/v19.0/${keys.metaPageId}/feed`;
        const params = new URLSearchParams();
        params.append('message', args.message);
        params.append('access_token', keys.metaToken);
        
        addLog(`Executing POST request to Facebook Feed...`);
        const res = await fetch(url, { 
            method: 'POST', 
            headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
            body: params 
        });
        
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        addLog(`Successfully posted! Post ID: ${data.id}`);
        return `Successfully posted! Post ID: ${data.id}`;
    };

    // --- BINANCE LOGIC ---
    const signBinance = async (qs: string, secret: string) => {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, enc.encode(qs));
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const executeBinanceTrade = async (args: any, keys: SystemKeys) => {
        if (!keys.binanceApiKey) throw new Error("Missing Binance API Key.");
        const { action, symbol, amount, price } = args;
        
        addLog(`Connecting to Binance Node... Action: ${action}, Symbol: ${symbol}`);
        
        if(action === 'check_price') {
             const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
             const data = await res.json();
             addLog(`Current price of ${symbol}: ${data.price}`);
             return;
        }

        if (!keys.binanceSecretKey) throw new Error("Missing Binance Secret Key for trading.");

        const side = action.includes('buy') ? 'BUY' : 'SELL';
        const type = action.includes('limit') ? 'LIMIT' : 'MARKET';
        const timestamp = Date.now();
        let qs = `symbol=${symbol}&side=${side}&type=${type}&timestamp=${timestamp}`;

        if (type === 'LIMIT') qs += `&timeInForce=GTC&price=${price}&quantity=${amount}`;
        else qs += `&quantity=${amount}`;

        addLog(`Generating HMAC SHA256 Signature...`);
        const signature = await signBinance(qs, keys.binanceSecretKey);
        const url = `https://api.binance.com/api/v3/order?${qs}&signature=${signature}`;

        addLog(`Executing Order via API...`);
        const res = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': keys.binanceApiKey }});
        const data = await res.json();
        if(data.code && data.msg) throw new Error(`Binance Error: ${data.msg}`);
        addLog(`Order Success! Status: ${data.status}, Order ID: ${data.orderId}`);
        return `Order Success! Status: ${data.status}, Order ID: ${data.orderId}`;
    };

    const deployToGitHubAndVercel = async (args: any, keys: SystemKeys) => {
        if (!keys.githubToken) throw new Error("Missing GitHub Personal Access Token.");
        
        // This tool handles multiple modes: 'create_repo', 'read_file', 'update_file', 'push_files'
        const { mode, repository_name, files, file_path, file_content, force_update } = args;
        const targetFiles = files || []; 
        
        addLog(`Connecting to GitHub API [Mode: ${mode || 'push_files'}]...`);
        const userRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${keys.githubToken}` }});
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(`GitHub Auth Failed: ${userData.message}`);
        const owner = userData.login;
        addLog(`Authenticated as GitHub user: ${owner}`);

        if (mode === 'read_file' && file_path) {
             addLog(`Reading file: ${file_path} from repo: ${repository_name}...`);
             const res = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file_path}`, {
                 headers: { Authorization: `Bearer ${keys.githubToken}` }
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             addLog(`\n[FILE CONTENT EXTRACTED]\nPath: ${file_path}\nSha: ${data.sha}\nSize: ${data.size} bytes`);
             addLog(`Memory Updated. The assistant can now see this file.`);
             
             let decodedContent = '';
             try {
                decodedContent = decodeURIComponent(escape(atob(data.content)));
             } catch(e) {
                decodedContent = atob(data.content);
             }
             return decodedContent;
        }

        if (mode === 'update_file' && file_path && file_content) {
             addLog(`Updating file: ${file_path} in repo: ${repository_name}...`);
             // 1. Get SHA of existing file
             const getRes = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file_path}`, {
                 headers: { Authorization: `Bearer ${keys.githubToken}` }
             });
             const existingData = await getRes.json();
             const sha = getRes.ok ? existingData.sha : undefined;

             // 2. Put new content
             const contentBase64 = btoa(new TextEncoder().encode(file_content).reduce((data, byte) => data + String.fromCharCode(byte), ''));
             const putRes = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file_path}`, {
                 method: 'PUT',
                 headers: { Authorization: `Bearer ${keys.githubToken}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({ 
                    message: force_update ? `Force update ${file_path} via Shadow Agent` : `Update ${file_path} via Shadow Agent`, 
                    content: contentBase64,
                    sha: sha 
                 })
             });
             if (!putRes.ok) throw new Error(`Failed to update file: ${(await putRes.json()).message}`);
             addLog(`Successfully updated: ${file_path}`);
             
             if (keys.vercelToken) await triggerVercel(keys.vercelToken);
             return `Successfully updated: ${file_path}`;
        }

        // --- LEGACY/BATCH REPO CREATION FLOW ---
        addLog(`Checking/Creating Repository: ${repository_name}...`);
        const createRepoRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${keys.githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: repository_name, private: true, auto_init: true }) 
        });
        const repoData = await createRepoRes.json();
        if(!createRepoRes.ok && repoData.message !== 'Repository creation failed.') {
            addLog(`Repository status: ${repoData.message || 'Already exists'}`);
        } else {
            addLog(`Repository initialized successfully.`);
        }

        await new Promise(r => setTimeout(r, 2000));

        if (targetFiles.length > 0) {
            addLog(`Pushing ${targetFiles.length} files to repository...`);
            for (const file of targetFiles) {
                // Get SHA if exists (to allow overwrite)
                const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file.path}`, {
                    headers: { Authorization: `Bearer ${keys.githubToken}` }
                });
                const checkData = await checkRes.json();
                
                const contentBase64 = btoa(new TextEncoder().encode(file.content).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                const putRes = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file.path}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${keys.githubToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: `Add ${file.path} via Shadow Agent`, 
                        content: contentBase64,
                        sha: checkRes.ok ? checkData.sha : undefined 
                    })
                });
                const data = await putRes.json();
                if(!putRes.ok) addLog(`File path [${file.path}] response: ${data.message}`);
                else addLog(`Successfully pushed: ${file.path}`);
            }
        }

        if (keys.vercelToken) await triggerVercel(keys.vercelToken);
        addLog(`Check your GitHub account for the '${repository_name}' repository!`);
        return `Deployment finished! Check your GitHub account for '${repository_name}'.`;
    };

    const triggerVercel = async (token: string) => {
        addLog(`Triggering Vercel Hook/Deployment...`);
        if (token.includes('http')) {
            const hookRes = await fetch(token, { method: 'POST' });
            addLog(`Vercel Hook signal sent: HTTP ${hookRes.status}`);
        } else {
            addLog(`Note: Add Vercel Deploy Hook URL to system keys, or link GH repo directly in Vercel.`);
        }
    };

    return (
        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 my-2 font-mono shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{actionType}</span>
                <div className="flex-1"></div>
                {status === 'running' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            </div>
            
            {status === 'awaiting_confirmation' && (
                <div className="bg-[#0f0f0f] border border-purple-500/30 rounded-xl p-4 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.15)] font-['Cairo'] text-right" dir="rtl">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        مطلوب تأكيد المهندس/المدير
                    </h3>
                    <p className="text-xs text-white/70 mb-4 whitespace-normal font-sans">
                        أنا جاهز لتنفيذ هذه العملية الحساسة ({actionType}). هل تريدني أن أنفذ الآن فوراً؟
                    </p>
                    <div className="flex bg-[#1a1a1a] rounded-lg p-3 text-[10px] text-white/50 mb-4 truncate text-left" dir="ltr">
                        {JSON.stringify(args).substring(0, 50)}...
                    </div>
                    <div className="flex justify-end gap-3 font-sans">
                        <button onClick={handleReject} className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all text-xs font-bold">
                            تجاهل
                        </button>
                        <button onClick={handleApprove} className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all font-bold text-xs shadow-lg shadow-emerald-900/30">
                            صادق على التنفيذ
                        </button>
                    </div>
                </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1 text-[11px] leading-relaxed custom-scrollbar text-left" dir="ltr">
                {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-emerald-500/80'}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveAgentAction;
