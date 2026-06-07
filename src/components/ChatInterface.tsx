/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Message, Scenario, LanguageDef } from '../types';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Languages,
  Loader,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ChatInterfaceProps {
  scenario: Scenario;
  language: LanguageDef;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendVoice: (base64Audio: string, mimeType: string) => void;
  isGeneratingResponse: boolean;
  onRestartScenario: () => void;
  onPlayTts: (text: string, voiceName: string, id: string) => void;
  playingTtsId: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  scenario,
  language,
  messages,
  onSendMessage,
  onSendVoice,
  isGeneratingResponse,
  onRestartScenario,
  onPlayTts,
  playingTtsId,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [showExplanationId, setShowExplanationId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingResponse]);

  // Audio recording timer loop
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGeneratingResponse) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleStartRecording = async () => {
    try {
      if (isGeneratingResponse) return;
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine standard browser support
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/ogg';
      }
      if (!MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Strip header block
          const base64String = base64data.split(',')[1];
          onSendVoice(base64String, mimeType);
        };

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone recording error:', err);
      alert('Could not access microphone. Please enable permissions in your browser or type in your response.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleTranslation = (id: string) => {
    setShowTranslations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[480px] sm:h-[650px] bg-white rounded-3xl border-2 border-indigo-100 overflow-hidden shadow-xl shadow-indigo-100/40" id="chat-interface">
      {/* Companion Banner - Warm, rich and interactive header with vibrant level flag */}
      <div className="bg-white border-b-2 border-indigo-50 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-indigo-650 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 text-white font-black text-xl select-none">
              {scenario.characterName.slice(0, 1)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow"></span>
          </div>
          <div>
            <h3 className="font-display font-black text-slate-800 leading-tight flex items-center gap-2">
              <span>{scenario.characterName}</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Companion
              </span>
            </h3>
            <p className="text-[10px] text-slate-450 text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Practice: {scenario.title} ({language.name})
            </p>
          </div>
        </div>

        <button
          id="btn-restart-conv"
          onClick={onRestartScenario}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3.5 py-2 rounded-xl border border-indigo-100 transition-all font-bold cursor-pointer shadow-sm active:scale-95"
          title="Restart active scenario"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Scenario</span>
        </button>
      </div>

      {/* Learning Goals Tray from Vibrant Theme */}
      <div className="bg-slate-50 px-6 py-2.5 border-b border-indigo-100/40 text-[11px] text-slate-600 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-4">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate font-semibold">
            Objective: <span className="font-medium text-slate-500">"{scenario.suggestedPrompt}"</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 select-none shrink-0 bg-indigo-50 border border-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider font-mono">
          <span>{language.flag}</span>
          <span>{language.code.toUpperCase()}</span>
        </div>
      </div>

      {/* Chats Scroll Stage */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-sky-50/20" id="dialogues-stage">
        {messages.map((msg: Message) => {
          const isUser = msg.sender === 'user';
          
          if (isUser) {
            return (
              <div key={msg.id} className="flex flex-col items-end space-y-2 animate-fade-in" id={`chat-bubble-container-${msg.id}`}>
                {/* User Dialogue Bubble */}
                <div id={`chat-bubble-user-${msg.id}`} className="max-w-[85%] sm:max-w-[80%] bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 sm:px-4.5 sm:py-3.5 text-sm sm:text-base shadow-md leading-relaxed whitespace-pre-line font-medium">
                  {msg.text}
                </div>

                {/* Grammar Evaluation Indicator */}
                {msg.grammarCorrection && (
                  <div className="max-w-[85%] bg-white rounded-2xl border-2 border-indigo-50 p-4 shadow-xl shadow-indigo-100/30 space-y-3 self-end text-slate-700 animate-fade-in" id={`grammar-board-${msg.id}`}>
                    <div className="flex items-center justify-between border-b border-indigo-50 pb-2 gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>Grammar Check</span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          msg.grammarCorrection.score >= 90
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.grammarCorrection.score >= 75
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Score: {msg.grammarCorrection.score}/100
                      </span>
                    </div>

                    {msg.grammarCorrection.corrected ? (
                      <div className="space-y-2.5 text-sm leading-relaxed">
                        <div className="bg-rose-50 border border-rose-100/50 text-rose-800 rounded-xl p-3 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="block font-black text-[9px] text-rose-500 uppercase tracking-widest mb-0.5">Attempted Speech:</span>
                            <span className="line-through text-slate-500">{msg.grammarCorrection.original}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100/50 text-emerald-800 rounded-xl p-3 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="block font-black text-[9px] text-emerald-600 uppercase tracking-widest mb-0.5">Correct native way:</span>
                            <span className="font-bold">{msg.grammarCorrection.corrected}</span>
                          </div>
                        </div>
                        
                        <div className="pt-1 select-none">
                          <button
                            id={`btn-toggle-explain-${msg.id}`}
                            onClick={() => setShowExplanationId(showExplanationId === msg.id ? null : msg.id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-750 flex items-center gap-1 transition-colors cursor-pointer active:scale-95 py-1"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>{showExplanationId === msg.id ? 'Hide Explanation' : 'Explain Grammar Principle'}</span>
                          </button>
                          
                          {showExplanationId === msg.id && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-650 text-slate-600 animate-fade-in bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line font-medium">
                              {msg.grammarCorrection.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 font-bold flex items-center gap-2 bg-emerald-100/60 p-3 rounded-xl border border-emerald-200/50">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Flawless standard sentence structure! Beautiful work.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex items-start gap-3 animate-fade-in" id={`chat-bubble-container-${msg.id}`}>
                {/* Companion Avatar */}
                <div className="relative shrink-0 select-none">
                  <span className="w-9 h-9 rounded-full bg-indigo-600 text-[11px] text-white font-extrabold flex items-center justify-center shrink-0 border border-white shadow">
                    AI
                  </span>
                </div>

                <div className="flex flex-col items-start space-y-2 max-w-[80%]">
                  {/* AI Dialogue Bubble */}
                  <div id={`chat-bubble-ai-${msg.id}`} className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-4 sm:p-4.5 text-sm sm:text-base shadow-sm leading-relaxed whitespace-pre-line font-normal relative group">
                    <p className="text-base sm:text-lg leading-relaxed">{msg.text}</p>
                    {msg.translation && !showTranslations[msg.id] && (
                      <p className="text-xs text-slate-400 mt-1 italic group-hover:text-slate-500 transition-colors">"Translate to view English helper"</p>
                    )}

                    {/* Secondary Actions embedded in bubble */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-200/50 select-none">
                      {/* Hear Pronunciation Button */}
                      <button
                        id={`btn-hear-ai-${msg.id}`}
                        onClick={() => onPlayTts(msg.text, scenario.id === 'cafe' ? 'Fenrir' : scenario.id === 'lost-directions' ? 'Kore' : scenario.id === 'hotel-checkin' ? 'Zephyr' : scenario.id === 'job-interview' ? 'Charon' : 'Puck', msg.id)}
                        className={`text-[10px] font-extrabold px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 transition-all cursor-pointer ${
                          playingTtsId === msg.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''
                        }`}
                        title="Hear natural pronunciation"
                        disabled={playingTtsId === msg.id}
                      >
                        {playingTtsId === msg.id ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                            <span>Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />
                            <span>Pronounce</span>
                          </>
                        )}
                      </button>

                      {/* Display Translation Toggle */}
                      {msg.translation && (
                        <button
                          id={`btn-trans-ai-${msg.id}`}
                          onClick={() => toggleTranslation(msg.id)}
                          className="text-[10px] font-extrabold px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-200 rounded-lg text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Languages className="w-3.5 h-3.5 text-slate-500" />
                          <span>{showTranslations[msg.id] ? 'Hide English' : 'Translate'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Peek translation text / Tooltip tip box style from Vibrant Theme */}
                  {msg.translation && showTranslations[msg.id] && (
                    <div className="bg-white p-3.5 rounded-xl border-l-4 border-amber-400 shadow-md border-y border-r border-indigo-50 leading-relaxed text-slate-650 text-slate-700 text-xs italic animate-fade-in font-medium max-w-full">
                      <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Translation</p>
                      "{msg.translation}"
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}

        {/* Typing Response indicator */}
        {isGeneratingResponse && (
          <div className="flex items-start gap-3 animate-fade-in" id="loading-indicator">
            <span className="w-8 h-8 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0 border border-white animate-pulse">
              AI
            </span>
            <div className="flex flex-col items-start space-y-1">
              <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400 pl-1">
                {scenario.characterName} is listening and brainstorming feedback...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Replies Panel (Vibrant tag capsule look) */}
      {!isGeneratingResponse && messages.length > 0 && messages[messages.length - 1].sender === 'ai' && (messages[messages.length - 1].suggestions?.length ?? 0) > 0 && (
        <div className="bg-slate-50 px-6 py-3.5 border-t border-indigo-100/50 flex flex-wrap items-center gap-2 shrink-0 max-h-[140px] overflow-y-auto scrollbar-none" id="suggestions-box">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block w-full mb-1">
            Suggested Phrases (Click to select):
          </span>
          {messages[messages.length - 1].suggestions?.map((sug, i) => (
            <button
              key={sug + i}
              id={`sug-btn-${i}`}
              onClick={() => setInputText(sug)}
              className="text-xs bg-white text-indigo-700 hover:text-white border border-indigo-150 border-indigo-100 hover:bg-indigo-600 hover:border-indigo-600 px-3 py-1.5 rounded-full font-bold transition-all shadow-sm shrink-0 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px] active:scale-95"
              title={sug}
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Mic soundwave active and manual controls */}
      <div className="p-4 border-t border-indigo-100 bg-white shrink-0" id="action-center">
        {isRecording ? (
          /* Mic Active Recording Panel with pulse waves */
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex items-center justify-between animate-fade-in h-16 w-full relative" id="recording-stage">
            <div className="flex gap-1.5 items-center h-full select-none">
              <div className="w-1.5 h-6 bg-indigo-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
              <div className="w-1.5 h-4 bg-indigo-300 rounded-full"></div>
              <div className="w-1.5 h-12 bg-indigo-600 rounded-full animate-pulse [animation-delay:-0.2s]"></div>
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
              <div className="w-1.5 h-5 bg-indigo-300 rounded-full"></div>
              <p className="ml-3 text-indigo-700 font-bold text-xs italic tracking-wide animate-pulse hidden sm:block">Lumi is listening... ({formatTime(recordingSeconds)})</p>
              <p className="ml-2 text-indigo-700 font-bold text-xs italic tracking-wide animate-pulse block sm:hidden">({formatTime(recordingSeconds)})</p>
            </div>

            <button
              id="stop-rec-btn"
              onClick={handleStopRecording}
              className="px-3 py-2 sm:px-4.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-150 hover:scale-[1.02]"
            >
              <MicOff className="w-4 h-4" />
              <span className="hidden sm:inline">Tap to Send Voice</span>
              <span className="inline sm:hidden">Send Voice</span>
            </button>
          </div>
        ) : (
          /* Normal Input State Panel */
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            {/* Native Browser Microphone Button Triggers */}
            <button
              type="button"
              id="start-rec-btn"
              onClick={handleStartRecording}
              disabled={isGeneratingResponse}
              className="p-3.5 bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/30 text-indigo-600 rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
              title="Speak in target language"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Main Text Input box */}
            <input
              type="text"
              id="chat-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isGeneratingResponse}
              placeholder={
                isGeneratingResponse
                  ? `Please wait while ${scenario.characterName} compiles reply...`
                  : `Speak or type to ${scenario.characterName} in ${language.name}...`
              }
              className="flex-1 min-w-0 bg-slate-50 border-2 border-indigo-50 hover:border-indigo-100/80 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded-xl px-4 py-3.5 text-sm font-bold placeholder-slate-400 outline-none transition-all disabled:opacity-50"
            />

            {/* SEND button with explicit Vibrant Palette theme trigger */}
            <button
              type="submit"
              id="chat-send-submit"
              disabled={!inputText.trim() || isGeneratingResponse}
              className="p-3.5 bg-indigo-650 bg-indigo-600 border border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-30 disabled:hover:bg-indigo-650 cursor-pointer shadow-md shadow-indigo-100/40 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
