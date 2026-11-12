export type UserRole = 'admin' | 'partner' | 'tsm' | 'zbh' | 'rsm';

export type OrderStatus = 
  | 'Pending_TSM'      // Step 1: Awaiting TSM / TSO Review
  | 'Pending_ZBH'      // Step 2: Awaiting ZBH / ASM Zonal Approval
  | 'Pending_RSM'      // Step 3: Awaiting CSM / RSM Regional Approval
  | 'Pending_Admin'    // Step 4: Reached Admin Panel for Final Approval
  | 'Approved'         // Step 5: Final Commercial Approval Given by Admin
  | 'Rejected'         // Rejected at any level with feedback
  | 'Cancelled'        // Cancelled by Partner
  | 'Submitted';       // Backwards-compatible alias for Pending_TSM

export interface ProductColorVariant {
  color: string;
  price: number; // In BDT ৳
}

export interface ProductItem {
  id: string;
  model: string;
  prodcode: string;
  colors: ProductColorVariant[];
  status: 'Active' | 'Inactive';
}

export interface PartnerUser {
  id: string;
  partnerCode: string;   // DMS Code (e.g. SAMS-DHK-01)
  dmsCode?: string;      // Explicit DMS code alias
  partnerName: string;
  username: string;
  password?: string;
  phone?: string;
  address?: string;
  zone: string;           // e.g. 'Dhaka North', 'Chittagong Metro', 'Sylhet Division'
  tsmName: string;        // TSM / TSO (Territory Sales Officer/Manager)
  zbhName: string;        // ZBH / ASM (Zonal Business Head / Area Sales Manager)
  rsmName: string;        // CSM / RSM (Commercial Sales Manager / Regional Sales Manager)
  createdAt: string;
}

export interface OrderItemDetail {
  model: string;
  color: string;
  qty: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface DepositSlip {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string; // Base64 data URL or blob
  uploadedAt: string;
  fileSize?: string;
}

export interface ApprovalStep {
  stage: 'TSM_TSO' | 'ZBH_ASM' | 'CSM_RSM' | 'ADMIN';
  stageTitle: string;
  designation: string;
  approverName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp?: string;
  remarks?: string;
}

export interface PartnerOrder {
  OrderID: string;
  PartnerCode: string;
  dmsCode?: string;       // DMS Code
  PartnerName: string;
  OrderDate: string; // ISO string
  Status: OrderStatus;
  TotalQty: number;
  TotalValue: number; // BDT ৳
  details: OrderItemDetail[];
  RejectReason?: string;
  rejectedByStage?: string;
  deposits: DepositSlip[];
  updatedAt?: string;
  
  // Hierarchy Mapping
  zone: string;
  tsmName: string;
  zbhName: string;
  rsmName: string;
  
  // Multi-tier approval timeline
  approvalChain: ApprovalStep[];
  currentStage: 'TSM_TSO' | 'ZBH_ASM' | 'CSM_RSM' | 'ADMIN' | 'COMPLETED';
}

export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  designation: string;
  zone?: string;
  dmsCode?: string;
  createdAt: string;
}

export interface SessionData {
  token: string;
  role: UserRole;
  username: string;
  partnerCode?: string;
  dmsCode?: string;
  partnerName?: string;
  officialTitle?: string;
  assignedZone?: string;
  officerName?: string;
}
