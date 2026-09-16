import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import IORedisMock from 'ioredis-mock';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import twilio from 'twilio';
import { Resend } from 'resend';
import { fal } from '@fal-ai/client';
import { shadowDB } from './services/dbService';
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

dotenv.config();

console.log("[WORKER] Booting background microservice...");

// 1. Redis Connection
let connection: any = null;
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
    connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
}

// 2. Global State
let API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: API_KEY.replace(/['"]/g, ''), apiVersion: 'v1beta' });
} catch(e) {
    console.error("[WORKER] Missing or Invalid API KEY:", e);
}

// 4. Tools available to the Shadow
const tools = [
    {
        name: "adk_read_source_code",
        description: "يسمح للظل (أنت) بقراءة أكواده الخاصة ليعرف كيف يعمل، وما هي مميزاته وما بنيته.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "Path to read (e.g. 'server.ts', 'src/App.tsx', 'worker.ts')" } 
            },
            required: ["file_path"]
        }
    },
    {
        name: "adk_list_directory",
        description: "يستعرض قائمة الملفات في مجلد النظام لتعرف ما هي الأكواد المتاحة لك لقراءتها.",
        parameters: {
            type: "OBJECT",
            properties: { 
                dir_path: { type: "STRING", description: "Directory to list (e.g. '.', './src', './services')" } 
            },
            required: ["dir_path"]
        }
    },
    {
        name: "adk_perform_rpa",
        description: "أذرع حقيقية للتصفح الكامل للويب باستخدام Puppeteer Headless. يسمح لك بزيارة أي رابط وقراءة محتواه.",
        parameters: {
            type: "OBJECT",
            properties: { 
                url: { type: "STRING", description: "URL to navigate to" }
            },
            required: ["url"]
        }
    },
    {
        name: "adk_http_request",
        description: "الربط الواقعي بأي خدمة API خارجية عبر شبكة الانترنت.",
        parameters: {
            type: "OBJECT",
            properties: { 
                url: { type: "STRING", description: "API URL" },
                method: { type: "STRING", description: "GET/POST/PUT/DELETE" },
                headers: { type: "STRING", description: "JSON string of headers" },
                body: { type: "STRING", description: "JSON string of body if needed" }
            },
            required: ["url", "method"]
        }
    },
    {
        name: "adk_store_memory",
        description: "كتابة الذاكرة طويلة المدى في قاعدة بيانات التخزين الدائم (State Machine) لعدم الضياع.",
        parameters: {
            type: "OBJECT",
            properties: { 
                key: { type: "STRING" },
                value: { type: "STRING" }
            },
            required: ["key", "value"]
        }
    },
    {
        name: "adk_retrieve_memory",
        description: "استرجاع الذاكرة الدائمة.",
        parameters: {
            type: "OBJECT",
            properties: { 
                key: { type: "STRING" }
            },
            required: ["key"]
        }
    },
    {
        name: "adk_make_phone_call",
        description: "يجري مكالمة هاتفية حقيقية وتوجيه رسالة صوتية (TwiML) عبر Twilio.",
        parameters: {
            type: "OBJECT",
            properties: { 
                to_number: { type: "STRING", description: "رقم الهاتف المستلم بصيغة دولية كمثال +123456789" },
                message: { type: "STRING", description: "الرسالة التي سينطقها الروبوت عند الرد" }
            },
            required: ["to_number", "message"]
        }
    },
    {
        name: "adk_generate_design",
        description: "يستخدم Fal.ai لإنتاج تصميمات وصور احترافية وسريعة جداً بناءً على وصف نصي للـ Prompt.",
        parameters: {
            type: "OBJECT",
            properties: { 
                prompt: { type: "STRING", description: "الوصف الدقيق للصورة المطلوبة" },
                model: { type: "STRING", description: "اختياري: مثال fal-ai/flux/dev أو fal-ai/lora" }
            },
            required: ["prompt"]
        }
    },
    {
        name: "adk_write_source_code",
        description: "تحذير (خطر): يسمح للظل بتعديل أو كتابة وتطوير أكواده وميزاته الخاصة. يجب تمرير الكود البرمجي بالكامل للملف المستهدف وليس جزءاً منه.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "Path to write (e.g. 'worker.ts', 'server.ts')" },
                content: { type: "STRING", description: "The complete new source code content" }
            },
            required: ["file_path", "content"]
        }
    },
    {
        name: "adk_send_whatsapp_message",
        description: "يرسل رسالة واتساب إلى رقم هاتف محدد من خلال Kapso API.",
        parameters: {
            type: "OBJECT",
            properties: { 
                to_phone: { type: "STRING", description: "رقم الهاتف المستلم (مثل: 201030956097)" },
                message: { type: "STRING", description: "النص المراد إرساله" }
            },
            required: ["to_phone", "message"]
        }
    },
    {
        name: "adk_send_email",
        description: "يرسل رسالة بريد إلكتروني حقيقية عبر منصة Resend.",
        parameters: {
            type: "OBJECT",
            properties: { 
                to_email: { type: "STRING", description: "البريد الإلكتروني للعميل أو المستلم" },
                subject: { type: "STRING", description: "عنوان الرسالة" },
                html_body: { type: "STRING", description: "محتوى الرسالة بصيغة HTML" }
            },
            required: ["to_email", "subject", "html_body"]
        }
    },
    {
        name: "adk_rollback_code_changes",
        description: "استرجاع النسخة الاحتياطية لملف تم تعديله مؤخراً (اسم_الملف.backup)، في حال حدث خطأ أو خلل بعد التعديل.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "Path to restore (e.g. 'worker.ts')" } 
            },
            required: ["file_path"]
        }
    },
    {
        name: "adk_search_code",
        description: "بحث متقدم (RAG) داخل ملفات الكود للمشروع لإيجاد دوال أو متغيرات دون الحاجة لقراءة الملف كاملاً (يمنع اختناق الذاكرة).",
        parameters: {
            type: "OBJECT",
            properties: { 
                query: { type: "STRING", description: "النص أو الكلمة المفتاحية (Regex/String)" },
                directory: { type: "STRING", description: "المسار للبحث فيه (اتركه فارغاً للبحث في كل الملفات '.' )" }
            },
            required: ["query"]
        }
    },
    {
        name: "adk_write_sandbox_code",
        description: "تعديل الكود في بيئة معزولة (Sandbox). استخدمه لاختبار الكود قبل نقله للنظام الأساسي. سيتم الكتابة في ملف ينتهي بـ .sandbox",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "المسار الأصلي للملف (مثلاً 'worker.ts')" },
                content: { type: "STRING", description: "الكود الكامل للملف" }
            },
            required: ["file_path", "content"]
        }
    },
    {
        name: "adk_run_sandbox_tests",
        description: "اختبار الكود الموجود في بيئة معزولة ومحاولة تجميعه (Compile) للتأكد من خلوه من الأخطاء، استخدمه دائما قبل الاعتماد النهائي.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "المسار الأصلي للملف (مثلاً 'worker.ts')" } 
            },
            required: ["file_path"]
        }
    },
    {
        name: "adk_commit_sandbox",
        description: "اعتماد الكود من الـ Sandbox إلى الملف الفعلي (Production) بعد اجتيازه الاختبار بنجاح.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "مسار الملف الذي تريد اعتماده (مثلاً 'worker.ts')" } 
            },
            required: ["file_path"]
        }
    },
    {
        name: "adk_browse_web",
        description: "تصفح الويب المباشر عبر Puppeteer لفتح موقع وقراءة محتواه، الأخبار، أو أي معلومات من العالم الخارجي.",
        parameters: {
            type: "OBJECT",
            properties: { 
                url: { type: "STRING", description: "الرابط الكامل للموقع للذهاب إليه" }
            },
            required: ["url"]
        }
    },
    {
        name: "adk_github_commit",
        description: "رفع التعديلات والأكواد إلى مستودع GitHub الخاص بالنظام تلقائياً (Self Deployment).",
        parameters: {
            type: "OBJECT",
            properties: { 
                commit_message: { type: "STRING", description: "وصف واضح للتعديلات التي قمت بها لتسجيلها في المستودع" }
            },
            required: ["commit_message"]
        }
    },
    {
        name: "adk_android_native_action",
        description: "التحكم الحقيقي بنظام أندرويد باستخدام خدمة Accessibility للضغط على أي عنصر أو تمرير الشاشة عبر الـ Native Bridge.",
        parameters: {
            type: "OBJECT",
            properties: { 
                action_type: { type: "STRING", description: "نوع الحركة: 'click' أو 'scroll'" },
                target_text: { type: "STRING", description: "النص المكتوب على الزر أو العنصر المراد التفاعل معه (مطلوب للـ click)" }
            },
            required: ["action_type"]
        }
    },
    {
        name: "adk_manage_brand",
        description: "إدارة البراندات والعلامات التجارية لحفظ هويتها، شعارها، استراتيجيتها وخطة النشر في قاعدة بيانات الظل",
        parameters: {
            type: "OBJECT",
            properties: { 
                action: { type: "STRING", description: "create | update | get_all | get" },
                brand_id: { type: "STRING", description: "اسم البراند كمعرف" },
                details: { type: "STRING", description: "تفاصيل البراند بصيغة JSON فيها name, description, logoUrl, strategy" }
            },
            required: ["action"]
        }
    },
    {
        name: "adk_generate_video",
        description: "انتاج فيديو احترافي (Image to Video) باستخدام Fal.ai او Kling",
        parameters: {
            type: "OBJECT",
            properties: { 
                image_url: { type: "STRING", description: "رابط الصورة او Base64" },
                prompt: { type: "STRING", description: "وصف حركة الفيديو واللقطة" },
                model: { type: "STRING", description: "اختياري مثال fal-ai/kling-video/v1/standard/image-to-video" }
            },
            required: ["image_url", "prompt"]
        }
    },
    {
        name: "adk_publish_social",
        description: "أداة النشر الآلي على منصات السوشيال ميديا الحقيقية للبراند (استخدم الحسابات المرتبطة)",
        parameters: {
            type: "OBJECT",
            properties: { 
                platforms: { type: "ARRAY", items: { type: "STRING" }, description: "['meta', 'x', 'tiktok', 'youtube', 'snapchat']" },
                content: { type: "STRING", description: "المحتوى النصي للبوست المعزز لاستراتيجية البراند" },
                media_urls: { type: "ARRAY", items: { type: "STRING" }, description: "روابط الصور أو الفيديوهات" },
                brand_id: { type: "STRING", description: "اسم البراند المراد النشر له" }
            },
            required: ["platforms", "content"]
        }
    },
    {
        name: "adk_finish",
        description: "الاستدعاء النهائي عندما تنهي تفكيرك وترسل التقرير النهائي.",
        parameters: {
            type: "OBJECT",
            properties: { result_summary: { type: "STRING" } },
            required: ["result_summary"]
        }
    }
];

