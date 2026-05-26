'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getBootcamp } from '@/lib/db';

export default function BootcampDetailLayout({ children }) {
  const { id } = useParams();
  const { applyTheme, resetTheme } = useTheme();

  useEffect(() => {
    if (!id) return;

    const loadBc = async () => {
      const bc = await getBootcamp(id);
      if (bc) applyTheme(bc);
    };
    loadBc();

    return () => resetTheme();
  }, [id, applyTheme, resetTheme]);

  return <>{children}</>;
}
