'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

interface GeneratedProduct {
  id: string;
  name: string;
  sku: string;
  scanUrl: string;
  qrCodeDataUrl: string;
}

export default function AdminDashboard() {
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

  const handleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set()); // deselect all
    } else {
      setSelectedIds(new Set(results.map(r => r.id))); // select all
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Factory Dashboard</h1>
          <p>Mass Generate Warranty QRs</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>New Batch Registration</h2>
          
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
              {loading ? 'Generating...' : `Generate ${formData.quantity || 0} QR Code(s)`}
            </button>
          </form>
        </div>

        {results.length > 0 && (
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <h2 className={styles.cardTitle}>Generated {results.length} QRs</h2>
              <div className={styles.actionButtons}>
                <button type="button" className={styles.selectAllBtn} onClick={handleSelectAll}>
                  {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  className={styles.printBtn} 
                  onClick={() => window.print()}
                  disabled={selectedIds.size === 0}
                >
                  Print Selected ({selectedIds.size})
                </button>
              </div>
            </div>
            
            <div className={styles.qrGrid}>
              {results.map((product) => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <div 
                    key={product.id} 
                    className={`${styles.qrItem} ${isSelected ? styles.selected : ''} ${!isSelected ? styles.noPrint : ''}`}
                    onClick={() => toggleSelection(product.id)}
                  >
                    <div className={styles.checkbox}>
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
      </main>
    </div>
  );
}
