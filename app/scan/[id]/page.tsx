'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './scan.module.css';

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);


  useEffect(() => {
    const fetchProductAndScan = async () => {
      try {
        // First check if product exists and if we are authorized
        const getRes = await fetch(`/api/scan/${productId}`);
        if (getRes.status === 401) {
          window.location.href = `/login?returnTo=/scan/${productId}`;
          return;
        }
        
        if (!getRes.ok) {
          setError('Product not found or invalid QR code.');
          setLoading(false);
          return;
        }

        const data = await getRes.json();
        setProduct(data.product);

        if (data.product.scans && data.product.scans.length > 0) {
          // Already registered. Log the subsequent scan in the background
          fetch(`/api/scan/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).then(async (res) => {
            if (res.ok) {
              const newData = await res.json();
              setProduct(newData.product);
            }
          });
        }
        
        setLoading(false);
      } catch {
        setError('An error occurred.');
        setLoading(false);
      }
    };

    fetchProductAndScan();
  }, [productId]);

  const performScan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scan/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.status === 401) {
        window.location.href = `/login?returnTo=/scan/${productId}`;
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setProduct(data.product);
        setScanned(true);
      } else {
        setError(data.error || 'Failed to scan product');
      }
    } catch (err) {
      setError('An error occurred during scan.');
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
            onClick={performScan}
            className={styles.dashboardBtn}
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              marginTop: '24px',
              backgroundColor: '#22c55e',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.39)'
            }}
          >
            Register & Claim Points →
          </button>
        </div>
      </div>
    );
  }

  const firstScan = product.scans[0];
  const warrantyStart = new Date(firstScan.scannedAt);
  const warrantyEnd = new Date(warrantyStart);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyMonths);
  
  const now = new Date();
  const isActive = now <= warrantyEnd;
  
  const timeDiff = warrantyEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

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
            <span className={styles.timerValue}>{daysRemaining}</span>
            <span className={styles.timerLabel}>Days Remaining</span>
          </div>
        )}

        <button 
          onClick={() => window.location.href = '/dashboard'}
          className={styles.dashboardBtn}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            marginTop: '24px',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
          }}
        >
          View My Dashboard & History →
        </button>
      </div>
    </div>
  );
}
