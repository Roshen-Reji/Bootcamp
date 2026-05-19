'use client';

import { motion } from 'framer-motion';
import styles from './GlassCard.module.css';

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  padding = 'md',
  onClick,
  style,
  ...props
}) {
  const paddingMap = {
    none: '0',
    sm: 'var(--space-md)',
    md: 'var(--space-lg)',
    lg: 'var(--space-xl)',
    xl: 'var(--space-2xl)',
  };

  return (
    <motion.div
      className={`${styles.card} ${hover ? styles.hover : ''} ${glow ? styles.glow : ''} ${className}`}
      style={{ padding: paddingMap[padding], ...style }}
      onClick={onClick}
      whileHover={hover ? { y: -3, scale: 1.005 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
