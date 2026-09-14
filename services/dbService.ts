import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, getDocsFromServer, updateDoc, addDoc, orderBy, deleteDoc, writeBatch, limit } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, User } from "firebase/auth";
import { encryptData, decryptData } from './cryptoService';

export interface DBMessage {
  id?: number;
  userId: string; // Now Email
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  voiceData?: string; 
  groundingLinks?: { title?: string; uri?: string }[];
  image?: string; 
  video?: string;
  uiCards?: any[]; // CHANGED: Array to support multitasking cards
  isHidden?: boolean;
  synced?: boolean;
  isAutonomousResult?: boolean;
}

export interface UserTraits {
    communicationStyle: 'direct' | 'detailed' | 'formal' | 'friendly';
    focusAreas: string[];
    psychologicalProfile: string;
    lastAnalysis: number;
}

export interface AffiliateStats {
    isMarketer: boolean;
    referralCode: string;
    totalEarnings: number;
    referralsCount: number;
    payoutDetails?: {
        method: 'wallet' | 'instapay';
        number: string;
        name: string;
    };
    payoutHistory: { id?: number; date: number; amount: number; status: 'paid' | 'pending' }[];
}

export interface AgentPowers {
    developer?: boolean;
    trader?: boolean;
    social?: boolean;
}

export interface SystemKeys {
    githubToken?: string;
    vercelToken?: string;
    binanceApiKey?: string;
    binanceSecretKey?: string;
    metaToken?: string;
    metaPageId?: string;
    openAIBaseUrl?: string;
    openAIApiKey?: string;
    openAIModelName?: string;
    pineconeApiKey?: string;
    pineconeHost?: string;
}

export interface UserProfile {
    email: string; // Primary Key
    phone?: string; // Legacy ID / Identifier
    password?: string; // Admin Bypass / Local Auth
    uid?: string; // Firebase Auth UID
    name: string;
    shadowName?: string;
    shadowId?: string; // Unique, easily shareable ID for shadow-to-shadow comms
    voicePreference?: 'male' | 'female';
    formalityLevel?: 'formal' | 'friendly' | 'sarcastic' | 'balanced';
    interfaceColor?: string;
    emojiUsage?: 'heavy' | 'moderate' | 'minimal' | 'none';
    personalityTraits?: string[];
    paymentProof?: string;
    tier: 'lite' | 'guardian' | 'sovereign';
    status: 'active' | 'pending' | 'blocked';
    joinedAt: number;
    referredBy?: string; 
    affiliate?: AffiliateStats; 
    subscriptionCycle?: 'monthly' | 'yearly';
    commissionPaid?: boolean;
    iotActions?: { [key: string]: string; };
    personalKeys?: {
        githubToken?: string;
        vercelToken?: string;
        binanceApiKey?: string;
        binanceSecretKey?: string;
        metaAccessToken?: string;
        metaAppId?: string;
        metaAppSecret?: string;
        xApiKey?: string;
        xApiSecret?: string;
        tiktokKey?: string;
        tiktokSecret?: string;
        youtubeKey?: string;
        snapchatKey?: string;
        openaiApiKey?: string;
        anthropicApiKey?: string;
        geminiApiKey?: string;
        twilioSid?: string;
        twilioAuthToken?: string;
        twilioWhatsAppNumber?: string;
        _encrypted?: string;
        data?: string;
    };
    vaultState?: {
        contactsImported: boolean;
        biometricsEnabled: boolean;
        logsEnabled: boolean;
    };
    pin?: string;
    traits?: UserTraits;
    longTermMemory?: string;
    customPrompts?: {
        maestro?: string;
        designer?: string;
        researcher?: string;
        trader?: string;
        engineer?: string;
        archivist?: string;
    };
    lastPulseReceived?: number; 
    synced?: boolean;
    agentPowers?: AgentPowers;
}

export interface DBTask {
  id?: number;
  userId: string; 
  task: string;
  time: string;
  executionTime?: number;
  category: string;
  status: 'pending' | 'completed' | 'done' | 'failed';
  type?: string;
  recurring?: boolean;
  notified?: boolean;
  synced?: boolean;
}

export interface DBFact {
  id?: number;
  userId: string; 
  fact: string;
  timestamp: number;
  synced?: boolean;
  embedding?: number[];
}

export interface DBFSItem {
  id?: number | string;
  userId: string; 
  parentId: number | string | null;
  name: string;
  type: 'folder' | 'table' | 'calendar' | 'project' | 'file' | 'image' | 'video' | 'audio' | 'doc' | 'brand';
  content?: string;
  l0_summary?: string;
  l1_metadata?: string;
  l2_content?: string;
  createdAt: number;
  synced?: boolean;
}

export interface DBContact {
    id?: number;
    userId: string; 
    name: string;
    phones: string[];
    emails: string[];
    lastInteraction: number;
    encryptedData: string;
    synced?: boolean;
}

export interface DBFeedback {
    id?: number;
    userId: string;
    userName: string;
    message: string;
    timestamp: number;
    isRead: boolean;
}

export interface DBPlugin {
    id?: number;
    userId: string;
    name: string;
    description: string;
    parametersSchema: string; // JSON string representations of the parameters
    jsCode: string;
    createdAt: number;
    synced?: boolean;
}

export interface DBCoupon {
    code: string;
    discountAmount: number; // e.g. 200 or 1000
    type: 'fixed' | 'percent'; // currently logic supports fixed reduction mainly
    maxUses: number;
    usedCount: number;
    expiryDate?: number;
}

export interface GraphNode {
    id?: number;
    userId: string;
    label: string;
    properties: any;
}

export interface GraphEdge {
    id?: number;
    userId: string;
    sourceNodeId: number;
    targetNodeId: number;
    relationship: string;
    weight?: number;
}

export interface ShadowMessage {
    id?: number;
    fromUserId: string;
    toUserId: string;
    content: string;
    status: 'pending' | 'delivered' | 'read' | 'acted_upon';
    timestamp: number;
}

export interface AgentProfile {
    id: string; 
    name: string;
    role: string;
    isActive: boolean;
    systemInstruction: string; 
    knowledgeBase: string[]; 
    documents?: { name: string; mimeType: string; data: string; }[]; // New: PDF/File Storage
    lastUpdated: number;
}



const sanitizeForFirestore = (data: any): any => {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) return data.map(sanitizeForFirestore);
    if (typeof data === 'object') {
        const clean: any = {};
        Object.keys(data).forEach(key => {
            const val = data[key];
            clean[key] = val === undefined ? null : sanitizeForFirestore(val);
        });
        return clean;
    }
    return data;
};

