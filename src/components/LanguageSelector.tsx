/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LanguageDef, LanguageCode, ProficiencyLevel } from '../types';
import { LANGUAGES } from '../data';
import { Globe, Award, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  selectedProficiency: ProficiencyLevel;
  onSelectLanguage: (code: LanguageCode) => void;
  onSelectProficiency: (level: ProficiencyLevel) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  selectedProficiency,
  onSelectLanguage,
  onSelectProficiency,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in" id="lang-selector">
      {/* Target Language Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
            <Globe className="w-5 h-5" id="globe-icon" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-800">What would you like to speak?</h2>
            <p className="text-slate-500 text-sm">Choose your practice language</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="lang-grid">
          {LANGUAGES.map((lang: LanguageDef) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                onClick={() => onSelectLanguage(lang.code)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 group hover:translate-y-[-2px] cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-100'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <span className="text-4xl mb-3 transform transition-transform group-hover:scale-110" id={`flag-${lang.code}`}>
                  {lang.flag}
                </span>
                <span className="font-semibold text-slate-800 block text-base" id={`native-name-${lang.code}`}>
                  {lang.nativeName}
                </span>
                <span className="text-xs text-slate-500 mt-1" id={`english-name-${lang.code}`}>
                  {lang.name}
                </span>
                {isSelected && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Proficiency Level Section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Award className="w-5 h-5" id="proficiency-icon" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-800">Select Proficiency Level</h2>
            <p className="text-slate-500 text-sm">The AI will adapt sentence lengths and vocabulary complexity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="proficiency-grid">
          {(['beginner', 'intermediate', 'advanced'] as ProficiencyLevel[]).map((level) => {
            const isSelected = selectedProficiency === level;
            return (
              <button
                key={level}
                id={`pref-btn-${level}`}
                onClick={() => onSelectProficiency(level)}
                className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-100'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/55'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider px-2 p-1 rounded-md ${
                      level === 'beginner'
                        ? 'bg-emerald-50 text-emerald-700'
                        : level === 'intermediate'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {level}
                  </span>
                  {isSelected && <Sparkles className="w-4 h-4 text-amber-500" />}
                </div>
                <h3 className="font-semibold text-slate-800 block text-base capitalization">
                  {level.charAt(0).toUpperCase() + level.slice(1)} Practice
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  {level === 'beginner' && 'Short, supportive phrasing with simplified everyday terms.'}
                  {level === 'intermediate' && 'Comfortable pacing, compound sentences, and dynamic dialogue.'}
                  {level === 'advanced' && 'Fast-paced, idiomatic dialogue, job simulation questions, and subtle grammar tips.'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
