'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin, isOrganiser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isOrganiser))) {
      router.push('/');
    }
  }, [user, loading, isAdmin, isOrganiser, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading panel...</p>
      </div>
    );
  }

  if (!user || (!isAdmin && !isOrganiser)) return null;

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}