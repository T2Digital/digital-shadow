// Edge Fallback System for offline natural language processing
// Provides zero-latency response when the cloud API is unreachable.

export const processOfflineCommand = (message: string): {text: string, toolActions: any[]} | null => {
    const text = message.toLowerCase();
    
    // Command matches for Apps
    if (text.includes("افتح") || text.includes("open")) {
        const appMap: {[key: string]: string} = {
            "واتساب": "whatsapp://",
            "whatsapp": "whatsapp://",
            "فيسبوك": "fb://",
            "facebook": "fb://",
            "يوتيوب": "youtube://",
            "يوتوب": "youtube://",
            "youtube": "youtube://",
            "انستجرام": "instagram://",
            "تويتر": "twitter://",
            "اكس": "twitter://",
            "تيك توك": "tiktok://",
            "اوبر": "uber://",
            "الكاميرا": "camera",
            "الموسيقى": "music",
            "spotify": "spotify://"
        };

        for (const [key, target] of Object.entries(appMap)) {
            if (text.includes(key)) {
                return {
                    text: `(Edge Fallback ⚡) بفتح ${key} حالا يا ريس من غير نت!`,
                    toolActions: [
                        { name: "app_control", args: { target: target, action_type: "open" } }
                    ]
                };
            }
        }
    }

    // Command matches for Reminder basics
    if (text.includes("فكرني") || text.includes("ذكرني") || text.includes("remind")) {
        return {
            text: "(Edge Fallback ⚡) من عيني يا ريس، اضبطلك منبه امتى بالضبط؟",
            toolActions: []
        };
    }

    // Generic chat fallback
    if (text.includes("عامل ايه") || text.includes("ازيك") || text.includes("أخبارك")) {
         return {
             text: "(Edge Fallback ⚡) أنا بخير كالعادة يا ماستر، بس الشبكة فاصلة شوية. شغال معاك أوفلاين لحد ما ترجع.",
             toolActions: []
         };
    }

    return null;
};
