import React, { useState } from 'react';
import { PartnerOrder } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  MessageSquare, 
  Send, 
  Building2, 
  Package, 
  UserCheck,
  QrCode
} from 'lucide-react';

interface ShareOrderModalProps {
  order: PartnerOrder;
  onClose: () => void;
}

export const ShareOrderModal: React.FC<ShareOrderModalProps> = ({ order, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Generate shareable link targeting TSM portal directly for this order
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // Include minimal metadata query params in case TSM opens link on a fresh browser without localStorage
    const params = new URLSearchParams();
    params.set('role', 'tsm');
    params.set('orderId', order.OrderID);
    params.set('pcode', order.PartnerCode || order.dmsCode || '');
    params.set('pname', order.PartnerName || '');
    params.set('val', String(order.TotalValue || 0));
    params.set('qty', String(order.TotalQty || 0));
    if (order.zone) params.set('zone', order.zone);
    if (order.tsmName) params.set('tsm', order.tsmName);

    return `${origin}${pathname}?${params.toString()}`;
  };

  const shareUrl = getShareUrl();

  const formattedMessage = `🏢 *Samsung B2B Order Notification*
📦 *Order ID:* ${order.OrderID}
🏬 *Partner:* ${order.PartnerName} (${order.PartnerCode || order.dmsCode || 'DMS'})
📍 *Zone / Territory:* ${order.zone || 'Assigned Territory'}
📊 *Total Qty:* ${order.TotalQty} pcs
💰 *Product Value:* ৳${order.TotalValue.toLocaleString()}
👤 *Assigned TSM / TSO:* ${order.tsmName || 'Territory Sales Officer'}
📄 *Bank Slip:* ${order.deposits && order.deposits.length > 0 ? '✓ Bank Deposit Slip Attached' : 'Pending Slip'}

👉 *Open Dedicated TSM Portal to Review & Approve:*
${shareUrl}

*(This dedicated portal link allows TSM/TSO to verify stock, validate deposit voucher, and forward to ZBH)*`;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(formattedMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Share Order with TSM / TSO</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate direct review link for Territory Sales Officer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Order Summary Card */}
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-sm text-indigo-900 dark:text-indigo-300">
                {order.OrderID}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {order.Status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Partner:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {order.PartnerName}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Code: {order.PartnerCode || order.dmsCode}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned TSM:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {order.tsmName || 'Rafiqul Islam'}
                </span>
                <span className="text-[11px] text-slate-500">
                  📍 {order.zone || 'Territory'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Total: <strong>{order.TotalQty} units</strong>
              </span>
              <span className="font-bold text-[#142b55] dark:text-blue-400 text-sm">
                ৳{order.TotalValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Direct Link Input & Copy */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Direct TSM / TSO Review Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#142b55] hover:bg-[#0f2142] text-white'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Opening this link opens the TSM portal directly focused on Order <strong>{order.OrderID}</strong>.
            </p>
          </div>

          {/* Quick Sharing Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Share via WhatsApp</span>
            </button>

            {/* Copy Full Message */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`py-2.5 px-3 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-2 shadow-xs ${
                copiedMsg
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {copiedMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Full Message Copied!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Copy Full Notification</span>
                </>
              )}
            </button>
          </div>

          {/* TSM Portal Instruction Note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              💡 For TSM / TSO Officer:
            </span>
            <p>
              When your TSM opens this link, they will see only their clean Territory Officer login (User ID & Password) without demo accounts or complex hierarchy clutter. Upon signing in, this order will be prominently presented for instant recommendation to ZBH.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
