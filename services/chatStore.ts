import { create } from 'zustand';

interface ChatState {
  input: string;
  setInput: (input: string) => void;
  appStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
  setAppStatus: (status: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSentinelMode: boolean;
  setIsSentinelMode: (mode: boolean) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  
  page: number;
  setPage: (page: number) => void;
  hasMoreMessages: boolean;
  setHasMoreMessages: (has: boolean) => void;
  speechSupported: boolean;
  setSpeechSupported: (supported: boolean) => void;
  liveTranscript: string;
  setLiveTranscript: (t: string) => void;
  showCapabilities: boolean;
  setShowCapabilities: (s: boolean) => void;
  isProcessingImage: boolean;
  setIsProcessingImage: (s: boolean) => void;
  audioLevel: number;
  setAudioLevel: (l: number) => void;
  showBigFace: boolean;
  setShowBigFace: (s: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOffline: boolean;
  setIsOffline: (s: boolean) => void;
  thinkingStep: number;
  setThinkingStep: (s: number) => void;
  isDreaming: boolean;
  setIsDreaming: (s: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  input: '',
  setInput: (input) => set({ input }),
  appStatus: 'idle',
  setAppStatus: (appStatus) => set({ appStatus }),
  isMuted: false,
  setIsMuted: (isMuted) => set({ isMuted }),
  isSentinelMode: false,
  setIsSentinelMode: (isSentinelMode) => set({ isSentinelMode }),
  isSearchActive: false,
  setIsSearchActive: (isSearchActive) => set({ isSearchActive }),
  
  page: 1,
  setPage: (page) => set({ page }),
  hasMoreMessages: true,
  setHasMoreMessages: (hasMoreMessages) => set({ hasMoreMessages }),
  speechSupported: true,
  setSpeechSupported: (speechSupported) => set({ speechSupported }),
  liveTranscript: '',
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  showCapabilities: false,
  setShowCapabilities: (showCapabilities) => set({ showCapabilities }),
  isProcessingImage: false,
  setIsProcessingImage: (isProcessingImage) => set({ isProcessingImage }),
  audioLevel: 0,
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  showBigFace: false,
  setShowBigFace: (showBigFace) => set({ showBigFace }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  isOffline: false,
  setIsOffline: (isOffline) => set({ isOffline }),
  thinkingStep: 0,
  setThinkingStep: (thinkingStep) => set({ thinkingStep }),
  isDreaming: false,
  setIsDreaming: (isDreaming) => set({ isDreaming }),
}));
