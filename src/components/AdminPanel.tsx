import React, { useState } from 'react';
import { PartnerUser, ProductItem, PartnerOrder, SystemUser, UserRole } from '../types';
import { INITIAL_OFFICERS } from '../data/initialData';
import { 
  UserPlus, 
  PackagePlus, 
  Download, 
  CheckCircle2, 
  Users, 
  FileSpreadsheet, 
  Bell, 
  Check, 
  XCircle, 
  FileText, 
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Edit2,
  Save,
  X,
  Upload,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Database,
  FileCheck,
  Search,
  Filter,
  Cloud,
  ExternalLink,
  Copy,
  Link2,
  UserCheck
} from 'lucide-react';
import { saveOrderReportToDrive, isDriveConnected, getDriveUser } from '../services/googleDrive';

interface AdminPanelProps {
  partners: PartnerUser[];
  products: ProductItem[];
  orders: PartnerOrder[];
  users: SystemUser[];
  onOpenDriveModal?: () => void;
  onAddPartner: (
    code: string,
    name: string,
    user: string,
    pass: string,
    zone: string,
    tsmName: string,
    zbhName: string,
    rsmName: string
  ) => void;
  onBulkImportPartners: (newPartners: PartnerUser[]) => void;
  onBulkImportProducts: (newProducts: ProductItem[]) => void;
  onAddUser: (user: SystemUser) => void;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdatePartnerMapping: (
    partnerId: string,
    zone: string,
    tsmName: string,
    zbhName: string,
    rsmName: string
  ) => void;
  onSaveProduct: (model: string, prodcode: string, color: string, price: number) => void;
  onDeleteProduct?: (id: string) => void;
  onApproveOrder?: (orderId: string, remarks?: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onClearOrders?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  partners,
  products,
  orders,
  users,
  onAddPartner,
  onBulkImportPartners,
  onBulkImportProducts,
  onAddUser,
  onUpdateUserPassword,
  onDeleteUser,
  onUpdatePartnerMapping,
  onSaveProduct,
  onApproveOrder,
  onRejectOrder,
  onOpenDriveModal,
  onClearOrders,
}) => {
  // Navigation Tabs inside Admin Panel
  const [activeTab, setActiveTab] = useState<'approvals' | 'mapping' | 'users' | 'upload_partner' | 'products' | 'export'>('approvals');
  const [driveExportNotice, setDriveExportNotice] = useState<string | null>(null);
  const [driveExportLink, setDriveExportLink] = useState<string | null>(null);
  const [isExportingDrive, setIsExportingDrive] = useState(false);

  // Add Partner Form State
  const [pcode, setPcode] = useState('');
  const [pname, setPname] = useState('');
  const [puser, setPuser] = useState('');
  const [ppass, setPpass] = useState('');
  const [pzone, setPzone] = useState('Dhaka Central');
  const [ptsm, setPtsm] = useState('Rafiqul Islam (TSM/TSO)');
  const [pzbh, setPzbh] = useState('Mahmudul Hasan (ZBH/ASM)');
  const [prsm, setPrsm] = useState('Tanvir Ahmed (CSM/RSM)');
  const [partnerNotice, setPartnerNotice] = useState<string | null>(null);

  // Edit Mapping Inline State
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editZone, setEditZone] = useState('');
  const [editTsm, setEditTsm] = useState('');
  const [editZbh, setEditZbh] = useState('');
  const [editRsm, setEditRsm] = useState('');
  const [mappingFilterTsm, setMappingFilterTsm] = useState<string>('all');

  // Add User State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('pass123');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('tsm');
  const [newDesignation, setNewDesignation] = useState('TSM / TSO (Territory Sales Officer)');
  const [newUserZone, setNewUserZone] = useState('Dhaka Central');
  const [newUserDms, setNewUserDms] = useState('');
  const [userNotice, setUserNotice] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [editingPasswordValue, setEditingPasswordValue] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [copiedTsmLink, setCopiedTsmLink] = useState(false);
  const [copiedUserCardId, setCopiedUserCardId] = useState<string | null>(null);

  // Bulk Upload Partner Database State
  const [partnerCsvNotice, setPartnerCsvNotice] = useState<string | null>(null);

  // Bulk Upload Product Catalog State
  const [productCsvNotice, setProductCsvNotice] = useState<string | null>(null);

  // Add/Update Product State
  const [model, setModel] = useState('');
  const [prodcode, setProdcode] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [productNotice, setProductNotice] = useState<string | null>(null);

  // Date-wise Export State
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Orders pipeline counts
  const pendingTsmOrders = orders.filter((o) => o.Status === 'Pending_TSM');
  const pendingZbhOrders = orders.filter((o) => o.Status === 'Pending_ZBH');
  const pendingRsmOrders = orders.filter((o) => o.Status === 'Pending_RSM');
  const pendingAdminOrders = orders.filter((o) => o.Status === 'Pending_Admin' || o.Status === 'Submitted');
  const pendingAdminCount = pendingAdminOrders.length;

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcode || !pname || !puser || !ppass) {
      alert('Please fill out all partner fields.');
      return;
    }
    onAddPartner(
      pcode.trim(),
      pname.trim(),
      puser.trim(),
      ppass.trim(),
      pzone.trim(),
      ptsm.trim(),
      pzbh.trim(),
      prsm.trim()
    );
    setPartnerNotice(`Partner "${pname}" (DMS: ${pcode}) registered and mapped to ${ptsm}.`);
    setPcode('');
    setPname('');
    setPuser('');
    setPpass('');
    setTimeout(() => setPartnerNotice(null), 3500);
  };

  const startEditMapping = (partner: PartnerUser) => {
    setEditingPartnerId(partner.id);
    setEditZone(partner.zone || 'Dhaka Central');
    setEditTsm(partner.tsmName || 'Rafiqul Islam (TSM/TSO)');
    setEditZbh(partner.zbhName || 'Mahmudul Hasan (ZBH/ASM)');
    setEditRsm(partner.rsmName || 'Tanvir Ahmed (CSM/RSM)');
  };

  const handleSaveMapping = (partnerId: string) => {
    onUpdatePartnerMapping(partnerId, editZone, editTsm, editZbh, editRsm);
    setEditingPartnerId(null);
    setPartnerNotice('Partner hierarchy mapping updated successfully.');
    setTimeout(() => setPartnerNotice(null), 3000);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !prodcode || !color || price === '' || Number(price) <= 0) {
      alert('Please provide model, product code, color, and a valid BDT price.');
      return;
    }
    onSaveProduct(model.trim(), prodcode.trim(), color.trim(), Number(price));
    setProductNotice(`Saved ${model} (${color}) at ৳${Number(price).toLocaleString()}`);
    setColor('');
    setPrice('');
    setTimeout(() => setProductNotice(null), 3000);
  };

  // 1. BULK UPLOAD PARTNER DATABASE (CSV FILE PARSER)
  const handlePartnerCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file is empty or does not contain data rows.');
          return;
        }

        const newPartnersList: PartnerUser[] = [];
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/(^"|"$)/g, '').trim());
          if (cols.length >= 3 && cols[0]) {
            const partnerName = cols[0];
            const dmsCode = cols[1] || `SAMS-GEN-${Date.now().toString().slice(-4)}`;
            const username = cols[2] || partnerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const password = cols[3] || 'pass123';
            const phone = cols[4] || '+880 1700-000000';
            const zone = cols[5] || 'Dhaka Central';
            const tsmName = cols[6] || 'Rafiqul Islam (TSM/TSO)';
            const zbhName = cols[7] || 'Mahmudul Hasan (ZBH/ASM)';
            const rsmName = cols[8] || 'Tanvir Ahmed (CSM/RSM)';

            newPartnersList.push({
              id: 'p-' + Date.now() + '-' + i,
              partnerName,
              partnerCode: dmsCode,
              dmsCode: dmsCode,
              username,
              password,
              phone,
              zone,
              tsmName,
              zbhName,
              rsmName,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (newPartnersList.length > 0) {
          onBulkImportPartners(newPartnersList);
          setPartnerCsvNotice(`Successfully imported ${newPartnersList.length} partner(s) into database!`);
          setTimeout(() => setPartnerCsvNotice(null), 4000);
        } else {
          alert('Could not parse valid partner rows. Please check template format.');
        }
      } catch (err) {
        alert('Error parsing CSV file. Please make sure it is a valid CSV document.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Sample Partner CSV Template
  const downloadPartnerTemplate = () => {
    const headers = 'Partner_Name,DMS_Code,Username,Password,Phone,Zone,TSM_Name,ZBH_Name,RSM_Name\n';
    const sampleRows = [
      'Padma Electronics Ltd,SAMS-DHK-11,padma_bd,pass123,+880 1711-334455,Dhaka Central,Rafiqul Islam (TSM/TSO),Mahmudul Hasan (ZBH/ASM),Tanvir Ahmed (CSM/RSM)',
      'Meghna Telecom World,SAMS-CTG-09,meghna_ctg,pass123,+880 1819-223344,Chittagong Metro,Kamrul Ahsan (TSM/TSO),Mizanur Rahman (ZBH/ASM),Saiful Islam (CSM/RSM)',
      'Jamuna Gadget Store,SAMS-SYL-14,jamuna_syl,pass123,+880 1722-556677,Sylhet Division,Nazmul Huda (TSM/TSO),Farhan Kabir (ZBH/ASM),Tanvir Ahmed (CSM/RSM)',
    ].join('\n');

    const blob = new Blob(['\ufeff' + headers + sampleRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Samsung_Partner_Database_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. BULK UPLOAD PRODUCT CATALOG (CSV FILE PARSER)
  const handleProductCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file is empty or does not contain data rows.');
          return;
        }

        const productMap = new Map<string, ProductItem>();

        // Preload existing products
        products.forEach((p) => {
          productMap.set(p.model.toLowerCase(), { ...p, colors: [...p.colors] });
        });

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/(^"|"$)/g, '').trim());
          if (cols.length >= 4 && cols[0]) {
            const modelName = cols[0];
            const dmsProdCode = cols[1];
            const colorName = cols[2];
            const price = Number(cols[3]) || 0;

            const key = modelName.toLowerCase();
            if (productMap.has(key)) {
              const existing = productMap.get(key)!;
              existing.prodcode = dmsProdCode || existing.prodcode;
              const colorIdx = existing.colors.findIndex((c) => c.color.toLowerCase() === colorName.toLowerCase());
              if (colorIdx > -1) {
                existing.colors[colorIdx] = { color: colorName, price };
              } else {
                existing.colors.push({ color: colorName, price });
              }
            } else {
              productMap.set(key, {
                id: 'prod-' + Date.now() + '-' + i,
                model: modelName,
                prodcode: dmsProdCode,
                status: 'Active',
                colors: [{ color: colorName, price }],
              });
            }
          }
        }

        const updatedProducts = Array.from(productMap.values());
        onBulkImportProducts(updatedProducts);
        setProductCsvNotice(`Successfully updated product catalog with ${updatedProducts.length} models!`);
        setTimeout(() => setProductCsvNotice(null), 4000);
      } catch (err) {
        alert('Error parsing Product CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Sample Product CSV Template
  const downloadProductTemplate = () => {
    const headers = 'Model,DMS_ProdCode,Color,Price_BDT\n';
    const sampleRows = [
      'Galaxy S25 Ultra,SM-S938B,Titanium Black,179999',
      'Galaxy S25 Ultra,SM-S938B,Titanium Gray,179999',
      'Galaxy Z Fold6,SM-F956B,Silver Shadow,229999',
      'Galaxy A55 5G,SM-A556E,Awesome Navy,49999',
      'Galaxy A35 5G,SM-A356E,Awesome Lemon,39999',
    ].join('\n');

    const blob = new Blob(['\ufeff' + headers + sampleRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Samsung_Product_Catalog_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. CREATE ALL USER ID & PASSWORD HANDLER
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newFullName) {
      alert('Please fill out User ID, Password, and Full Name.');
      return;
    }

    const newUser: SystemUser = {
      id: 'usr-' + Date.now(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      fullName: newFullName.trim(),
      role: newUserRole,
      designation: newDesignation.trim(),
      zone: newUserZone.trim(),
      dmsCode: newUserDms.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddUser(newUser);
    setUserNotice(`User ID "${newUser.username}" (${newUser.role.toUpperCase()}) created successfully!`);
    setNewUsername('');
    setNewFullName('');
    setNewPassword('pass123');
    setNewUserDms('');
    setTimeout(() => setUserNotice(null), 3500);
  };

  const handleUpdatePassword = (userId: string) => {
    if (!editingPasswordValue.trim()) {
      alert('Please enter a new password.');
      return;
    }
    onUpdateUserPassword(userId, editingPasswordValue.trim());
    setEditingPasswordUserId(null);
    setEditingPasswordValue('');
    setUserNotice('Password updated successfully.');
    setTimeout(() => setUserNotice(null), 3000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = userSearchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.zone && u.zone.toLowerCase().includes(q)) ||
      (u.dmsCode && u.dmsCode.toLowerCase().includes(q))
    );
  });

  const handleExportCsv = () => {
    if (!fromDate || !toDate) {
      alert('Please choose both from and to dates.');
      return;
    }

    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T23:59:59');

    const filtered = orders.filter((o) => {
      const d = new Date(o.OrderDate);
      return d >= start && d <= end;
    });

    if (filtered.length === 0) {
      alert(`No orders found between ${fromDate} and ${toDate}`);
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
      'Assigned CSM / RSM',
      'Deposit Slip Attached',
      'Rejection Feedback'
    ];

    const rows: (string | number)[][] = [];

    filtered.forEach((order) => {
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
            `"${order.rsmName || ''}"`,
            `"${(order.deposits && order.deposits.length > 0) ? order.deposits[0].fileName : 'None'}"`,
            `"${order.RejectReason || ''}"`,
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
          `"${order.rsmName || ''}"`,
          `"${(order.deposits && order.deposits.length > 0) ? order.deposits[0].fileName : 'None'}"`,
          `"${order.RejectReason || ''}"`,
        ]);
      }
    });

    const csvString = '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Samsung_Orders_ProductWise_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportToDrive = async () => {
    setDriveExportNotice(null);
    setDriveExportLink(null);
    if (!isDriveConnected()) {
      if (onOpenDriveModal) {
        onOpenDriveModal();
      } else {
        alert('Please connect Google Drive from the top bar first.');
      }
      return;
    }

    setIsExportingDrive(true);
    try {
      const from = new Date(fromDate).getTime();
      const to = new Date(toDate).getTime() + 86400000;
      const filtered = orders.filter((o) => {
        const d = new Date(o.OrderDate).getTime();
        return d >= from && d <= to;
      });

      const res = await saveOrderReportToDrive(
        filtered.length > 0 ? filtered : orders,
        `Samsung_Orders_${fromDate}_to_${toDate}.csv`
      );

      setDriveExportNotice(`Successfully saved to Google Drive folder "Samsung_Partner_Orders"!`);
      if (res.webViewLink) {
        setDriveExportLink(res.webViewLink);
      }
    } catch (err: any) {
      setDriveExportNotice(`Failed: ${err.message || 'Drive export error'}`);
    } finally {
      setIsExportingDrive(false);
    }
  };

  const tsmPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?role=tsm`
    : 'https://ais-pre-47fh2qwwcdov6sjjalwtu6-724951353974.asia-east1.run.app/?role=tsm';

  const handleCopyTsmLink = () => {
    navigator.clipboard.writeText(tsmPortalUrl);
    setCopiedTsmLink(true);
    setTimeout(() => setCopiedTsmLink(false), 2500);
  };

  const handleCopyTsmUserCredentials = (u: SystemUser) => {
    const text = `🏢 Samsung Partner Order Portal (TSM / TSO)
🔗 Dedicated Officer Link: ${tsmPortalUrl}
👤 User ID: ${u.username}
🔑 Password: ${u.password}
📍 Officer Name: ${u.fullName}
🗺️ Territory / Zone: ${u.zone || 'Assigned Zone'}
------------------------------------------------
Note: This link only shows your territory partners & orders. Admin Desk and other accounts are hidden.`;
    navigator.clipboard.writeText(text);
    setCopiedUserCardId(u.id);
    setTimeout(() => setCopiedUserCardId(null), 2500);
  };

  return (
    <div className="space-y-5">
      
      {/* MASTER ADMIN ACCESS PERMISSION BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-[#142b55] via-[#1a3668] to-[#1e3a8a] text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-400/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Admin Access Permission: Full Portal Control Active
            </span>
          </div>
          <p className="text-[11px] text-slate-200">
            Only Administrator has full permission: User Add & Remove • Database Update • Product List & Price List Update • Commercial Approvals
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold bg-blue-950/80 border border-blue-400/40 px-2 py-0.5 rounded text-blue-100">
            ✓ User Add & Remove
          </span>
          <span className="text-[10px] font-bold bg-blue-950/80 border border-blue-400/40 px-2 py-0.5 rounded text-blue-100">
            ✓ Database Update
          </span>
          <span className="text-[10px] font-bold bg-blue-950/80 border border-blue-400/40 px-2 py-0.5 rounded text-blue-100">
            ✓ Product & Price Update
          </span>
        </div>
      </div>

      {/* ADMIN WORKSPACE SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Final Approvals ({pendingAdminCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
          <span>User Add & Remove ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload_partner')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'upload_partner'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>Database Update ({partners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5 text-blue-500" />
          <span>Product List & Price List Update ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mapping')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'mapping'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
          <span>Territory Mapping</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'export'
              ? 'bg-[#142b55] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Date Export</span>
        </button>

        {onClearOrders && orders.length > 0 && (
          <button
            type="button"
            onClick={onClearOrders}
            title="Wipe and clear all orders from database"
            className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Orders ({orders.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: NOTIFICATION BADGE & FINAL APPROVALS PIPELINE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className={`rounded-xl p-5 border transition-all ${
            pendingAdminCount > 0
              ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-sm'
              : 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingAdminCount > 0
                    ? 'bg-amber-500 text-white shadow-md animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Admin Final Commercial Approvals
                    </h3>
                    {pendingAdminCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs animate-bounce">
                        {pendingAdminCount} Awaiting Final Approval
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                        All Requisitions Cleared
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {pendingAdminCount > 0
                      ? `There are ${pendingAdminCount} partner purchase order(s) awaiting final administrative authorization in the Admin Panel.`
                      : 'Zero orders awaiting final approval. All partner requisitions have been verified.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-tier Pipeline Counters */}
            <div className="mt-4 pt-3.5 border-t border-amber-200/80 dark:border-amber-800/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">1. TSM / TSO Review</span>
                  <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">{pendingTsmOrders.length}</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">2. ZBH / ASM Zonal</span>
                  <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">{pendingZbhOrders.length}</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">3. CSM / RSM Regional</span>
                  <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">{pendingRsmOrders.length}</span>
                </div>
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/50 rounded-lg border border-amber-300">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block uppercase">4. Admin Final Desk</span>
                  <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-400">{pendingAdminCount}</span>
                </div>
              </div>
            </div>

            {/* Pending Orders Queue */}
            {pendingAdminCount > 0 && (
              <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 space-y-2">
                {pendingAdminOrders.map((order) => (
                  <div
                    key={order.OrderID}
                    className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {order.OrderID}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {order.PartnerName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-blue-600">
                          (DMS: {order.dmsCode || order.PartnerCode})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                        <span>{order.TotalQty} pcs</span>
                        <span>•</span>
                        <span className="font-bold text-[#142b55] dark:text-blue-400">৳{order.TotalValue.toLocaleString()}</span>
                        <span>•</span>
                        <span>TSM: {order.tsmName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onApproveOrder && (
                        <button
                          type="button"
                          onClick={() => onApproveOrder(order.OrderID, 'Commercial Final Approval given by Admin Desk')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Final Approval</span>
                        </button>
                      )}
                      {onRejectOrder && (
                        <button
                          type="button"
                          onClick={() => onRejectOrder(order.OrderID)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE ALL USER ID & PASSWORD (USER CREDENTIALS CENTER) */}
      {activeTab === 'users' && (
        <div className="space-y-5">

          {/* DEDICATED TSM/TSO PORTAL LINK CARD */}
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-[#1428a0] text-white rounded-xl p-5 shadow-md space-y-3 border border-indigo-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <UserCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Dedicated TSM / TSO Portal Link (টিএসএম / টিএসও ফিল্ড পোর্টাল লিংক)</span>
                    <span className="text-[10px] bg-emerald-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      TSM Only
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                    Share this dedicated link with your TSM / TSO field officers. When they open it, they will <strong>ONLY</strong> see the TSM field booking & territory approvals. Admin Panel, switch-role dropdowns, and other users' accounts are completely hidden.
                  </p>
                </div>
              </div>
            </div>

            {/* Link Box & Copy Action */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="w-full flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-xs font-mono text-indigo-100 select-all overflow-x-auto">
                <Link2 className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span className="truncate">{tsmPortalUrl}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCopyTsmLink}
                  className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  {copiedTsmLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-900" />}
                  <span>{copiedTsmLink ? 'Link Copied!' : 'Copy TSM Link'}</span>
                </button>
                <a
                  href={tsmPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 shrink-0 border border-white/20"
                  title="Test TSM Portal in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          </div>

          {/* Create User Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Admin: Create User ID & Password</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create credentials for any role: Admin, TSM/TSO, ZBH/ASM, CSM/RSM, or Partner
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {users.length} Active System Users
              </span>
            </div>

            {userNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{userNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Full Name / Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anisur Rahman"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    System Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewUserRole(r);
                      if (r === 'tsm') setNewDesignation('TSM / TSO (Territory Sales Officer)');
                      if (r === 'zbh') setNewDesignation('ZBH / ASM (Zonal Business Head)');
                      if (r === 'rsm') setNewDesignation('CSM / RSM (Commercial Sales Manager)');
                      if (r === 'admin') setNewDesignation('Samsung Headquarters Admin Desk');
                      if (r === 'partner') setNewDesignation('Authorized Partner Retailer');
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="tsm">TSM / TSO (Territory Sales Officer)</option>
                    <option value="zbh">ZBH / ASM (Zonal Business Head)</option>
                    <option value="rsm">CSM / RSM (Regional Sales Manager)</option>
                    <option value="admin">Admin Desk (Headquarters)</option>
                    <option value="partner">Partner (Retailer Account)</option>
                  </select>
                </div>

                {/* Designation / Title */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* User ID */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Login User ID (Username)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. tso_khulna, electro_dhk"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Zone */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Assigned Zone / Territory
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka Central"
                    value={newUserZone}
                    onChange={(e) => setNewUserZone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* DMS Code (if partner) */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    DMS Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SAMS-DHK-20"
                    value={newUserDms}
                    onChange={(e) => setNewUserDms(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User ID & Set Password</span>
              </button>
            </form>
          </div>

          {/* User Directory Table with Password Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  System User Accounts & Password Management
                </h3>
                <p className="text-xs text-slate-500">
                  Manage login IDs, passwords, and permissions for all officers and partners
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user ID, name, role..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">User ID</th>
                    <th className="py-2 px-3">Full Name / Title</th>
                    <th className="py-2 px-3">Zone / DMS</th>
                    <th className="py-2 px-3">Password</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const isVisible = visiblePasswords[u.id];
                    const isEditingPass = editingPasswordUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : u.role === 'tsm'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : u.role === 'zbh'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : u.role === 'rsm'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {u.username}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400">{u.designation}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-700 dark:text-slate-300">{u.zone || '—'}</div>
                          {u.dmsCode && (
                            <span className="font-mono text-[10px] text-blue-600 font-bold block">
                              DMS: {u.dmsCode}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditingPass ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingPasswordValue}
                                onChange={(e) => setEditingPasswordValue(e.target.value)}
                                className="px-2 py-0.5 text-xs font-mono border rounded bg-white dark:bg-slate-800 w-28"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePassword(u.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                title="Save Password"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPasswordUserId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-700 dark:text-slate-300">
                                {isVisible ? u.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-0.5 text-slate-400 hover:text-slate-600"
                                title={isVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {u.role === 'tsm' && (
                              <button
                                type="button"
                                onClick={() => handleCopyTsmUserCredentials(u)}
                                className="px-2 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition shadow-2xs"
                                title="Copy portal link & credentials to send to TSM officer"
                              >
                                {copiedUserCardId === u.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-indigo-600" />}
                                <span>{copiedUserCardId === u.id ? 'Copied Info!' : 'Share TSM Info'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPasswordUserId(u.id);
                                setEditingPasswordValue(u.password || '');
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              Edit Password
                            </button>
                            {onDeleteUser && u.username !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD PARTNER DATABASE (CSV BULK IMPORT & REGISTRATION) */}
      {activeTab === 'upload_partner' && (
        <div className="space-y-5">
          {/* File Upload Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Admin: Upload Partner Database (CSV / Excel)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import partner master data with DMS codes, login IDs, passwords, and assigned field officers in bulk
                </p>
              </div>

              <button
                type="button"
                onClick={downloadPartnerTemplate}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {partnerCsvNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{partnerCsvNotice}</span>
              </div>
            )}

            {/* Upload Drag & Drop Area */}
            <div>
              <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
                <Upload className="w-8 h-8 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select Partner Database CSV file to upload
                </span>
                <span className="text-[11px] text-slate-400">
                  Columns: Partner_Name, DMS_Code, Username, Password, Phone, Zone, TSM_Name, ZBH_Name, RSM_Name
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handlePartnerCsvUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Or Register Single Partner Manually */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Or Register Single Partner with DMS Code & Hierarchy:
            </h3>

            {partnerNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{partnerNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="DMS Code (e.g. SAMS-DHK-09)"
                  value={pcode}
                  onChange={(e) => setPcode(e.target.value)}
                  className="px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Partner Name (e.g. Padma Telecom Ltd)"
                  value={pname}
                  onChange={(e) => setPname(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Login User ID (e.g. padma_bd)"
                  value={puser}
                  onChange={(e) => setPuser(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Temporary Password (e.g. pass123)"
                  value={ppass}
                  onChange={(e) => setPpass(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Zone / Territory</label>
                  <input
                    type="text"
                    value={pzone}
                    onChange={(e) => setPzone(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-indigo-600 block mb-1">Assign TSM / TSO</label>
                  <select
                    value={ptsm}
                    onChange={(e) => setPtsm(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                  >
                    {INITIAL_OFFICERS.tsmList.map((t) => (
                      <option key={t.id} value={`${t.name} (TSM/TSO)`}>{t.name} ({t.zone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-purple-600 block mb-1">Assign ZBH / ASM</label>
                  <select
                    value={pzbh}
                    onChange={(e) => setPzbh(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                  >
                    {INITIAL_OFFICERS.zbhList.map((z) => (
                      <option key={z.id} value={`${z.name} (ZBH/ASM)`}>{z.name} ({z.zone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-blue-600 block mb-1">Assign CSM / RSM</label>
                  <select
                    value={prsm}
                    onChange={(e) => setPrsm(e.target.value)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                  >
                    {INITIAL_OFFICERS.rsmList.map((r) => (
                      <option key={r.id} value={`${r.name} (CSM/RSM)`}>{r.name} ({r.zone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Register Partner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT CATALOG & BULK UPLOAD */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Bulk Upload Product Catalog Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-blue-600" />
                  <span>Admin: Upload Product List (CSV / Excel)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulk upload or update product models, color variants, product codes, and official BDT prices
                </p>
              </div>

              <button
                type="button"
                onClick={downloadProductTemplate}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Product CSV Template</span>
              </button>
            </div>

            {productCsvNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{productCsvNotice}</span>
              </div>
            )}

            <div>
              <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
                <Upload className="w-8 h-8 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select Product List CSV file to upload
                </span>
                <span className="text-[11px] text-slate-400">
                  Columns: Model, DMS_ProdCode, Color, Price_BDT
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleProductCsvUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Add / Update Single Product Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Add / Update Single Product Model & Price:
            </h3>

            {productNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{productNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Model (e.g. Galaxy S25 Ultra)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Product Code / DMS Code (e.g. SM-S938B)"
                  value={prodcode}
                  onChange={(e) => setProdcode(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Color (e.g. Titanium Black)"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Price in BDT (৳)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Save Product / Price
              </button>
            </form>

            {/* Existing Catalog List */}
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Active Catalog Models ({products.length})
              </p>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {products.map((p) => (
                  <div key={p.id} className="p-2.5 text-xs flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{p.model}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">{p.prodcode}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                        {p.colors.map((c, i) => (
                          <span key={i} className="font-mono">
                            {c.color}: <strong className="text-slate-800 dark:text-slate-200">৳{c.price.toLocaleString()}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setModel(p.model);
                        setProdcode(p.prodcode);
                        if (p.colors[0]) {
                          setColor(p.colors[0].color);
                          setPrice(p.colors[0].price);
                        }
                      }}
                      className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded font-medium"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TSM / ZBH / RSM HIERARCHY MAPPING */}
      {activeTab === 'mapping' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#142b55] dark:text-blue-400" />
                <span>Partner Hierarchy & Territory Mapping (TSM / ZBH / CSM)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign supervising TSM/TSO, ZBH/ASM, and CSM/RSM officers for each partner's orders
              </p>
            </div>

            <select
              value={mappingFilterTsm}
              onChange={(e) => setMappingFilterTsm(e.target.value)}
              className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="all">All TSM Officers ({partners.length} partners)</option>
              {INITIAL_OFFICERS.tsmList.map((t) => (
                <option key={t.id} value={t.name}>{t.name} ({t.zone})</option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
            {partners
              .filter((p) => mappingFilterTsm === 'all' || (p.tsmName || '').includes(mappingFilterTsm))
              .map((partner) => {
                const isEditing = editingPartnerId === partner.id;

                return (
                  <div key={partner.id} className="p-4 bg-white dark:bg-slate-900 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          DMS: {partner.partnerCode || partner.dmsCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{partner.partnerName}</span>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => startEditMapping(partner)}
                          className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveMapping(partner.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPartnerId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Zone</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{partner.zone || 'Dhaka Central'}</span>
                        </div>
                        <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-200/60">
                          <span className="text-[10px] text-indigo-700 block">1. TSM / TSO</span>
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200">{partner.tsmName || 'Rafiqul Islam'}</span>
                        </div>
                        <div className="bg-purple-50/60 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-200/60">
                          <span className="text-[10px] text-purple-700 block">2. ZBH / ASM</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-200">{partner.zbhName || 'Mahmudul Hasan'}</span>
                        </div>
                        <div className="bg-blue-50/60 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-200/60">
                          <span className="text-[10px] text-blue-700 block">3. CSM / RSM</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-200">{partner.rsmName || 'Tanvir Ahmed'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Zone</label>
                          <input
                            type="text"
                            value={editZone}
                            onChange={(e) => setEditZone(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-indigo-600 block mb-1">TSM / TSO</label>
                          <select
                            value={editTsm}
                            onChange={(e) => setEditTsm(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                          >
                            {INITIAL_OFFICERS.tsmList.map((t) => (
                              <option key={t.id} value={`${t.name} (TSM/TSO)`}>{t.name} ({t.zone})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-purple-600 block mb-1">ZBH / ASM</label>
                          <select
                            value={editZbh}
                            onChange={(e) => setEditZbh(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                          >
                            {INITIAL_OFFICERS.zbhList.map((z) => (
                              <option key={z.id} value={`${z.name} (ZBH/ASM)`}>{z.name} ({z.zone})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-blue-600 block mb-1">CSM / RSM</label>
                          <select
                            value={editRsm}
                            onChange={(e) => setEditRsm(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border rounded"
                          >
                            {INITIAL_OFFICERS.rsmList.map((r) => (
                              <option key={r.id} value={`${r.name} (CSM/RSM)`}>{r.name} ({r.zone})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 6: DATE-WISE EXPORT */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#142b55] dark:text-blue-400" />
                <span>Individual Product-wise Order Export (Excel / CSV)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Columns: <strong>Order Date → DMS Code → Partner Name → Product Model → Product Color → Product QTY → Approval Status</strong>
              </p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
              Excel UTF-8 BOM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-medium">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-medium">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          {driveExportNotice && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#1428a0] shrink-0" />
                <span>{driveExportNotice}</span>
              </div>
              {driveExportLink && (
                <a
                  href={driveExportLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline flex items-center gap-1 text-[#1428a0] dark:text-blue-400 shrink-0 ml-2"
                >
                  Open File
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full py-2.5 px-4 bg-[#142b55] hover:bg-[#0f2142] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV to Computer</span>
            </button>

            <button
              type="button"
              onClick={handleExportToDrive}
              disabled={isExportingDrive}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              <span>{isExportingDrive ? 'Saving to Drive...' : 'Save Directly to Google Drive'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
            <span>
              Google Drive: {isDriveConnected() ? (
                <strong className="text-emerald-600">Connected ({getDriveUser()?.email})</strong>
              ) : (
                <span className="text-slate-400">Not connected</span>
              )}
            </span>
            {onOpenDriveModal && (
              <button
                type="button"
                onClick={onOpenDriveModal}
                className="text-[#1428a0] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Cloud className="w-3.5 h-3.5" />
                Manage Google Drive
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
