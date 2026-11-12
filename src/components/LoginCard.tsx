import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { SamsungLogo } from './SamsungLogo';

interface LoginCardProps {
  onLogin: (uid: string, pwd: string) => boolean;
  errorMsg: string;
  portalMode?: 'all' | 'tsm' | 'partner' | 'zbh' | 'rsm';
  focusedOrderId?: string | null;
}

export const LoginCard: React.FC<LoginCardProps> = ({ 
  onLogin, 
  errorMsg, 
  portalMode = 'all',
  focusedOrderId = null
}) => {
  const [uid, setUid] = useState('');
  const [pwd, setPwd] = useState('');

  const isTsmOnly = portalMode === 'tsm';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(uid, pwd);
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <SamsungLogo height={52} className="drop-shadow-sm" />
        </div>

        {isTsmOnly ? (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              TSM / TSO Officer Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter official User ID & Password issued by Admin Desk
            </p>
            {focusedOrderId && (
              <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                🎯 Direct Link for Order: <strong className="font-mono">{focusedOrderId}</strong>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Partner Order Management Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Samsung Commercial Order & Approval System
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            User ID
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="uid"
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder={isTsmOnly ? 'Enter TSM User ID' : 'Enter User ID'}
              autoComplete="username"
              required
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142b55]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Enter Password"
              autoComplete="current-password"
              required
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#142b55]"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>{isTsmOnly ? 'Sign In as TSM / TSO' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
