/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageCode = 'es' | 'fr' | 'de' | 'ja' | 'it' | 'en';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LanguageDef {
  code: LanguageCode;
  name: string;
  flag: string;
  nativeName: string;
  defaultVoice: 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';
  greeting: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: ProficiencyLevel;
  iconName: string; // lucide icon name
  characterName: string;
  characterRole: string;
  characterBio: string;
  avatarSeed: string; // for nice background/accent rendering
  suggestedPrompt: string;
  initialMessage: Record<LanguageCode, string>;
}

export interface GrammarCorrection {
  original: string;
  corrected: string | null; // null means no correction needed or perfect grammar
  explanation: string | null;
  score: number; // 0-100 score for the message
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
  audio?: string; // base64 response string from TTS api
  grammarCorrection?: GrammarCorrection;
  suggestions?: string[]; // Clickable quick replies
  timestamp: string;
}

export interface SessionStats {
  accuracyScore: number; // average grammar score
  messagesSent: number;
  newWords: { word: string; translation: string }[];
  scenariosCompleted: boolean;
}

export interface User {
  username: string;
  email: string;
  password?: string;
  streak: number;
  accuracy: number;
  turns: number;
  vocabCount: number;
  completedScenarios: string[];
  vocabularyVault?: { word: string; translation: string }[];
}
