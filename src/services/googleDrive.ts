import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, driveProvider } from './firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { PartnerOrder } from '../types';

// In-memory access token storage (CRITICAL: never persist to localStorage)
let inMemoryAccessToken: string | null = null;
let driveUser: { displayName: string | null; email: string | null; photoURL: string | null } | null = null;

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

export function getDriveAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getDriveUser() {
  return driveUser;
}

export function isDriveConnected(): boolean {
  return inMemoryAccessToken !== null;
}

/**
 * Sign in to Google with Drive scopes using Firebase Auth popup
 */
export async function connectGoogleDrive(): Promise<{ email: string | null; name: string | null; token: string }> {
  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Could not obtain Google Drive access token. Please grant permissions in the Google prompt.');
    }

    inMemoryAccessToken = token;
    driveUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    };

    return {
      email: result.user.email,
      name: result.user.displayName,
      token,
    };
  } catch (err: any) {
    console.error('Google Drive Sign-In Error:', err);
    throw err;
  }
}

/**
 * Disconnect Google Drive
 */
export async function disconnectGoogleDrive(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut warning:', err);
  } finally {
    inMemoryAccessToken = null;
    driveUser = null;
  }
}

/**
 * Helper to ensure folder exists in Google Drive
 */
export async function getOrCreateFolder(folderName = 'Samsung_Partner_Orders'): Promise<string> {
  const token = inMemoryAccessToken;
  if (!token) throw new Error('Not connected to Google Drive');

  // Search for existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Drive search failed: ${await searchRes.text()}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${await createRes.text()}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload a file (Blob or base64) to Google Drive
 */
export async function uploadFileToDrive(
  fileBlob: Blob,
  fileName: string,
  folderName = 'Samsung_Partner_Orders'
): Promise<DriveFileInfo> {
  const token = inMemoryAccessToken;
  if (!token) throw new Error('Google Drive is not connected. Please connect first.');

  const folderId = await getOrCreateFolder(folderName);

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to upload to Google Drive: ${errorText}`);
  }

  const fileData: DriveFileInfo = await uploadRes.json();
  return fileData;
}

/**
 * Convert Base64 data URL to Blob for Drive upload
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Save Order Report CSV directly to Google Drive
 */
export async function saveOrderReportToDrive(
  orders: PartnerOrder[],
  customTitle?: string
): Promise<DriveFileInfo> {
  const headers = [
    'Order Date',
    'DMS Code',
    'Partner Name',
    'Product Model',
    'Product Color',
    'Product QTY',
    'Unit Price (BDT)',
    'Product Value (BDT)',
    'Approval Status',
    'Order ID',
    'Zone',
    'TSM/TSO',
    'ZBH/ASM',
    'CSM/RSM',
    'Deposit Slip Drive URL'
  ];

  const rows: string[][] = [];

  orders.forEach(ord => {
    const dmsCode = ord.dmsCode || ord.PartnerCode || 'N/A';
    const depositUrl = ord.deposits && ord.deposits.length > 0 ? (ord.deposits[0].fileUrl.startsWith('http') ? ord.deposits[0].fileUrl : 'Uploaded in App') : 'None';
    
    if (ord.details && ord.details.length > 0) {
      ord.details.forEach(item => {
        const unitPrice = item.unitPrice || 0;
        const lineTotal = item.lineTotal || (item.qty * unitPrice);
        rows.push([
          ord.OrderDate ? ord.OrderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          `"${dmsCode.replace(/"/g, '""')}"`,
          `"${(ord.PartnerName || '').replace(/"/g, '""')}"`,
          `"${(item.model || '').replace(/"/g, '""')}"`,
          `"${(item.color || '').replace(/"/g, '""')}"`,
          String(item.qty || 0),
          String(unitPrice),
          String(lineTotal),
          ord.Status,
          ord.OrderID,
          `"${(ord.zone || '').replace(/"/g, '""')}"`,
          `"${(ord.tsmName || '').replace(/"/g, '""')}"`,
          `"${(ord.zbhName || '').replace(/"/g, '""')}"`,
          `"${(ord.rsmName || '').replace(/"/g, '""')}"`,
          `"${depositUrl.replace(/"/g, '""')}"`
        ]);
      });
    } else {
      rows.push([
        ord.OrderDate ? ord.OrderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        `"${dmsCode.replace(/"/g, '""')}"`,
        `"${(ord.PartnerName || '').replace(/"/g, '""')}"`,
        'N/A',
        'N/A',
        String(ord.TotalQty || 0),
        '0',
        String(ord.TotalValue || 0),
        ord.Status,
        ord.OrderID,
        `"${(ord.zone || '').replace(/"/g, '""')}"`,
        `"${(ord.tsmName || '').replace(/"/g, '""')}"`,
        `"${(ord.zbhName || '').replace(/"/g, '""')}"`,
        `"${(ord.rsmName || '').replace(/"/g, '""')}"`,
        `"${depositUrl.replace(/"/g, '""')}"`
      ]);
    }
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = customTitle || `Samsung_Individual_Product_Orders_${dateStr}.csv`;

  return await uploadFileToDrive(blob, fileName, 'Samsung_Partner_Orders');
}

/**
 * List files in the Google Drive orders folder
 */
export async function listDriveOrderFiles(folderName = 'Samsung_Partner_Orders'): Promise<DriveFileInfo[]> {
  const token = inMemoryAccessToken;
  if (!token) return [];

  try {
    const folderId = await getOrCreateFolder(folderName);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=30&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size)`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      console.warn('Failed to fetch Drive files:', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('List Drive files error:', err);
    return [];
  }
}
