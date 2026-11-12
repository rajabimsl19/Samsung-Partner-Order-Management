import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectReasonModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (orderId: string, reason: string) => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState('Please verify deposit slip and correct quantity.');

  if (!isOpen || !orderId) return null;

  const presets = [
    'Bank deposit slip voucher is illegible. Please re-upload clear receipt copy.',
    'Payment transaction reference could not be verified with treasury.',
    'Requested model is currently out of stock. Please select alternate color or model.',
    'Quantity exceeds single delivery allocation. Please split or adjust.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for order rejection.');
      return;
    }
    onConfirmReject(orderId, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Reject Order {orderId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Feedback Reason for Partner (Reject reason লিখুন):
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State why this order cannot be approved so the partner can correct and resubmit..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Quick Suggestions:
            </span>
            <div className="space-y-1">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(p)}
                  className="w-full text-left p-1.5 rounded text-[11px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  • {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-bold text-white bg-[#a4262c] hover:bg-[#881f24] rounded-lg transition-colors shadow-xs"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
