import React, { useState } from 'react';
import { PartnerOrder, UserRole, OrderStatus, DepositSlip } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  Edit3, 
  FileText, 
  ExternalLink,
  Search,
  Filter,
  Check,
  Ban,
  Bell,
  GitBranch,
  Shield,
  UserCheck,
  Layers,
  ChevronRight,
  Eye,
  FileCheck,
  Download,
  Share2
} from 'lucide-react';
import { ShareOrderModal } from './ShareOrderModal';

interface OrdersListProps {
  orders: PartnerOrder[];
  role: UserRole;
  currentOfficerName?: string;
  focusedOrderId?: string | null;
  onApproveOrder: (orderId: string, remarks?: string) => void;
  onRejectOrder: (orderId: string) => void;
  onEditOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onUploadDeposit: (orderId: string, file: File) => void;
  onViewDeposit?: (deposit: DepositSlip) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  role,
  currentOfficerName,
  focusedOrderId,
  onApproveOrder,
  onRejectOrder,
  onEditOrder,
  onCancelOrder,
  onUploadDeposit,
  onViewDeposit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sharingOrder, setSharingOrder] = useState<PartnerOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFileMap, setSelectedFileMap] = useState<{ [orderId: string]: File | null }>({});

  const isAdmin = role === 'admin';
  const isTsm = role === 'tsm';
  const isZbh = role === 'zbh';
  const isRsm = role === 'rsm';
  const isPartner = role === 'partner';

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.OrderID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.PartnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.PartnerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.zone && order.zone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.tsmName && order.tsmName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.details.some(
        (d) =>
          d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.color.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || order.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (order: PartnerOrder) => {
    switch (order.Status) {
      case 'Pending_TSM':
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3 h-3 text-indigo-500 animate-spin" />
            <span>Step 1: Awaiting TSM / TSO</span>
          </span>
        );
      case 'Pending_ZBH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Clock className="w-3 h-3 text-purple-500 animate-spin" />
            <span>Step 2: Awaiting ZBH / ASM</span>
          </span>
        );
      case 'Pending_RSM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-500 animate-spin" />
            <span>Step 3: Awaiting CSM / RSM</span>
          </span>
        );
      case 'Pending_Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-xs animate-pulse">
            <Bell className="w-3 h-3" />
            <span>Step 4: Pending Admin Final Approval</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Approved (Final Commercial)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            <Ban className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleFileChange = (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileMap((prev) => ({ ...prev, [orderId]: file }));
    }
  };

  const handleTriggerUpload = (orderId: string) => {
    const file = selectedFileMap[orderId];
    if (!file) {
      alert('Please choose a file first (ফাইল নির্বাচন করুন).');
      return;
    }
    onUploadDeposit(orderId, file);
    setSelectedFileMap((prev) => ({ ...prev, [orderId]: null }));
  };

  const handleExportProductWiseCsv = () => {
    if (filteredOrders.length === 0) {
      alert('No orders found to export.');
      return;
    }

    const headers = [
      'Order Date',
      'DMS Code',
      'Partner Name',
      'Product Model',
      'Product Color',
      'Product QTY',
      'Approval Status',
      'Unit Price (BDT)',
      'Product Value (BDT)',
      'Order ID',
      'Zone',
      'Assigned TSM / TSO',
      'Assigned ZBH / ASM',
      'Assigned CSM / RSM'
    ];

    const rows: (string | number)[][] = [];

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.OrderDate);
      const formattedDate = orderDate.toISOString().replace('T', ' ').slice(0, 19);
      const dmsCode = order.dmsCode || order.PartnerCode || 'N/A';
      const partnerName = order.PartnerName || 'N/A';
      const status = order.Status || 'N/A';

      if (order.details && order.details.length > 0) {
        order.details.forEach((item) => {
          const unitPrice = item.unitPrice || 0;
          const lineValue = item.lineTotal || (item.qty * unitPrice);

          rows.push([
            `"${formattedDate}"`,
            `"${dmsCode}"`,
            `"${partnerName}"`,
            `"${item.model}"`,
            `"${item.color}"`,
            item.qty,
            `"${status}"`,
            unitPrice,
            lineValue,
            `"${order.OrderID}"`,
            `"${order.zone || ''}"`,
            `"${order.tsmName || ''}"`,
            `"${order.zbhName || ''}"`,
            `"${order.rsmName || ''}"`
          ]);
        });
      } else {
        rows.push([
          `"${formattedDate}"`,
          `"${dmsCode}"`,
          `"${partnerName}"`,
          `"N/A"`,
          `"N/A"`,
          order.TotalQty,
          `"${status}"`,
          0,
          order.TotalValue,
          `"${order.OrderID}"`,
          `"${order.zone || ''}"`,
          `"${order.tsmName || ''}"`,
          `"${order.zbhName || ''}"`,
          `"${order.rsmName || ''}"`
        ]);
      }
    });

    const csvString = '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Samsung_Orders_ProductWise_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 id="ordersTitle" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {isAdmin
                ? 'All Partner Orders & Hierarchy Approvals'
                : isTsm
                ? 'Territory Partner Orders (TSM / TSO Review)'
                : isZbh
                ? 'Zonal Partner Orders (ZBH / ASM Approval)'
                : isRsm
                ? 'Regional Partner Orders (CSM / RSM Approval)'
                : 'My Orders & Hierarchy Status'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found in database
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick filter for orders needing active review */}
          {isAdmin && orders.filter((o) => o.Status === 'Pending_Admin' || o.Status === 'Submitted').length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Pending_Admin' ? 'all' : 'Pending_Admin')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'Pending_Admin'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>{orders.filter((o) => o.Status === 'Pending_Admin' || o.Status === 'Submitted').length} Ready for Admin</span>
            </button>
          )}

          {isTsm && orders.filter((o) => o.Status === 'Pending_TSM').length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Pending_TSM' ? 'all' : 'Pending_TSM')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'Pending_TSM'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{orders.filter((o) => o.Status === 'Pending_TSM').length} Awaiting My TSM Review</span>
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, model, partner, zone..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#142b55]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="Pending_TSM">Step 1: Pending TSM / TSO ({orders.filter((o) => o.Status === 'Pending_TSM').length})</option>
            <option value="Pending_ZBH">Step 2: Pending ZBH / ASM ({orders.filter((o) => o.Status === 'Pending_ZBH').length})</option>
            <option value="Pending_RSM">Step 3: Pending CSM / RSM ({orders.filter((o) => o.Status === 'Pending_RSM').length})</option>
            <option value="Pending_Admin">Step 4: Pending Admin Final ({orders.filter((o) => o.Status === 'Pending_Admin' || o.Status === 'Submitted').length})</option>
            <option value="Approved">Approved ({orders.filter((o) => o.Status === 'Approved').length})</option>
            <option value="Rejected">Rejected ({orders.filter((o) => o.Status === 'Rejected').length})</option>
            <option value="Cancelled">Cancelled ({orders.filter((o) => o.Status === 'Cancelled').length})</option>
          </select>

          {/* Individual Product-wise Export Button */}
          <button
            type="button"
            onClick={handleExportProductWiseCsv}
            title="Download individual product-wise CSV report"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export Product-wise CSV</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div id="orders" className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No orders found matching the filter criteria.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const canPartnerEdit = isPartner && (order.Status === 'Rejected' || order.Status === 'Pending_TSM');
            
            // Check if current user is eligible to approve at this stage
            const isTsmActionable = isTsm && order.Status === 'Pending_TSM';
            const isZbhActionable = isZbh && order.Status === 'Pending_ZBH';
            const isRsmActionable = isRsm && order.Status === 'Pending_RSM';
            const isAdminActionable = isAdmin && (order.Status === 'Pending_Admin' || order.Status === 'Submitted');

            return (
              <div
                key={order.OrderID}
                id={`order-${order.OrderID}`}
                className={`order py-5 first:pt-0 last:pb-0 space-y-3.5 transition-all ${
                  order.OrderID === focusedOrderId
                    ? 'p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-2 border-indigo-500 rounded-xl my-3 shadow-md'
                    : ''
                }`}
              >
                {/* Header line: OrderID, Partner details, and Status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {order.OrderID}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {order.PartnerName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({order.PartnerCode})
                    </span>
                    {order.zone && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        📍 {order.zone}
                      </span>
                    )}
                    {order.OrderID === focusedOrderId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white animate-pulse">
                        🎯 Active Shared Order
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSharingOrder(order)}
                      title="Generate share link for TSM/TSO"
                      className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                    >
                      <Share2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Share TSM Link</span>
                    </button>
                    <div className="pill self-start sm:self-center">{getStatusBadge(order)}</div>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                    Ordered: {new Date(order.OrderDate).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{order.TotalQty} pcs</span>
                  <span>•</span>
                  <span className="font-bold text-[#142b55] dark:text-blue-400">
                    ৳{order.TotalValue.toLocaleString()}
                  </span>
                  <span>•</span>
                  <span className="font-sans text-[11px] text-slate-500">
                    TSM: <strong className="text-slate-700 dark:text-slate-300">{order.tsmName || 'Rafiqul Islam'}</strong>
                  </span>
                </div>

                {/* VISUAL 4-TIER APPROVAL STEPPER */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Hierarchy Approval Chain (TSM/TSO → ZBH/ASM → CSM/RSM → Admin)</span>
                    {order.Status === 'Approved' && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Fully Approved
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {/* Step 1: TSM / TSO */}
                    {(() => {
                      const step = order.approvalChain?.[0];
                      const isPassed = step?.status === 'Approved';
                      const isCurrent = order.Status === 'Pending_TSM' || order.Status === 'Submitted';
                      const isRejected = step?.status === 'Rejected';

                      return (
                        <div className={`p-2 rounded-lg border text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : isCurrent
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 ring-1 ring-indigo-400'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] text-indigo-700 dark:text-indigo-400 uppercase">
                              1. TSM / TSO
                            </span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {order.tsmName?.replace(' (TSM/TSO)', '') || step?.approverName || 'Rafiqul Islam'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isPassed ? '✓ Recommended' : isCurrent ? 'Reviewing deposit & quota' : isRejected ? 'Rejected' : 'Awaiting upstream'}
                          </p>
                          {step?.remarks && (
                            <p className="text-[9px] text-slate-500 italic mt-1 bg-white/70 dark:bg-slate-800/70 p-1 rounded">
                              "{step.remarks}"
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Step 2: ZBH / ASM */}
                    {(() => {
                      const step = order.approvalChain?.[1];
                      const isPassed = step?.status === 'Approved';
                      const isCurrent = order.Status === 'Pending_ZBH';
                      const isRejected = step?.status === 'Rejected';

                      return (
                        <div className={`p-2 rounded-lg border text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : isCurrent
                            ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-400 dark:border-purple-700 ring-1 ring-purple-400'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] text-purple-700 dark:text-purple-400 uppercase">
                              2. ZBH / ASM
                            </span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {order.zbhName?.replace(' (ZBH/ASM)', '') || step?.approverName || 'Mahmudul Hasan'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isPassed ? '✓ Zonal Cleared' : isCurrent ? 'Awaiting Zonal check' : isRejected ? 'Rejected' : 'Next in line'}
                          </p>
                          {step?.remarks && (
                            <p className="text-[9px] text-slate-500 italic mt-1 bg-white/70 dark:bg-slate-800/70 p-1 rounded">
                              "{step.remarks}"
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Step 3: CSM / RSM */}
                    {(() => {
                      const step = order.approvalChain?.[2];
                      const isPassed = step?.status === 'Approved';
                      const isCurrent = order.Status === 'Pending_RSM';
                      const isRejected = step?.status === 'Rejected';

                      return (
                        <div className={`p-2 rounded-lg border text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : isCurrent
                            ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] text-blue-700 dark:text-blue-400 uppercase">
                              3. CSM / RSM
                            </span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {order.rsmName?.replace(' (CSM/RSM)', '') || step?.approverName || 'Tanvir Ahmed'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isPassed ? '✓ Regional Cleared' : isCurrent ? 'Awaiting Regional check' : isRejected ? 'Rejected' : 'Next in line'}
                          </p>
                          {step?.remarks && (
                            <p className="text-[9px] text-slate-500 italic mt-1 bg-white/70 dark:bg-slate-800/70 p-1 rounded">
                              "{step.remarks}"
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Step 4: Admin Panel Final Approval */}
                    {(() => {
                      const step = order.approvalChain?.[3];
                      const isPassed = order.Status === 'Approved';
                      const isCurrent = order.Status === 'Pending_Admin';
                      const isRejected = step?.status === 'Rejected';

                      return (
                        <div className={`p-2 rounded-lg border text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                            : isCurrent
                            ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400 shadow-xs'
                            : isRejected
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] text-slate-800 dark:text-slate-200 uppercase">
                              4. Admin Desk
                            </span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            Admin Commercial Desk
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isPassed ? '✓ Final Invoice Authorized' : isCurrent ? 'Ready for Final Approval' : isRejected ? 'Rejected' : 'Final Step'}
                          </p>
                          {step?.remarks && (
                            <p className="text-[9px] text-slate-500 italic mt-1 bg-white/70 dark:bg-slate-800/70 p-1 rounded">
                              "{step.remarks}"
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Line items detail */}
                <div className="text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
                  {order.details.map((d, idx) => (
                    <div key={idx} className="flex justify-between font-mono">
                      <span className="font-sans font-medium text-slate-800 dark:text-slate-200">
                        {d.model} <span className="text-slate-400">/</span> {d.color}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        × {d.qty} pcs {d.unitPrice && `(৳${d.unitPrice.toLocaleString()})`} = <strong>৳{(d.lineTotal || (d.qty * (d.unitPrice || 0))).toLocaleString()}</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Uploaded Deposit Slips */}
                {order.deposits && order.deposits.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                      Bank Deposit Slip Attached:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {order.deposits.map((slip) => (
                        <button
                          key={slip.id}
                          type="button"
                          onClick={() => onViewDeposit && onViewDeposit(slip)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-medium">{slip.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({slip.fileSize})</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>No deposit slip uploaded yet for this order.</span>
                  </div>
                )}

                {/* Rejection Notice Banner */}
                {order.Status === 'Rejected' && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Rejection Notice {order.rejectedByStage ? `(By: ${order.rejectedByStage})` : ''}:</span>
                    </div>
                    <p>{order.RejectReason || 'Please review and resubmit with updated deposit voucher.'}</p>
                  </div>
                )}

                {/* ROLE ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* TSM / TSO Action: Recommend & Forward to ZBH */}
                  {isTsmActionable && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveOrder(order.OrderID, 'Verified with branch & recommended to ZBH')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>TSM: Recommend & Submit to ZBH</span>
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>TSM Reject</span>
                      </button>
                    </div>
                  )}

                  {/* ZBH / ASM Action: Zonal Approve & Forward to RSM */}
                  {isZbhActionable && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveOrder(order.OrderID, 'Zonal quota approved & forwarded to CSM/RSM')}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ZBH: Zonal Approve & Forward to RSM</span>
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ZBH Reject</span>
                      </button>
                    </div>
                  )}

                  {/* CSM / RSM Action: Regional Approve & Forward to Admin */}
                  {isRsmActionable && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveOrder(order.OrderID, 'Regional allocation cleared & forwarded to Admin Desk')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>RSM: Regional Approve & Forward to Admin</span>
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>RSM Reject</span>
                      </button>
                    </div>
                  )}

                  {/* ADMIN Action: Final Commercial Approval */}
                  {isAdmin && (order.Status !== 'Approved' && order.Status !== 'Cancelled') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveOrder(order.OrderID, 'Commercial Final Approval given by Admin Desk')}
                        className={`px-3.5 py-1.5 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                          order.Status === 'Pending_Admin' || order.Status === 'Submitted'
                            ? 'bg-[#142b55] hover:bg-[#0f2142] ring-1 ring-blue-300'
                            : 'bg-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {order.Status === 'Pending_Admin' || order.Status === 'Submitted'
                            ? 'Admin: Commercial Final Approval'
                            : 'Admin: Override & Approve to Next Stage'}
                        </span>
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Admin Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Partner Actions: Edit & Resubmit or Cancel */}
                  {canPartnerEdit && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onEditOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-[#e9edf5] dark:bg-slate-800 hover:bg-[#d8e0ee] dark:hover:bg-slate-700 text-[#172033] dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit & Resubmit Order</span>
                      </button>

                      <button
                        onClick={() => onCancelOrder(order.OrderID)}
                        className="px-3 py-1.5 bg-[#a4262c] hover:bg-[#881f24] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>

                      {/* Deposit Slip Upload Input & Trigger */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                          type="file"
                          id={`file${order.OrderID}`}
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(order.OrderID, e)}
                          className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#142b55] file:text-white text-slate-500"
                        />
                        <button
                          onClick={() => handleTriggerUpload(order.OrderID)}
                          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            selectedFileMap[order.OrderID]
                              ? 'bg-[#142b55] text-white hover:bg-[#0f2142] shadow-xs'
                              : 'bg-[#e9edf5] dark:bg-slate-800 hover:bg-[#d8e0ee] text-[#172033] dark:text-slate-200'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {selectedFileMap[order.OrderID]
                              ? 'Upload Deposit Slip & Resubmit'
                              : 'Upload Deposit Slip'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Share Order with TSM/TSO Modal */}
      {sharingOrder && (
        <ShareOrderModal
          order={sharingOrder}
          onClose={() => setSharingOrder(null)}
        />
      )}

    </div>
  );
};