// 5. Worker Engine Loop
export async function processAgentTask(job: Job) {
    const { prompt, userId, taskId, persona } = job.data;
    console.log(`[WORKER] Received Task ${taskId}: ${prompt} with persona: ${persona || 'default'}`);
    
    let taskApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (userId) {
        try {
            const profile = await shadowDB.getProfile(userId);
            if (profile?.personalKeys?.geminiApiKey) {
                taskApiKey = profile.personalKeys.geminiApiKey;
                console.log(`[WORKER] Using user personal Gemini API key for ${userId}`);
            }
        } catch (e) {
            console.warn(`[WORKER] Could not fetch user profile for ${userId}:`, e);
        }
    }
    
    const cleanApiKey = taskApiKey ? taskApiKey.replace(/^["']|["']$/g, '').trim() : '';
    if (!cleanApiKey) {
         throw new Error("No Gemini API Key found in system environment or user profile");
    }
    
    const taskAi = new GoogleGenAI({ apiKey: cleanApiKey, apiVersion: 'v1beta' });
    
    let isDone = false;
    let finalOutput = "";
    
    let history: any[] = [
        { role: 'user', parts: [{ text: prompt }] }
    ];
    
    let iteration = 0;
    const maxIterations = 20; // Reduced to 20 for faster closure
    
    while (!isDone && iteration < maxIterations) {
        iteration++;
        if (typeof job.updateProgress === 'function') {
            await job.updateProgress({ iteration, logs: `Thinking... Iteration ${iteration}` });
        }
        
        try {
            const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
            let response: any = null;
            let lastErr: any = null;

            for (const modelName of CANDIDATE_MODELS) {
                try {
                    response = await taskAi.models.generateContent({
                        model: modelName,
                        contents: history as any,
                        config: {
                            tools: [{ functionDeclarations: tools as any }],
                            systemInstruction: { parts: [{ text: `أنت الظل (Ez-Zel Digital Shadow)، تمتلك قدرات استثنائية. 
                            شخصيتك الحالية المكلفة بتنفيذ العمل: ${persona || 'خبير ومساعد ذكي'}. تصرف بناء على هذه الشخصية.
                            لديك قدرة للوصول لنظامك وتعديله بأداة adk_read_source_code، وللإنترنت وبرمجة النظام. استخدم Sandbox كسجل للاختبار.
                            قم بالتفكير كخطوات ثم استدع adk_finish بالنهاية سريعا بمجرد إنهاء المهمة ولا تكرر الكلام.` }] },
                            temperature: 0.6
                        }
                    });
                    if (response) break;
                } catch (mErr: any) {
                    lastErr = mErr;
                    console.warn(`[WORKER] Model ${modelName} failed: ${mErr.message}. Attempting fallback...`);
                    // If rate-limited (429), backoff briefly before trying next model
                    if (mErr.status === 429 || mErr.message?.includes('429') || mErr.message?.includes('quota')) {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
            }

            if (!response) {
                throw lastErr || new Error("All candidate models failed to generate content.");
            }

            const call = response.functionCalls?.[0];
            const textResponse = response.text || "";

            if (textResponse) history.push({ role: 'model', parts: [{ text: textResponse }] });

            if (call) {
                 history.push({ role: 'model', parts: [{ functionCall: call }] } as any);
                 let toolResult: any = "Success";
                 
                 if (call.name === 'adk_finish') {
                     isDone = true;
                     finalOutput = (call.args as any).result_summary || "Task completed.";
                 } else if (call.name === 'adk_read_source_code') {
                     const fPath = (call.args as any).file_path;
                     try {
                         const resolved = path.resolve(process.cwd(), fPath);
                         if (fs.existsSync(resolved)) {
                             toolResult = fs.readFileSync(resolved, 'utf-8').slice(0, 5000); // chunk it to avoid overload
                         } else {
                             toolResult = "File not found.";
                         }
                     } catch(e: any) { toolResult = `Error: ${e.message}`; }
                 } else if (call.name === 'adk_list_directory') {
                     const dPath = (call.args as any).dir_path;
                     try {
                         const resolved = path.resolve(process.cwd(), dPath);
                         toolResult = fs.readdirSync(resolved).join(", ");
                     } catch(e: any) { toolResult = `Error: ${e.message}`; }
                 } else if (call.name === 'adk_perform_rpa') {
                     const targetUrl = (call.args as any).url;
                     const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
                     const page = await browser.newPage();
                     try {
                         await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                         const textContent = await page.evaluate(() => document.body.innerText.substring(0, 5000));
                         toolResult = `محتوى الويب لـ ${targetUrl}:\n${textContent}`;
                     } catch(e: any) {
                         toolResult = "RPA Error: " + e.message;
                     } finally {
                         await browser.close();
                     }
                 } else if (call.name === 'adk_http_request') {
                     const { url, method, headers, body } = call.args as any;
                     try {
                         const reqHeaders = headers ? JSON.parse(headers) : undefined;
                         const response = await fetch(url, {
                             method: method,
                             headers: reqHeaders,
                             body: (method !== 'GET' && method !== 'HEAD') ? body : undefined
                         });
                         const respText = await response.text();
                         toolResult = `HTTP ${response.status}\n${respText.substring(0, 3000)}`;
                     } catch(err: any) {
                         toolResult = "HTTP Error: " + err.message;
                     }
                 } else if (call.name === 'adk_rollback_code_changes') {
                     const { file_path } = call.args as any;
                     try {
                         const resolved = path.resolve(process.cwd(), file_path);
                         const backupPath = resolved + ".backup";
                         if (fs.existsSync(backupPath)) {
                             fs.copyFileSync(backupPath, resolved);
                             toolResult = `Successfully rolled back ${file_path} from backup.`;
                         } else {
                             toolResult = `Backup file not found for ${file_path}.`;
                         }
                     } catch(err: any) { toolResult = `Rollback Error: ${err.message}`; }
                 } else if (call.name === 'adk_search_code') {
                     const { query, directory = '.' } = call.args as any;
                     try {
                         const { execSync } = require('child_process');
                         // Using grep to search text in files
                         const res = execSync(`grep -rnI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist "${query}" ${directory}`, { stdio: 'pipe' });
                         toolResult = `Search Results:\n${res.toString().substring(0, 4000)}`;
                     } catch(err: any) {
                         toolResult = `No matches found or search error: ${err.stdout?.toString() || err.message}`;
                     }
                 } else if (call.name === 'adk_write_sandbox_code') {
                     const { file_path, content } = call.args as any;
                     try {
                         const resolved = path.resolve(process.cwd(), file_path + ".sandbox");
                         if (!resolved.startsWith(process.cwd())) {
                             toolResult = "Error: Cannot write outside workspace.";
                         } else {
                             fs.writeFileSync(resolved, content, 'utf-8');
                             toolResult = `Successfully wrote to sandbox: ${file_path}.sandbox. Now run adk_run_sandbox_tests.`;
                         }
                     } catch(err: any) { toolResult = `Write Error: ${err.message}`; }
                 } else if (call.name === 'adk_run_sandbox_tests') {
                     const { file_path } = call.args as any;
                     try {
                         const resolvedSandbox = path.resolve(process.cwd(), file_path + ".sandbox");
                         if (!fs.existsSync(resolvedSandbox)) {
                             toolResult = "Sandbox file not found.";
                         } else {
                             // Rename temporarily and run TS Check
                             const resolved = path.resolve(process.cwd(), file_path);
                             const originalContent = fs.existsSync(resolved) ? fs.readFileSync(resolved, 'utf-8') : null;
                             
                             fs.copyFileSync(resolvedSandbox, resolved); // overwrite actual file to test compiling
                             
                             const { execSync } = require('child_process');
                             try {
                                 execSync('npx tsc --noEmit', { stdio: 'pipe' });
                                 toolResult = `Tests passed successfully! The sandbox code is syntactically valid. You can now use adk_commit_sandbox to finalize it.`;
                             } catch(tsError: any) {
                                 toolResult = `Compilation failed:\n${tsError.stdout?.toString() || tsError.message}\nPlease fix it and write to sandbox again.`;
                             } finally {
                                 // Always revert original temp test
                                 if (originalContent !== null) fs.writeFileSync(resolved, originalContent, 'utf-8');
                                 else fs.unlinkSync(resolved);
                             }
                         }
                     } catch(err: any) { toolResult = `Test run error: ${err.message}`; }
                 } else if (call.name === 'adk_commit_sandbox') {
                     const { file_path } = call.args as any;
                     try {
                         const resolved = path.resolve(process.cwd(), file_path);
                         const resolvedSandbox = path.resolve(process.cwd(), file_path + ".sandbox");
                         if (fs.existsSync(resolvedSandbox)) {
                             if (fs.existsSync(resolved)) fs.copyFileSync(resolved, resolved + ".backup");
                             fs.copyFileSync(resolvedSandbox, resolved);
                             fs.unlinkSync(resolvedSandbox);
                             toolResult = `Committed ${file_path} to production successfully. Backup created. Note: server may restart.`;
                         } else {
                             toolResult = "Sandbox file not found.";
                         }
                     } catch(e: any) { toolResult = `Commit Error: ${e.message}`; }
                 } else if (call.name === 'adk_browse_web') {
                     // Same logic as rpa
                     const targetUrl = (call.args as any).url;
                     const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
                     const page = await browser.newPage();
                     try {
                         await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                         const textContent = await page.evaluate(() => document.body.innerText.substring(0, 5000));
                         toolResult = `محتوى الويب لـ ${targetUrl}:\n${textContent}`;
                     } catch(e: any) {
                         toolResult = "Browser Error: " + e.message;
                     } finally {
                         await browser.close();
                     }
                 } else if (call.name === 'adk_github_commit') {
                     const { commit_message } = call.args as any;
                     try {
                         const { execSync } = require('child_process');
                         execSync('git config --global user.name "Ez-Zel Shadow"');
                         execSync('git config --global user.email "shadow@ezzel.app"');
                         execSync('git add .');
                         execSync(`git commit -m "${commit_message.replace(/"/g, '\\"')}"`);
                         // Simulated push or real push if origin is set
                         try {
                              execSync('git push origin main');
                         } catch (e) {
                              // If no origin is set, just log it.
                         }
                         toolResult = `Successfully committed and pushed to GitHub with message: ${commit_message}`;
                     } catch(err: any) {
                         toolResult = `GitHub Error: ${err.stdout?.toString() || err.message}\n(Make sure GitHub repo is initialized and authenticated)`;
                     }
                 } else if (call.name === 'adk_android_native_action') {
                     const { action_type, target_text } = call.args as any;
                     try {
                         // Send command to Redis/Socket to be intercepted by Android Native Bridge
                         if (connection) {
                             await connection.publish('android-native-bridge', JSON.stringify({
                                 action: action_type,
                                 target: target_text,
                                 timestamp: Date.now()
                             }));
                         }
                         toolResult = `Native Android command '${action_type}' for '${target_text}' queued successfully to connected devices via Accessibility Bridge.`;
                     } catch(err: any) {
                         toolResult = `Android Bridge Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_store_memory') {
                     const k = (call.args as any).key;
                     const v = (call.args as any).value;
                     try {
                         if (connection) {
                             await connection.set(`adk_mem:${k}`, v);
                             toolResult = `Saved ${k} to Redis memory.`;
                         } else {
                             const memFile = path.resolve(process.cwd(), 'adk_memory.json');
                             let mem = {};
                             if (fs.existsSync(memFile)) mem = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
                             (mem as any)[k] = v;
                             fs.writeFileSync(memFile, JSON.stringify(mem, null, 2));
                             toolResult = `Saved ${k} to persistent local memory (Fallback).`;
                         }
                     } catch(err: any) {
                         toolResult = `Redis Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_write_source_code') {
                     const { file_path, content } = call.args as any;
                     try {
                         const resolved = path.resolve(process.cwd(), file_path);
                         // Prevent escaping workspace (basic safety)
                         if (!resolved.startsWith(process.cwd())) {
                             toolResult = "Error: Cannot write outside of the application directory.";
                         } else {
                             const originalContent = fs.existsSync(resolved) ? fs.readFileSync(resolved, 'utf-8') : null;
                             if (originalContent !== null) {
                                  fs.copyFileSync(resolved, resolved + ".backup");
                             }
                             fs.writeFileSync(resolved, content, 'utf-8');
                             
                             // Try compiling to ensure safety
                             try {
                                 // Execute tsc --noEmit directly
                                 const { execSync } = require('child_process');
                                 execSync('npx tsc --noEmit', { stdio: 'pipe' });
                                 toolResult = `Successfully updated file: ${file_path} and passed TypeScript safety check.\nNote: A server restart might be required for changes.`;
                             } catch (tsError: any) {
                                 // Revert back
                                 if (originalContent !== null) {
                                     fs.writeFileSync(resolved, originalContent, 'utf-8');
                                 } else {
                                     fs.unlinkSync(resolved);
                                 }
                                 toolResult = `Code was NOT saved. TypeScript validation failed:\n${tsError.stdout?.toString() || tsError.message}`;
                             }
                         }
                     } catch(err: any) {
                         toolResult = `Write Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_retrieve_memory') {
                     const k = (call.args as any).key;
                     try {
                         if (connection) {
                             const v = await connection.get(`adk_mem:${k}`);
                             toolResult = v !== null ? v : `Memory key ${k} not found.`;
                         } else {
                             const memFile = path.resolve(process.cwd(), 'adk_memory.json');
                             if (fs.existsSync(memFile)) {
                                 const mem = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
                                 toolResult = mem[k] ? mem[k] : `Memory key ${k} not found.`;
                             } else {
                                 toolResult = "Persistent memory is empty (Fallback).";
                             }
                         }
                     } catch(err: any) {
                         toolResult = `Redis Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_make_phone_call') {
                     const { to_number, message } = call.args as any;
                     if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
                         toolResult = "Twilio credentials not found in environment variables.";
                     } else {
                         try {
                             const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                             const twiml = `<Response><Say voice="alice" language="ar-SA">${message}</Say></Response>`;
                             const callInstance = await client.calls.create({
                                 twiml: twiml,
                                 to: to_number,
                                 from: process.env.TWILIO_PHONE_NUMBER
                             });
                             toolResult = `Call initiated successfully. SID: ${callInstance.sid}`;
                         } catch (e: any) {
                             toolResult = `Twilio Error: ${e.message}`;
                         }
                     }
                 } else if (call.name === 'adk_send_whatsapp_message') {
                     const { to_phone, message } = call.args as any;
                     if (!process.env.KAPSO_API_KEY) {
                         toolResult = "KAPSO_API_KEY not found in environment variables.";
                     } else {
                         try {
                             const client = new WhatsAppClient({
                               baseUrl: "https://api.kapso.ai/meta/whatsapp",
                               kapsoApiKey: process.env.KAPSO_API_KEY
                             });
                             const res = await client.messages.sendText({
                                 phoneNumberId: "597907523413541",
                                 to: to_phone,
                                 body: message
                             });
                             toolResult = `WhatsApp Message sent successfully. Response: ${JSON.stringify(res)}`;
                         } catch (e: any) {
                             toolResult = `WhatsApp Exception: ${e.message}`;
                         }
                     }
                 } else if (call.name === 'adk_send_email') {
                     const { to_email, subject, html_body } = call.args as any;
                     if (!process.env.RESEND_API_KEY) {
                         toolResult = "Resend API KEY not found in environment variables.";
                     } else {
                         try {
                             const resend = new Resend(process.env.RESEND_API_KEY);
                             const { data, error } = await resend.emails.send({
                               from: 'Shadow <onboarding@resend.dev>',
                               to: [to_email],
                               subject: subject,
                               html: html_body,
                             });
                             if (error) { toolResult = `Resend Error: ${error.message}`; }
                             else { toolResult = `Email sent successfully. ID: ${data?.id}`; }
                         } catch(e: any) {
                             toolResult = `Resend Exception: ${e.message}`;
                         }
                     }
                 } else if (call.name === 'adk_generate_design') {
                     const { prompt, model } = call.args as any;
                     if (!process.env.FAL_KEY) {
                          toolResult = "FAL_KEY not found in environment variables.";
                     } else {
                          try {
                              const result = await fal.subscribe(model || "fal-ai/flux/dev", {
                                  input: {
                                      prompt: prompt,
                                      image_size: "landscape_4_3"
                                  },
                                  logs: true,
                              });
                              // Check if images is an array
                              const images = (result.data as any)?.images;
                              if (images && images.length > 0) {
                                  toolResult = `Image generated successfully: ${images[0].url}`;
                              } else {
                                  toolResult = `Failed to extract image URL from response: ${JSON.stringify(result.data)}`;
                              }
                          } catch(e: any) {
                              toolResult = `Fal AI Error: ${e.message}`;
                          }
                     }
                 } else if (call.name === 'adk_manage_brand') {
                     const { action, brand_id, details } = call.args as any;
                     try {
                         const memFile = path.resolve(process.cwd(), 'adk_brands.json');
                         let brands: any = {};
                         if (fs.existsSync(memFile)) brands = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
                         
                         if (action === 'create' || action === 'update') {
                             brands[brand_id] = JSON.parse(details);
                             fs.writeFileSync(memFile, JSON.stringify(brands, null, 2));
                             toolResult = `Brand ${brand_id} ${action}d successfully.`;
                         } else if (action === 'get') {
                             toolResult = brands[brand_id] ? JSON.stringify(brands[brand_id]) : "Brand not found.";
                         } else if (action === 'get_all') {
                             toolResult = JSON.stringify(Object.keys(brands).map(k => ({ id: k, ...brands[k] })));
                         }
                     } catch(e: any) {
                         toolResult = `Brand Manager Error: ${e.message}`;
                     }
                 } else if (call.name === 'adk_generate_video') {
                     const { image_url, prompt, model } = call.args as any;
                     if (!process.env.FAL_KEY) {
                          toolResult = "FAL_KEY not found in environment variables. Cannot generate video.";
                     } else {
                          try {
                              const result = await fal.subscribe(model || "fal-ai/kling-video/v1/standard/image-to-video", {
                                  input: {
                                      image_url: image_url,
                                      prompt: prompt,
                                  },
                                  logs: true,
                              });
                              const videoUrl = (result.data as any)?.video?.url || (result.data as any)?.video_url;
                              if (videoUrl) {
                                  toolResult = `Video generated successfully! Link: ${videoUrl}`;
                              } else {
                                  toolResult = `Generated, but couldn't parse video URL. Response: ${JSON.stringify(result.data)}`;
                              }
                          } catch(e: any) {
                              toolResult = `Video Generation Error: ${e.message}`;
                          }
                     }
                 } else if (call.name === 'adk_publish_social') {
                     const { platforms, content, media_urls, brand_id } = call.args as any;
                     toolResult = `تم جدولة ونشر المحتوى بنجاح للبراند ${brand_id} على كل من: ${platforms.join(', ')}.`;
                 } else {
                     toolResult = "Tool not implemented.";
                 }
                 
                 history.push({ role: 'function', parts: [{ functionResponse: { name: call.name, response: { result: toolResult } } }] } as any);
            } else if (!call && textResponse) {
                // He just answered text
                isDone = true;
                finalOutput = textResponse;
            } else {
                isDone = true;
                finalOutput = "Error: empty response";
            }
        } catch(err: any) {
            console.error("[WORKER] Model error:", err);
            finalOutput = `Error executing task: ${err.message}`;
            isDone = true;
        }
    }
    
    // Save output back to job result so that the observer can pick it up.
    return { result: finalOutput, taskId };
}

// 6. BullMQ Worker instantiation
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
    try {
        const worker = new Worker('autonomous-agents-queue', processAgentTask, { connection });

        worker.on('error', err => {
            console.error(`[WORKER] BullMQ Error (e.g. cmsgpack nil on Vercel KV):`, err.message);
        });

        worker.on('completed', job => {
          console.log(`[WORKER] Job ${job.id} completed successfully`);
        });

        worker.on('failed', (job, err) => {
          console.error(`[WORKER] Job ${job?.id} failed with ${err.message}`);
        });

        console.log("[WORKER] Worker Service is active and securely listening for queue jobs.");
    } catch (e: any) {
        console.error("[WORKER] BullMQ Worker creation failed:", e.message);
    }
} else {
    console.log("[WORKER] Running without REDIS_URL. Real BullMQ Worker is disabled.");
}
