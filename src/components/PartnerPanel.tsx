import React, { useState, useEffect } from 'react';
import { ProductItem, OrderItemDetail, PartnerOrder, DepositSlip, PartnerUser, UserRole } from '../types';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  FileText, 
  X, 
  ArrowRight, 
  Building2,
  FileCheck,
  Tag,
  MapPin,
  Check,
  Cloud
} from 'lucide-react';
import { isDriveConnected, getDriveUser } from '../services/googleDrive';

interface PartnerPanelProps {
  products: ProductItem[];
  editingOrder: PartnerOrder | null;
  partners?: PartnerUser[];
  currentRole?: UserRole;
  currentOfficerName?: string;
  defaultPartner?: PartnerUser;
  onOpenDriveModal?: () => void;
  onSubmitOrder: (
    items: OrderItemDetail[],
    depositSlip?: DepositSlip | null,
    orderIdToUpdate?: string,
    targetPartner?: PartnerUser
  ) => void;
  onCancelEdit: () => void;
}

interface FormLine {
  id: number;
  model: string;
  color: string;
  qty: number;
}

export const PartnerPanel: React.FC<PartnerPanelProps> = ({
  products,
  editingOrder,
  partners = [],
  currentRole = 'partner',
  currentOfficerName,
  defaultPartner,
  onOpenDriveModal,
  onSubmitOrder,
  onCancelEdit,
}) => {
  const isTsm = currentRole === 'tsm';
  const isOfficer = currentRole === 'tsm' || currentRole === 'admin' || currentRole === 'zbh' || currentRole === 'rsm';

  // Selected Partner for TSM/TSO
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(() => {
    if (editingOrder) {
      const match = partners.find((p) => p.partnerCode === editingOrder.PartnerCode);
      return match ? match.id : (partners[0]?.id || '');
    }
    if (defaultPartner) return defaultPartner.id;
    return partners[0]?.id || '';
  });

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || defaultPartner || partners[0];

  const [lines, setLines] = useState<FormLine[]>([]);
  const [nextId, setNextId] = useState(1);
  const [orderMsg, setOrderMsg] = useState<string | null>(null);

  // Deposit slip upload state
  const [attachedSlip, setAttachedSlip] = useState<DepositSlip | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Initialize lines and deposit slip
  useEffect(() => {
    if (editingOrder && editingOrder.details.length > 0) {
      let idCounter = 1;
      const initialLines = editingOrder.details.map((d) => ({
        id: idCounter++,
        model: d.model,
        color: d.color,
        qty: d.qty,
      }));
      setLines(initialLines);
      setNextId(idCounter);

      if (editingOrder.deposits && editingOrder.deposits.length > 0) {
        setAttachedSlip(editingOrder.deposits[0]);
      } else {
        setAttachedSlip(null);
      }
    } else {
      // Default 1 line
      const firstProduct = products[0];
      const firstColor = firstProduct?.colors[0]?.color || '';
      setLines([
        {
          id: 1,
          model: firstProduct?.model || '',
          color: firstColor,
          qty: 1,
        },
      ]);
      setNextId(2);
      setAttachedSlip(null);
    }
  }, [editingOrder, products]);

  const addLine = () => {
    const firstProduct = products[0];
    const firstColor = firstProduct?.colors[0]?.color || '';
    setLines((prev) => [
      ...prev,
      {
        id: nextId,
        model: firstProduct?.model || '',
        color: firstColor,
        qty: 1,
      },
    ]);
    setNextId((prev) => prev + 1);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 1) {
      alert('Order must contain at least one line item.');
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateModel = (id: number, newModel: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const prod = products.find((p) => p.model === newModel);
          const firstColor = prod?.colors[0]?.color || '';
          return {
            ...l,
            model: newModel,
            color: firstColor,
          };
        }
        return l;
      })
    );
  };

  const updateColor = (id: number, newColor: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, color: newColor } : l))
    );
  };

  const updateQty = (id: number, newQty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, newQty) } : l))
    );
  };

  // Handle deposit slip file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepositError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setDepositError('File size exceeds 15MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = (event.target?.result as string) || '#';
      const slip: DepositSlip = {
        id: 'dep-' + Date.now(),
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: Math.round(file.size / 1024) + ' KB',
      };
      setAttachedSlip(slip);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedSlip = () => {
    setAttachedSlip(null);
    setDepositError(null);
  };

  // Calculate live totals
  let totalQty = 0;
  let totalValue = 0;

  lines.forEach((line) => {
    const qty = Number(line.qty) || 0;
    const prod = products.find((p) => p.model === line.model);
    const colorVariant = prod?.colors.find((c) => c.color === line.color);
    const price = colorVariant?.price || 0;
    totalQty += qty;
    totalValue += qty * price;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isOfficer && !selectedPartner) {
      alert('Please select a partner from the dropdown box first.');
      return;
    }

    if (!attachedSlip) {
      setDepositError('Deposit slip is required. Please upload your bank voucher before submitting.');
      const uploadElement = document.getElementById('depositUploadSection');
      if (uploadElement) {
        uploadElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const validItems: OrderItemDetail[] = lines
      .filter((l) => l.model && l.color && l.qty > 0)
      .map((l) => {
        const prod = products.find((p) => p.model === l.model);
        const colorVariant = prod?.colors.find((c) => c.color === l.color);
        const unitPrice = colorVariant?.price || 0;
        return {
          model: l.model,
          color: l.color,
          qty: l.qty,
          unitPrice,
          lineTotal: l.qty * unitPrice,
        };
      });

    if (validItems.length === 0) {
      alert('Please select valid models and quantities.');
      return;
    }

    onSubmitOrder(
      validItems,
      attachedSlip,
      editingOrder ? editingOrder.OrderID : undefined,
      selectedPartner
    );

    setOrderMsg(
      editingOrder
        ? `Order updated & resubmitted: ${editingOrder.OrderID}`
        : `Order successfully booked for ${selectedPartner?.partnerName || 'Partner'} (DMS: ${selectedPartner?.partnerCode || selectedPartner?.dmsCode}) with deposit slip!`
    );
    setTimeout(() => setOrderMsg(null), 4000);

    // Reset if not editing
    if (!editingOrder) {
      const firstProduct = products[0];
      setLines([
        {
          id: 1,
          model: firstProduct?.model || '',
          color: firstProduct?.colors[0]?.color || '',
          qty: 1,
        },
      ]);
      setNextId(2);
      setAttachedSlip(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Title & Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#142b55] dark:text-blue-400" />
            <span>
              {editingOrder
                ? `Edit Order: ${editingOrder.OrderID}`
                : isTsm
                ? 'TSM / TSO: Partner Order Booking & Submission'
                : 'Create / Submit Partner Order'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTsm
              ? 'Select Partner Name → View DMS Code → Select Model & Color → Enter QTY & View Product Value → Attach Deposit Slip'
              : 'Select Model & Color → Enter QTY & View Product Value → Attach Deposit Slip → Submit Order'}
          </p>
        </div>

        {editingOrder && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* STEP 1: FOR TSM/TSO: SELECT PARTNER NAME FROM DROPDOWN BOX */}
      {isOfficer && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-800/50 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Step 1: Select Partner Name from Dropdown</span>
            </label>
            <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
              * Selecting Partner displays official DMS Code
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Dropdown Box */}
            <div>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#142b55]"
              >
                <option value="">-- Click to Select Partner Name --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partnerName} ({p.partnerCode || p.dmsCode})
                  </option>
                ))}
              </select>
            </div>

            {/* DMS Code & Partner Details Display Card */}
            {selectedPartner && (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-xs flex items-center justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">DMS Code:</span>
                    <span className="font-mono font-extrabold text-xs text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      {selectedPartner.partnerCode || selectedPartner.dmsCode}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedPartner.partnerName}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 shrink-0 font-medium">
                  <span className="flex items-center justify-end gap-1 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{selectedPartner.zone || 'Dhaka'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    User: {selectedPartner.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* For logged-in Partner: Display their DMS Code and Territory */}
      {!isOfficer && selectedPartner && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedPartner.partnerName}
              </span>
              <span className="text-[11px] text-slate-500 ml-2">
                Zone: {selectedPartner.zone || 'Dhaka Central'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">DMS Code:</span>
            <span className="font-mono font-extrabold text-xs text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              {selectedPartner.partnerCode || selectedPartner.dmsCode}
            </span>
          </div>
        </div>
      )}

      {/* Rejection Feedback Banner if editing a rejected order */}
      {editingOrder && editingOrder.Status === 'Rejected' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Rejection Feedback ({editingOrder.rejectedByStage || 'Reviewer'}):</span>
            <span>{editingOrder.RejectReason || 'Please correct the quantities or upload valid deposit voucher and resubmit.'}</span>
          </div>
        </div>
      )}

      {/* Order Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Dynamic Items Container */}
        <div id="items" className="space-y-3.5">
          {lines.map((line, index) => {
            const currentProd = products.find((p) => p.model === line.model);
            const colorOptions = currentProd?.colors || [];
            const currentColorVariant = colorOptions.find((c) => c.color === line.color);
            const unitPrice = currentColorVariant?.price || 0;
            const lineProductValue = unitPrice * line.qty;

            return (
              <div
                key={line.id}
                className="product bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-3 transition-all"
              >
                {/* Line Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Product Item #{index + 1}</span>
                  </span>
                  {unitPrice > 0 && (
                    <span className="font-mono text-slate-500 font-normal">
                      Unit Price: <strong>৳{unitPrice.toLocaleString()}</strong>
                    </span>
                  )}
                </div>

                {/* ROW 1: SELECT PRODUCT MODEL & SELECT PRODUCT COLOR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Select Product Model */}
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      1. Select Product Model
                    </label>
                    <select
                      value={line.model}
                      onChange={(e) => updateModel(line.id, e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#142b55]"
                    >
                      <option value="">-- Choose Model --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.model}>
                          {p.model} ({p.prodcode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Product Color */}
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      2. Select Product Color
                    </label>
                    <select
                      value={line.color}
                      onChange={(e) => updateColor(line.id, e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#142b55]"
                    >
                      <option value="">-- Choose Color --</option>
                      {colorOptions.map((c, i) => (
                        <option key={i} value={c.color}>
                          {c.color} — ৳{c.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* ROW 2: TYPE PRODUCT QTY & RIGHT SIDE SHOW PRODUCT VALUE */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                  
                  {/* Type Product QTY */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      3. Type Product QTY (Pcs)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) => updateQty(line.id, parseInt(e.target.value, 10) || 1)}
                        placeholder="e.g. 5"
                        required
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#142b55]"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-medium pointer-events-none">
                        pcs
                      </span>
                    </div>
                  </div>

                  {/* RIGHT SIDE OF PRODUCT QTY: SHOW PRODUCT VALUE */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      Product Value (Calculated Total)
                    </label>
                    <div className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">
                          ৳{unitPrice.toLocaleString()} × {line.qty} pcs
                        </span>
                        <span className="font-mono font-extrabold text-sm text-[#142b55] dark:text-blue-400">
                          ৳{lineProductValue.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60">
                        Line Value
                      </span>
                    </div>
                  </div>

                  {/* Remove Line Button */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="w-full py-2 px-2 text-xs font-medium text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Remove this model line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Add Another Model Button */}
        <button
          type="button"
          onClick={addLine}
          className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add another Product Model / Color</span>
        </button>

        {/* Order Totals Summary Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="font-sans text-slate-600 dark:text-slate-400 font-medium">Total Quantity</span>
            <b id="totalQty" className="text-base text-slate-900 dark:text-white tabular-nums">
              {totalQty} pcs
            </b>
          </div>
          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="font-sans text-slate-600 dark:text-slate-400 font-bold">Total Order Value</span>
            <b id="totalValue" className="text-lg text-[#142b55] dark:text-blue-400 tabular-nums font-bold">
              ৳{totalValue.toLocaleString()}
            </b>
          </div>
        </div>

        {/* UPLOAD DEPOSIT SLIP (BANK VOUCHER / CHALLAN) */}
        <div 
          id="depositUploadSection"
          className={`rounded-xl p-4 border transition-all ${
            attachedSlip 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
              : 'bg-slate-50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-900/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Upload className={`w-4 h-4 ${attachedSlip ? 'text-emerald-600' : 'text-[#142b55] dark:text-blue-400'}`} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Upload Deposit Slip (Bank Voucher / Challan)
              </span>
            </div>

            {attachedSlip ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Deposit Slip Attached</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                Required for Order Submission
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Please attach the bank deposit receipt, wire transfer voucher, or challan (PDF, JPG, PNG).
          </p>

          {isDriveConnected() ? (
            <div className="flex items-center justify-between text-xs p-2 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/50 mb-3">
              <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-medium">
                <Cloud className="w-4 h-4 text-[#1428a0] dark:text-blue-400" />
                <span>Google Drive Active: Deposit slips are stored securely in cloud</span>
              </div>
              {onOpenDriveModal && (
                <button
                  type="button"
                  onClick={onOpenDriveModal}
                  className="text-[11px] text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                >
                  Manage Drive
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs p-2 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 mb-3">
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Want automatic Google Drive cloud backup for deposit slips?</span>
              {onOpenDriveModal && (
                <button
                  type="button"
                  onClick={onOpenDriveModal}
                  className="text-[11px] font-bold text-[#1428a0] dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Connect Drive
                </button>
              )}
            </div>
          )}

          {!attachedSlip ? (
            /* Upload Input Area */
            <div>
              <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#142b55] dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-colors group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#142b55] dark:group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to browse or drop Bank Deposit Slip
                </span>
                <span className="text-[10px] text-slate-400">
                  Supports Image (JPG, PNG) or PDF document (Max 15MB)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {depositError && (
                <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Attached Slip File Preview & Details */
            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 truncate">
                {attachedSlip.fileType.startsWith('image/') && attachedSlip.fileUrl.startsWith('data:') ? (
                  <img
                    src={attachedSlip.fileUrl}
                    alt="Deposit preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                )}

                <div className="truncate">
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {attachedSlip.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {attachedSlip.fileSize} · Ready for submission
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="cursor-pointer px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <span>Replace</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={removeAttachedSlip}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Remove slip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT ORDER BUTTON (AFTER DEPOSIT SLIP) */}
        <div>
          {attachedSlip ? (
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {editingOrder
                  ? 'Update & Resubmit Order with Deposit Slip'
                  : isTsm
                  ? `Submit Order for ${selectedPartner?.partnerName || 'Partner'} (DMS: ${selectedPartner?.partnerCode || selectedPartner?.dmsCode})`
                  : 'Submit Order with Attached Deposit Slip'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Upload Deposit Slip Above to Submit Order</span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                * Attach bank deposit voucher / challan in the section above to submit this purchase order.
              </p>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {orderMsg && (
          <div id="orderMsg" className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{orderMsg}</span>
          </div>
        )}

      </form>
    </div>
  );
};
