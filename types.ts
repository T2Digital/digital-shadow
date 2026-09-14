
export interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  image?: string; // base64
}

export interface ShadowPersonality {
  name: string;
  traits: string[];
  spiritualConnection: string;
  learnedContext: string[];
}

export interface ShadowState {
  detectedContext: 'balanced' | 'spiritual' | 'financial' | 'professional';
  isLearning: boolean;
}
