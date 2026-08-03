'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, name }),
    });

    if (res.ok) {
      router.push(returnTo);
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleLogin} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=" "
            required
          />
          <label htmlFor="name">Full Name</label>
        </div>
        
        <div className={styles.inputGroup}>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder=" "
            required
          />
          <label htmlFor="phoneNumber">Phone Number</label>
        </div>

        <button type="submit" className={styles.submitBtn}>Continue</button>
      </form>
    </>
  );
}

export default function CustomerLogin() {
  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>Welcome</h1>
        <p className={styles.subtitle}>Enter your details to continue</p>
        
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
