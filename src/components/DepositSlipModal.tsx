import React from 'react';
import { DepositSlip } from '../types';
import { X, FileText, Download, CheckCircle2 } from 'lucide-react';

interface DepositSlipModalProps {
  deposit: DepositSlip | null;
  onClose: () => void;
}

export const DepositSlipModal: React.FC<DepositSlipModalProps> = ({ deposit, onClose }) => {
  if (!deposit) return null;

  const isImage = deposit.fileType?.startsWith('image/') || deposit.fileName.match(/\.(jpeg|jpg|png|webp|gif)$/i);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[320px]">
              {deposit.fileName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between text-slate-500 font-mono text-[11px]">
            <span>Uploaded: {new Date(deposit.uploadedAt).toLocaleString()}</span>
            <span>{deposit.fileSize || 'Attached'}</span>
          </div>

          {/* Preview container */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 min-h-[160px] flex items-center justify-center p-4">
            {isImage && deposit.fileUrl && deposit.fileUrl.startsWith('data:') ? (
              <img
                src={deposit.fileUrl}
                alt={deposit.fileName}
                className="max-h-80 w-auto rounded object-contain shadow-sm"
              />
            ) : (
              <div className="text-center space-y-2 py-6">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {deposit.fileName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Verified Bank Deposit Slip Document
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100 dark:border-slate-800">
          {deposit.fileUrl && deposit.fileUrl.startsWith('http') ? (
            <a
              href={deposit.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Open in Google Drive</span>
              <Download className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-400">Stored in Order Ledger</span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
