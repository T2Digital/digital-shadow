import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Scopes we configured in set_up_oauth
export const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.modify"
];

// In-memory access token cache
let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;

export const connectGoogle = async (): Promise<string> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Check your firebase configuration.");
  }

  const provider = new GoogleAuthProvider();
  // Add required scopes
  WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
  // Request offline access if needed, force prompt to ensure consent screen is shown
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error("Failed to get Google Access Token from login credential.");
    }
    
    cachedAccessToken = credential.accessToken;
    // Set token expiry (Google access tokens usually expire in 3600 seconds)
    tokenExpiry = Date.now() + 3500 * 1000;
    
    // Dispatch custom event to notify components that we are connected
    window.dispatchEvent(new CustomEvent('google_workspace_connected'));
    
    return cachedAccessToken;
  } catch (error) {
    console.error("Error connecting to Google Workspace:", error);
    throw error;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }
  // If expired or not present, return null. The app will prompt to reconnect.
  return null;
};

export const disconnectGoogle = () => {
  cachedAccessToken = null;
  tokenExpiry = null;
  window.dispatchEvent(new CustomEvent('google_workspace_disconnected'));
};

export const isGoogleConnected = (): boolean => {
  return cachedAccessToken !== null && tokenExpiry !== null && Date.now() < tokenExpiry;
};

// --- GOOGLE CALENDAR API FUNCTIONS ---

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

export const listCalendarEvents = async (maxResults = 10): Promise<CalendarEvent[]> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Calendar API Error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  return (data.items || []) as CalendarEvent[];
};

export const createCalendarEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Calendar API Error: ${res.status} - ${errText}`);
  }

  return await res.json() as CalendarEvent;
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Calendar API Error: ${res.status} - ${errText}`);
  }
};


// --- GMAIL API FUNCTIONS ---

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject?: string;
  from?: string;
  snippet?: string;
  date?: string;
}

export const listGmailMessages = async (maxResults = 10, q = "label:INBOX"): Promise<GmailMessageSummary[]> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API Error: ${res.status} - ${errText}`);
  }

  const listData = await res.json();
  const messages = listData.messages || [];
  
  // Fetch details for each message in parallel
  const detailPromises = messages.map(async (msg: { id: string, threadId: string }) => {
    try {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId, snippet: '' };
      
      const detailData = await detailRes.json();
      const headers = detailData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(بدون عنوان)';
      const from = headers.find((h: any) => h.name === 'From')?.value || '(مجهول)';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject,
        from,
        snippet: detailData.snippet || '',
        date
      };
    } catch (e) {
      return { id: msg.id, threadId: msg.threadId, snippet: '' };
    }
  });

  return await Promise.all(detailPromises);
};

export const sendGmailMessage = async (to: string, subject: string, body: string): Promise<{ id: string }> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

  // Construct MIME email message
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  const email = emailLines.join('\n');
  const base64SafeEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64SafeEmail })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API Error: ${res.status} - ${errText}`);
  }

  return await res.json();
};

export const archiveGmailMessage = async (messageId: string): Promise<void> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error("No active Google Workspace connection. Please connect first.");

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removeLabelIds: ['INBOX']
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API Error: ${res.status} - ${errText}`);
  }
};
