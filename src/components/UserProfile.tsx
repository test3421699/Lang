/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User as UserType } from '../types';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  LogOut,
  Trophy,
  Flame,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserProfileProps {
  currentUser: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  sessionStats: {
    accuracyScore: number;
    messagesSent: number;
    newWords: { word: string; translation: string }[];
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  onLogin,
  onLogout,
  sessionStats,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Setup initial users DB with a default demo user if the DB doesn't exist
  useEffect(() => {
    const existingUsers = localStorage.getItem('lingo_users');
    if (!existingUsers) {
      const demoUser: UserType = {
        username: 'Demo Apprentice',
        email: 'demo@example.com',
        password: 'password123',
        streak: 14,
        accuracy: 88,
        turns: 36,
        vocabCount: 6,
        completedScenarios: ['cafe'],
        vocabularyVault: [
          { word: 'buenos días', translation: 'good morning' },
          { word: 'por favor', translation: 'please' },
          { word: 'un café cortado', translation: 'espresso with a dash of warm milk' },
          { word: 's’il vous plaît', translation: 'please (French)' },
          { word: 'arigatou gozaimasu', translation: 'thank you very much' },
          { word: 'danke schön', translation: 'thank you kindly' },
        ],
      };
      localStorage.setItem('lingo_users', JSON.stringify([demoUser]));
    }
  }, []);

  const getUsersFromStorage = (): UserType[] => {
    const usersStr = localStorage.getItem('lingo_users');
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please specify both your email address and password.');
      return;
    }

    const users = getUsersFromStorage();
    const foundUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
      setSuccessMsg(`Welcome back, ${foundUser.username}!`);
      // Update local storage current user
      localStorage.setItem('lingo_current_user', JSON.stringify(foundUser));
    } else {
      setErrorMsg('Invalid email or password. Please try demo@example.com with password123!');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !username || !password) {
      setErrorMsg('Please provide your email, a username, and a secure password.');
      return;
    }

    const users = getUsersFromStorage();
    const userExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      setErrorMsg('An account with this email already exists.');
      return;
    }

    const newUser: UserType = {
      username: username,
      email: email.toLowerCase(),
      password: password,
      streak: 1,
      accuracy: 100,
      turns: 0,
      vocabCount: 0,
      completedScenarios: [],
      vocabularyVault: [],
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('lingo_users', JSON.stringify(updatedUsers));
    localStorage.setItem('lingo_current_user', JSON.stringify(newUser));

    setSuccessMsg('Account created successfully! Auto-logging in...');
    setTimeout(() => {
      onLogin(newUser);
    }, 1000);
  };

  const handleDemoSignIn = () => {
    const users = getUsersFromStorage();
    const demo = users.find((u) => u.email === 'demo@example.com');
    if (demo) {
      onLogin(demo);
      localStorage.setItem('lingo_current_user', JSON.stringify(demo));
    } else {
      // Create demo if missing
      const initialDemo: UserType = {
        username: 'Demo Apprentice',
        email: 'demo@example.com',
        password: 'password123',
        streak: 14,
        accuracy: 88,
        turns: 36,
        vocabCount: 6,
        completedScenarios: ['cafe'],
        vocabularyVault: [
          { word: 'buenos días', translation: 'good morning' },
          { word: 'por favor', translation: 'please' },
          { word: 'un café cortado', translation: 'espresso with a dash of warm milk' },
        ],
      };
      const updated = [...users, initialDemo];
      localStorage.setItem('lingo_users', JSON.stringify(updated));
      onLogin(initialDemo);
      localStorage.setItem('lingo_current_user', JSON.stringify(initialDemo));
    }
  };

  // Profile Dashboard styling for already logged-in state
  if (currentUser) {
    const combinedAccuracy = currentUser.turns > 0
      ? Math.round((currentUser.accuracy * currentUser.turns + sessionStats.accuracyScore * sessionStats.messagesSent) / (currentUser.turns + sessionStats.messagesSent))
      : Math.round(sessionStats.accuracyScore);

    const totalTurns = currentUser.turns + sessionStats.messagesSent;
    const combinedStreak = currentUser.streak;

    // Merge historic vocab vault with active session vault
    const historicList = currentUser.vocabularyVault || [];
    const activeList = sessionStats.newWords || [];
    const mergedList = [...historicList];
    activeList.forEach((aItem) => {
      const exists = mergedList.some((hItem) => hItem.word.toLowerCase() === aItem.word.toLowerCase());
      if (!exists && aItem.word.trim()) {
        mergedList.push(aItem);
      }
    });

    const totalVocabCount = mergedList.length;

    return (
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto" id="profile-dashboard">
        {/* User Card Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white select-none shadow-md transform rotate-2 font-display font-black text-2xl">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-slate-800 leading-tight">
                {currentUser.username}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Level {Math.max(1, Math.floor(totalTurns / 10) + 1)} Professional
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Native English
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-logout"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 px-4 py-2.5 rounded-xl border border-slate-100 hover:border-rose-100 active:scale-95 cursor-pointer max-w-xs self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Profile</span>
          </button>
        </div>

        {/* Stats Bento Grid styled layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="stats-bento">
          {/* Streak Stat */}
          <div className="bg-amber-50/50 border border-amber-100/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm select-none">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">
              🔥
            </div>
            <div>
              <span className="block text-[10px] font-extrabold text-amber-600 uppercase tracking-widest leading-none">Practice Streak</span>
              <span className="font-display font-black text-2xl text-amber-900 mt-1 block">{combinedStreak} Days</span>
            </div>
          </div>

          {/* Grammar Accuracy Stat */}
          <div className="bg-indigo-50/50 border border-indigo-100/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm select-none">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <span className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest leading-none">Avg Grammar Accuracy</span>
              <span className="font-display font-black text-2xl text-indigo-900 mt-1 block">{combinedAccuracy}%</span>
            </div>
          </div>

          {/* Words Vault Count */}
          <div className="bg-emerald-50/50 border border-emerald-100/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm select-none sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none">Vocabulary Saved</span>
              <span className="font-display font-black text-2xl text-emerald-900 mt-1 block">{totalVocabCount} Terms</span>
            </div>
          </div>
        </div>

        {/* Progress & Info Statement */}
        <div className="bg-sky-50 border border-sky-100/60 rounded-2xl p-4.5 flex gap-3 text-xs leading-relaxed text-sky-850 text-slate-700 font-medium">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold text-sky-900 block mb-0.5">Automated Cloud Sandbox Syncing</span>
            Your interactive learning progression is fully linked to this profile. All stats, word tags, and completion matrices are stored safely inside local browser memory, allowing seamless offline navigation and practice runs.
          </div>
        </div>

        {/* Saved Vocabulary Vault Panel */}
        <div className="space-y-4">
          <h4 className="font-display font-black text-slate-800 text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Mastered Vocabulary Vault ({totalVocabCount})</span>
          </h4>
          
          {mergedList.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100/60 text-slate-400 font-semibold text-xs text-slate-500">
              No vocabulary terms discovered yet. Start chatting in different scenarios to unlock and save native phrases!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {mergedList.map((item, index) => (
                <div key={item.word + index} className="p-3 bg-white border-2 border-indigo-50/70 rounded-xl flex flex-col hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/20 transition-all select-none">
                  <span className="font-bold text-indigo-700 text-sm tracking-tight truncate">{item.word}</span>
                  <span className="text-xs text-slate-500 mt-0.5 truncate italic">"{item.translation}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Auth Forms Mode - Unregistered/Unauthenticated State
  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-3xl border-2 border-indigo-100 shadow-xl overflow-hidden" id="auth-container">
      {/* Tab Select Header */}
      <div className="flex border-b border-indigo-50 select-none">
        <button
          id="tab-auth-login"
          type="button"
          onClick={() => {
            setIsRegistering(false);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-4.5 text-center text-sm font-black transition-all ${
            !isRegistering
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/20 font-bold'
              : 'text-slate-400 hover:text-slate-600 bg-slate-50/40 font-medium'
          }`}
        >
          Sign In
        </button>
        <button
          id="tab-auth-register"
          type="button"
          onClick={() => {
            setIsRegistering(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-4.5 text-center text-sm font-black transition-all ${
            isRegistering
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/20 font-bold'
              : 'text-slate-400 hover:text-slate-600 bg-slate-50/40 font-medium'
          }`}
        >
          Create Account
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <h3 className="font-display font-black text-slate-800 text-xl tracking-tight">
            {isRegistering ? 'Start Your Language Odyssey' : 'Access Your Companion'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            {isRegistering
              ? 'Join free and store your custom high-scores & vocab list in browser LocalStorage.'
              : 'Login using local storage keys or try LingoAI instantly with demo account!'}
          </p>
        </div>

        {/* Dynamic feedback messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-bold leading-normal">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs font-bold leading-normal">
            ✓ {successMsg}
          </div>
        )}

        {isRegistering ? (
          /* REGISTER FORM */
          <form id="form-register" onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-0.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="reg-input-email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-0.5">Your Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="reg-input-username"
                  required
                  placeholder="LingoPractit"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-0.5">Security Password</label>
              <div className="relative overflow-hidden rounded-xl border-2 border-indigo-50 focus-within:border-indigo-500">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <button
                  id="btn-eye-reg"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reg-input-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            <button
              id="submit-register"
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-md shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account Profile</span>
            </button>
          </form>
        ) : (
          /* LOGIN FORM */
          <form id="form-login" onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-0.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="login-input-email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border-2 border-indigo-50 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block pl-0.5">Security Password</label>
              <div className="relative overflow-hidden rounded-xl border-2 border-indigo-50 focus-within:border-indigo-500">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <button
                  id="btn-eye-login"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-input-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            <button
              id="submit-login"
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-md shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>Unlock Companion</span>
            </button>
          </form>
        )}

        <div className="relative flex py-2 items-center select-none">
          <div className="flex-grow border-t border-indigo-50"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or sign in with</span>
          <div className="flex-grow border-t border-indigo-50"></div>
        </div>

        {/* Demo Account quick access */}
        <button
          id="btn-demo-signin"
          type="button"
          onClick={handleDemoSignIn}
          className="w-full py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200/50 hover:border-amber-300 rounded-xl text-[13px] font-extrabold text-amber-800 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Flame className="w-4.5 h-4.5 text-amber-600 animate-bounce" />
          <span>Quick Log In with Sandbox Demo</span>
        </button>
      </div>
    </div>
  );
};
