import { getAI } from "./geminiService";
import { DBMessage, shadowDB, DBTask } from "./dbService";
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppStore } from "./store";
import { showSafeNotification } from "./notificationService";

export interface AutonomousTask {
    id: string;
    userId: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    createdAt: number;
    updatedAt: number;
}

const activeTasks: Record<string, boolean> = {};

export const getActiveTasksCount = () => Object.keys(activeTasks).length;

/**
 * ADK Engine (Agent Development Kit Core)
 * A real autonomous loop: Think -> Act -> Observe -> Reflect
 */
class ADKEngine {
    private userId: string;
    private maxIterations: number;

    constructor(userId: string, maxIterations = 8) {
        this.userId = userId;
        this.maxIterations = maxIterations;
    }

    async run(prompt: string): Promise<string> {
        let history = [
            { role: 'user', parts: [{ text: prompt + " \n\n[ADK DIRECTIVE]: You are a fully autonomous ADK Agent. Perform the needed tasks step by step using your tools. Be factual. Output your final report at the end in Arabic." }] }
        ];

        let iteration = 0;
        let isDone = false;
        let finalOutput = "";

        const ai = getAI();
        const profile = await shadowDB.getProfile(this.userId);

        const tools = [
            {
                name: "adk_wikipedia_search",
                description: "Search Wikipedia for real-world information and facts.",
                parameters: {
                    type: "OBJECT",
                    properties: { query: { type: "STRING" }, lang: { type: "STRING", description: "Language code (e.g., 'ar' or 'en')" } },
                    required: ["query"]
                }
            },
            {
                name: "adk_get_weather",
                description: "Get current weather for a city.",
                parameters: {
                    type: "OBJECT",
                    properties: { city: { type: "STRING" } },
                    required: ["city"]
                }
            },
            {
                name: "adk_read_user_memory",
                description: "Recall facts or preferences about the user from their long term memory.",
                parameters: {
                    type: "OBJECT",
                    properties: { topic: { type: "STRING" } },
                    required: ["topic"]
                }
            },
            {
                name: "adk_add_user_task",
                description: "Add a task or reminder to the user's todo list.",
                parameters: {
                    type: "OBJECT",
                    properties: { title: { type: "STRING" }, category: { type: "STRING" } },
                    required: ["title"]
                }
            },
            {
                name: "adk_read_emails",
                description: "Read recent emails from the connected workspace or simulated environment.",
                parameters: {
                    type: "OBJECT",
                    properties: { max_count: { type: "INTEGER" } },
                    required: []
                }
            },
            {
                name: "adk_reply_email",
                description: "Reply to an email.",
                parameters: {
                    type: "OBJECT",
                    properties: { email_id: { type: "STRING" }, reply_body: { type: "STRING" } },
                    required: ["email_id", "reply_body"]
                }
            },
            {
                name: "adk_schedule_event",
                description: "Schedule an event in the user's calendar.",
                parameters: {
                    type: "OBJECT",
                    properties: { title: { type: "STRING" }, time: { type: "STRING" } },
                    required: ["title", "time"]
                }
            },
            {
                name: "adk_perform_browser_action",
                description: "Simulate browsing automation (RPA) like booking a ticket or filling a form.",
                parameters: {
                    type: "OBJECT",
                    properties: { action_description: { type: "STRING" }, url: { type: "STRING" } },
                    required: ["action_description", "url"]
                }
            },
            {
                name: "adk_finish",
                description: "Call this when you have completed all objectives to submit your final report.",
                parameters: {
                    type: "OBJECT",
                    properties: { result_summary: { type: "STRING" } },
                    required: ["result_summary"]
                }
            }
        ];

        while (!isDone && iteration < this.maxIterations) {
            console.log(`[ADK] Iteration ${iteration + 1}...`);
            
            let response;
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-3.1-pro-preview',
                    contents: history as any,
                    config: {
                        tools: [{ functionDeclarations: tools as any }],
                        systemInstruction: "You are an autonomous intelligence powered by ADK. Think step by step. Use your tools to gather data or take actions. When finished, ALWAYS call adk_finish.",
                        temperature: 0.6
                    }
                });
            } catch (err: any) {
                console.error("[ADK] Model error:", err);
                // Push an error note to history and continue or try to gracefully end
                history.push({ role: 'model', parts: [{ text: `System Error: Failed to contact AI model (${err?.message || 'timeout'}). Ending task.` }] });
                finalOutput = "Task failed due to a system API error. Please try again later.";
                isDone = true;
                break;
            }

            const call = response.functionCalls?.[0];
            const textResponse = response.text || "";

            if (textResponse) {
               history.push({ role: 'model', parts: [{ text: textResponse }] });
            }

            if (call) {
                history.push({ role: 'model', parts: [{ functionCall: call }] } as any);
                let toolResult: any = "Success";
                
                try {
                    if (call.name === 'adk_finish') {
                        isDone = true;
                        finalOutput = (call.args as any).result_summary || "Task completed successfully.";
                    } else if (call.name === 'adk_wikipedia_search') {
                        const args = call.args as any;
                        const lang = args.lang || "ar";
                        const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(args.query)}&utf8=&format=json&origin=*`);
                        const data = await res.json();
                        toolResult = data.query?.search?.map((s: any) => s.snippet.replace(/(<([^>]+)>)/ig, '')).join(' | ') || "No data found.";
                    } else if (call.name === 'adk_get_weather') {
                        const city = (call.args as any).city;
                        // Geocode first
                        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
                        const geoData = await geo.json();
                        if (geoData.results && geoData.results.length > 0) {
                            const { latitude, longitude } = geoData.results[0];
                            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                            const wData = await wRes.json();
                            toolResult = `Temperature: ${wData.current_weather?.temperature}°C, Wind Speed: ${wData.current_weather?.windspeed} km/h`;
                        } else {
                            toolResult = "City not found.";
                        }
                    } else if (call.name === 'adk_read_user_memory') {
                        const { getRelevantMemories } = await import('./geminiService');
                        toolResult = await getRelevantMemories((call.args as any).topic, this.userId);
                    } else if (call.name === 'adk_add_user_task') {
                        const { title, category } = call.args as any;
                        await shadowDB.saveTask({
                            userId: this.userId,
                            task: title,
                            time: new Date().toISOString(),
                            category: category || "general",
                            status: "pending",
                            type: "reminder"
                        });
                        toolResult = "Task added to user dashboard successfully.";
                    } else if (call.name === 'adk_read_emails') {
                        toolResult = `ERROR: Google Workspace API is not configured. Real OAuth 2.0 connection is required to read emails.`;
                    } else if (call.name === 'adk_reply_email') {
                        toolResult = `ERROR: Google Workspace API is not configured. Real OAuth 2.0 connection is required to reply to emails.`;
                    } else if (call.name === 'adk_schedule_event') {
                        toolResult = `ERROR: Google Calendar API is not configured. Real OAuth 2.0 connection is required to schedule events.`;
                    } else if (call.name === 'adk_perform_browser_action') {
                        const args = call.args as any;
                        window.open(args.url, '_blank');
                        toolResult = `Opened browser at ${args.url}. The user must complete the action manually since full RPA requires a browser extension.`;
                    } else {
                        toolResult = "Unknown tool.";
                    }
                } catch (e: any) {
                    toolResult = `Tool Error: ${e.message}`;
                }

                if (!isDone) {
                    history.push({ 
                        role: 'function', 
                        parts: [{ functionResponse: { name: call.name, response: { result: toolResult } } }] 
                    } as any);
                }
            } else {
                if (textResponse) {
                    finalOutput = textResponse;
                    isDone = true;
                }
            }

            iteration++;
        }

        if (!finalOutput) finalOutput = "Agent concluded without a final summary.";
        return finalOutput;
    }
}

let sentinelInterval: any = null;

export const startProactiveSentinel = (userId: string) => {
    if (sentinelInterval) clearInterval(sentinelInterval);
    console.log("[Sentinel] Proactive agent watcher disabled due to user preference.");
};

export const cleanupStaleAutonomousTasks = async (userId: string) => {
    const tasks = await shadowDB.getTasks(userId);
    const pendingAuto = tasks.filter(t => t.category === 'autonomous' && t.status === 'pending');
    let hasChanges = false;
    for (const bgTask of pendingAuto) {
        if (Date.now() - new Date(bgTask.time).getTime() > 20 * 60 * 1000) { // 20 mins timeout
            bgTask.status = 'failed';
            await shadowDB.saveTask(bgTask);
            hasChanges = true;
        }
    }
    if (hasChanges) {
        useAppStore.getState().setRunningTasks(getActiveTasksCount());
        window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
    }
};

export const submitAutonomousTask = async (userId: string, prompt: string, persona?: string): Promise<string> => {
    console.log(`[AGENT NODE] Dispatching background task to Dedicated Server Queue...`);
    
    // Save task to DB
    const bgTask: DBTask = {
        userId,
        task: prompt,
        time: new Date().toISOString(),
        category: 'autonomous',
        status: 'pending',
        type: 'autonomous'
    };
    const dbTaskId = await shadowDB.saveTask(bgTask);
    
    // Start async without awaiting
    (async () => {
        let taskId = "";
        try {
            await new Promise(r => setTimeout(r, 1000)); // UI grace period

            // Submit to Backend Worker Server
            const res = await fetch('/api/agents/spawn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, userId, persona })
            });
            const data = await res.json();
            
            if (!data.success) {
                throw new Error("Failed to spawn backend worker");
            }
            
            taskId = data.taskId;
            activeTasks[taskId] = true;
            useAppStore.getState().setRunningTasks(getActiveTasksCount());
            window.dispatchEvent(new CustomEvent('autonomous_status_changed'));

            // Long-polling / Status check from Backend Server
            let adkResult = "";
            let isDone = false;
            let counter = 0;
            
            while (!isDone && counter < 400) { // Safety break
                await new Promise(r => setTimeout(r, 3000));
                counter++;
                try {
                    const statusRes = await fetch(`/api/agents/${taskId}`);
                    if (!statusRes.ok) break;
                    const statusData = await statusRes.json();
                    
                    if (statusData.status === 'completed' || statusData.status === 'failed') {
                        isDone = true;
                        adkResult = statusData.result || "No data";
                    }
                } catch(e) {
                    console.error("Polling error", e);
                }
            }

            // Tell Maestro to report it!
            const { getShadowResponse, playShadowVoice } = await import('./geminiService');
            const profile = await shadowDB.getProfile(userId);
            
            const systemMessage = `[معلومة للنظام - للظل فقط]\nأنجز العميل المستقل (${persona || 'الباحث'}) المهمة التالية في الخلفية:\nالمهمة: ${prompt}\n\nالنتيجة:\n${adkResult}\n\nيرجى صياغة رد للمستخدم تبلغه فيه بإنهاء المهمة وتشرح له النتيجة بأسلوبك المصري الرائع وباختصار.`;
            const finalMaestroResponse = await getShadowResponse([], systemMessage, {}, profile);

            // Record Final Output to Local DB
            const uiCards = [];
            uiCards.push({
                cardType: 'task_success',
                title: 'اكتملت المهمة المستقلة',
                description: `العميل: ${persona || 'الباحث'}\nالحالة: نجاح`,
                details: prompt
            });

            const msg: DBMessage = {
                userId,
                role: 'model',
                text: finalMaestroResponse.text,
                timestamp: Date.now(),
                isAutonomousResult: true,
                uiCards
            };
            await shadowDB.saveMessage(msg);
            
            bgTask.status = 'done';
            await shadowDB.saveTask({...bgTask, id: Number(dbTaskId)});
            window.dispatchEvent(new CustomEvent('autonomous_message_received'));
            
            // Notify User
            if ('Notification' in window && Notification.permission === 'granted') {
                showSafeNotification("الظل | المهمة انتهت", { body: finalMaestroResponse.text });
            }
            // Auto Play Voice if app is open
            playShadowVoice(finalMaestroResponse.text, profile?.voicePreference || "male");

        } catch (e) {
            console.error("ADK task server submission failed:", e);
            bgTask.status = 'pending';
            await shadowDB.saveTask({...bgTask, id: Number(dbTaskId)});
        } finally {
            if (taskId) delete activeTasks[taskId];
            useAppStore.getState().setRunningTasks(getActiveTasksCount());
            window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
        }
    })();
    
    // We return a temporary ID since the real ID is async retrieved, or we can just return a placeholder
    return `auto_${Date.now()}`;
};

export const initWorker = () => {
    if (typeof Notification !== 'undefined') {
        Notification.requestPermission();
    }
};


