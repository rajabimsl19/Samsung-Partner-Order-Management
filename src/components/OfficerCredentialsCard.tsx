import React, { useState } from 'react';
import { SessionData, SystemUser } from '../types';
import { 
  KeyRound, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Shield,
  ArrowRight
} from 'lucide-react';

interface OfficerCredentialsCardProps {
  session: SessionData;
  currentUser?: SystemUser;
  onAccessAdmin: () => void;
}

export const OfficerCredentialsCard: React.FC<OfficerCredentialsCardProps> = ({
  session,
  currentUser,
  onAccessAdmin,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);

  const username = session.username;
  const password = currentUser?.password || 'pass123';
  const roleName = session.role.toUpperCase();

  const handleCopyUid = () => {
    navigator.clipboard.writeText(username);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCopyPwd = () => {
    navigator.clipboard.writeText(password);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{roleName} Officer Credentials (User ID & Password)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                Read-Only
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Assigned login credentials for {session.officerName || session.username} · No edit permission
            </p>
          </div>
        </div>

        {/* Master Admin Elevation Shortcut */}
        <button
          type="button"
          onClick={onAccessAdmin}
          className="px-3 py-1.5 bg-[#142b55] hover:bg-[#0f2142] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          title="Switch to Admin Desk to add/remove users, update database and product price lists"
        >
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Access Admin Control</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Credentials Display Grid - Strictly Read-Only (No Edit Option) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* User ID Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Assigned User ID:</span>
            </span>
            <span className="text-[10px] text-slate-400">(Read-Only)</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white select-all">
              {username}
            </span>
            <button
              type="button"
              onClick={handleCopyUid}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              title="Copy User ID"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Password Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Assigned Password:</span>
            </span>
            <span className="text-[10px] text-slate-400">(No Edit Option)</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white select-all">
              {showPassword ? password : '••••••••••••'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCopyPwd}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                title="Copy Password"
              >
                {copiedPwd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Boundary Note */}
      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold">
            Admin Controlled Account: No Edit Option for {roleName}
          </p>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
            Only <strong>Admin users</strong> have permission to <strong>add & remove users</strong>, <strong>update databases</strong>, <strong>update product lists</strong>, and <strong>update price lists</strong>. If you are an administrator needing to make updates, click <strong>"Access Admin Control"</strong> above.
          </p>
        </div>
      </div>
    </div>
  );
};
