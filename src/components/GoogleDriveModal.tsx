import React, { useState, useEffect } from 'react';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  isDriveConnected, 
  getDriveUser, 
  saveOrderReportToDrive,
  listDriveOrderFiles,
  DriveFileInfo
} from '../services/googleDrive';
import { PartnerOrder } from '../types';
import { 
  Cloud, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  FileSpreadsheet, 
  RefreshCw, 
  Copy, 
  Check, 
  HelpCircle, 
  HardDrive, 
  X,
  FileText,
  FolderOpen,
  ArrowRight
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PartnerOrder[];
  onNotify: (msg: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  orders,
  onNotify
}) => {
  const [connected, setConnected] = useState(isDriveConnected());
  const [user, setUser] = useState(getDriveUser());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'files' | 'unverified_help' | 'apps_script_help'>('status');
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConnected(isDriveConnected());
      setUser(getDriveUser());
      if (isDriveConnected()) {
        loadFiles();
      }
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setFetchingFiles(true);
    try {
      const files = await listDriveOrderFiles('Samsung_Partner_Orders');
      setDriveFiles(files);
    } catch (e: any) {
      console.warn('Could not list drive files', e);
    } finally {
      setFetchingFiles(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await connectGoogleDrive();
      setConnected(true);
      setUser(getDriveUser());
      onNotify(`Google Drive connected successfully (${res.email})!`);
      loadFiles();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to connect to Google Drive. Check popups or OAuth settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogleDrive();
    setConnected(false);
    setUser(null);
    setDriveFiles([]);
    onNotify('Disconnected from Google Drive.');
  };

  const handleExportOrdersToDrive = async () => {
    if (!isDriveConnected()) {
      setErrorMsg('Please connect your Google Drive first.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await saveOrderReportToDrive(orders);
      onNotify(`Order CSV exported to Google Drive: "${result.name}"`);
      await loadFiles();
      setActiveTab('files');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to export order file to Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const copyAppsScriptCode = () => {
    const code = `// Google Apps Script (Code.gs) for Samsung Partner Order Management
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Samsung Partner Order Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Function to handle saving data to Google Sheets
function saveOrderToSheet(orderData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('Samsung_Orders_Database');
  var sheet = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'OrderID', 'DMS Code', 'Partner Name', 'Zone', 
      'TSM/TSO', 'Product Model', 'Color', 'QTY', 'Total Value', 'Status', 'Deposit URL'
    ]);
  }
  
  var data = JSON.parse(orderData);
  sheet.appendRow([
    new Date(),
    data.OrderID,
    data.dmsCode || data.PartnerCode,
    data.PartnerName,
    data.zone,
    data.tsmName,
    data.model,
    data.color,
    data.qty,
    data.totalValue,
    data.status,
    data.depositUrl || ''
  ]);
  
  return { success: true, sheetUrl: ss.getUrl() };
}`;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const copyAppsScriptIndexHtml = () => {
    fetch('/google_apps_script_Index.html')
      .then(res => res.text())
      .then(html => {
        navigator.clipboard.writeText(html);
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2500);
      })
      .catch(() => {
        onNotify('Could not load Index.html template.');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1428a0] to-[#0a196e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Google Drive Integration
                {connected && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                    Connected
                  </span>
                )}
              </h2>
              <p className="text-xs text-blue-200">
                Store deposit slips, sync orders, and backup reports directly to your Google Drive
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'status' 
                ? 'border-[#1428a0] text-[#1428a0] dark:text-blue-400 bg-white dark:bg-slate-800' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Drive Status & Sync
          </button>
          <button
            onClick={() => { setActiveTab('files'); if (connected) loadFiles(); }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'files' 
                ? 'border-[#1428a0] text-[#1428a0] dark:text-blue-400 bg-white dark:bg-slate-800' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Drive Files ({driveFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('unverified_help')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'unverified_help' 
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Fix: "Google hasn't verified"
          </button>
          <button
            onClick={() => setActiveTab('apps_script_help')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
              activeTab === 'apps_script_help' 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800' 
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            Fix: Apps Script "No Index found"
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">Notice</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* TAB 1: STATUS & SYNC */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${connected ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {connected ? 'Connected to Google Drive' : 'Google Drive Not Connected'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {connected 
                        ? `Account: ${user?.email || 'Authenticated User'}`
                        : 'Connect your Google account to enable automatic cloud backup and deposit slip storage.'}
                    </p>
                  </div>
                </div>

                <div>
                  {connected ? (
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg transition"
                    >
                      Disconnect Drive
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1428a0] hover:bg-[#0e1d75] rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Sign in with Google Drive
                    </button>
                  )}
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Orders to Drive */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Save Individual Product Orders to Drive
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Creates an individual product-wise CSV (Order Date, DMS Code, Partner Name, Model, Color, QTY, Price, Value, Status) in your Drive folder <strong>Samsung_Partner_Orders</strong>.
                  </p>
                  <button
                    onClick={handleExportOrdersToDrive}
                    disabled={!connected || loading}
                    className="w-full py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                    Save Current Orders ({orders.length}) to Drive
                  </button>
                </div>

                {/* Drive Folder info */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    Automatic Deposit Slip Folder
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    When TSM/TSO books an order with bank deposit slips, slips are saved directly into your Google Drive, generating instant cloud shareable links.
                  </p>
                  <div className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-300">
                    <span>Folder: Samsung_Partner_Orders</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVE FILES */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Files in "Samsung_Partner_Orders" ({driveFiles.length})
                </h4>
                <button
                  onClick={loadFiles}
                  disabled={fetchingFiles || !connected}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingFiles ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {!connected ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Please connect your Google Drive above to see synced order sheets and deposit slips.
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <FolderOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No files synced yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Click "Save Current Orders to Drive" to generate your first sheet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {file.mimeType.includes('spreadsheet') || file.name.endsWith('.csv') ? (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {file.createdTime ? new Date(file.createdTime).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#1428a0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900/50 flex items-center gap-1 shrink-0 ml-2"
                        >
                          Open in Drive
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FIX "GOOGLE HASN'T VERIFIED THIS APP" */}
          {activeTab === 'unverified_help' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                    How to bypass "Google hasn't verified this app" (2 Clicks)
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Google shows this warning for personal Google Cloud projects during development before public domain verification. It is 100% safe to proceed for your own account.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1428a0] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Click "Advanced" (উন্নত লিঙ্ক)</p>
                    <p className="text-slate-500 mt-0.5">
                      On the warning screen that appears (with the red triangle), look at the bottom-left corner and click the <strong>"Advanced"</strong> link.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1428a0] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Click "Go to Samsung Partner Orders (unsafe)" (নিরাপদ নয় এমন লিঙ্ক-এ যান)</p>
                    <p className="text-slate-500 mt-0.5">
                      After clicking Advanced, a new text link appears at the bottom. Click <strong>"Go to ... (unsafe)"</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1428a0] text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Grant Google Drive Permissions</p>
                    <p className="text-slate-500 mt-0.5">
                      Check the boxes to allow viewing and managing your files in Google Drive, then click <strong>"Continue"</strong>.
                    </p>
                  </div>
                </div>

                {/* Cloud Console Test User Tip */}
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <p className="font-bold text-blue-900 dark:text-blue-200">
                    💡 Optional: Add your email as a Test User in Google Cloud Console
                  </p>
                  <p className="text-blue-800 dark:text-blue-300 mt-1">
                    In your Google Cloud Console for project <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">gen-lang-client-0277842836</code>:
                    <br />
                    Go to <strong>APIs & Services &gt; OAuth consent screen &gt; Test users</strong> &gt; Click <strong>+ ADD USERS</strong> and enter <code className="font-mono font-bold">rajab.imsl19@gmail.com</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FIX APPS SCRIPT "NO HTML FILE NAMED INDEX WAS FOUND" */}
          {activeTab === 'apps_script_help' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                    How to fix: "Exception: No HTML file named Index was found. doGet @ Code.gs:3"
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                    This error happens in Google Apps Script when <code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 rounded">Code.gs</code> tries to load <code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 rounded">Index</code>, but you have not yet created an HTML file named exactly <strong>Index</strong> in the Apps Script editor.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1428a0] text-white flex items-center justify-center text-[10px]">1</span>
                      Create the HTML File in Google Apps Script
                    </span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>In your Google Apps Script editor, look at the left sidebar under <strong>Files</strong>.</li>
                    <li>Click the <strong>+ (Add a file)</strong> button.</li>
                    <li>Select <strong>HTML</strong> from the popup menu.</li>
                    <li>Type the name: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">Index</strong> (exact capitalization, no .html extension needed).</li>
                    <li>Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Enter</kbd>.</li>
                  </ol>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1428a0] text-white flex items-center justify-center text-[10px]">2</span>
                      Copy the Index.html Code
                    </span>
                    <button
                      onClick={copyAppsScriptIndexHtml}
                      className="px-3 py-1.5 text-xs font-bold bg-[#1428a0] text-white rounded-lg hover:bg-blue-900 flex items-center gap-1.5 transition"
                    >
                      {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedHtml ? 'Copied HTML!' : 'Copy Index.html Code'}
                    </button>
                  </div>
                  <p className="text-slate-500">
                    Click the button above to copy the full HTML code. Select all code inside your newly created <code className="font-mono">Index.html</code> in Google Apps Script, delete it, and paste this copied code.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1428a0] text-white flex items-center justify-center text-[10px]">3</span>
                      Copy Code.gs Code
                    </span>
                    <button
                      onClick={copyAppsScriptCode}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 flex items-center gap-1.5 transition"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedScript ? 'Copied Code.gs!' : 'Copy Code.gs Code'}
                    </button>
                  </div>
                  <p className="text-slate-500">
                    Replace your current <code className="font-mono">Code.gs</code> with this tested handler.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    Step 4: Deploy as Web App
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                    Click <strong>Deploy &gt; New deployment &gt; Select type: Web app</strong> &gt; Execute as: <strong>Me</strong> &gt; Who has access: <strong>Anyone</strong> &gt; Click <strong>Deploy</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Cloud className="w-4 h-4 text-[#1428a0]" />
            <span>Project ID: <strong className="font-mono">gen-lang-client-0277842836</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
