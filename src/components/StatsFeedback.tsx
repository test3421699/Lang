/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SessionStats } from '../types';
import * as Icons from 'lucide-react';

interface StatsFeedbackProps {
  stats: SessionStats;
  targetLang: string;
  onPronounceWord: (word: string) => void;
  isLoadingTts: string | null;
}

export const StatsFeedback: React.FC<StatsFeedbackProps> = ({
  stats,
  targetLang,
  onPronounceWord,
  isLoadingTts,
}) => {
  return (
    <div className="space-y-6" id="stats-panel">
      {/* Visual Analytics Card */}
      <div className="bg-white rounded-3xl border border-indigo-100/80 p-6 shadow-xl shadow-indigo-100/40">
        <h3 className="font-display text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
          Session Performance
        </h3>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          {/* Circular SVG Gauge for Accuracy */}
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="#e0e7ff"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke={
                  stats.accuracyScore >= 90
                    ? '#10b981' // emerald-500
                    : stats.accuracyScore >= 75
                    ? '#6366f1' // indigo-500
                    : stats.accuracyScore >= 50
                    ? '#f59e0b' // amber-500
                    : '#ef4444' // rose-500
                }
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - Math.max(1, stats.accuracyScore) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-xl font-black text-indigo-750 text-indigo-900">
                {Math.round(stats.accuracyScore)}%
              </span>
              <span className="text-[8px] text-slate-450 text-slate-500 uppercase tracking-widest font-black">
                Accuracy
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2 text-xs text-slate-650">
              <Icons.MessageCircle className="w-4 h-4 text-indigo-500" />
              <span>Turns Practiced: <strong className="text-indigo-950">{stats.messagesSent}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-650">
              <Icons.Flame className="w-4 h-4 text-amber-500" />
              <span>
                Status:{' '}
                <strong className="text-amber-700 capitalize">
                  {stats.messagesSent >= 6
                    ? 'Fluent Dialogue'
                    : stats.messagesSent >= 3
                    ? 'Warm Converser'
                    : 'Getting Warmed'}
                </strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-450 text-slate-500 leading-relaxed font-medium">
              Every turn, AI evaluates syntax, spelling, and vocabulary. Keep messaging to push your score!
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Vault Card */}
      <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-xl shadow-indigo-100/40 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between mb-4 border-b border-indigo-50/50 pb-3">
          <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Icons.BookOpen className="w-4 h-4 text-indigo-650 text-indigo-600" />
            Vocabulary Vault
          </h3>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-105 bg-indigo-100 px-2 py-0.5 rounded font-black">
            {stats.newWords.length} terms
          </span>
        </div>

        {stats.newWords.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <Icons.PlusCircle className="w-8 h-8 text-indigo-200 stroke-[1.5] mb-2" />
            <p className="text-xs text-slate-450 text-slate-500 font-medium leading-relaxed">
              New vocabulary terms highlighted by Lumi will populate here automatically as you practice.
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[260px] scrollbar-none pr-1">
            {stats.newWords.map((term, index) => (
              <div
                key={term.word + index}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl group transition-colors hover:border-indigo-100"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-display text-xs font-bold text-indigo-950 block truncate">
                    {term.word}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-medium">
                    {term.translation}
                  </span>
                </div>
                <button
                  id={`stats-pronounce-btn-${index}`}
                  onClick={() => onPronounceWord(term.word)}
                  disabled={isLoadingTts === term.word}
                  className="p-1 px-2.5 text-[10px] font-bold bg-white border border-slate-200 rounded-lg text-slate-650 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                  title="Listen Pronunciation"
                >
                  {isLoadingTts === term.word ? (
                    <Icons.Loader className="w-3 h-3 animate-spin text-indigo-600" />
                  ) : (
                    <Icons.Volume2 className="w-3 h-3 text-indigo-505" />
                  )}
                  <span>Pronounce</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Tips Card - Left-bordered Warm Amber Tip style card */}
      <div className="bg-white p-5 rounded-2xl border-l-4 border-amber-400 shadow-md shadow-indigo-100/30 border-y border-r border-indigo-50">
        <h4 className="font-display text-xs font-black text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icons.Lightbulb className="w-4 h-4 text-amber-500" />
          Pro-Partnership Tips
        </h4>
        <ul className="space-y-1.5 text-[11px] text-slate-650 text-slate-600 leading-relaxed font-semibold">
          <li className="flex items-start gap-1.5">
            <span className="text-amber-500 select-none">•</span>
            <span>Type or click the microphone to speak back.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-amber-500 select-none">•</span>
            <span>Click suggestions pills if you feel stuck or need help.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-amber-500 select-none">•</span>
            <span>Tap the voice speaker on a reply to hear correct accents.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-amber-500 select-none">•</span>
            <span>Study grammar corrections under your bubbles to level up!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
