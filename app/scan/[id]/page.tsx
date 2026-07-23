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
    fetchProductAndScan();
  }, [productId]);

  const fetchProductAndScan = async () => {
    try {
      // First check if product exists and if we are authorized
      const getRes = await fetch(`/api/scan/${productId}`);
      if (getRes.status === 401) {
        router.push(`/login?returnTo=/scan/${productId}`);
        return;
      }
      
      if (!getRes.ok) {
        setError('Product not found or invalid QR code.');
        setLoading(false);
        return;
      }

      // We no longer require location. Just perform the scan log.
      await performScan();
    } catch (err) {
      setError('An error occurred.');
      setLoading(false);
    }
  };

  const performScan = async () => {
    try {
      const res = await fetch(`/api/scan/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        router.push(`/login?returnTo=/scan/${productId}`);
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
      </div>
    </div>
  );
}
