/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Scenario, ProficiencyLevel, LanguageCode } from '../types';
import { SCENARIOS } from '../data';
import * as Icons from 'lucide-react';

interface ScenarioGridProps {
  selectedLanguage: LanguageCode;
  selectedProficiency: ProficiencyLevel;
  onSelectScenario: (scenario: Scenario) => void;
}

export const ScenarioGrid: React.FC<ScenarioGridProps> = ({
  selectedLanguage,
  selectedProficiency,
  onSelectScenario,
}) => {
  // Simple helper to render Lucide Icons dynamically
  const renderIcon = (name: string, className: string = 'w-5 h-5') => {
    const IconComponent = (Icons as any)[name];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.Sparkles className={className} />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in" id="scenario-hub">
      <div className="text-center md:text-left mb-6">
        <h2 className="font-display text-2xl font-black text-slate-800">Select Practice Scenario</h2>
        <p className="text-slate-500 text-sm mt-1">
          Pick a simulated environment and start an interactive discussion with your AI study partner
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="scenarios-grid">
        {SCENARIOS.map((sc: Scenario) => {
          // Highlight difficulty compatibility
          const matchesProficiency = sc.difficulty === selectedProficiency;
          
          return (
            <div
              key={sc.id}
              id={`scenario-card-${sc.id}`}
              className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-md shadow-indigo-100/10 hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3.5 rounded-2xl text-white shadow-md ${
                      sc.id === 'cafe'
                        ? 'bg-amber-500'
                        : sc.id === 'lost-directions'
                        ? 'bg-emerald-500'
                        : sc.id === 'hotel-checkin'
                        ? 'bg-brand-500'
                        : sc.id === 'job-interview'
                        ? 'bg-brand-600'
                        : 'bg-rose-500'
                    }`}
                  >
                    {renderIcon(sc.iconName, 'w-6 h-6')}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        sc.difficulty === 'beginner'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sc.difficulty === 'intermediate'
                          ? 'bg-blue-105 bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-850 bg-brand-50 text-brand-700 border border-brand-100'
                      }`}
                    >
                      {sc.difficulty}
                    </span>
                    {!matchesProficiency && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Adjusted to your level
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-slate-805 text-slate-800 group-hover:text-brand-600 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  {sc.description}
                </p>

                {/* Persona Info */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-indigo-100/40 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 text-xs font-bold text-brand-750 text-brand-700 flex items-center justify-center border border-brand-100 uppercase shadow-inner">
                    {sc.characterName.slice(0, 2)}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">
                      Partner: {sc.characterName}
                    </h4>
                    <p className="text-[10px] text-slate-500">{sc.characterRole}</p>
                  </div>
                </div>

                {/* Subtask goal */}
                <div className="mt-3.5">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider mb-1">
                    Learning objective:
                  </span>
                  <p className="text-[11px] text-slate-600 italic">
                    "{sc.suggestedPrompt}"
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-indigo-50/65">
                <button
                  id={`start-scenario-btn-${sc.id}`}
                  onClick={() => onSelectScenario(sc)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl py-3 font-semibold text-xs hover:bg-brand-700 transition-all duration-300 hover:scale-[1.015] shadow-md shadow-brand-100/40 cursor-pointer"
                >
                  <span>Practice with {sc.characterName}</span>
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
