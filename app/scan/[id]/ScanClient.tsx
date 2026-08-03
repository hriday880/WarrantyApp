'use client';

import { useEffect, useState } from 'react';
import styles from './scan.module.css';

export default function ScanClient({ productId }: { productId: string }) {

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const [timeLeft, setTimeLeft] = useState('00:00:00:00:00');


  useEffect(() => {
    fetchProductAndScan();
  }, [productId]);

  const fetchProductAndScan = async () => {
    try {
      // First check if product exists and if we are authorized
      const getRes = await fetch(`/api/product-check/${productId}`);
      
      if (!getRes.ok) {
        setError('Product not found or invalid QR code.');
        setLoading(false);
        return;
      }

      const data = await getRes.json();
      setProduct(data.product);

      if (data.product.scans && data.product.scans.length > 0) {
        // Already registered. Log the subsequent scan in the background
        fetch(`/api/product-check/${productId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(err => console.error('Background scan error:', err)).then(async (res) => {
          if (res?.ok) {
            const newData = await res.json();
            setProduct(newData.product);
          }
        });
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(`An error occurred: ${err.message || err}`);
      setLoading(false);
    }
  };

  const performScan = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/product-check/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });


      const data = await res.json();
      if (res.ok) {
        setProduct(data.product);
        setScanned(true);
      } else {
        setError(data.error || 'Failed to scan product');
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading product info...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
          <a 
            href="/dashboard"
            className={styles.dashboardBtn}
          >
            View My Dashboard & History &rarr;
          </a>
        </div>
      </div>
    );
  }

  if (!product.scans || product.scans.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>{product.name}</h1>
            <span className={styles.sku}>SKU: {product.sku}</span>
          </div>
          
          <div className={styles.statusBox} data-active="false" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className={styles.statusIcon} style={{ background: '#3b82f6', boxShadow: 'none' }}>
              ✦
            </div>
            <h2>Unregistered Product</h2>
            <p>This product is genuine and ready to be registered.</p>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Duration</span>
              <span className={styles.value}>{product.warrantyMonths} Months</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Credits</span>
              <span className={styles.value}>+{product.creditPoints} pts</span>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              performScan(e);
            }}
            className={styles.actionBtn}
          >
            Register & Claim Points &rarr;
          </button>

          <a 
            href="/dashboard"
            className={styles.dashboardBtn}
          >
            View My Dashboard & History &rarr;
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!product || !product.scans || product.scans.length === 0) return;

    const firstScan = product.scans[0];
    const warrantyStart = new Date(firstScan.scannedAt);
    const warrantyEnd = new Date(warrantyStart);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyMonths);

    const updateTimer = () => {
      const now = new Date();
      if (now >= warrantyEnd) {
        setTimeLeft('00:00:00:00:00');
        return;
      }

      let years = warrantyEnd.getFullYear() - now.getFullYear();
      let months = warrantyEnd.getMonth() - now.getMonth();
      let days = warrantyEnd.getDate() - now.getDate();
      let hours = warrantyEnd.getHours() - now.getHours();
      let mins = warrantyEnd.getMinutes() - now.getMinutes();

      if (mins < 0) {
        mins += 60;
        hours--;
      }
      if (hours < 0) {
        hours += 24;
        days--;
      }
      if (days < 0) {
        const prevMonth = new Date(warrantyEnd.getFullYear(), warrantyEnd.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
      }
      if (months < 0) {
        months += 12;
        years--;
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(years)}:${pad(months)}:${pad(days)}:${pad(hours)}:${pad(mins)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [product]);

  const firstScan = product.scans[0];
  const warrantyStart = new Date(firstScan.scannedAt);
  const warrantyEnd = new Date(warrantyStart);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyMonths);
  
  const now = new Date();
  const isActive = now <= warrantyEnd;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>{product.name}</h1>
          <span className={styles.sku}>SKU: {product.sku}</span>
        </div>

        <div className={styles.statusBox} data-active={isActive}>
          <div className={styles.statusIcon}>
            {isActive ? '✓' : '✕'}
          </div>
          <h2>{isActive ? 'Warranty Active' : 'Warranty Expired'}</h2>
          <p>{isActive ? 'Your product is fully covered.' : 'The warranty period has ended.'}</p>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Started On</span>
            <span className={styles.value}>{warrantyStart.toLocaleDateString()}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Valid Until</span>
            <span className={styles.value}>{warrantyEnd.toLocaleDateString()}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Duration</span>
            <span className={styles.value}>{product.warrantyMonths} Months</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Credits</span>
            <span className={styles.value}>+{product.creditPoints} pts</span>
          </div>
        </div>

        {product.scans.length === 1 && (
          <div className={styles.successBanner}>
            Points have been credited to your account!
          </div>
        )}
        
        {product.scans.length > 1 && (
          <div className={styles.timerBox}>
            <span className={styles.timerValue} style={{ fontSize: '1.8rem', letterSpacing: '0.05em' }}>{timeLeft}</span>
            <span className={styles.timerLabel}>Y : M : D : H : M</span>
          </div>
        )}

        <a 
          href="/dashboard"
          className={styles.dashboardBtn}
        >
          View My Dashboard & History →
        </a>
      </div>
    </div>
  );
}
