import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import styles from './dashboard.module.css';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default async function ElectricianDashboard() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch the full user details to get credit points and name
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch their scan history along with product details
  const scanHistory = await prisma.scanHistory.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { scannedAt: 'desc' },
  });

  const now = new Date();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>My Dashboard</h1>
          <p>Welcome back, {user.name}!</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pointsCard}>
          <h2>Total Credit Points</h2>
          <div className={styles.pointsDisplay}>
            <span className={styles.pointsValue}>{user.creditPoints}</span>
            <span className={styles.pointsLabel}>Pts</span>
          </div>
        </div>

        <section className={styles.historySection}>
          <h2>My Warranties & Scans ({scanHistory.length})</h2>
          
          {scanHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't scanned any products yet. Scan a QR code to start earning points and activating warranties!</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {scanHistory.map((scan) => {
                const expiryDate = addMonths(scan.scannedAt, scan.product.warrantyMonths);
                const isExpired = now > expiryDate;
                
                return (
                  <div key={scan.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{scan.product.name}</h3>
                      <span className={`${styles.badge} ${isExpired ? styles.badgeExpired : styles.badgeActive}`}>
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    
                    <div className={styles.cardBody}>
                      <div className={styles.infoRow}>
                        <span>Serial Number:</span>
                        <strong>{scan.product.sku}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Activated On:</span>
                        <strong>{new Date(scan.scannedAt).toLocaleDateString()}</strong>
                      </div>
                      <div className={styles.infoRow}>
                        <span>Expires On:</span>
                        <strong>{expiryDate.toLocaleDateString()}</strong>
                      </div>
                      {scan.isFirstScan && (
                        <div className={styles.pointsEarned}>
                          + {scan.product.creditPoints} Points Earned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
