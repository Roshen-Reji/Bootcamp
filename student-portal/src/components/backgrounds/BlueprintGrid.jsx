'use client';

import { useEffect, useRef } from 'react';

/**
 * Industrial Applications — Blueprint grid with rotating gears
 * Technical drawing aesthetic with subtle mechanical elements
 */
export default function BlueprintGrid({ color = '#F39C12' }) {
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

    const gridSpacing = 50;
    const gears = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 20 + Math.random() * 40,
      teeth: 8 + Math.floor(Math.random() * 8),
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.005),
    }));

    const drawGear = (x, y, radius, teeth, rotation, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Outer teeth
      ctx.beginPath();
      const toothDepth = radius * 0.15;
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
        const gapAngle = ((i + 1) / teeth) * Math.PI * 2;

        ctx.lineTo(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        );
        ctx.lineTo(
          Math.cos(angle) * (radius + toothDepth),
          Math.sin(angle) * (radius + toothDepth)
        );
        ctx.lineTo(
          Math.cos(nextAngle) * (radius + toothDepth),
          Math.sin(nextAngle) * (radius + toothDepth)
        );
        ctx.lineTo(
          Math.cos(nextAngle) * radius,
          Math.sin(nextAngle) * radius
        );
      }
      ctx.closePath();
      ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Center hole
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Draw grid lines
      ctx.strokeStyle = `${color}06`;
      ctx.lineWidth = 0.5;

      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw finer sub-grid
      ctx.strokeStyle = `${color}03`;
      const subGrid = gridSpacing / 5;
      for (let x = 0; x < canvas.width; x += subGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += subGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw rotating gears
      gears.forEach(gear => {
        drawGear(gear.x, gear.y, gear.radius, gear.teeth, time * gear.speed, 0.08);
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
        opacity: 0.7,
      }}
    />
  );
}
