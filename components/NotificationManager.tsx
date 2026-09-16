import React, { useEffect, useRef } from "react";
import { useAppStore } from "../services/store";
import { shadowDB, DBMessage } from "../services/dbService";
import { cleanupStaleAutonomousTasks } from "../services/autonomousAgentService";
import { speakNative, stopVoice, resumeAudioContext, playShadowVoice } from "../services/geminiService";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { showSafeNotification } from "../services/notificationService";

export const NotificationManager: React.FC = () => {
  const { user, isAuthReady, setLatestSystemMessage, setUser } = useAppStore();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    // ALARM CHECKER FUNCTION
    const performChecks = async () => {
      if (checkingRef.current || !user || !user.email) return;
      checkingRef.current = true;
      try {
        const uid = user.email || "GUEST";
        const now = Date.now();
        
        // Execute Stale Autonomous Tasks optionally
        if (Math.random() < 0.05 && uid !== "GUEST") {
          cleanupStaleAutonomousTasks(uid).catch(console.error);
        }

        const allTasks = await shadowDB.getTasks(uid);
        
        // 1. SYNC NATIVE OS NOTIFICATIONS (Delegate future alarms to the OS)
        const pendingTasks = allTasks.filter(t => t.status === "pending" && !t.notified && t.executionTime);
        try {
           const scheduled = await LocalNotifications.getPending();
           const scheduledIds = scheduled.notifications.map(n => n.id);
           
           for (const task of pendingTasks) {
              // Ensure integer ID for capacitor
              const taskIdNum = typeof task.id === 'number' ? task.id : Math.abs(String(task.id).hashCode() || Math.floor(now/1000)); 
              if (task.executionTime && task.executionTime > now && !scheduledIds.includes(taskIdNum)) {
                 LocalNotifications.schedule({
                   notifications: [{
                     title: "تنبيه من الظل",
                     body: task.task,
                     id: taskIdNum,
                     schedule: { at: new Date(task.executionTime) },
                     sound: null,
                     attachments: null,
                     actionTypeId: "",
                     extra: { taskId: task.id }
                   }],
                 }).catch(e => console.warn("Failed scheduling native alarm", e));
              }
           }
        } catch (e) {
           console.log("LocalNotifications API not fully available", e);
        }

        // 2. TRIGGER DUE TASKS IN APP (If app is open when task is due)
        const dueTasks = pendingTasks.filter(t => t.executionTime && t.executionTime <= now);

        if (dueTasks.length > 0) {
          const task = dueTasks[0];
          const cleanTask = task.task.replace(/[^a-zA-Z\u0600-\u06FF0-9 ]/g, "");
          const reminderText = `تنبيه يا ريس.. ميعاد ${cleanTask} جه.`;

          // 1. Resume Audio Context immediately
          resumeAudioContext();

          // 2. Play warning beep
          const audio = document.getElementById("notification-sound") as HTMLAudioElement;
          if (audio) {
            audio.volume = 1.0;
            audio.currentTime = 0;
            audio.play().catch((e) => console.warn("Alarm beep blocked", e));
          }

          // 3. Play voice
          playShadowVoice(
            reminderText,
            user.voicePreference === "female" ? "female" : "male"
          );

          // 4. Save System Message
          const alarmMsg: DBMessage = {
            userId: uid,
            role: "system",
            text: `🔔 **تنبيه:** ${task.task}`,
            timestamp: Date.now(),
          };
          await shadowDB.saveMessage(alarmMsg, true);
          setLatestSystemMessage(alarmMsg);

          // 5. Reschedule or clear
          if (task.recurring) {
            const nextTime = Date.now() + 24 * 60 * 60 * 1000;
            await shadowDB.updateTaskStatus(task.id!, { notified: false, executionTime: nextTime });
          } else {
            await shadowDB.updateTaskStatus(task.id!, { notified: true, status: "completed" });
          }
        }
      } finally {
        checkingRef.current = false;
      }
    };

    // POLLING WHEN FOREGROUNDED (Optimized to 10s to prevent battery and database thrashing)
    const intervalId = setInterval(performChecks, 10000);

    let appStateListener: any;
    const setupListener = async () => {
      appStateListener = await CapacitorApp.addListener("appStateChange", async ({ isActive }) => {
        if (isActive) {
          performChecks(); 
        }
      });
    };
    setupListener();

    // Global Pulse (Push Sync)
    shadowDB.subscribeToSystem(
      (pulse) => {
        if (pulse) {
          const lastSeen = user.lastPulseReceived || 0;
          if (pulse.timestamp > lastSeen + 1000) {
            const pulseMsg: DBMessage = {
              userId: user.email,
              role: "system",
              text: `📢 **نداء عام (Shadow Pulse):**\n\n${pulse.text}`,
              timestamp: pulse.timestamp,
            };
            shadowDB.saveMessage(pulseMsg, true).then(() => {
              setLatestSystemMessage(pulseMsg);
              shadowDB.updateLastPulseReceived(user.email, pulse.timestamp);
              setUser({ ...user, lastPulseReceived: pulse.timestamp });
              
              const audio = document.getElementById("notification-sound") as HTMLAudioElement;
              if (audio) {
                audio.volume = 1.0;
                audio.play().catch(e => console.warn(e));
              }
              speakNative("رسالة هامة من الإدارة", user?.voicePreference || "male");
            });
          }
        }
      },
      () => { console.log("[System] Global rules updated."); }
    );

    return () => {
      clearInterval(intervalId);
      if (appStateListener) appStateListener.remove();
      stopVoice();
      shadowDB.unsubscribeSystem();
    };
  }, [user?.email, user?.phone, isAuthReady]);

  return (
    <audio
      id="notification-sound"
      src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      preload="auto"
    />
  );
};

// Polyfill for simple hash code if missing
declare global {
  interface String {
    hashCode(): number;
  }
}
if (!String.prototype.hashCode) {
  String.prototype.hashCode = function() {
    let hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  };
}
