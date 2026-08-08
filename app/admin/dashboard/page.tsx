'use client';

import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';

// Dynamically require qz-tray only on the client side to avoid SSR errors
let qz: any;
if (typeof window !== 'undefined') {
  const qzTray = require('qz-tray');
  qz = qzTray.default || qzTray;
}

interface GeneratedProduct {
  id: string;
  name: string;
  sku: string;
  scanUrl: string;
  qrCodeDataUrl: string;
}

interface AdminUser {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  creditPoints: number;
  isBanned: boolean;
  createdAt: string;
  _count?: {
    scans: number;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'qr' | 'users'>('qr');

  // Form & QR Generation State
  const [formData, setFormData] = useState({
    name: '',
    serialPrefix: '',
    warrantyMonths: '',
    creditPoints: '',
    quantity: '1',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // User Management State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Label Printing State
  const [labelSize, setLabelSize] = useState<'2x1' | '2x2' | '4x6' | '18x18' | 'default' | 'custom'>('2x1');
  const [customSize, setCustomSize] = useState({ width: '8.5', height: '1', columns: '4', gap: '0.1' });

  // QZ Tray State
  const [qzConnected, setQzConnected] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [qzError, setQzError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  // QZ Tray State
  const [qzConnected, setQzConnected] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [qzError, setQzError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json().catch(() => null);
        setUsersError(data?.error || `Failed to fetch users (Status: ${res.status})`);
      }
    } catch (err: any) {
      setUsersError(`Network error: ${err.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setSelectedIds(new Set());

    try {
      const res = await fetch('/api/admin/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, baseUrl: window.location.origin }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setResults(data.products || []);
        setSelectedIds(new Set((data.products || []).map((p: GeneratedProduct) => p.id)));
        setFormData({ name: '', serialPrefix: '', warrantyMonths: '', creditPoints: '', quantity: '1' });
      } else {
        setError(data?.error || `Failed to generate QRs (Status: ${res.status})`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleConnectQZ = async () => {
    setQzError('');
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      setQzConnected(true);
      const foundPrinters = await qz.printers.find();
      setPrinters(foundPrinters);
      if (foundPrinters.length > 0) {
        setSelectedPrinter(foundPrinters[0]);
      }
    } catch (err: any) {
      setQzError(err.message || 'Failed to connect to QZ Tray. Is it running?');
    }
  };

  const handleQZPrintTSPL = async () => {
    if (!selectedPrinter) {
      setQzError('Please select a printer first.');
      return;
    }
    setIsPrinting(true);
    setQzError('');
    
    try {
      const selectedProducts = results.filter(r => selectedIds.has(r.id));
      if (selectedProducts.length === 0) return;

      const config = qz.configs.create(selectedPrinter);

      // Start the TSPL string
      // SIZE: width 78mm (4 * 18 + 3 * 2), height 18mm
      let tspl = "SIZE 78 mm, 18 mm\n";
      tspl += "GAP 2 mm, 0 mm\n";
      tspl += "DIRECTION 1\n";
      
      // We will print in chunks of 4 labels (since it's a 4-column roll)
      for (let i = 0; i < selectedProducts.length; i += 4) {
        const chunk = selectedProducts.slice(i, i + 4);
        
        tspl += "CLS\n"; // Clear buffer for new row
        
        chunk.forEach((product, index) => {
          // Calculate X offset for this column
          // 203 DPI = 8 dots per mm.
          // Col 0: 0mm -> 0 dots
          // Col 1: 20mm -> 160 dots
          // Col 2: 40mm -> 320 dots
          // Col 3: 60mm -> 480 dots
          // We add a small 24-dot (3mm) left margin inside each label's bounds for safe printing.
          const xOffset = (index * 20 * 8) + 24; 
          
          // QRCODE X, Y, ECC level, cell width, mode, rotation, [model, mask,]"content"
          // We use cell width 3 (approx 3 * 8 = 24 dots, good for 18mm labels)
          tspl += `QRCODE ${xOffset}, 10, L, 3, A, 0, "${product.scanUrl}"\n`;
          
          // TEXT X, Y, font, rotation, x-multi, y-multi, "content"
          // Print serial number below the QR code
          tspl += `TEXT ${xOffset}, 115, "1", 0, 1, 1, "SN: ${product.sku}"\n`;
        });
        
        tspl += "PRINT 1,1\n";
      }

      const printData = [
        {
          type: 'raw',
          format: 'command',
          flavor: 'plain',
          data: tspl
        }
      ];

      await qz.print(config, printData);
    } catch (err: any) {
      setQzError(err.message || 'Print failed.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConnectQZ = async () => {
    setQzError('');
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      setQzConnected(true);
      const foundPrinters = await qz.printers.find();
      setPrinters(foundPrinters);
      if (foundPrinters.length > 0) {
        setSelectedPrinter(foundPrinters[0]);
      }
    } catch (err: any) {
      setQzError(err.message || 'Failed to connect to QZ Tray. Is it running?');
    }
  };

  const handleQZPrintTSPL = async () => {
    if (!selectedPrinter) {
      setQzError('Please select a printer first.');
      return;
    }
    setIsPrinting(true);
    setQzError('');
    
    try {
      const selectedProducts = results.filter(r => selectedIds.has(r.id));
      if (selectedProducts.length === 0) return;

      const config = qz.configs.create(selectedPrinter);

      // Start the TSPL string
      // SIZE: width 78mm (4 * 18 + 3 * 2), height 18mm
      let tspl = "SIZE 78 mm, 18 mm\n";
      tspl += "GAP 2 mm, 0 mm\n";
      tspl += "DIRECTION 1\n";
      
      // We will print in chunks of 4 labels (since it's a 4-column roll)
      for (let i = 0; i < selectedProducts.length; i += 4) {
        const chunk = selectedProducts.slice(i, i + 4);
        
        tspl += "CLS\n"; // Clear buffer for new row
        
        chunk.forEach((product, index) => {
          // Calculate X offset for this column
          // 203 DPI = 8 dots per mm.
          // Col 0: 0mm -> 0 dots
          // Col 1: 20mm -> 160 dots
          // Col 2: 40mm -> 320 dots
          // Col 3: 60mm -> 480 dots
          // We add a small 24-dot (3mm) left margin inside each label's bounds for safe printing.
          const xOffset = (index * 20 * 8) + 24; 
          
          // QRCODE X, Y, ECC level, cell width, mode, rotation, [model, mask,]"content"
          // We use cell width 3 (approx 3 * 8 = 24 dots, good for 18mm labels)
          tspl += `QRCODE ${xOffset}, 10, L, 3, A, 0, "${product.scanUrl}"\n`;
          
          // TEXT X, Y, font, rotation, x-multi, y-multi, "content"
          // Print serial number below the QR code
          tspl += `TEXT ${xOffset}, 115, "1", 0, 1, 1, "SN: ${product.sku}"\n`;
        });
        
        tspl += "PRINT 1,1\n";
      }

      const printData = [
        {
          type: 'raw',
          format: 'command',
          flavor: 'plain',
          data: tspl
        }
      ];

      await qz.print(config, printData);
    } catch (err: any) {
      setQzError(err.message || 'Print failed.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClearCredits = async (userId: string, userName: string) => {
    setActionLoadingId(userId);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/clear-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, creditPoints: 0 } : u))
        );
        setBanner({ type: 'success', message: `Successfully cleared credit points for ${userName || 'user'}.` });
      } else {
        setBanner({ type: 'error', message: data.error || 'Failed to clear credits.' });
      }
    } catch (err: any) {
      setBanner({ type: 'error', message: `Error: ${err.message}` });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBan = async (userId: string, userName: string, currentlyBanned: boolean) => {
    setActionLoadingId(userId);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBanned: !currentlyBanned } : u))
        );
        setBanner({
          type: 'success',
          message: currentlyBanned ? `Successfully unbanned ${userName || 'user'}.` : `Successfully banned ${userName || 'user'}.`,
        });
      } else {
        setBanner({ type: 'error', message: data.error || 'Failed to toggle ban status.' });
      }
    } catch (err: any) {
      setBanner({ type: 'error', message: `Error: ${err.message}` });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber.includes(searchQuery)
  );

  const totalPointsAllUsers = users.reduce((acc, u) => acc + (u.creditPoints || 0), 0);
  const activeUserCount = users.filter((u) => !u.isBanned).length;
  const bannedUserCount = users.filter((u) => u.isBanned).length;

  return (
    <div className={styles.container}>
      <style>{`
        @media print {
          ${labelSize === '2x1' ? '@page { size: 2in 1in; margin: 0; }' : ''}
          ${labelSize === '2x2' ? '@page { size: 2in 2in; margin: 0; }' : ''}
          ${labelSize === '4x6' ? '@page { size: 4in 6in; margin: 0; }' : ''}
          ${labelSize === '18x18' ? '@page { size: 18mm 18mm; margin: 0; }' : ''}
          ${labelSize === '18x18-4col' ? '@page { size: 78mm 18mm; margin: 0; }' : ''}
          ${labelSize === 'default' ? '@page { margin: 0.5in; }' : ''}
          ${labelSize === 'custom' ? `@page { size: ${customSize.width}cm ${customSize.height}cm; margin: 0; }` : ''}
          ${(labelSize === 'custom' || labelSize === '18x18-4col') ? `
            [data-print-layout="custom"], [data-print-layout="18x18-4col"] {
              display: grid !important;
              grid-template-columns: repeat(${labelSize === '18x18-4col' ? '4' : (customSize.columns || 1)}, ${labelSize === '18x18-4col' ? '18mm' : `calc(100% / ${customSize.columns || 1})`}) !important;
              ${labelSize === '18x18-4col' ? 'column-gap: 2mm !important;' : 'gap: 0 !important;'}
              justify-content: flex-start !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            [data-print-layout="custom"] [data-print-item], [data-print-layout="18x18-4col"] [data-print-item] {
              width: ${labelSize === '18x18-4col' ? '18mm' : '100%'} !important;
              height: ${labelSize === '18x18-4col' ? '18mm' : `${customSize.height}cm`} !important;
              box-sizing: border-box !important;
              border: none !important;
              background: #fff !important;
              padding: 0.5mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border-radius: 0 !important;
            }
            [data-print-layout="custom"] [data-print-item] img, [data-print-layout="18x18-4col"] [data-print-item] img {
              max-width: 100% !important;
              max-height: 65% !important;
              margin: 0 !important;
              object-fit: contain !important;
            }
            [data-print-layout="custom"] [data-print-item] strong, [data-print-layout="18x18-4col"] [data-print-item] strong {
              font-size: 7pt !important;
              line-height: 1.1 !important;
              margin: 1px 0 0 0 !important;
              text-align: center !important;
            }
            [data-print-layout="custom"] [data-print-item] span, [data-print-layout="18x18-4col"] [data-print-item] span {
              font-size: 6pt !important;
              line-height: 1.1 !important;
              margin: 0 !important;
              text-align: center !important;
            }
          ` : ''}
        }
      `}</style>
      <header className={`${styles.header} ${styles.noPrint}`}>
        <div className={styles.headerTop}>
          <div className={styles.headerContent}>
            <h1>Factory Admin Portal</h1>
            <p>System Management & Batch Operations</p>
          </div>
          <div className={styles.adminBadge}>
            <span className={styles.onlineDot}></span>
            <span>Admin Authenticated</span>
          </div>
        </div>

        <nav className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'qr' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            QR Batch Generator
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            User Management
            {users.length > 0 && <span className={styles.tabBadge}>{users.length}</span>}
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {activeTab === 'qr' && (
          <>
            <div className={`${styles.card} ${styles.noPrint}`}>
              <h2 className={styles.cardTitle}>New Batch Registration</h2>
              <p className={styles.cardSubtitle}>Generate unique QR codes with warranty & reward point data</p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">Product Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. LED Bulb 9W" required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="serialPrefix">Serial Number Prefix (Optional)</label>
                    <input type="text" id="serialPrefix" name="serialPrefix" value={formData.serialPrefix} onChange={handleChange} placeholder="e.g. LED9W" />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="warrantyMonths">Warranty (Months)</label>
                    <input type="number" id="warrantyMonths" name="warrantyMonths" value={formData.warrantyMonths} onChange={handleChange} min="1" required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="creditPoints">Credit Points</label>
                    <input type="number" id="creditPoints" name="creditPoints" value={formData.creditPoints} onChange={handleChange} min="0" required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="quantity">Quantity of QRs</label>
                    <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="1" max="500" required />
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <span className={styles.btnContent}>
                      <span className={styles.spinner}></span> Generating...
                    </span>
                  ) : (
                    `Generate ${formData.quantity || 0} QR Code(s)`
                  )}
                </button>
              </form>
            </div>

            {results.length > 0 && (
              <div className={styles.resultCard}>
                <div className={`${styles.resultHeader} ${styles.noPrint}`}>
                  <div>
                    <h2 className={styles.cardTitle}>Generated {results.length} Batch QRs</h2>
                    <p className={styles.cardSubtitle}>Select codes to send to high-resolution printing</p>
                  </div>
                  {/* Print Options */}
                  <div className={styles.printOptionsContainer}>
                    <div className={styles.labelSizeSelector}>
                      <label htmlFor="labelSize">Print Layout:</label>
                      <select 
                        id="labelSize" 
                        value={labelSize} 
                        onChange={(e) => setLabelSize(e.target.value as any)}
                        className={styles.printerSelect}
                      >
                        <option value="2x1">2" x 1" (Small Labels)</option>
                        <option value="2x2">2" x 2" (Square Labels)</option>
                        <option value="4x6">4" x 6" (Shipping Labels)</option>
                        <option value="18x18">18mm x 18mm (Micro Labels)</option>
                        <option value="18x18-4col">18mm x 18mm (4-Column Roll)</option>
                        <option value="default">Standard A4 Sheet</option>
                        <option value="custom">Custom Size</option>
                      </select>
                      
                      {labelSize === 'custom' && (
                        <div className={styles.customSizeInputs}>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={customSize.width} 
                            onChange={(e) => setCustomSize(prev => ({ ...prev, width: e.target.value }))} 
                            className={styles.sizeInput} 
                            title="Total Page Width in cm"
                          />
                          <span>x</span>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={customSize.height} 
                            onChange={(e) => setCustomSize(prev => ({ ...prev, height: e.target.value }))} 
                            className={styles.sizeInput} 
                            title="Total Page Height in cm"
                          />
                          <span>cm</span>
                          <span style={{ marginLeft: '10px' }}>Columns:</span>
                          <input 
                            type="number" 
                            step="1" 
                            min="1"
                            value={customSize.columns} 
                            onChange={(e) => setCustomSize(prev => ({ ...prev, columns: e.target.value }))} 
                            className={styles.sizeInput} 
                            title="Labels per row"
                          />
                        </div>
                      )}
                    </div>
                  </div>


                  {/* QZ Tray Integration UI */}
                  <div className={styles.qzContainer}>
                    {!qzConnected ? (
                      <button type="button" className={styles.qzConnectBtn} onClick={handleConnectQZ}>
                        🔌 Connect QZ Tray
                      </button>
                    ) : (
                      <div className={styles.qzActive}>
                        <select 
                          value={selectedPrinter} 
                          onChange={(e) => setSelectedPrinter(e.target.value)}
                          className={styles.printerSelect}
                        >
                          {printers.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button 
                          className={styles.qzPrintBtn} 
                          onClick={handleQZPrintTSPL}
                          disabled={selectedIds.size === 0 || isPrinting}
                        >
                          {isPrinting ? 'Printing...' : `🖨️ Direct Print TSPL (${selectedIds.size})`}
                        </button>
                      </div>
                    )}
                    {qzError && <span className={styles.qzError}>{qzError}</span>}
                  </div>

                  <div className={styles.actionButtons}>
                    <button type="button" className={styles.selectAllBtn} onClick={handleSelectAll}>
                      {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      className={styles.printBtn}
                      onClick={handleNativePrint}
                      disabled={selectedIds.size === 0}
                    >
                      🖨️ Print Selected ({selectedIds.size})
                    </button>
                  </div>
                </div>

                <div
                  className={`${styles.qrGrid} ${styles[`printLayout_${labelSize}`]}`}
                  data-print-layout={labelSize}
                >
                  {results.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className={`${styles.qrItem} ${isSelected ? styles.selected : ''} ${!isSelected ? styles.noPrint : ''}`}
                        data-print-item
                        onClick={() => toggleSelection(product.id)}
                      >
                        <div className={`${styles.checkbox} ${styles.noPrint}`}>
                          {isSelected ? '✓' : ''}
                        </div>
                        <img src={product.qrCodeDataUrl} alt={`QR for ${product.sku}`} className={styles.qrImage} />
                        <div className={styles.qrLabels}>
                          <strong>{product.name}</strong>
                          <span>SN: {product.sku}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div className={styles.userTabSection}>
            {banner && (
              <div className={banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}>
                <span>{banner.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{banner.message}</span>
              </div>
            )}

            {usersError && <div className={styles.error}>{usersError}</div>}

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Customers</span>
                <span className={styles.statValue}>{users.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Active / Banned</span>
                <span className={styles.statValue}>
                  <span className={styles.activeText}>{activeUserCount}</span> / <span className={styles.bannedText}>{bannedUserCount}</span>
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Points Issued</span>
                <span className={styles.statValue}>{totalPointsAllUsers} Pts</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.userHeaderRow}>
                <div>
                  <h2 className={styles.cardTitle}>Customer Accounts</h2>
                  <p className={styles.cardSubtitle}>Manage customer credit balances, view scan activity, and ban/unban accounts</p>
                </div>
                <button type="button" className={styles.refreshBtn} onClick={fetchUsers} disabled={usersLoading}>
                  {usersLoading ? 'Refreshing...' : '🔄 Refresh List'}
                </button>
              </div>

              <div className={styles.searchRow}>
                <input
                  type="text"
                  placeholder="🔍 Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {usersLoading && users.length === 0 ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading customer accounts...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>{searchQuery ? 'No customer accounts found matching your search.' : 'No customer accounts registered yet.'}</p>
                </div>
              ) : (
                <div className={styles.userGrid}>
                  {filteredUsers.map((user) => {
                    const isProcessing = actionLoadingId === user.id;
                    return (
                      <div key={user.id} className={`${styles.userCard} ${user.isBanned ? styles.userCardBanned : ''}`}>
                        <div className={styles.userCardHeader}>
                          <div className={styles.userAvatar}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className={styles.userInfo}>
                            <h3>{user.name || 'Unnamed User'}</h3>
                            <span className={styles.userPhone}>{user.phoneNumber}</span>
                          </div>
                          <span className={user.isBanned ? styles.statusBanned : styles.statusActive}>
                            {user.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </div>

                        <div className={styles.userCardBody}>
                          <div className={styles.userMetaRow}>
                            <span className={styles.metaLabel}>Credit Points:</span>
                            <span className={styles.pointsBadge}>{user.creditPoints} Pts</span>
                          </div>
                          <div className={styles.userMetaRow}>
                            <span className={styles.metaLabel}>Total Scans:</span>
                            <span className={styles.metaValue}>{user._count?.scans ?? 0}</span>
                          </div>
                          <div className={styles.userMetaRow}>
                            <span className={styles.metaLabel}>Joined:</span>
                            <span className={styles.metaValue}>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className={styles.userCardActions}>
                          <button
                            type="button"
                            className={styles.clearBtn}
                            onClick={() => handleClearCredits(user.id, user.name)}
                            disabled={user.creditPoints === 0 || isProcessing}
                            title={user.creditPoints === 0 ? 'No credits to clear' : 'Reset credit points to zero'}
                          >
                            {isProcessing ? 'Processing...' : 'Clear Credits'}
                          </button>
                          <button
                            type="button"
                            className={user.isBanned ? styles.unbanBtn : styles.banBtn}
                            onClick={() => handleToggleBan(user.id, user.name, user.isBanned)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : user.isBanned ? 'Unban User' : 'Ban User'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
