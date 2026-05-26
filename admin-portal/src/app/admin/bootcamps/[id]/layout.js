'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getBootcamp } from '@/lib/db';

export default function BootcampDetailLayout({ children }) {
  const { id } = useParams();
  const router = useRouter();
  const { applyTheme, resetTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (!id || !user) return;

    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) {
        if (user.role === 'organiser' && bc.createdBy !== user.uid) {
          router.push('/admin');
          return;
        }
        applyTheme(bc);
      }
    };
    loadBc();

    return () => resetTheme();
  }, [id, user, router, applyTheme, resetTheme]);

  return <>{children}</>;
}
