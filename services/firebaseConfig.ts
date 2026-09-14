import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfigData from '../firebase-applet-config.json';

let app: any = null;
let db: any = null;
let auth: any = null;

// Robust Initialization
try {
    if (firebaseConfigData.apiKey && firebaseConfigData.apiKey.length > 5) {
        if (!getApps().length) {
            app = initializeApp(firebaseConfigData);
            // Initialize Firestore with memory cache to avoid IndexedDB corruption/assertion issues
            db = initializeFirestore(app, { 
                localCache: memoryLocalCache(),
                experimentalForceLongPolling: true
            }, (firebaseConfigData as any).firestoreDatabaseId);
        } else {
            app = getApp();
            db = getFirestore(app, (firebaseConfigData as any).firestoreDatabaseId);
        }

        auth = getAuth(app);
        console.log("[Shadow Core] Firebase Connected Successfully.");
    } else {
        console.warn("[Shadow Core] Running in Local Mode (No Firebase Config Found). Data will be stored locally.");
    }
} catch (e) {
    console.error("[Shadow Core] Firebase Init Error (Falling back to local):", e);
}

export { db, auth };