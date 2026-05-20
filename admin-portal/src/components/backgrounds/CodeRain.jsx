'use client';

import { useEffect, useRef } from 'react';

/**
 * Computer Society — Animated code rain (Matrix-style)
 * Emulates authentic terminal rendering: Grid-snapped drops, 12.5 FPS throttle, Katakana chars
 */
export default function CodeRain({ color = '#0076D6' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastDrawTime = 0;

    // Matches the Python script's MOVERATE = 0.08 (80ms). 
    // Throttling the FPS gives it that chunky, authentic terminal feel.
    const frameInterval = 80;

    // Generate Half-width Katakana (like Python's 0xFF71-0xFF9E) and Latin characters
    const kana = Array.from({ length: 45 }, (_, i) => String.fromCharCode(0xFF71 + i));
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>[]{}'.split('');
    const chars = [...kana, ...latin];

    const fontSize = 16;
    let columns = 0;
    let drops = [];
    let activeColumns = new Set();

    const initArrays = (newColumns) => {
      if (newColumns > columns) {
        const added = newColumns - columns;
        for (let i = 0; i < added; i++) {
          const colIndex = columns + i;
          drops[colIndex] = Math.random() * -50; // Random start above screen

          // Matches the Python script's DENSITY = 0.9
          // Leaves ~10% of columns perpetually blank
          if (Math.random() <= 0.9) {
            activeColumns.add(colIndex);
          }
        }
      }
      columns = newColumns;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initArrays(Math.floor(canvas.width / fontSize));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const draw = (timestamp) => {
      animationId = requestAnimationFrame(draw);

      // Throttle rendering to mimic terminal update speed
      if (timestamp - lastDrawTime < frameInterval) return;
      lastDrawTime = timestamp;

      // Dark fade overlay (creates the trailing tails)
      ctx.fillStyle = 'rgba(7, 7, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace, 'MS Gothic'`;
      ctx.textAlign = 'center';

      for (let i = 0; i < drops.length; i++) {
        // Skip columns excluded by the Density filter
        if (!activeColumns.has(i)) continue;

        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize + (fontSize / 2);

        // Strictly align Y to the grid (no fractional smooth scrolling)
        const y = Math.floor(drops[i]) * fontSize;

        // Draw the new character (head of the drop)
        ctx.fillStyle = color;
        ctx.fillText(char, x, y);

        // Reset drop to the top of the screen once it hits the bottom
        if (y > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }

        // Move exactly 1 row down
        drops[i]++;
      }
    };

    // Start loop
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.5, // Overall visibility. Tweak this if it feels too bright/dark
      }}
    />
  );
}