/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  BookOpen,
  Settings,
  MessageSquare,
  Award,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Loader2,
  BookmarkCheck,
  User,
} from 'lucide-react';
import { LanguageCode, ProficiencyLevel, Message, Scenario, SessionStats, User as UserType } from './types';
import { LANGUAGES, SCENARIOS } from './data';
import { LanguageSelector } from './components/LanguageSelector';
import { ScenarioGrid } from './components/ScenarioGrid';
import { ChatInterface } from './components/ChatInterface';
import { StatsFeedback } from './components/StatsFeedback';
import { UserProfile } from './components/UserProfile';

export default function App() {
  const [step, setStep] = useState<'setup' | 'scenarios' | 'practice' | 'account'>('setup');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('es');
  const [selectedProficiency, setSelectedProficiency] = useState<ProficiencyLevel>('intermediate');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<boolean>(false);
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoadingTts, setIsLoadingTts] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Live Practice Statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    accuracyScore: 100,
    messagesSent: 0,
    newWords: [],
    scenariosCompleted: false,
  });

  // Load current user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lingo_current_user');
    if (storedUser) {
      try {
        const u: UserType = JSON.parse(storedUser);
        setCurrentUser(u);
        setSessionStats({
          accuracyScore: u.accuracy || 100,
          messagesSent: 0,
          newWords: u.vocabularyVault || [],
          scenariosCompleted: false,
        });
      } catch (e) {
        console.warn('Could not parse stored current user', e);
      }
    }
  }, []);

  const handleUserLogin = (u: UserType) => {
    setCurrentUser(u);
    setStep('setup');
    setSessionStats({
      accuracyScore: u.accuracy || 100,
      messagesSent: 0,
      newWords: u.vocabularyVault || [],
      scenariosCompleted: false,
    });
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setStep('setup');
    localStorage.removeItem('lingo_current_user');
    setSessionStats({
      accuracyScore: 100,
      messagesSent: 0,
      newWords: [],
      scenariosCompleted: false,
    });
  };

  // Safe release of audio on unmount or navigation
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
      }
    };
  }, [activeAudio]);

  const activeLanguageDef = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  // Starts or Resets a Conversation Scenario
  const handleStartScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStep('practice');

    // Create Initial Message
    const initialText = scenario.initialMessage[selectedLanguage];
    
    // Simple prompt-based or default translation for initial scenario greets
    const initialTranslationMap: Record<LanguageCode, string> = {
      es: 'Hello! Welcome to Cafe El Sol. What would you like to have today?',
      fr: 'Hello! Welcome to Cafe de Paris. What can I serve you today?',
      de: 'Hello! Welcome to Cafe Sonnenschein. What can I get for you today?',
      ja: 'Hello! Welcome to Cafe Hikari. What will you have today?',
      it: 'Hello! Welcome to Cafe Bella Vita. What would you like to order today?',
      en: 'Hello! Welcome to Dawn Bistro. What can I get started for you today?',
    };

    const initialSuggestionsMap: Record<LanguageCode, string[]> = {
      es: ['Hola, me gustaría un café.', 'Hola, ¿qué pasteles tienes hoy?', 'Un croissant, por favor.'],
      fr: ['Bonjour, je voudrais un café.', 'Qu’est-ce que vous avez comme pâtisseries ?', 'Un croissant, s’il vous plaît.'],
      de: ['Hallo, ich hätte gerne einen Kaffee.', 'Was für Gebäck haben Sie heute?', 'Einen Croissant, bitte.'],
      ja: ['こんにちは、コーヒーをお願いします。', '今日のケーキは何がありますか？', 'クロワッサンを一つください。'],
      it: ['Ciao, vorrei un caffè.', 'Che dolci avete oggi?', 'Un croissant, per favore.'],
      en: ['Hi, I would like a coffee.', 'What pastries do you have today?', 'A croissant, please.'],
    };

    const firstMsg: Message = {
      id: 'init-greet',
      sender: 'ai',
      text: initialText,
      translation: initialTranslationMap[selectedLanguage] || 'Hello! Let us begin our practice.',
      suggestions: initialSuggestionsMap[selectedLanguage] || [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([firstMsg]);
    setSessionStats({
      accuracyScore: 100,
      messagesSent: 0,
      newWords: [],
      scenariosCompleted: false,
    });
  };

  const handleRestartScenario = () => {
    if (selectedScenario) {
      handleStartScenario(selectedScenario);
    }
  };

  // Submits the typed text response
  const handleSendMessage = async (text: string) => {
    if (!selectedScenario || isGeneratingResponse) return;

    // 1. Append temporary message on the client
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsGeneratingResponse(true);

    // 2. Format simple history context for the backend
    const apiHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          targetLang: activeLanguageDef.name,
          nativeLang: 'English',
          proficiency: selectedProficiency,
          history: apiHistory,
          userText: text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate partner response.');
      }

      const { reply } = data;

      // 3. Construct AI Reply payload
      const aiReplyMsgId = `ai-${Date.now()}`;
      const newAiMsg: Message = {
        id: aiReplyMsgId,
        sender: 'ai',
        text: reply.text,
        translation: reply.translation,
        suggestions: reply.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Update message list, appending the AI reply AND updating user's grammar block
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === userMsgId) {
            return {
              ...m,
              grammarCorrection: reply.grammarCorrection,
            };
          }
          return m;
        }).concat(newAiMsg)
      );

      // Autoplay mentor voice feedback
      const companionVoice = selectedScenario.id === 'cafe' ? 'Fenrir' : selectedScenario.id === 'lost-directions' ? 'Kore' : selectedScenario.id === 'hotel-checkin' ? 'Zephyr' : selectedScenario.id === 'job-interview' ? 'Charon' : 'Puck';
      handlePlayTts(reply.text, companionVoice, aiReplyMsgId);

      // 4. Update session score analytics & vocabulary list
      setSessionStats((prev) => {
        const nextSent = prev.messagesSent + 1;
        const currentScore = reply.grammarCorrection?.score ?? 100;
        const nextAccuracy =
          prev.messagesSent === 0
            ? currentScore
            : (prev.accuracyScore * prev.messagesSent + currentScore) / nextSent;

        // Strip duplicate words from additions
        const wordVault = [...prev.newWords];
        if (reply.newWords && reply.newWords.length > 0) {
          reply.newWords.forEach((wordObj: { word: string; translation: string }) => {
            const exists = wordVault.some(
              (w) => w.word.toLowerCase() === wordObj.word.toLowerCase()
            );
            if (!exists && wordObj.word.trim()) {
              wordVault.push(wordObj);
            }
          });
        }

        // Sync to storage if logged in
        if (currentUser) {
          const totalTurns = currentUser.turns + 1;
          const userAcc = currentUser.turns === 0 ? currentScore : Math.round((currentUser.accuracy * currentUser.turns + currentScore) / totalTurns);
          const updatedUser: UserType = {
            ...currentUser,
            turns: totalTurns,
            accuracy: userAcc,
            vocabCount: wordVault.length,
            vocabularyVault: wordVault,
          };
          
          setCurrentUser(updatedUser);
          localStorage.setItem('lingo_current_user', JSON.stringify(updatedUser));
          
          const usersStr = localStorage.getItem('lingo_users');
          if (usersStr) {
            try {
              const users: UserType[] = JSON.parse(usersStr);
              const idx = users.findIndex((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());
              if (idx !== -1) {
                users[idx] = updatedUser;
                localStorage.setItem('lingo_users', JSON.stringify(users));
              }
            } catch (e) {}
          }
        }

        return {
          ...prev,
          messagesSent: nextSent,
          accuracyScore: nextAccuracy,
          newWords: wordVault,
        };
      });
    } catch (err: any) {
      console.error(err);
      // Append supportive error message
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Sorry, I encountered building context: "${err.message || 'Can’t respond right now'}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Submits the audio voice recording content
  const handleSendVoice = async (base64Audio: string, mimeType: string) => {
    if (!selectedScenario || isGeneratingResponse) return;

    setIsGeneratingResponse(true);

    const apiHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          targetLang: activeLanguageDef.name,
          nativeLang: 'English',
          proficiency: selectedProficiency,
          history: apiHistory,
          audio: base64Audio,
          audioMime: mimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process voice response.');
      }

      const { userInputTranscribed, reply } = data;

      // Append Transcribed Voice Bubble for User
      const userMsgId = `user-${Date.now()}`;
      const newUserMsg: Message = {
        id: userMsgId,
        sender: 'user',
        text: userInputTranscribed || '[Inaudible Speech]',
        grammarCorrection: reply.grammarCorrection,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Append AI reply
      const aiReplyMsgId = `ai-${Date.now()}`;
      const newAiMsg: Message = {
        id: aiReplyMsgId,
        sender: 'ai',
        text: reply.text,
        translation: reply.translation,
        suggestions: reply.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newUserMsg, newAiMsg]);

      // Autoplay mentor voice feedback
      const companionVoice = selectedScenario.id === 'cafe' ? 'Fenrir' : selectedScenario.id === 'lost-directions' ? 'Kore' : selectedScenario.id === 'hotel-checkin' ? 'Zephyr' : selectedScenario.id === 'job-interview' ? 'Charon' : 'Puck';
      handlePlayTts(reply.text, companionVoice, aiReplyMsgId);

      // Update session statistics
      setSessionStats((prev) => {
        const nextSent = prev.messagesSent + 1;
        const currentScore = reply.grammarCorrection?.score ?? 100;
        const nextAccuracy =
          prev.messagesSent === 0
            ? currentScore
            : (prev.accuracyScore * prev.messagesSent + currentScore) / nextSent;

        const wordVault = [...prev.newWords];
        if (reply.newWords && reply.newWords.length > 0) {
          reply.newWords.forEach((wordObj: { word: string; translation: string }) => {
            const exists = wordVault.some(
              (w) => w.word.toLowerCase() === wordObj.word.toLowerCase()
            );
            if (!exists && wordObj.word.trim()) {
              wordVault.push(wordObj);
            }
          });
        }

        // Sync to storage if logged in
        if (currentUser) {
          const totalTurns = currentUser.turns + 1;
          const userAcc = currentUser.turns === 0 ? currentScore : Math.round((currentUser.accuracy * currentUser.turns + currentScore) / totalTurns);
          const updatedUser: UserType = {
            ...currentUser,
            turns: totalTurns,
            accuracy: userAcc,
            vocabCount: wordVault.length,
            vocabularyVault: wordVault,
          };
          
          setCurrentUser(updatedUser);
          localStorage.setItem('lingo_current_user', JSON.stringify(updatedUser));
          
          const usersStr = localStorage.getItem('lingo_users');
          if (usersStr) {
            try {
              const users: UserType[] = JSON.parse(usersStr);
              const idx = users.findIndex((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());
              if (idx !== -1) {
                users[idx] = updatedUser;
                localStorage.setItem('lingo_users', JSON.stringify(users));
              }
            } catch (e) {}
          }
        }

        return {
          ...prev,
          messagesSent: nextSent,
          accuracyScore: nextAccuracy,
          newWords: wordVault,
        };
      });
    } catch (err: any) {
      console.error(err);
      alert(`Voice Practice Error: ${err.message || 'Check your internet connection and try again.'}`);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Speaks any custom string aloud using our server TTS API
  const handlePlayTts = async (text: string, voiceName: string, id: string) => {
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }

    if (playingTtsId === id) {
      setPlayingTtsId(null);
      return;
    }

    setPlayingTtsId(id);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: activeLanguageDef.name,
          voice: voiceName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize speech.');
      }

      // Play audio chunk using browser Audio Element with Data URI
      const mime = data.mimeType || 'audio/mp3';
      const dataUri = `data:${mime};base64,${data.audio}`;
      const audio = new Audio(dataUri);
      setActiveAudio(audio);

      audio.onended = () => {
        setPlayingTtsId(null);
        setActiveAudio(null);
      };

      audio.onerror = () => {
        setPlayingTtsId(null);
        setActiveAudio(null);
      };

      await audio.play();
    } catch (err) {
      console.error('Playback failed:', err);
      setPlayingTtsId(null);
      setActiveAudio(null);
    }
  };

  // Speaks individual vocabulary terms from Vault list using default voice name
  const handlePronounceWord = async (word: string) => {
    setIsLoadingTts(word);
    try {
      const defaultVoice = activeLanguageDef.defaultVoice;
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: word,
          targetLang: activeLanguageDef.name,
          voice: defaultVoice,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error();

      const mime = data.mimeType || 'audio/mp3';
      const dataUri = `data:${mime};base64,${data.audio}`;
      const audio = new Audio(dataUri);
      await audio.play();
    } catch {
      console.warn('Could not speak vocabulary word');
    } finally {
      setIsLoadingTts(null);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans relative" id="application-root">
      {/* Decorative colored ambient blobs of premium UI */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-100/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-orange-100/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Global Application Header */}
      <header className="sticky top-0 bg-white border-b-2 border-indigo-100/80 z-50 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 shrink-0">
            <span className="text-white font-black text-xl">L</span>
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
              <span>LingoAI</span>
              <span className="text-indigo-600">Lumi</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 uppercase">AI Practice Companion</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-4 animate-fade-in">
            {/* Dynamic Streak Badge from Vibrant Palette */}
            <div className="flex items-center gap-2 bg-amber-100 border border-amber-200/50 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="text-sm">🔥</span>
              <span className="font-bold text-amber-700 text-xs whitespace-nowrap">
                {sessionStats.messagesSent > 0 ? `${14 + Math.floor(sessionStats.messagesSent / 3)} Day Streak` : '14 Day Streak'}
              </span>
            </div>

            {/* Dynamic target indicators */}
            {step !== 'setup' && step !== 'account' && (
              <div className="flex items-center gap-2 animate-fade-in text-xs font-semibold">
                <span className="text-sm shrink-0">{activeLanguageDef.flag}</span>
                <span className="text-indigo-750 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100/60 capitalize font-bold text-indigo-700">
                  {activeLanguageDef.name} ({selectedProficiency})
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {!currentUser ? (
        /* LOCK GATE: Authentication Required Space */
        <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10">
          <UserProfile
            currentUser={currentUser}
            onLogin={handleUserLogin}
            onLogout={handleUserLogout}
            sessionStats={{
              accuracyScore: sessionStats.accuracyScore,
              messagesSent: sessionStats.messagesSent,
              newWords: sessionStats.newWords,
            }}
          />
        </main>
      ) : (
        <>
          {/* Primary Navigation System Tab Bar */}
          <nav className="bg-white border-b-2 border-indigo-50 px-4 py-2 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 select-none z-40" id="app-nav-tabs">
            <button
              id="nav-tab-setup"
              onClick={() => setStep('setup')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                step === 'setup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100/40'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Setup Goals</span>
            </button>

            <button
              id="nav-tab-scenarios"
              onClick={() => setStep('scenarios')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                step === 'scenarios'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100/40'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Scenarios</span>
            </button>

            <button
              id="nav-tab-practice"
              onClick={() => setStep('practice')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                step === 'practice'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100/40'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Speaking Lab</span>
              {selectedScenario && (
                <span className="w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full absolute -top-0.5 -right-0.5 animate-pulse"></span>
              )}
            </button>

            <button
              id="nav-tab-account"
              onClick={() => setStep('account')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                step === 'account'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100/40'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{currentUser ? currentUser.username : 'My Account'}</span>
            </button>
          </nav>

          {/* Primary Workspace View Area */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8 relative">
            <AnimatePresence mode="wait">
              {step === 'setup' && (
                <motion.div
                  key="setup-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  <div className="text-center max-w-2xl mx-auto space-y-3 mb-4">
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
                      Real-Time Speaking Partnership
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                      Speak any language with natural, instant feedback.
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                      LingoPartner places you in simulated real-world scenarios. Speak or write, learn key vocabulary, and see real-time grammar checks in a supportive practice space.
                    </p>
                  </div>

                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    selectedProficiency={selectedProficiency}
                    onSelectLanguage={setSelectedLanguage}
                    onSelectProficiency={setSelectedProficiency}
                  />

                  <div className="flex justify-center pt-4">
                    <button
                      id="btn-confirm-settings"
                      onClick={() => setStep('scenarios')}
                      className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-brand-100 hover:shadow-2xl hover:shadow-brand-100/55 transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-[1.025]"
                    >
                      <span>Select Scene Scenarios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'scenarios' && (
                <motion.div
                  key="scenarios-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <button
                    id="btn-back-to-settings"
                    onClick={() => setStep('setup')}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition-all bg-indigo-50 hover:bg-indigo-100/50 px-4 py-2.5 rounded-xl border border-indigo-100 shadow-sm shrink-0 cursor-pointer mb-2 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Adjust Language & Proficiency Settings</span>
                  </button>

                  <ScenarioGrid
                    selectedLanguage={selectedLanguage}
                    selectedProficiency={selectedProficiency}
                    onSelectScenario={handleStartScenario}
                  />
                </motion.div>
              )}

              {step === 'practice' && (
                <motion.div
                  key="practice-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {!selectedScenario ? (
                    /* Interactive Practice Placeholder Callout */
                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-indigo-100 shadow-xl max-w-2xl mx-auto p-8 space-y-6 select-none" id="practice-unavailable">
                      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner shadow-indigo-100/60 border border-indigo-100 animate-pulse">
                        💬
                      </div>
                      <div className="space-y-2.5">
                        <h3 className="font-display font-black text-2xl text-slate-800 tracking-tight">Speaking Lab Unlocked</h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                          Get hands-on conversations with customized AI companions. To start talking, explore our situations directory and recruit a companion now!
                        </p>
                      </div>
                      <button
                        id="btn-goto-scenarios-cta"
                        onClick={() => setStep('scenarios')}
                        className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer inline-flex items-center gap-2 hover:scale-[1.01]"
                      >
                        <span>Browse Scenarios Directory</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Active Practice Arena */
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between gap-4">
                        <button
                          id="btn-leave-practice"
                          onClick={() => setStep('scenarios')}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-805 bg-indigo-50 hover:bg-indigo-100/50 px-4 py-2.5 rounded-xl border border-indigo-100 shadow-sm shrink-0 cursor-pointer active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Change Scenario Location</span>
                        </button>

                        <div className="flex gap-2 font-mono text-[10px] font-bold text-slate-450 uppercase select-none">
                          <span>Companion: {selectedScenario.characterName}</span>
                        </div>
                      </div>

                      {/* Responsive Split Screen Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="practice-split-view">
                        <div className="lg:col-span-2">
                          <ChatInterface
                            scenario={selectedScenario}
                            language={activeLanguageDef}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onSendVoice={handleSendVoice}
                            isGeneratingResponse={isGeneratingResponse}
                            onRestartScenario={handleRestartScenario}
                            onPlayTts={handlePlayTts}
                            playingTtsId={playingTtsId}
                          />
                        </div>
                        
                        <div className="lg:col-span-1" id="practice-sidebar">
                          <StatsFeedback
                            stats={sessionStats}
                            targetLang={activeLanguageDef.name}
                            onPronounceWord={handlePronounceWord}
                            isLoadingTts={isLoadingTts}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'account' && (
                <motion.div
                  key="account-screen"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <UserProfile
                    currentUser={currentUser}
                    onLogin={handleUserLogin}
                    onLogout={handleUserLogout}
                    sessionStats={{
                      accuracyScore: sessionStats.accuracyScore,
                      messagesSent: sessionStats.messagesSent,
                      newWords: sessionStats.newWords,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>Real-Time Practice Partner • LingoPartner</span>
          <div className="flex gap-4">
            <span>Powered by Gemini 3.5 Models</span>
            <span>•</span>
            <span>Offline-Safe local state sandbox</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