class ShadowDB {
  async deleteFSItem(id: number | string, userId?: string) {
      if (!db) throw new Error('DB not initialized');
      const dbLocal = await this.init();
      return new Promise<void>((resolve) => {
          const tx = dbLocal.transaction('fs', 'readwrite');
          tx.objectStore('fs').delete(id);
          tx.oncomplete = async () => {
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow_fs_update'));
              if (userId && db) {
                  deleteDoc(doc(db, `users/${userId}/filesystem`, id.toString())).catch(e => console.error(e));
              }
              resolve();
          };
      });
  }

  async saveFSItem(item: DBFSItem, skipCloud = false, skipEvent = false): Promise<number> {
      if (item.userId) item.userId = item.userId.toLowerCase();
      const dbLocal = await this.init();
      return new Promise((resolve) => {
          const tx = dbLocal.transaction('fs', 'readwrite');
          const itemWithId = { ...item, id: item.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
          if (!skipCloud && itemWithId.userId && itemWithId.userId !== 'GUEST') {
              this.pushToCloud('filesystem', itemWithId, 'filesystem', itemWithId.userId);
          }
          const req = tx.objectStore('fs').put(itemWithId);
          req.onsuccess = () => {
              if (!skipEvent && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow_fs_update'));
              resolve(itemWithId.id as number);
          };
          req.onerror = (e) => {
              console.error("IDB saveFSItem error for item:", itemWithId, e);
              resolve(itemWithId.id as number); // allow it to continue even if local save fails
          };
      });
  }

  async deleteTask(id: number) {
      if (!db) throw new Error('DB not initialized');
      return new Promise<void>((resolve) => {
          const tx = db.transaction('tasks', 'readwrite');
          tx.objectStore('tasks').delete(id);
          tx.oncomplete = () => resolve();
      });
  }

  private dbName = 'ShadowCore_V20_Email'; 
  private version = 23; // Incremented version for audio_cache
  public unsubscribeListeners: Function[] = [];
  public systemUnsubscribe: Function[] = [];
  public adminUnsubscribe: Function | null = null;
  
  private syncQueue: { collectionName: string, data: any, subCollection?: string, userId?: string }[] = [];
  private syncTimer: any = null;
  public syncStatus: 'synced' | 'syncing' | 'offline' | 'error' = 'synced';
  public onSyncStatusChange: ((status: 'synced' | 'syncing' | 'offline' | 'error') => void) | null = null;

  private updateSyncStatus(status: 'synced' | 'syncing' | 'offline' | 'error') {
      this.syncStatus = status;
      if (this.onSyncStatusChange) this.onSyncStatusChange(status);
  }

  constructor() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(granted => { if (granted) console.log("[Storage] Persistent storage granted"); });
      }
      
      if (typeof window !== 'undefined') {
          window.addEventListener('online', () => {
              console.log("[Sync] Network online, flushing queue...");
              this.updateSyncStatus('syncing');
              if (this.syncQueue.length > 0) this.flushSyncQueue();
          });
          window.addEventListener('offline', () => {
              console.log("[Sync] Network offline.");
              this.updateSyncStatus('offline');
          });
      }
  }

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = (event) => reject((event.target as any).error);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const stores = ['history', 'tasks', 'memory', 'profiles', 'fs', 'contacts', 'feedback', 'config', 'agents', 'coupons', 'plugins', 'graph_nodes', 'graph_edges', 'shadow_messages', 'audio_cache'];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: s === 'profiles' ? 'email' : (s === 'config' ? 'key' : (s === 'agents' || s === 'coupons' || s === 'audio_cache' ? 'id' : 'id')), autoIncrement: s === 'feedback' || s === 'history' || s === 'tasks' || s === 'memory' || s === 'plugins' || s === 'graph_nodes' || s === 'graph_edges' || s === 'shadow_messages' || s === 'fs' });
            if (s !== 'profiles' && s !== 'config' && s !== 'agents' && s !== 'coupons' && s !== 'audio_cache' && !store.indexNames.contains('userId')) store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  // --- AUTHENTICATION (Firebase) ---
  onAuthStateChanged(callback: (user: any) => void) {
      if (auth) {
          return onAuthStateChanged(auth, callback);
      }
      return () => {};
  }

  async registerUser(email: string, password: string, name: string, isAffiliate: boolean, referralCode?: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const cleanEmail = email.toLowerCase();
      const isAdmin = cleanEmail === 'admin@shadow.com';
      
      const newUser: UserProfile = {
          email: cleanEmail,
          phone: cleanEmail,
          uid,
          name: isAdmin ? 'تيتو (الماستر)' : name, 
          shadowName: isAdmin ? 'الماستر' : (isAffiliate ? 'Marketer' : 'الظل'),
          shadowId: 'SHADOW-' + Math.floor(100000 + Math.random() * 900000).toString(),
          voicePreference: 'male',
          tier: isAdmin ? 'sovereign' : (isAffiliate ? 'lite' : 'sovereign'),
          status: isAdmin ? 'active' : (isAffiliate ? 'active' : 'pending'),
          joinedAt: Date.now(),
          referredBy: referralCode,
          affiliate: isAdmin ? { 
              isMarketer: true, 
              referralCode: 'ADMIN_BOSS', 
              totalEarnings: 0, 
              referralsCount: 0, 
              payoutHistory: [] 
          } : { 
              isMarketer: isAffiliate, 
              referralCode: (name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(), 
              totalEarnings: 0, 
              referralsCount: 0, 
              payoutHistory: [] 
          },
          subscriptionCycle: isAdmin ? 'yearly' : (isAffiliate ? undefined : 'monthly'),
      };
      await this.saveProfile(newUser, true);
      return newUser;
  }

  async nukeLocalDatabase() {
      try {
          localStorage.clear();
          sessionStorage.clear();
          const req = indexedDB.deleteDatabase(this.dbName);
          req.onsuccess = () => console.log("IndexedDB wiped");
          if (auth) await auth.signOut();
          return true;
      } catch (e) {
          console.error("Nuke failed", e);
          return false;
      }
  }

  async syncHistoryFast(email: string) {
      if (!db || !email || email === 'GUEST') return;
      const cleanEmail = email.toLowerCase();
      try {
          const q = query(collection(db, `users/${cleanEmail}/history`), orderBy('timestamp', 'desc'), limit(100));
          let snap;
          try {
              snap = await getDocs(q);
          } catch (e: any) {
              console.warn("getDocs failed with assertion error, falling back to getDocsFromServer...", e);
              snap = await getDocsFromServer(q);
          }
          for (const d of snap.docs) {
              const item = d.data();
              if (item) {
                  await this.saveMessage({...item, userId: email} as any, true);
              }
          }
      } catch (e) {
          console.error("Fast sync failed:", e);
      }
  }

  private _isDownloadingCloudData = false;

  async downloadUserCloudData(email: string, force = false) {
      if (!db || !email) return;
      if (this._isDownloadingCloudData) return;
      
      const cleanEmail = email.toLowerCase();
      
      try {
          this._isDownloadingCloudData = true;

          const dbLocal = await this.init();
          const pFsCount = new Promise<number>((resolve) => {
              const req = dbLocal.transaction('fs', 'readonly').objectStore('fs').index('userId').count(cleanEmail);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => resolve(0);
          });
          const pHistCount = new Promise<number>((resolve) => {
              const req = dbLocal.transaction('history', 'readonly').objectStore('history').index('userId').count(cleanEmail);
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => resolve(0);
          });
          const fsCount = await pFsCount;
          const histCount = await pHistCount;
          
          if (!force && fsCount > 0 && histCount > 0) {
              console.log('[Shadow Core] Local data exists (fsCount:', fsCount, ', histCount:', histCount, '), skipping deep cloud download.');
              return;
          }

          console.log('[Shadow Core] Downloading cloud data for', cleanEmail);
          
          const collectionsList = ['history', 'tasks', 'memory', 'filesystem'];
          for (const col of collectionsList) {
             let q = query(collection(db, 'users/' + cleanEmail + '/' + col));
             if (col === 'history') {
                 q = query(collection(db, `users/${cleanEmail}/history`), orderBy('timestamp', 'desc'), limit(150));
             }
             let snap;
             try {
                 snap = await getDocs(q);
             } catch (e: any) {
                 console.warn("[Shadow Core] getDocs failed in downloadUserCloudData, fallback to server...", e);
                 snap = await getDocsFromServer(q);
             }
             for (const d of snap.docs) {
                const item = d.data();
                if (item) {
                   if (col === 'history') await this.saveMessage({...item, userId: cleanEmail} as any, true);
                   if (col === 'tasks') await this.saveTask({...item, userId: cleanEmail} as any, true);
                   if (col === 'memory') await this.saveFact({...item, userId: cleanEmail} as any, true);
                   if (col === 'filesystem') await this.saveFSItem({...item, userId: cleanEmail} as any, true, true);
                }
             }
          }
          console.log('[Shadow Core] Cloud data download complete.');
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow_fs_update'));
      } catch (e) {
          console.error('[Shadow Core] Failed to download cloud data', e);
      } finally {
          this._isDownloadingCloudData = false;
      }
  }

  async loginUser(email: string, password: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const cleanEmail = email.toLowerCase();
      let profile = await this.getProfile(cleanEmail);

      // AUTO-HEAL
      if (!profile) {
          if (db) {
              try {
                  const docSnap = await getDoc(doc(db, "users", cleanEmail));
                  if (docSnap.exists()) {
                      profile = docSnap.data() as UserProfile;
                      if (!profile.shadowId) profile.shadowId = 'SHADOW-' + Math.floor(100000 + Math.random() * 900000).toString();
                      if (profile.personalKeys) {
                          profile.personalKeys = {
                              githubToken: decryptData(profile.personalKeys.githubToken || '', cleanEmail),
                              vercelToken: decryptData(profile.personalKeys.vercelToken || '', cleanEmail),
                              binanceApiKey: decryptData(profile.personalKeys.binanceApiKey || '', cleanEmail),
                              binanceSecretKey: decryptData(profile.personalKeys.binanceSecretKey || '', cleanEmail),
                              metaAccessToken: decryptData(profile.personalKeys.metaAccessToken || '', cleanEmail),
                              openaiApiKey: decryptData(profile.personalKeys.openaiApiKey || '', cleanEmail),
                              anthropicApiKey: decryptData(profile.personalKeys.anthropicApiKey || '', cleanEmail),
                              geminiApiKey: decryptData(profile.personalKeys.geminiApiKey || '', cleanEmail),
                          };
                      }
                      await this.saveProfile(profile, true);
                      this.downloadUserCloudData(cleanEmail);
                      return profile;
                  }
              } catch(e) {}
          }

          console.warn("[Shadow Core] Profile missing locally. Creating default/healing...");
          const namePart = email.split('@')[0];
          const isAdmin = cleanEmail === 'admin@shadow.com';
          
          profile = {
              email: cleanEmail,
              phone: cleanEmail,
              uid: uid,
              name: isAdmin ? 'تيتو (الماستر)' : namePart,
              shadowName: isAdmin ? 'الماستر' : 'الظل',
              shadowId: 'SHADOW-' + Math.floor(100000 + Math.random() * 900000).toString(),
              tier: isAdmin ? 'sovereign' : 'lite',
              status: 'active',
              joinedAt: Date.now(),
              affiliate: isAdmin ? {
                  isMarketer: true,
                  referralCode: 'ADMIN_BOSS',
                  totalEarnings: 0,
                  referralsCount: 0,
                  payoutHistory: []
              } : undefined
          };
          
          try {
              if (db) await setDoc(doc(db, "users", cleanEmail), profile, { merge: true });
              await this.saveProfile(profile);
          } catch(e) {
              await this.saveProfile(profile, true);
          }
      }

      if (!profile) throw new Error("Profile creation failed");
      
      if (!profile.shadowId) {
          profile.shadowId = 'SHADOW-' + Math.floor(100000 + Math.random() * 900000).toString();
          await this.saveProfile(profile, true);
      }
      
      this.downloadUserCloudData(cleanEmail);
      return profile;
  }

  async resetPassword(email: string) {
      if (!auth) throw new Error("Firebase Auth not initialized");
      await sendPasswordResetEmail(auth, email);
  }

  async logout() {
      if (auth) await signOut(auth);
  }

  // --- FIREBASE SYNC (USER SPECIFIC) ---
  unsubscribeRealtime() {
      this.unsubscribeListeners.forEach(unsub => unsub());
      this.unsubscribeListeners = [];
  }

  subscribeToRealtime(email: string, onUpdate: (table: string, payload: any) => void) {
      if (!db || email === 'GUEST' || !auth?.currentUser) return;
      const cleanEmail = email.toLowerCase();
      try {
          this.unsubscribeListeners.forEach(unsub => unsub());
          this.unsubscribeListeners = [];
          
          const profileUnsub = onSnapshot(doc(db, "users", cleanEmail), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  const profile: UserProfile = { ...data, email: cleanEmail } as any; 
                  
                  if (profile.personalKeys) {
                      profile.personalKeys = {
                          githubToken: decryptData(profile.personalKeys.githubToken || '', cleanEmail),
                          vercelToken: decryptData(profile.personalKeys.vercelToken || '', cleanEmail),
                          binanceApiKey: decryptData(profile.personalKeys.binanceApiKey || '', cleanEmail),
                          binanceSecretKey: decryptData(profile.personalKeys.binanceSecretKey || '', cleanEmail),
                          metaAccessToken: decryptData(profile.personalKeys.metaAccessToken || '', cleanEmail),
                          openaiApiKey: decryptData(profile.personalKeys.openaiApiKey || '', cleanEmail),
                          anthropicApiKey: decryptData(profile.personalKeys.anthropicApiKey || '', cleanEmail),
                          geminiApiKey: decryptData(profile.personalKeys.geminiApiKey || '', cleanEmail),
                      };
                  }
                  
                  onUpdate('profiles', profile);
                  this.saveProfile(profile, true);
              }
          }, (error) => { console.warn("[Firebase] Profile sync error:", error); });
          this.unsubscribeListeners.push(profileUnsub);

          const historyQuery = query(collection(db, `users/${cleanEmail}/history`), where('timestamp', '>', Date.now() - 10000));
          const historyUnsub = onSnapshot(historyQuery, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                      const data = change.doc.data();
                      this.saveMessage(data as any, true).then((id) => {
                          data.text = decryptData(data.text, cleanEmail);
                          onUpdate('history', { ...data, id });
                      });
                  }
              });
          }, (error) => { console.warn("[Firebase] History sync error:", error); });
          this.unsubscribeListeners.push(historyUnsub);
      } catch (e) { console.warn("[Firebase] Realtime sync init failed.", e); }
  }

  // --- GLOBAL SYSTEM SYNC (ALL USERS) ---
  unsubscribeSystem() {
      this.systemUnsubscribe.forEach(unsub => unsub());
      this.systemUnsubscribe = [];
  }

  subscribeToSystem(onPulse: (pulse: any) => void, onRules: (rules: string) => void) {
      if (!db || !auth?.currentUser) return; // Wait for auth
      this.systemUnsubscribe.forEach(unsub => unsub());
      this.systemUnsubscribe = [];

      try {
          const pulseUnsub = onSnapshot(doc(db, "system", "pulse"), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  this.setConfig('latest_pulse', data); 
                  onPulse(data);
              }
          }, (error) => { console.warn("[Firebase] Pulse sync error:", error); });
          this.systemUnsubscribe.push(pulseUnsub);

          const rulesUnsub = onSnapshot(doc(db, "system", "rules"), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  if (data.text) {
                      this.updateGlobalRules(data.text, true); 
                      onRules(data.text);
                  }
              }
          }, (error) => { console.warn("[Firebase] Rules sync error:", error); });
          this.systemUnsubscribe.push(rulesUnsub);

          const agentsUnsub = onSnapshot(collection(db, "system_agents"), (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  const agent = change.doc.data() as AgentProfile;
                  this.saveAgentProfile(agent, true);
              });
          }, (error) => { console.warn("[Firebase] Agents sync error:", error); });
          this.systemUnsubscribe.push(agentsUnsub);

      } catch (e) { console.warn("[Firebase] System sync failed", e); }
  }

  subscribeToAdminFeed(onProfilesUpdate: (profiles: UserProfile[]) => void, onFeedbackUpdate: (feedbacks: DBFeedback[]) => void) {
      if (!db || !auth?.currentUser) return;
      if (this.adminUnsubscribe) this.adminUnsubscribe();
      
      try {
          const q = query(collection(db, "users"));
          const unsubProfiles = onSnapshot(q, (snapshot) => {
              const profiles: UserProfile[] = [];
              snapshot.forEach((doc) => profiles.push({ ...doc.data(), email: doc.id } as UserProfile));
              onProfilesUpdate(profiles);
          }, (error) => { console.warn("[Firebase] Admin profiles sync error:", error); });

          const qFeed = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
          const unsubFeedback = onSnapshot(qFeed, (snapshot) => {
             const items: DBFeedback[] = [];
             snapshot.forEach(doc => items.push(doc.data() as DBFeedback));
             onFeedbackUpdate(items);
          }, (error) => { console.warn("[Firebase] Admin feedback sync error:", error); });

          this.adminUnsubscribe = () => { unsubProfiles(); unsubFeedback(); };
      } catch (e) { console.error("[Admin] Sync Error:", e); }
  }

  async pushToCloud(collectionName: string, rawData: any, subCollection?: string, userId?: string) {
      if (!db) throw new Error('DB not initialized'); 
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.updateSyncStatus('offline');
      }
      const data = sanitizeForFirestore(rawData);
      console.log(`[pushToCloud] collection: ${collectionName}, subCollection: ${subCollection}, userId: ${userId}, data:`, data);
      this.syncQueue.push({ collectionName, data, subCollection, userId });
      this.updateSyncStatus('syncing');

      if (!this.syncTimer) {
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 500); // Batched quickly
      }
  }

  async flushSyncQueue() {
      if (this.syncQueue.length === 0) {
          this.updateSyncStatus('synced');
          this.syncTimer = null;
          return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.updateSyncStatus('offline');
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 10000); // Retry later
          return;
      }

      this.updateSyncStatus('syncing');
      const batch = this.syncQueue.splice(0, 50); // Process up to 50 items with writeBatch
      try {
          const firestoreBatch = writeBatch(db);
          let hasWrites = false;

          for (const item of batch) {
              const { collectionName, data, subCollection, userId } = item;
              if (collectionName === 'profiles') {
                  firestoreBatch.set(doc(db, "users", data.email), data, { merge: true });
                  hasWrites = true;
              } else if (collectionName === 'coupons') {
                  firestoreBatch.set(doc(db, "system_coupons", data.code), data, { merge: true });
                  hasWrites = true;
              } else if (collectionName === 'system_agents') {
                 firestoreBatch.set(doc(db, "system_agents", data.id), data, { merge: true });
                 hasWrites = true;
              } else if (collectionName === 'feedback') {
                 const newDocRef = doc(collection(db, "feedback"));
                 firestoreBatch.set(newDocRef, data);
                 hasWrites = true;
              } else if (userId && subCollection) {
                  const docId = data.id ? data.id.toString() : data.timestamp ? data.timestamp.toString() : undefined;
                  if (docId) {
                      firestoreBatch.set(doc(db, `users/${userId}/${subCollection}`, docId), data, { merge: true });
                      hasWrites = true;
                  } else {
                      const newDocRef = doc(collection(db, `users/${userId}/${subCollection}`));
                      firestoreBatch.set(newDocRef, data);
                      hasWrites = true;
                  }
              }
          }

          if (hasWrites) {
              await firestoreBatch.commit();
          }

          if (this.syncQueue.length > 0) {
              this.syncTimer = setTimeout(() => this.flushSyncQueue(), 2000);
          } else {
              this.updateSyncStatus('synced');
              this.syncTimer = null;
          }
      } catch (e: any) { 
          console.warn(`[Cloud Sync Warning] Batch flush failed:`, e.message);
          if (e?.code === 'resource-exhausted' || e?.message?.includes('resource-exhausted')) {
              console.warn("[Sync] Resource exhausted, dropping batch to recover.");
          } else {
              this.syncQueue.unshift(...batch); // Put failed items back
          }
          this.updateSyncStatus('error');
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 10000);
      }
  }

  // --- CRUD OPERATIONS ---
  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const db = await this.init();
    if (msg.userId) msg.userId = msg.userId.toLowerCase();
    const tx = db.transaction('history', 'readwrite');
    const id = (msg as any).id || Date.now() + Math.floor(Math.random() * 1000);
    // If skipCloud is true, it came from the cloud where it is already encrypted!
    const textToSave = skipCloud ? msg.text : encryptData(msg.text, msg.userId);
    const secureMsg = { ...msg, id, text: textToSave, synced: true };
    const request = tx.objectStore('history').put(secureMsg);
    // Skip cloud sync for system messages to prevent resource-exhausted errors
    if (!skipCloud && msg.userId !== 'GUEST' && msg.role !== 'system') {
        const cloudMsg = { ...msg, id, text: secureMsg.text };
        delete cloudMsg.voiceData;
        this.pushToCloud('history', cloudMsg, 'history', msg.userId);
    }
    return new Promise((resolve, reject) => { 
        request.onsuccess = () => resolve(request.result as number); 
        request.onerror = () => reject(request.error);
    });
  }

  async updateMessage(id: number, updates: Partial<DBMessage>) {
      const db = await this.init();
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      return new Promise<void>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
              const data = req.result;
              if (data) {
                  const updatedData = { ...data, ...updates, synced: true };
                  store.put(updatedData);
                  if (data.userId !== 'GUEST') {
                      const cloudMsg = { ...updatedData };
                      delete cloudMsg.voiceData;
                      this.pushToCloud('history', cloudMsg, 'history', data.userId);
                  }
              }
              resolve();
          };
          req.onerror = () => resolve();
      });
  }

  async deleteMessage(id: number) {
      const db = await this.init();
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  }

  async syncWithNeuralNetwork(userId: string) {
      console.log("Initiating Cross-Device Neural Sync via Firebase");
      return new Promise<void>(async (resolve, reject) => {
          try {
              if (this.syncQueue.length > 0) {
                  await this.flushSyncQueue();
              }
              if (db) {
                  // Fetch memories from cloud to local
                  const { collection, getDocs } = await import('firebase/firestore');
                  const memQuery = collection(db, `users/${userId}/memory`);
                  const snap = await getDocs(memQuery);
                  const dbLocal = await this.init();
                  const tx = dbLocal.transaction('memory', 'readwrite');
                  const store = tx.objectStore('memory');
                  snap.forEach(doc => {
                     const data = doc.data();
                     // only sync facts we don't have
                     store.put({ ...data, synced: true });
                  });
              }
              console.log("Memory Merged across devices securely via Cloud");
              resolve();
          } catch (e) {
              console.error("Neural Sync failed", e);
              // Fallback to delay
              setTimeout(resolve, 2000);
          }
      });
  }

  async getTasks(userId: string): Promise<DBTask[]> {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readonly');
    const request = tx.objectStore('tasks').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async savePlugin(plugin: DBPlugin) {
    const db = await this.init();
    const tx = db.transaction('plugins', 'readwrite');
    const pluginWithId = { ...plugin, id: plugin.id || Date.now() + Math.floor(Math.random() * 1000) };
    return tx.objectStore('plugins').put(pluginWithId);
  }

  // --- KNOWLEDGE GRAPH MEMORY ---
  async addGraphNode(node: GraphNode): Promise<number> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction('graph_nodes', 'readwrite');
      const req = tx.objectStore('graph_nodes').put(node);
      req.onsuccess = () => {
          this.pushToCloud('graph_nodes', { ...node, id: req.result }, 'graph_nodes', node.userId);
          resolve(req.result as number);
      };
    });
  }

  async addGraphEdge(edge: GraphEdge): Promise<number> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction('graph_edges', 'readwrite');
      const req = tx.objectStore('graph_edges').put(edge);
      req.onsuccess = () => {
          this.pushToCloud('graph_edges', { ...edge, id: req.result }, 'graph_edges', edge.userId);
          resolve(req.result as number);
      };
    });
  }

  async getGraphNodes(userId: string): Promise<GraphNode[]> {
    const db = await this.init();
    const tx = db.transaction('graph_nodes', 'readonly');
    const index = tx.objectStore('graph_nodes').index('userId');
    return new Promise((resolve) => {
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result);
    });
  }

  async getGraphEdges(userId: string): Promise<GraphEdge[]> {
    const db = await this.init();
    const tx = db.transaction('graph_edges', 'readonly');
    const index = tx.objectStore('graph_edges').index('userId');
    return new Promise((resolve) => {
      const req = index.getAll(userId);
      req.onsuccess = () => resolve(req.result);
    });
  }

  // --- COLLABORATIVE SHADOWS (AGENT TO AGENT) ---
  async addShadowMessage(msg: ShadowMessage): Promise<number> {
    const db = await this.init();
    return new Promise(async (resolve) => {
        const tx = db.transaction('shadow_messages', 'readwrite');
        const req = tx.objectStore('shadow_messages').put(msg);
        req.onsuccess = async () => {
            if (auth) {
                // write directly to firestore so the other user can see it
                const { doc, setDoc, getFirestore } = await import('firebase/firestore');
                setDoc(doc(getFirestore(), 'users', msg.toUserId, 'shadow_messages', Date.now().toString()), { ...msg, id: req.result });
            }
            resolve(req.result as number);
        };
    });
  }

  async getShadowMessages(userId: string): Promise<ShadowMessage[]> {
    const db = await this.init();
    const tx = db.transaction('shadow_messages', 'readonly');
    return new Promise((resolve) => {
      const store = tx.objectStore('shadow_messages');
      const request = store.getAll();
      request.onsuccess = () => {
         const msgs = request.result.filter((m: any) => m.toUserId === userId || m.userId === userId);
         resolve(msgs);
      }
    });
  }

  async getPluginsByUserId(userId: string): Promise<DBPlugin[]> {
    const db = await this.init();
    const tx = db.transaction('plugins', 'readonly');
    const request = tx.objectStore('plugins').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async saveTask(task: DBTask, skipCloud = false) {
    if (task.userId) task.userId = task.userId.toLowerCase();
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tasks', 'readwrite');
        const taskWithId = { ...task, id: task.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
        if (!skipCloud && task.userId !== 'GUEST') this.pushToCloud('tasks', taskWithId, 'tasks', task.userId);
        const req = tx.objectStore('tasks').put(taskWithId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
  }

  async updateTaskStatus(id: number, updates: Partial<DBTask>) {
      const db = await this.init();
      return new Promise<void>((resolve, reject) => {
          const tx = db.transaction('tasks', 'readwrite');
          const store = tx.objectStore('tasks');
          const req = store.get(id);
          req.onsuccess = () => {
              const task = req.result;
              if (task) {
                  const updated = { ...task, ...updates };
                  store.put(updated);
                  if (task.userId !== 'GUEST') this.pushToCloud('tasks', updated, 'tasks', task.userId);
              }
          };
          req.onerror = () => reject(req.error);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }

  async saveFact(fact: DBFact, skipCloud = false) {
    if (fact.userId) fact.userId = fact.userId.toLowerCase();
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    const factWithId = { ...fact, id: fact.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
    if (!skipCloud && fact.userId !== 'GUEST') this.pushToCloud('memory', factWithId, 'memory', fact.userId);
    return tx.objectStore('memory').put(factWithId); // Changed to put to allow updates
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const db = await this.init();
    const tx = db.transaction('memory', 'readonly');
    const request = tx.objectStore('memory').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async deleteMemory(id: number) {
      const db = await this.init();
      return new Promise<void>((resolve, reject) => {
          const tx = db.transaction('memory', 'readwrite');
          const req = tx.objectStore('memory').delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
      });
  }

  async getProfile(email: string): Promise<UserProfile | undefined> {
      const cleanEmail = email.toLowerCase();
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get(cleanEmail);
      
      let localProfile = await new Promise<UserProfile | undefined>((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
      });

      if (!localProfile && db && cleanEmail !== 'guest') {
         try {
             const docSnap = await getDoc(doc(db, "users", cleanEmail));
             if (docSnap.exists()) {
                 const cloudData = docSnap.data() as UserProfile;
                 localProfile = { ...cloudData, email: cleanEmail };
                 await this.saveProfile(localProfile, true); 
             }
         } catch(e) { console.warn("[DB] Cloud fetch failed/skipped:", e); }
      }

      if (localProfile && !localProfile.affiliate) {
          localProfile.affiliate = {
              isMarketer: false,
              referralCode: (localProfile.name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(),
              totalEarnings: 0,
              referralsCount: 0,
              payoutHistory: []
          };
          await this.saveProfile(localProfile, true);
      }

      if (localProfile && localProfile.personalKeys) {
          localProfile.personalKeys = {
              githubToken: decryptData(localProfile.personalKeys.githubToken || '', localProfile.email),
              vercelToken: decryptData(localProfile.personalKeys.vercelToken || '', localProfile.email),
              binanceApiKey: decryptData(localProfile.personalKeys.binanceApiKey || '', localProfile.email),
              binanceSecretKey: decryptData(localProfile.personalKeys.binanceSecretKey || '', localProfile.email),
              metaAccessToken: decryptData(localProfile.personalKeys.metaAccessToken || '', localProfile.email),
              openaiApiKey: decryptData(localProfile.personalKeys.openaiApiKey || '', localProfile.email),
              anthropicApiKey: decryptData(localProfile.personalKeys.anthropicApiKey || '', localProfile.email),
              geminiApiKey: decryptData(localProfile.personalKeys.geminiApiKey || '', localProfile.email),
          };
      }

      return localProfile;
  }

  async saveProfile(profile: UserProfile, skipCloud = false) {
      const secureProfile = { ...profile, email: profile.email.toLowerCase(), synced: true };
      
      if (secureProfile.personalKeys) {
          secureProfile.personalKeys = {
              githubToken: encryptData(secureProfile.personalKeys.githubToken || '', profile.email.toLowerCase()),
              vercelToken: encryptData(secureProfile.personalKeys.vercelToken || '', profile.email.toLowerCase()),
              binanceApiKey: encryptData(secureProfile.personalKeys.binanceApiKey || '', profile.email.toLowerCase()),
              binanceSecretKey: encryptData(secureProfile.personalKeys.binanceSecretKey || '', profile.email.toLowerCase()),
              metaAccessToken: encryptData(secureProfile.personalKeys.metaAccessToken || '', profile.email.toLowerCase()),
              openaiApiKey: encryptData(secureProfile.personalKeys.openaiApiKey || '', profile.email.toLowerCase()),
              anthropicApiKey: encryptData(secureProfile.personalKeys.anthropicApiKey || '', profile.email.toLowerCase()),
              geminiApiKey: encryptData(secureProfile.personalKeys.geminiApiKey || '', profile.email.toLowerCase()),
          };
      }

      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readwrite');
      const request = tx.objectStore('profiles').put(secureProfile);
      if (!skipCloud && profile.email !== 'GUEST') this.pushToCloud('profiles', secureProfile);
      return new Promise((resolve, reject) => { request.onsuccess = () => resolve(true); request.onerror = () => reject(request.error); });
  }

  async getAllProfiles(forceSync: boolean = false): Promise<UserProfile[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('profiles', 'readonly').objectStore('profiles').getAll();
      
      const localProfiles = await new Promise<UserProfile[]>((resolve) => { request.onsuccess = () => resolve(request.result || []); request.onerror = () => resolve([]); });

      // Only fetch all from Firestore if forced, or if local cache is completely empty and we are online.
      // This prevents massive Quota issues from components repeatedly doing full table scans.
      if (db && (forceSync || localProfiles.length === 0)) {
          try {
              const snap = await getDocs(collection(db, "users"));
              const cloudProfiles: UserProfile[] = [];
              snap.forEach((doc) => {
                  const p = { ...doc.data(), email: doc.id } as UserProfile;
                  cloudProfiles.push(p);
                  this.saveProfile(p, false); // cache it
              });
              return cloudProfiles;
          } catch(e) {
              console.warn("[Shadow Core] Failed to fetch all profiles", e);
          }
      }
      return localProfiles;
  }

  // --- PAYOUT APPROVAL ---
  async approvePayout(email: string, payoutId: number) {
      const profile = await this.getProfile(email);
      if (profile && profile.affiliate?.payoutHistory) {
          const updatedHistory = profile.affiliate.payoutHistory.map(p => 
              (p.date === payoutId || p.id === payoutId) ? { ...p, status: 'paid' as const } : p
          );
          
          const updatedProfile = { 
              ...profile, 
              affiliate: { ...profile.affiliate, payoutHistory: updatedHistory } 
          };
          
          await this.saveProfile(updatedProfile);
      }
  }

  async getAudioSegment(id: string): Promise<string | null> {
      try {
          const dbLocal = await this.init();
          const tx = dbLocal.transaction('audio_cache', 'readonly');
          const store = tx.objectStore('audio_cache');
          return new Promise((resolve) => {
              const req = store.get(id);
              req.onsuccess = () => resolve(req.result ? req.result.base64 : null);
              req.onerror = () => resolve(null);
          });
      } catch (e) { return null; }
  }

  async saveAudioSegment(id: string, base64: string): Promise<void> {
      try {
          const dbLocal = await this.init();
          const tx = dbLocal.transaction('audio_cache', 'readwrite');
          tx.objectStore('audio_cache').put({ id, base64 });
      } catch (e) { console.error('Failed saving audio cache', e); }
  }

  async getHistory(userId: string, limit?: number, offset?: number): Promise<DBMessage[]> {
    const db = await this.init();
    const tx = db.transaction('history', 'readonly');
    const index = tx.objectStore('history').index('userId');
    
    return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(userId), 'prev');
        const results: DBMessage[] = [];
        let hasAdvanced = false;

        request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
                if (offset && offset > 0 && !hasAdvanced) {
                    hasAdvanced = true;
                    cursor.advance(offset);
                    return;
                }
                
                const msg = cursor.value;
                results.push({ ...msg, text: decryptData(msg.text, userId) });
                
                if (limit && results.length >= limit) {
                    resolve(results.reverse());
                    return;
                }
                cursor.continue();
            } else {
                resolve(results.reverse());
            }
        };
        request.onerror = () => reject(request.error);
    });
  }

  async clearHistory(userId: string): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const index = store.index('userId');
    const request = index.openCursor(IDBKeyRange.only(userId));

    return new Promise((resolve, reject) => {
        request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        tx.oncomplete = () => {
            try {
               localStorage.removeItem('shadow_history_sync');
               localStorage.setItem('shadow_chat_cleared', Date.now().toString());
            } catch(e) {}
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
  }

  async setGlobalPulse(text: string) {
      const dbLocal = await this.init();
      return new Promise<void>((resolve, reject) => {
          const tx = dbLocal.transaction('config', 'readwrite');
          const pulseData = { text, timestamp: Date.now() };
          if (db) setDoc(doc(db, "system", "pulse"), pulseData).catch(console.error);
          const req = tx.objectStore('config').put({ key: 'latest_pulse', value: pulseData, lastUpdated: Date.now() });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
      });
  }

  async getGlobalPulse(): Promise<{ text: string, timestamp: number } | null> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('config', 'readonly').objectStore('config').get('latest_pulse');
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value || null); request.onerror = () => resolve(null); });
  }

  async updateLastPulseReceived(email: string, timestamp: number) {
      const profile = await this.getProfile(email);
      if (profile) await this.saveProfile({ ...profile, lastPulseReceived: timestamp }, true); 
  }

  async getSyncStats(): Promise<number> { return db ? 100 : 0; }
  async migrateGuestMessages(messages: DBMessage[]) { return; }

  async getFSItemsByParent(userId: string, parentId: number | string | null): Promise<DBFSItem[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('fs', 'readonly').objectStore('fs').getAll();
      return new Promise((resolve) => { 
          request.onsuccess = async () => { 
              const all = request.result as DBFSItem[]; 
              let filtered = all.filter(i => {
                  const uidMatch = !i.userId || (i.userId || '').toLowerCase() === userId.toLowerCase() || (i.userId || '').toLowerCase() === 'guest';
                  const normalizedItemParent = (i.parentId === 'null' || i.parentId === 'undefined' || i.parentId === undefined) ? null : i.parentId;
                  const normalizedArgParent = (parentId === 'null' || parentId === 'undefined' || parentId === undefined) ? null : parentId;
                  const parentMatch = normalizedItemParent == normalizedArgParent;
                  return uidMatch && parentMatch;
              });
              
              if (filtered.length === 0 && db) {
                 try {
                     const snap = await getDocs(query(collection(db, `users/${userId.toLowerCase()}/filesystem`)));
                     const onlineData: DBFSItem[] = [];
                     snap.forEach(d_doc => {
                         const d = d_doc.data() as DBFSItem;
                         const parsedId = Number(d_doc.id);
                         d.id = d.id || (!isNaN(parsedId) ? parsedId : d_doc.id as any);
                         onlineData.push(d);
                         this.saveFSItem(d, true, true); // save locally
                     });
                     filtered = onlineData.filter(i => {
                         const normalizedItemParent = (i.parentId === 'null' || i.parentId === 'undefined' || i.parentId === undefined) ? null : i.parentId;
                         const normalizedArgParent = (parentId === 'null' || parentId === 'undefined' || parentId === undefined) ? null : parentId;
                         return normalizedItemParent == normalizedArgParent;
                     });
                 } catch(e) { console.error("FS Fallback error:", e); }
              }
              resolve(filtered); 
          }; 
          request.onerror = (e) => { console.error("IDB getFSItemsByParent error:", e); resolve([]); }; 
      });
  }
  async getFSItemsByUserId(userId: string): Promise<DBFSItem[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('fs', 'readonly').objectStore('fs').getAll();
      return new Promise((resolve) => { 
          request.onsuccess = async () => {
              const all = request.result as DBFSItem[];
              let filtered = all.filter(i => !i.userId || (i.userId || '').toLowerCase() === userId.toLowerCase() || (i.userId || '').toLowerCase() === 'guest');
              
              if (filtered.length === 0 && db) {
                 try {
                     const snap = await getDocs(query(collection(db, `users/${userId.toLowerCase()}/filesystem`)));
                     const onlineData: DBFSItem[] = [];
                     snap.forEach(d_doc => {
                         const d = d_doc.data() as DBFSItem;
                         const parsedId = Number(d_doc.id);
                         d.id = d.id || (!isNaN(parsedId) ? parsedId : d_doc.id as any);
                         onlineData.push(d);
                         this.saveFSItem(d, true, true); // save locally
                     });
                     filtered = onlineData;
                 } catch(e) { console.error("FS Fallback error:", e); }
              }
              resolve(filtered);
          };
          request.onerror = (e) => { console.error("IDB getFSItemsByUserId error:", e); resolve([]); };
      });
  }
  async createFSItem(item: DBFSItem, skipCloud = false): Promise<number> {
      if (item.userId) item.userId = item.userId.toLowerCase();
      const dbLocal = await this.init();
      const itemWithId = { ...item, id: item.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
      const request = dbLocal.transaction('fs', 'readwrite').objectStore('fs').add(itemWithId);
      if (!skipCloud && itemWithId.userId !== 'GUEST') {
          this.pushToCloud('filesystem', itemWithId, 'filesystem', itemWithId.userId);
      }
      return new Promise((resolve) => { 
          request.onsuccess = () => {
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow_fs_update'));
              resolve(request.result as number);
          }; 
      });
  }
  async updateFSItem(id: number, updates: Partial<DBFSItem>) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('fs', 'readwrite');
      const store = tx.objectStore('fs');
      return new Promise<void>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
              const data = req.result;
              if (data) {
                  const updatedData = { ...data, ...updates, synced: true };
                  store.put(updatedData);
                  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shadow_fs_update'));
                  if (updatedData.userId !== 'GUEST') {
                      this.pushToCloud('filesystem', updatedData, 'filesystem', updatedData.userId);
                  }
              }
              resolve();
          };
          req.onerror = () => resolve();
      });
  }

  async registerReferral(referrerCode: string, commissionAmount: number) {
      const allProfiles = await this.getAllProfiles();
      const referrer = allProfiles.find(p => p.affiliate?.referralCode === referrerCode);
      if (referrer && referrer.affiliate) {
          referrer.affiliate.totalEarnings += commissionAmount; 
          referrer.affiliate.referralsCount += 1;
          await this.saveProfile(referrer);
      }
  }

  async recordPayout(email: string, amount: number) {
      const profile = await this.getProfile(email);
      if (profile && profile.affiliate) {
          const payout = { date: Date.now(), amount: amount, status: 'pending' as const };
          profile.affiliate.payoutHistory.push(payout);
          profile.affiliate.totalEarnings = Math.max(0, profile.affiliate.totalEarnings - amount);
          await this.saveProfile(profile);
      }
  }

  async getSystemKeys(): Promise<SystemKeys | null> {
      try {
          if (!db || !navigator.onLine) return null;
          const snap = await getDoc(doc(db, 'system', 'keys'));
          return snap.exists() ? snap.data() as SystemKeys : null;
      } catch (e: any) {
          // Silently handle offline and permission errors without cluttering console
          if (e?.code !== 'unavailable' && !e?.message?.includes('offline')) {
              console.warn("System keys unavailable in current network state:", e?.message || e);
          }
          return null;
      }
  }

  async saveSystemKeys(keys: SystemKeys) {
      if (!db) throw new Error('DB not initialized');
      await setDoc(doc(db, 'system', 'keys'), keys, { merge: true });
  }

  async saveContact(contact: DBContact) {
      if (contact.userId) contact.userId = contact.userId.toLowerCase();
      const db = await this.init();
      const contactWithId = { ...contact, id: contact.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
      if (contact.userId !== 'GUEST') this.pushToCloud('contacts', contactWithId, 'contacts', contact.userId);
      return db.transaction('contacts', 'readwrite').objectStore('contacts').add(contactWithId);
  }
  async getContacts(userId?: string): Promise<DBContact[]> {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readonly');
      const request = userId ? tx.objectStore('contacts').index('userId').getAll(userId) : tx.objectStore('contacts').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async saveFeedback(feedback: DBFeedback) {
      const localDB = await this.init();
      const feedbackWithId = { ...feedback, id: feedback.id || Date.now() + Math.floor(Math.random() * 1000) };
      const request = localDB.transaction('feedback', 'readwrite').objectStore('feedback').add(feedbackWithId);
      this.pushToCloud('feedback', feedbackWithId);
      return request;
  }
  async getAllFeedback(): Promise<DBFeedback[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('feedback', 'readonly').objectStore('feedback').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async getGlobalRules(): Promise<string> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('config', 'readonly').objectStore('config').get('global_rules');
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value || "- أنت ظل رقمي مصري أصيل.\n- ولاؤك الأول والأخير لصاحب الحساب (الماستر).\n- حافظ على أسرار المستخدم كأنها أسرار نووية.\n- تحدث بلهجة مصرية قوية، ذكية، ومختصرة.\n- هدفك هو نجاح الماستر وراحته."); request.onerror = () => resolve(""); });
  }

  async updateGlobalRules(rules: string, skipCloud = false) {
      if (!skipCloud && db) setDoc(doc(db, "system", "rules"), { text: rules, updated: Date.now() }).catch(console.error);
      const dbLocal = await this.init();
      return dbLocal.transaction('config', 'readwrite').objectStore('config').put({ key: 'global_rules', value: rules, lastUpdated: Date.now() });
  }

  // --- NEW AGENT METHODS ---
  async getAgentProfile(agentId: string): Promise<AgentProfile | null> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('agents', 'readonly').objectStore('agents').get(agentId);
      
      const localAgent = await new Promise<AgentProfile | null>(resolve => {
           request.onsuccess = () => resolve(request.result || null);
           request.onerror = () => resolve(null);
      });

      // Try Cloud fetch to ensure freshness
      if (db) {
          try {
              const snap = await getDoc(doc(db, "system_agents", agentId));
              if (snap.exists()) {
                  const cloudAgent = snap.data() as AgentProfile;
                  if (!localAgent || cloudAgent.lastUpdated > localAgent.lastUpdated) {
                       await this.saveAgentProfile(cloudAgent, true); // Update local cache
                       return cloudAgent;
                  }
              }
          } catch(e) {}
      }
      return localAgent;
  }

  async saveAgentProfile(agent: AgentProfile, skipCloud = false) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('agents', 'readwrite');
      tx.objectStore('agents').put(agent);
      if (!skipCloud) await this.pushToCloud('system_agents', agent);
      return tx.oncomplete;
  }

  async getAllAgents(): Promise<AgentProfile[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('agents', 'readonly').objectStore('agents').getAll();
      return new Promise(resolve => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  }

  // --- COUPON METHODS ---
  async saveCoupon(coupon: DBCoupon) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('coupons', 'readwrite');
      tx.objectStore('coupons').put(coupon);
      await this.pushToCloud('coupons', coupon);
  }

  async getCoupon(code: string): Promise<DBCoupon | null> {
      if (!code) return null;
      const cleanCode = code.toUpperCase().trim();
      if (db) {
          try {
              const snap = await getDoc(doc(db, "system_coupons", cleanCode));
              if (snap.exists()) return snap.data() as DBCoupon;
          } catch(e) {}
      }
      const dbLocal = await this.init();
      return new Promise(resolve => {
          const req = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').get(cleanCode);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
      });
  }

  async getAllCoupons(): Promise<DBCoupon[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').getAll();
      
      const localCoupons = await new Promise<DBCoupon[]>((resolve) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });

      if (db) {
          try {
              const snap = await getDocs(collection(db, "system_coupons"));
              const cloudCoupons: DBCoupon[] = [];
              snap.forEach((doc) => cloudCoupons.push(doc.data() as DBCoupon));
              if (cloudCoupons.length > localCoupons.length) return cloudCoupons;
          } catch(e) {}
      }
      return localCoupons;
  }

  async deleteCoupon(code: string) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('coupons', 'readwrite');
      tx.objectStore('coupons').delete(code);
      if (db) await deleteDoc(doc(db, "system_coupons", code));
  }

  async getConfig(key: string): Promise<any> {
      const db = await this.init();
      const request = db.transaction('config', 'readonly').objectStore('config').get(key);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value); request.onerror = () => resolve(null); });
  }
  async setConfig(key: string, value: any) {
      const db = await this.init();
      return db.transaction('config', 'readwrite').objectStore('config').put({ key, value, lastUpdated: Date.now() });
  }
}

export const shadowDB = new ShadowDB();