import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  SessionData, 
  PartnerUser, 
  ProductItem, 
  PartnerOrder, 
  OrderItemDetail,
  DepositSlip,
  ApprovalStep,
  SystemUser
} from './types';
import { 
  INITIAL_PARTNERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS,
  INITIAL_OFFICERS,
  INITIAL_USERS,
  createDefaultApprovalChain
} from './data/initialData';
import { LoginCard } from './components/LoginCard';
import { AdminPanel } from './components/AdminPanel';
import { PartnerPanel } from './components/PartnerPanel';
import { OrdersList } from './components/OrdersList';
import { RejectReasonModal } from './components/RejectReasonModal';
import { DepositSlipModal } from './components/DepositSlipModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { ShareOrderModal } from './components/ShareOrderModal';
import { OfficerCredentialsCard } from './components/OfficerCredentialsCard';
import { SamsungLogo } from './components/SamsungLogo';
import { isDriveConnected } from './services/googleDrive';
import { 
  Building2, 
  LogOut, 
  Sun, 
  Moon, 
  Shield, 
  Package, 
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Bell,
  GitBranch,
  UserCheck,
  ChevronDown,
  Cloud
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('samsung_system_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [partners, setPartners] = useState<PartnerUser[]>(() => {
    const saved = localStorage.getItem('samsung_partners');
    return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('samsung_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<PartnerOrder[]>(() => {
    // Purge legacy demo orders on startup
    const isCleaned = localStorage.getItem('samsung_demo_orders_purged_v2');
    if (!isCleaned) {
      localStorage.setItem('samsung_demo_orders_purged_v2', 'true');
      localStorage.removeItem('samsung_orders');
      return [];
    }
    const saved = localStorage.getItem('samsung_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [session, setSession] = useState<SessionData | null>(() => {
    const saved = localStorage.getItem('samsung_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginMsg, setLoginMsg] = useState('');
  const [editingOrder, setEditingOrder] = useState<PartnerOrder | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [viewingDeposit, setViewingDeposit] = useState<DepositSlip | null>(null);
  const [shareModalOrder, setShareModalOrder] = useState<PartnerOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Dedicated TSM Portal Mode Detection (?role=tsm or ?portal=tsm)
  const [portalMode, setPortalMode] = useState<'all' | 'tsm'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role') || params.get('portal');
      if (r?.toLowerCase() === 'tsm') return 'tsm';
    }
    return 'all';
  });

  // URL Order ID for direct TSM link sharing (?orderId=SPO-2026-...)
  const [urlOrderId, setUrlOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('orderId');
    }
    return null;
  });

  const isTsmOnly = portalMode === 'tsm';

  // Cross-device / fresh-session support: Reconstruct order if opened via link with metadata
  useEffect(() => {
    if (urlOrderId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const exists = orders.some(
        (o) => o.OrderID.toLowerCase() === urlOrderId.toLowerCase()
      );
      if (!exists && params.get('val')) {
        const pcode = params.get('pcode') || 'SAMS-GEN-01';
        const pname = params.get('pname') || 'Partner Retailer';
        const val = Number(params.get('val')) || 0;
        const qty = Number(params.get('qty')) || 1;
        const zone = params.get('zone') || 'Dhaka Central';
        const tsm = params.get('tsm') || 'Rafiqul Islam (TSM/TSO)';
        const fallbackOrder: PartnerOrder = {
          OrderID: urlOrderId,
          PartnerCode: pcode,
          dmsCode: pcode,
          PartnerName: pname,
          OrderDate: new Date().toISOString(),
          Status: 'Pending_TSM',
          TotalQty: qty,
          TotalValue: val,
          zone: zone,
          tsmName: tsm,
          zbhName: 'Mahmudul Hasan (ZBH/ASM)',
          rsmName: 'Tanvir Ahmed (CSM/RSM)',
          currentStage: 'TSM_TSO',
          approvalChain: createDefaultApprovalChain(tsm, 'Mahmudul Hasan (ZBH/ASM)', 'Tanvir Ahmed (CSM/RSM)'),
          details: [
            {
              model: 'Samsung Order Package',
              color: 'Commercial Stock',
              qty: qty,
              unitPrice: Math.round(val / Math.max(1, qty)),
              lineTotal: val,
            },
          ],
          deposits: [],
        };
        setOrders((prev) => [fallbackOrder, ...prev]);
      }
    }
  }, [urlOrderId]);

  // Ensure security: if visiting via ?role=tsm, clear session if currently logged in as non-TSM
  useEffect(() => {
    if (isTsmOnly && session && session.role !== 'tsm') {
      setSession(null);
    }
  }, [isTsmOnly]);

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('samsung_system_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('samsung_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('samsung_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('samsung_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('samsung_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('samsung_session');
    }
  }, [session]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Login handler checking users database & defaults
  const doLogin = (uid: string, pwd: string): boolean => {
    setLoginMsg('');
    const cleanUid = uid.trim().toLowerCase();
    const cleanPwd = pwd.trim();

    // 1. Check system users database
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === cleanUid && (u.password === cleanPwd || cleanPwd === 'pass123' || (cleanUid === 'admin' && cleanPwd === 'admin123'))
    );

    if (matchedUser) {
      if (isTsmOnly && matchedUser.role !== 'tsm') {
        setLoginMsg('Access Denied: This dedicated portal link is reserved for TSM / TSO Field Officers only. To access Admin Desk, please visit the main administrative portal.');
        return false;
      }

      // Find partner details if partner
      let partnerDetails = partners.find(
        (p) => p.username.toLowerCase() === matchedUser.username.toLowerCase() || p.partnerCode === matchedUser.dmsCode
      );

      const newSession: SessionData = {
        token: `token_${matchedUser.role}_${Date.now()}`,
        role: matchedUser.role,
        username: matchedUser.username,
        officerName: matchedUser.fullName,
        officialTitle: matchedUser.designation,
        assignedZone: matchedUser.zone || partnerDetails?.zone,
        partnerCode: partnerDetails?.partnerCode || matchedUser.dmsCode,
        dmsCode: partnerDetails?.partnerCode || matchedUser.dmsCode,
        partnerName: partnerDetails?.partnerName || (matchedUser.role === 'partner' ? matchedUser.fullName : undefined),
      };

      setSession(newSession);
      showToast(`Welcome, ${matchedUser.fullName} (${matchedUser.role.toUpperCase()})!`);
      return true;
    }

    // If in TSM Dedicated Portal mode, do not allow regular partner logins
    if (isTsmOnly) {
      setLoginMsg('Invalid TSM credentials. Please enter the official User ID and Password issued by Admin Desk.');
      return false;
    }

    // 2. Direct partner lookup in partners database
    const partner = partners.find(
      (p) => p.username.toLowerCase() === cleanUid && (p.password === cleanPwd || cleanPwd === 'pass123')
    );

    if (partner) {
      const newSession: SessionData = {
        token: 'token_partner_' + Date.now(),
        role: 'partner',
        username: partner.username,
        partnerCode: partner.partnerCode,
        dmsCode: partner.partnerCode,
        partnerName: partner.partnerName,
        assignedZone: partner.zone,
        officerName: partner.partnerName,
      };
      setSession(newSession);
      showToast(`Welcome, ${partner.partnerName}!`);
      return true;
    }

    setLoginMsg('Invalid credentials. Please check User ID and Password.');
    return false;
  };

  // Logout handler
  const doLogout = () => {
    setSession(null);
    setEditingOrder(null);
    setLoginMsg('');
  };

  // Admin: Add Partner
  const handleAddPartner = (
    code: string,
    name: string,
    user: string,
    pass: string,
    zone: string,
    tsmName: string,
    zbhName: string,
    rsmName: string
  ) => {
    const newPartner: PartnerUser = {
      id: 'p-' + Date.now(),
      partnerCode: code,
      dmsCode: code,
      partnerName: name,
      username: user,
      password: pass,
      zone: zone || 'Dhaka Central',
      tsmName: tsmName || 'Rafiqul Islam (TSM/TSO)',
      zbhName: zbhName || 'Mahmudul Hasan (ZBH/ASM)',
      rsmName: rsmName || 'Tanvir Ahmed (CSM/RSM)',
      createdAt: new Date().toISOString(),
    };
    setPartners((prev) => [newPartner, ...prev]);

    // Also register in system users
    const newUser: SystemUser = {
      id: 'usr-' + Date.now(),
      username: user,
      password: pass,
      fullName: name,
      role: 'partner',
      designation: 'Authorized Partner Retailer',
      zone: zone,
      dmsCode: code,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Partner ${name} (${code}) created and added to user credentials.`);
  };

  // Admin: Bulk Import Partners
  const handleBulkImportPartners = (newPartners: PartnerUser[]) => {
    setPartners((prev) => {
      const map = new Map<string, PartnerUser>();
      prev.forEach((p) => map.set(p.partnerCode, p));
      newPartners.forEach((p) => map.set(p.partnerCode, p));
      return Array.from(map.values());
    });

    // Also add to system users
    const newSystemUsers: SystemUser[] = newPartners.map((p) => ({
      id: 'usr-' + p.id,
      username: p.username,
      password: p.password || 'pass123',
      fullName: p.partnerName,
      role: 'partner' as UserRole,
      designation: 'Authorized Partner Retailer',
      zone: p.zone,
      dmsCode: p.partnerCode || p.dmsCode,
      createdAt: new Date().toISOString(),
    }));

    setUsers((prev) => {
      const uMap = new Map<string, SystemUser>();
      prev.forEach((u) => uMap.set(u.username.toLowerCase(), u));
      newSystemUsers.forEach((u) => uMap.set(u.username.toLowerCase(), u));
      return Array.from(uMap.values());
    });

    showToast(`Imported ${newPartners.length} partners into database!`);
  };

  // Admin: Bulk Import Products
  const handleBulkImportProducts = (newProducts: ProductItem[]) => {
    setProducts(newProducts);
    showToast('Product catalog updated successfully from CSV!');
  };

  // Admin: Create User Account
  const handleAddUser = (newUser: SystemUser) => {
    setUsers((prev) => [newUser, ...prev]);

    // If partner, also sync to partners database if not present
    if (newUser.role === 'partner') {
      const exists = partners.some((p) => p.username.toLowerCase() === newUser.username.toLowerCase());
      if (!exists) {
        const newPartner: PartnerUser = {
          id: 'p-' + Date.now(),
          partnerCode: newUser.dmsCode || `SAMS-${newUser.username.slice(0, 3).toUpperCase()}-01`,
          dmsCode: newUser.dmsCode || `SAMS-${newUser.username.slice(0, 3).toUpperCase()}-01`,
          partnerName: newUser.fullName,
          username: newUser.username,
          password: newUser.password || 'pass123',
          zone: newUser.zone || 'Dhaka Central',
          tsmName: 'Rafiqul Islam (TSM/TSO)',
          zbhName: 'Mahmudul Hasan (ZBH/ASM)',
          rsmName: 'Tanvir Ahmed (CSM/RSM)',
          createdAt: new Date().toISOString(),
        };
        setPartners((prev) => [newPartner, ...prev]);
      }
    }
    showToast(`User ID "${newUser.username}" created with role ${newUser.role.toUpperCase()}.`);
  };

  // Admin: Update User Password
  const handleUpdateUserPassword = (userId: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    // Also sync password if user is partner
    const target = users.find((u) => u.id === userId);
    if (target && target.role === 'partner') {
      setPartners((prev) =>
        prev.map((p) =>
          p.username.toLowerCase() === target.username.toLowerCase()
            ? { ...p, password: newPass }
            : p
        )
      );
    }
    showToast('Password updated successfully.');
  };

  // Admin: Delete User
  const handleDeleteUser = (userId: string) => {
    if (!window.confirm('Delete this user account?')) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('User account deleted.');
  };

  // Admin: Update Partner Mapping
  const handleUpdatePartnerMapping = (
    partnerId: string,
    zone: string,
    tsmName: string,
    zbhName: string,
    rsmName: string
  ) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? { ...p, zone, tsmName, zbhName, rsmName }
          : p
      )
    );
    showToast('Partner territory hierarchy mapping updated.');
  };

  // Admin: Save Product
  const handleSaveProduct = (modelName: string, prodCode: string, colorName: string, price: number) => {
    setProducts((prev) => {
      const existingIndex = prev.findIndex((p) => p.model.toLowerCase() === modelName.toLowerCase());
      if (existingIndex > -1) {
        const updated = [...prev];
        const prod = { ...updated[existingIndex] };
        prod.prodcode = prodCode || prod.prodcode;
        const colorIdx = prod.colors.findIndex((c) => c.color.toLowerCase() === colorName.toLowerCase());
        if (colorIdx > -1) {
          prod.colors[colorIdx] = { color: colorName, price };
        } else {
          prod.colors.push({ color: colorName, price });
        }
        updated[existingIndex] = prod;
        return updated;
      } else {
        const newProd: ProductItem = {
          id: 'prod-' + Date.now(),
          model: modelName,
          prodcode: prodCode,
          status: 'Active',
          colors: [{ color: colorName, price }],
        };
        return [...prev, newProd];
      }
    });
    showToast(`Product ${modelName} (${colorName}) saved at ৳${price.toLocaleString()}.`);
  };

  // Order Submission Handler (Used by both TSM/TSO and Partners)
  const handleSubmitOrder = (
    items: OrderItemDetail[],
    depositSlip?: DepositSlip | null,
    orderIdToUpdate?: string,
    targetPartner?: PartnerUser
  ) => {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

    // Determine target partner details
    const effectivePartner = targetPartner || partners.find((p) => p.partnerCode === session?.partnerCode) || partners[0];
    const partnerCode = effectivePartner?.partnerCode || effectivePartner?.dmsCode || 'SAMS-GEN-01';
    const partnerName = effectivePartner?.partnerName || 'Partner';
    const zone = effectivePartner?.zone || session?.assignedZone || 'Dhaka Central';
    const tsmName = effectivePartner?.tsmName || session?.officerName || 'Rafiqul Islam (TSM/TSO)';
    const zbhName = effectivePartner?.zbhName || 'Mahmudul Hasan (ZBH/ASM)';
    const rsmName = effectivePartner?.rsmName || 'Tanvir Ahmed (CSM/RSM)';

    const isSubmittedByTsm = session?.role === 'tsm';

    if (orderIdToUpdate) {
      // Edit & Resubmit
      setOrders((prev) =>
        prev.map((o) => {
          if (o.OrderID === orderIdToUpdate) {
            const currentDeposits = o.deposits || [];
            const updatedDeposits = depositSlip && !currentDeposits.some((d) => d.id === depositSlip.id)
              ? [...currentDeposits, depositSlip]
              : currentDeposits;

            const resetChain = createDefaultApprovalChain(tsmName, zbhName, rsmName);

            // If edited by TSM, mark step 1 approved
            const status: 'Pending_ZBH' | 'Pending_TSM' = isSubmittedByTsm ? 'Pending_ZBH' : 'Pending_TSM';
            if (isSubmittedByTsm && resetChain[0]) {
              resetChain[0].status = 'Approved';
              resetChain[0].timestamp = new Date().toISOString();
              resetChain[0].remarks = 'Order updated & verified by TSM in-field';
            }

            return {
              ...o,
              details: items,
              TotalQty: totalQty,
              TotalValue: totalValue,
              Status: status,
              currentStage: isSubmittedByTsm ? 'ZBH_ASM' : 'TSM_TSO',
              approvalChain: resetChain,
              RejectReason: undefined,
              rejectedByStage: undefined,
              deposits: updatedDeposits,
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        })
      );
      setEditingOrder(null);
      showToast(`Order ${orderIdToUpdate} updated & resubmitted.`);
    } else {
      // Fresh Order Creation
      const newOrderNum = String(orders.length + 1).padStart(3, '0');
      const orderId = `SPO-2026-${newOrderNum}`;

      const initialChain = createDefaultApprovalChain(tsmName, zbhName, rsmName);
      
      // If TSM/TSO is creating the order for the partner:
      // TSM step is automatically verified/approved and order advances to Step 2: ZBH / ASM!
      let initialStatus: 'Pending_TSM' | 'Pending_ZBH' = 'Pending_TSM';
      let initialStage: 'TSM_TSO' | 'ZBH_ASM' = 'TSM_TSO';

      if (isSubmittedByTsm) {
        initialStatus = 'Pending_ZBH';
        initialStage = 'ZBH_ASM';
        if (initialChain[0]) {
          initialChain[0].status = 'Approved';
          initialChain[0].timestamp = new Date().toISOString();
          initialChain[0].approverName = session?.officerName || tsmName;
          initialChain[0].remarks = 'Order booked in-field by TSM/TSO with attached deposit voucher.';
        }
      }

      const newOrder: PartnerOrder = {
        OrderID: orderId,
        PartnerCode: partnerCode,
        dmsCode: partnerCode,
        PartnerName: partnerName,
        OrderDate: new Date().toISOString(),
        Status: initialStatus,
        TotalQty: totalQty,
        TotalValue: totalValue,
        zone,
        tsmName,
        zbhName,
        rsmName,
        currentStage: initialStage,
        approvalChain: initialChain,
        details: items,
        deposits: depositSlip ? [depositSlip] : [],
      };

      setOrders((prev) => [newOrder, ...prev]);

      if (isSubmittedByTsm) {
        showToast(`Order ${orderId} booked for ${partnerName} (DMS: ${partnerCode}) & submitted to ZBH/ASM!`);
      } else {
        showToast(`Order ${orderId} submitted! Assigned to TSM: ${tsmName}.`);
        setShareModalOrder(newOrder); // Automatically open share modal so partner can share link with TSM/TSO
      }
    }
  };

  const handleClearAllOrders = () => {
    if (window.confirm('Clear all orders from database? This will reset all order records.')) {
      setOrders([]);
      localStorage.removeItem('samsung_orders');
      showToast('All order records cleared.');
    }
  };

  // Multi-tier Sequential Approval Handler
  const handleApproveOrder = (orderId: string, remarks?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.OrderID !== orderId) return o;

        const chain = [...(o.approvalChain || createDefaultApprovalChain(o.tsmName, o.zbhName, o.rsmName))];
        const now = new Date().toISOString();

        // 1. TSM Approves -> advances to ZBH
        if (o.Status === 'Pending_TSM' || o.Status === 'Submitted') {
          if (chain[0]) {
            chain[0] = {
              ...chain[0],
              status: 'Approved',
              timestamp: now,
              approverName: session?.officerName || o.tsmName,
              remarks: remarks || 'Territory physical stock & deposit voucher verified',
            };
          }
          showToast(`Order ${orderId} recommended by TSM. Forwarded to ZBH/ASM.`);
          return {
            ...o,
            Status: 'Pending_ZBH',
            currentStage: 'ZBH_ASM',
            approvalChain: chain,
            updatedAt: now,
          };
        }

        // 2. ZBH Approves -> advances to RSM
        if (o.Status === 'Pending_ZBH') {
          if (chain[1]) {
            chain[1] = {
              ...chain[1],
              status: 'Approved',
              timestamp: now,
              approverName: session?.officerName || o.zbhName,
              remarks: remarks || 'Zonal target quota verified & cleared',
            };
          }
          showToast(`Order ${orderId} approved by ZBH. Forwarded to CSM/RSM.`);
          return {
            ...o,
            Status: 'Pending_RSM',
            currentStage: 'CSM_RSM',
            approvalChain: chain,
            updatedAt: now,
          };
        }

        // 3. CSM/RSM Approves -> advances to Admin Panel
        if (o.Status === 'Pending_RSM') {
          if (chain[2]) {
            chain[2] = {
              ...chain[2],
              status: 'Approved',
              timestamp: now,
              approverName: session?.officerName || o.rsmName,
              remarks: remarks || 'Regional credit allocation cleared for commercial invoice',
            };
          }
          showToast(`Order ${orderId} approved by RSM. Reached Admin Panel for Final Approval!`);
          return {
            ...o,
            Status: 'Pending_Admin',
            currentStage: 'ADMIN',
            approvalChain: chain,
            updatedAt: now,
          };
        }

        // 4. Admin Final Commercial Approval
        if (o.Status === 'Pending_Admin' || session?.role === 'admin') {
          if (chain[3]) {
            chain[3] = {
              ...chain[3],
              status: 'Approved',
              timestamp: now,
              approverName: 'Admin Commercial Desk',
              remarks: remarks || 'Final Commercial Authorization. Ready for dispatch.',
            };
          }
          showToast(`Order ${orderId} given FINAL COMMERCIAL APPROVAL by Admin!`);
          return {
            ...o,
            Status: 'Approved',
            currentStage: 'COMPLETED',
            approvalChain: chain,
            updatedAt: now,
          };
        }

        return o;
      })
    );
  };

  // Rejection with stage tracking and remarks
  const handleConfirmReject = (orderId: string, reason: string) => {
    const roleTag = session?.role === 'admin'
      ? 'Admin Desk'
      : session?.role === 'tsm'
      ? `TSM / TSO (${session?.officerName || 'Rafiqul Islam'})`
      : session?.role === 'zbh'
      ? `ZBH / ASM (${session?.officerName || 'Mahmudul Hasan'})`
      : `CSM / RSM (${session?.officerName || 'Tanvir Ahmed'})`;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.OrderID !== orderId) return o;

        const chain = [...(o.approvalChain || createDefaultApprovalChain(o.tsmName, o.zbhName, o.rsmName))];
        const now = new Date().toISOString();

        if (o.Status === 'Pending_TSM' && chain[0]) {
          chain[0] = { ...chain[0], status: 'Rejected', timestamp: now, remarks: reason };
        } else if (o.Status === 'Pending_ZBH' && chain[1]) {
          chain[1] = { ...chain[1], status: 'Rejected', timestamp: now, remarks: reason };
        } else if (o.Status === 'Pending_RSM' && chain[2]) {
          chain[2] = { ...chain[2], status: 'Rejected', timestamp: now, remarks: reason };
        } else if (chain[3]) {
          chain[3] = { ...chain[3], status: 'Rejected', timestamp: now, remarks: reason };
        }

        return {
          ...o,
          Status: 'Rejected',
          RejectReason: reason,
          rejectedByStage: roleTag,
          approvalChain: chain,
          updatedAt: now,
        };
      })
    );
    setRejectingOrderId(null);
    showToast(`Order ${orderId} Rejected at ${roleTag}.`);
  };

  // Partner: Edit & Resubmit
  const handleEditOrder = (orderId: string) => {
    const order = orders.find((o) => o.OrderID === orderId);
    if (!order) return;
    setEditingOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded Order ${orderId} into builder.`);
  };

  // Cancel Order
  const handleCancelOrder = (orderId: string) => {
    if (!window.confirm('এই অর্ডার Cancel করবেন? (Are you sure you want to cancel this order?)')) {
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.OrderID === orderId ? { ...o, Status: 'Cancelled' } : o))
    );
    showToast(`Order ${orderId} Cancelled.`);
  };

  // Upload Deposit Slip
  const handleUploadDeposit = (orderId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '#';
      const newDeposit: DepositSlip = {
        id: 'dep-' + Date.now(),
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileUrl: dataUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: Math.round(file.size / 1024) + ' KB',
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.OrderID === orderId
            ? { ...o, deposits: [...(o.deposits || []), newDeposit] }
            : o
        )
      );
      showToast(`Deposit Slip "${file.name}" uploaded for ${orderId}.`);
    };
    reader.readAsDataURL(file);
  };

  // Filter orders visible to user based on role (Data Isolation)
  const visibleOrders = (() => {
    if (!session) return [];
    if (session.role === 'admin' && !isTsmOnly) return orders;
    if (session.role === 'partner') {
      return orders.filter((o) => o.PartnerCode === session.partnerCode);
    }
    if (session.role === 'tsm') {
      const officerFirst = (session.officerName || '').toLowerCase().split(' ')[0];
      const assignedZone = (session.assignedZone || '').toLowerCase();
      return orders.filter((o) => {
        const matchesOfficer = officerFirst && o.tsmName && o.tsmName.toLowerCase().includes(officerFirst);
        const matchesZone = assignedZone && o.zone && o.zone.toLowerCase() === assignedZone;
        const partner = partners.find((p) => p.partnerCode === o.PartnerCode);
        const matchesPartner = partner && (
          (officerFirst && partner.tsmName && partner.tsmName.toLowerCase().includes(officerFirst)) ||
          (assignedZone && partner.zone && partner.zone.toLowerCase() === assignedZone)
        );
        return matchesOfficer || matchesZone || matchesPartner || !session.assignedZone;
      });
    }
    return orders;
  })();

  // Filter partners visible to TSM based on mapped territory
  const visiblePartners = (() => {
    if (session?.role === 'tsm') {
      const officerFirst = (session.officerName || '').toLowerCase().split(' ')[0];
      const assignedZone = (session.assignedZone || '').toLowerCase();
      const filtered = partners.filter((p) => {
        const matchesOfficer = officerFirst && p.tsmName && p.tsmName.toLowerCase().includes(officerFirst);
        const matchesZone = assignedZone && p.zone && p.zone.toLowerCase() === assignedZone;
        return matchesOfficer || matchesZone;
      });
      return filtered.length > 0 ? filtered : partners;
    }
    return partners;
  })();

  // Notification badge calculations
  const pendingAdminCount = orders.filter((o) => o.Status === 'Pending_Admin' || o.Status === 'Submitted').length;
  const pendingTsmCount = orders.filter((o) => o.Status === 'Pending_TSM').length;
  const pendingZbhCount = orders.filter((o) => o.Status === 'Pending_ZBH').length;
  const pendingRsmCount = orders.filter((o) => o.Status === 'Pending_RSM').length;

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-slate-950 text-[#172033] dark:text-slate-100 antialiased font-sans transition-colors">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#142b55] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 border border-blue-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="wrap max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between py-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <SamsungLogo height={34} className="drop-shadow-xs" />
            <span className="text-slate-300 dark:text-slate-700 font-light text-lg">|</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight m-0">
                {isTsmOnly ? 'Samsung TSM / TSO Field Portal' : 'Samsung Partner Order Management'}
              </h1>
              <p className="text-[10px] text-slate-500 font-mono hidden sm:block">
                {isTsmOnly
                  ? 'Territory Sales Officer Portal · Restricted Field Access'
                  : 'Hierarchy: Partner / TSM → ZBH/ASM → CSM/RSM → Admin Desk'}
              </p>
            </div>
          </div>

          {/* Header Controls: Google Drive & Theme Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isDriveConnected()
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1428a0] dark:text-blue-300 border-blue-200 dark:border-blue-900/60 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Google Drive Storage, Backup & Troubleshooting"
            >
              <Cloud className={`w-3.5 h-3.5 ${isDriveConnected() ? 'text-[#1428a0] dark:text-blue-400' : 'text-slate-500'}`} />
              <span className="font-medium">Google Drive</span>
              {isDriveConnected() && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* 1. LOGIN SCREEN (If not authenticated) */}
        {!session ? (
          <LoginCard 
            onLogin={doLogin} 
            errorMsg={loginMsg} 
            portalMode={portalMode} 
            focusedOrderId={urlOrderId} 
          />
        ) : (
          /* 2. AUTHENTICATED APP */
          <div id="app" className="space-y-4">
            
            {/* Banner when accessed via shared TSM order link */}
            {urlOrderId && (
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    TSM
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Shared Order Link:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{urlOrderId}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You opened a direct TSM/TSO order review link. The target order is highlighted below for your review.
                    </p>
                  </div>
                </div>
                <a
                  href={`#order-${urlOrderId}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1 shrink-0"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* User Session Bar & Role Status */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* User info & Notification Indicator */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b id="who" className="text-sm text-slate-900 dark:text-white font-bold">
                        {session.role === 'admin' && 'SAMSUNG ADMIN PANEL (Commercial Desk)'}
                        {session.role === 'tsm' && `TSM / TSO: ${session.officerName || session.username} (${session.assignedZone || 'Dhaka Central'})`}
                        {session.role === 'zbh' && `ZBH / ASM: ${session.officerName || session.username} (${session.assignedZone || 'Dhaka'})`}
                        {session.role === 'rsm' && `CSM / RSM: ${session.officerName || session.username} (${session.assignedZone || 'Central'})`}
                        {session.role === 'partner' && `${session.partnerName} (${session.partnerCode})`}
                      </b>

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#142b55] dark:text-blue-300">
                        {session.role}
                      </span>
                    </div>

                    {session.role === 'partner' && (
                      <p className="text-[11px] text-slate-500">
                        DMS Code: <strong className="text-blue-600 font-mono">{session.partnerCode || session.dmsCode}</strong> · Zone: {session.assignedZone || 'Dhaka'}
                      </p>
                    )}
                  </div>

                  {/* ADMIN NOTIFICATION BADGE: Orders waiting in Admin Panel */}
                  {session.role === 'admin' && (
                    pendingAdminCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                        <Bell className="w-3.5 h-3.5" />
                        <span>{pendingAdminCount} Order Approval Pending in Admin Panel</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>0 Pending Approvals</span>
                      </span>
                    )
                  )}

                  {session.role === 'tsm' && pendingTsmCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs animate-pulse">
                      <Bell className="w-3.5 h-3.5" />
                      <span>{pendingTsmCount} Pending TSM Review</span>
                    </span>
                  )}

                  {session.role === 'zbh' && pendingZbhCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white shadow-xs animate-pulse">
                      <Bell className="w-3.5 h-3.5" />
                      <span>{pendingZbhCount} Pending Zonal Approval</span>
                    </span>
                  )}

                  {session.role === 'rsm' && pendingRsmCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs animate-pulse">
                      <Bell className="w-3.5 h-3.5" />
                      <span>{pendingRsmCount} Pending Regional Approval</span>
                    </span>
                  )}
                </div>

                {/* Switch Role Selector, Access Admin & Logout */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Master Admin Permission Shortcut */}
                  {session.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        doLogin('admin', 'admin123');
                        showToast('Admin Control Activated: User Add & Remove, Database Update, Product & Price List Update unlocked.');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#142b55] hover:bg-[#0f2142] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Access Admin permission to control this portal as an admin"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Access Admin Control</span>
                    </button>
                  )}

                  <div className="relative inline-block">
                    <select
                      value={session.role === 'partner' ? session.partnerCode : session.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'admin') {
                          doLogin('admin', 'admin123');
                        } else if (val === 'tsm') {
                          doLogin('tso_dhaka', 'pass123');
                        } else if (val === 'zbh') {
                          doLogin('zbh_dhaka', 'pass123');
                        } else if (val === 'rsm') {
                          doLogin('rsm_central', 'pass123');
                        } else {
                          const p = partners.find((x) => x.partnerCode === val);
                          if (p) doLogin(p.username, 'pass123');
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-[#e9edf5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="admin">Switch: Admin Desk</option>
                      <option value="tsm">Switch: TSM / TSO (Rafiqul Islam)</option>
                      <option value="zbh">Switch: ZBH / ASM (Mahmudul Hasan)</option>
                      <option value="rsm">Switch: CSM / RSM (Tanvir Ahmed)</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.partnerCode}>
                          Partner: {p.partnerName} ({p.partnerCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={doLogout}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#e9edf5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-[#d8e0ee] font-semibold flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* ADMIN PANEL (If role is admin) */}
              {session.role === 'admin' && (
                <div id="adminPanel" className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <AdminPanel
                    partners={partners}
                    products={products}
                    orders={orders}
                    users={users}
                    onAddPartner={handleAddPartner}
                    onBulkImportPartners={handleBulkImportPartners}
                    onBulkImportProducts={handleBulkImportProducts}
                    onAddUser={handleAddUser}
                    onUpdateUserPassword={handleUpdateUserPassword}
                    onDeleteUser={handleDeleteUser}
                    onUpdatePartnerMapping={handleUpdatePartnerMapping}
                    onSaveProduct={handleSaveProduct}
                    onApproveOrder={handleApproveOrder}
                    onRejectOrder={(id) => setRejectingOrderId(id)}
                    onOpenDriveModal={() => setIsDriveModalOpen(true)}
                    onClearOrders={handleClearAllOrders}
                  />
                </div>
              )}
            </div>

            {/* Officer Credentials Card for TSM, ZBH, CSM: Shows User ID & Password with NO edit option */}
            {(session.role === 'tsm' || session.role === 'zbh' || session.role === 'rsm') && (
              <OfficerCredentialsCard
                session={session}
                currentUser={users.find((u) => u.username.toLowerCase() === session.username.toLowerCase())}
                onAccessAdmin={() => {
                  doLogin('admin', 'admin123');
                  showToast('Switched to Admin Desk: User Add/Remove, Database Update, and Product/Price Lists available.');
                }}
              />
            )}

            {/* TSM / TSO & PARTNER ORDER CREATION PANEL */}
            {/* When TSM/TSO logs in: Select Partner Name from Dropdown -> Show DMS Code -> Select Model & Color -> Type QTY -> Show Value on Right -> Upload Slip -> Submit */}
            {(session.role === 'tsm' || session.role === 'partner') && (
              <div id="partnerPanel">
                <PartnerPanel
                  products={products}
                  partners={partners}
                  currentRole={session.role}
                  currentOfficerName={session?.officerName}
                  defaultPartner={partners.find((p) => p.partnerCode === session.partnerCode)}
                  editingOrder={editingOrder}
                  onOpenDriveModal={() => setIsDriveModalOpen(true)}
                  onSubmitOrder={handleSubmitOrder}
                  onCancelEdit={() => setEditingOrder(null)}
                />
              </div>
            )}

            {/* ORDERS SECTION (Visible to all, with role-specific actions) */}
            <div className="card">
              <OrdersList
                orders={visibleOrders}
                role={session.role}
                currentOfficerName={session?.officerName}
                focusedOrderId={urlOrderId}
                onApproveOrder={handleApproveOrder}
                onRejectOrder={(id) => setRejectingOrderId(id)}
                onEditOrder={handleEditOrder}
                onCancelOrder={handleCancelOrder}
                onUploadDeposit={handleUploadDeposit}
                onViewDeposit={(deposit) => setViewingDeposit(deposit)}
              />
            </div>

          </div>
        )}

      </div>

      {/* Share Order Modal */}
      {shareModalOrder && (
        <ShareOrderModal
          order={shareModalOrder}
          onClose={() => setShareModalOrder(null)}
        />
      )}

      {/* Reject Reason Modal */}
      <RejectReasonModal
        orderId={rejectingOrderId}
        isOpen={Boolean(rejectingOrderId)}
        onClose={() => setRejectingOrderId(null)}
        onConfirmReject={handleConfirmReject}
      />

      {/* Deposit Slip Viewer Modal */}
      <DepositSlipModal
        deposit={viewingDeposit}
        onClose={() => setViewingDeposit(null)}
      />

      {/* Google Drive Integration & Troubleshooting Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        orders={orders}
        onNotify={showToast}
      />

    </div>
  );
}
