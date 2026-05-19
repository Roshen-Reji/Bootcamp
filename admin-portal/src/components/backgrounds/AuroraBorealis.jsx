'use client';

import { useEffect, useRef } from 'react';

/**
 * Women In Engineering — Flowing aurora/gradient waves
 * Smooth, elegant color shifts creating an aurora borealis effect
 */
export default function AuroraBorealis({ color = '#6B2D8B' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const waves = [
      { y: 0.3, amplitude: 60, frequency: 0.003, speed: 0.008, color: 'rgba(107, 45, 139, 0.06)' },
      { y: 0.4, amplitude: 80, frequency: 0.002, speed: 0.006, color: 'rgba(224, 64, 251, 0.04)' },
      { y: 0.5, amplitude: 50, frequency: 0.004, speed: 0.01, color: 'rgba(155, 89, 182, 0.05)' },
      { y: 0.6, amplitude: 70, frequency: 0.0025, speed: 0.007, color: 'rgba(142, 68, 173, 0.04)' },
      { y: 0.35, amplitude: 90, frequency: 0.0015, speed: 0.005, color: 'rgba(175, 122, 197, 0.03)' },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 3) {
          const baseY = canvas.height * wave.y;
          const y = baseY + 
            Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 1.5 + time * wave.speed * 0.7) * wave.amplitude * 0.5 +
            Math.cos(x * wave.frequency * 0.5 + time * wave.speed * 1.3) * wave.amplitude * 0.3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, canvas.height * wave.y - wave.amplitude, 0, canvas.height);
        grad.addColorStop(0, wave.color);
        grad.addColorStop(0.5, wave.color.replace(/[\d.]+\)/, '0.02)'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
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
        opacity: 0.8,
      }}
    />
  );
}
