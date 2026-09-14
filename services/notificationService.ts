export const showSafeNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        try {
            // Check if we are on Android/Mobile where 'new Notification()' constructor might be illegal (throws TypeError)
            // or if we just want to leverage Service Workers.
            // But actually wait, navigator.serviceWorker.ready might hang if there's no service worker registered.
            // Let's get registration instead.
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                if (regs.length > 0 && regs[0].showNotification) {
                    await regs[0].showNotification(title, options);
                    return;
                }
            }
            
            // Fallback to constructor
            new Notification(title, options);
        } catch (e) {
            console.error("Failed to show notification:", e);
        }
    }
};
