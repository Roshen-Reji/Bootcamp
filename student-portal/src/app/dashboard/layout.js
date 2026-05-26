'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getBootcamp } from '@/lib/db';
import StudentSidebar from '@/components/student/StudentSidebar';
import styles from './layout.module.css';

export default function StudentLayout({ children }) {
  const { user, loading } = useAuth();
  const { applyTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/');
    } else if (user?.bootcampId) {
      getBootcamp(user.bootcampId).then(bc => {
        if (bc) applyTheme(bc);
      });
    }
  }, [user, loading, router, applyTheme]);

  if (loading || !user || user.role !== 'student') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
