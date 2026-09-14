import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "./components/AppRoutes";
import { NotificationManager } from "./components/NotificationManager";
import { AudioUnlocker } from "./components/AudioUnlocker";
import LiveTickers from "./components/LiveTickers";
import InstallPrompt from "./components/InstallPrompt";
import { FloatingShadowAvatar } from "./components/FloatingShadowAvatar";
import SpaceCanvas from "./components/SpaceCanvas";
import { ProactiveNotification } from "./components/ProactiveNotification";
import { VoiceCommandListener } from "./components/VoiceCommandListener";
import { useAppStore } from "./services/store";
import { shadowDB } from "./services/dbService";
import { setupBackgroundProcessing } from "./services/backgroundTaskService";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";

const App: React.FC = () => {
  const { user, view, setIsAuthReady, checkSession } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    const unsub = shadowDB.onAuthStateChanged((firebaseUser) => {
      setIsAuthReady(true);
      const lastEmail = localStorage.getItem("shadow_last_user");

      if (!firebaseUser && lastEmail && lastEmail !== "GUEST") {
        console.warn("[Auth Sync] Cloud identity missing. Auto-nuking stale local cache...");
        shadowDB.nukeLocalDatabase().then(() => {
          window.location.reload();
        });
      }

      if (firebaseUser && firebaseUser.email && (!lastEmail || lastEmail !== firebaseUser.email)) {
        console.log("[Auth Sync] Cloud identity found but local is missing. Restoring from cloud...");
        localStorage.setItem("shadow_last_user", firebaseUser.email);
        shadowDB.downloadUserCloudData(firebaseUser.email).then(() => {
          checkSession();
        });
      }
    });

    CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      console.log("App state changed. Is active?", isActive);
    });

    LocalNotifications.requestPermissions()
      .then((result) => console.log("Local Notifications Permission:", result.display))
      .catch(() => {});

    setupBackgroundProcessing();
    
    // Initialize Proactive Wakeup and Morning Briefing routine
    import('./services/proactiveWakeupService').then(m => m.proactiveWakeupService.init()).catch(() => {});

    return () => {
      unsub();
      CapacitorApp.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mode") === "widget") {
      const guestUserStr = localStorage.getItem("shadow_guest_active");
      const lastUser = localStorage.getItem("shadow_last_user");
      if (guestUserStr || (lastUser && lastUser !== "GUEST")) {
        useAppStore.setState({ view: "widget" });
        return;
      }
    }
    checkSession();
  }, []);

  return (
    <>
      <AudioUnlocker />
      <NotificationManager />

      <SpaceCanvas interactive={true} showEarth={true} />
      <div className="relative z-10 h-full w-full pointer-events-none">
        <div className="pointer-events-auto h-full w-full">
          <LiveTickers />
          <InstallPrompt />
          <AppRoutes />
        </div>
      </div>
      
      {/* Floating Maestro Avatar */}
      <FloatingShadowAvatar 
        user={user} 
        onNavigateChat={() => useAppStore.setState({ view: "chat" })} 
        hide={view === 'chat' || location.pathname === '/chat' || location.pathname.startsWith('/chat/')} 
      />
      <ProactiveNotification />
      <VoiceCommandListener />
    </>
  );
};

export default App;
