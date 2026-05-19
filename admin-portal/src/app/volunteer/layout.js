'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import VolunteerSidebar from '@/components/volunteer/VolunteerSidebar';
import styles from './layout.module.css';

export default function VolunteerLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'volunteer')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'volunteer') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <VolunteerSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
