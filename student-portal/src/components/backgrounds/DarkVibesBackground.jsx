'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './DarkVibesBackground.module.css';

const SHAPES = [
  // Triangle Blue
  <polygon points="12,2 22,20 2,20" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  // Circle Green
  <circle cx="12" cy="12" r="8" fill="none" stroke="#00e676" strokeWidth="2" />,
  // Triangle Yellow
  <polygon points="12,2 22,20 2,20" fill="none" stroke="#ffea00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  // M / Zigzag Red
  <polyline points="2,22 8,2 16,22 22,2" fill="none" stroke="#ff3d00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  // Z Purple
  <polyline points="2,4 22,4 4,20 22,20" fill="none" stroke="#d500f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  // Cross Cyan
  <g stroke="#00e5ff" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </g>,
  // Arc Yellow
  <path d="M 4 12 A 8 8 0 0 1 20 12" fill="none" stroke="#ffea00" strokeWidth="2" strokeLinecap="round" />
];

export default function DarkVibesBackground() {
  const [elements, setElements] = useState([]);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate random shapes
    const generatedElements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      shape: SHAPES[i % SHAPES.length],
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360,
      duration: 15 + Math.random() * 20, // animation duration
      delay: Math.random() * -20 // random start time
    }));

    // Generate stars
    const generatedStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
      duration: 3 + Math.random() * 4,
    }));

    setElements(generatedElements);
    setStars(generatedStars);
  }, []);

  return (
    <div className={styles.container}>
      {/* Render Stars */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className={styles.star}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [star.opacity * 0.2, star.opacity, star.opacity * 0.2] }}
          transition={{ duration: star.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Render Floating Elements */}
      {elements.map((el) => (
        <motion.div
          key={`el-${el.id}`}
          className={styles.floatingElement}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
          }}
          animate={{
            y: ['-15px', '15px', '-15px'],
            x: ['-10px', '10px', '-10px'],
            rotate: [el.rotation, el.rotation + 45, el.rotation],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: el.delay,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ transform: `scale(${el.scale})` }}
          >
            {el.shape}
          </svg>
        </motion.div>
      ))}

      {/* Bottom right decorative lines */}
      <div className={styles.decorLines}>
        <div className={styles.line} style={{ width: '40px' }} />
        <div className={styles.line} style={{ width: '30px' }} />
        <div className={styles.line} style={{ width: '50px' }} />
      </div>
      
      {/* Scroll down text */}
      <div className={styles.scrollDown}>
        <div className={styles.scrollText}>Scroll down</div>
        <div className={styles.scrollLine} />
      </div>
    </div>
  );
}
