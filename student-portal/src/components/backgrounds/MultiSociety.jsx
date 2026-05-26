'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Multi-Society — Orbital System
 * A technical/scientific orbital diagram with planets orbiting a central body,
 * thin orbit ellipses, crosshair markers, labels, and subtle grid lines.
 * Adapts to the bootcamp's color theme.
 */
export default function AntigravityDots({ color = '#6C63FF' }) {
  const canvasRef = useRef(null);

  const palette = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }, [color]);

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

    const { h, s } = palette;

    // Define planets / bodies for the orbital system
    const bodies = [
      { name: 'CORE', radius: 22, orbitRadius: 0, speed: 0, angle: 0, tilt: 0, eccentricity: 0, isCentral: true },
      { name: 'ALPHA', radius: 5, orbitRadius: 90, speed: 0.012, angle: Math.random() * Math.PI * 2, tilt: 0.15, eccentricity: 0.05 },
      { name: 'BETA', radius: 8, orbitRadius: 150, speed: 0.008, angle: Math.random() * Math.PI * 2, tilt: -0.1, eccentricity: 0.12 },
      { name: 'GAMMA', radius: 14, orbitRadius: 230, speed: 0.005, angle: Math.random() * Math.PI * 2, tilt: 0.2, eccentricity: 0.08 },
      { name: 'DELTA', radius: 10, orbitRadius: 320, speed: 0.003, angle: Math.random() * Math.PI * 2, tilt: -0.18, eccentricity: 0.15 },
      { name: 'EPSILON', radius: 6, orbitRadius: 420, speed: 0.002, angle: Math.random() * Math.PI * 2, tilt: 0.25, eccentricity: 0.1 },
      { name: 'ZETA', radius: 4, orbitRadius: 530, speed: 0.0015, angle: Math.random() * Math.PI * 2, tilt: -0.08, eccentricity: 0.2 },
      { name: 'ETA', radius: 3, orbitRadius: 650, speed: 0.001, angle: Math.random() * Math.PI * 2, tilt: 0.12, eccentricity: 0.18 },
    ];

    // Small orbiting moons for some planets
    const moons = [
      { parentIdx: 3, name: 'γ-1', radius: 2.5, orbitRadius: 28, speed: 0.03, angle: Math.random() * Math.PI * 2 },
      { parentIdx: 3, name: 'γ-2', radius: 2, orbitRadius: 38, speed: -0.02, angle: Math.random() * Math.PI * 2 },
      { parentIdx: 4, name: 'δ-1', radius: 2, orbitRadius: 22, speed: 0.025, angle: Math.random() * Math.PI * 2 },
      { parentIdx: 5, name: 'ε-1', radius: 1.5, orbitRadius: 18, speed: 0.04, angle: Math.random() * Math.PI * 2 },
    ];

    // Small floating markers (crosshair dots)
    const markers = Array.from({ length: 20 }, () => ({
      x: Math.random() * 2 - 1, // Normalized -1 to 1
      y: Math.random() * 2 - 1,
      label: Math.random() > 0.5 ? `${Math.floor(Math.random() * 9000 + 1000)}` : '',
      size: 2 + Math.random() * 3,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.0003 + Math.random() * 0.001,
    }));

    // Background stars
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.3 + Math.random() * 1.2,
      flickerPhase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.5 + Math.random() * 2,
    }));

    const drawCrosshair = (x, y, size, opacity) => {
      ctx.strokeStyle = `hsla(${h}, ${s * 0.5}%, 75%, ${Math.min(opacity * 1.5, 1)})`;
      ctx.lineWidth = 0.5;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.stroke();
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
      // Small circle
      ctx.beginPath();
      ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawLabel = (x, y, text, opacity) => {
      ctx.font = '9px monospace';
      ctx.fillStyle = `hsla(${h}, ${s * 0.3}%, 85%, ${Math.min(opacity * 1.5, 1)})`;
      ctx.fillText(text, x + 8, y - 4);
    };

    const draw = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      const cx = canvas.width * 0.42;
      const cy = canvas.height * 0.45;
      const scaleFactor = Math.min(canvas.width, canvas.height) / 900;

      // --- Background Stars ---
      stars.forEach(star => {
        const flicker = 0.3 + Math.sin(time * star.flickerSpeed + star.flickerPhase) * 0.3;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s * 0.2}%, 85%, ${flicker})`;
        ctx.fill();
      });

      // --- Draw orbit paths ---
      bodies.forEach(body => {
        if (body.isCentral) return;
        const orbitRx = body.orbitRadius * scaleFactor;
        const orbitRy = body.orbitRadius * scaleFactor * 0.35; // Elliptical tilt

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(body.tilt);

        // Dashed orbit line
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = `hsla(${h}, ${s * 0.4}%, 60%, 0.4)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      });

      // --- Update and draw planets ---
      bodies.forEach((body, idx) => {
        // Update angle
        body.angle += body.speed;

        let bx, by;

        if (body.isCentral) {
          bx = cx;
          by = cy;
        } else {
          const orbitRx = body.orbitRadius * scaleFactor;
          const orbitRy = body.orbitRadius * scaleFactor * 0.35;

          // Position on ellipse
          const localX = Math.cos(body.angle) * orbitRx * (1 + body.eccentricity * Math.cos(body.angle));
          const localY = Math.sin(body.angle) * orbitRy * (1 + body.eccentricity * Math.cos(body.angle));

          // Apply orbit tilt rotation
          const cosT = Math.cos(body.tilt);
          const sinT = Math.sin(body.tilt);
          bx = cx + localX * cosT - localY * sinT;
          by = cy + localX * sinT + localY * cosT;
        }

        // Store computed position for moon access
        body.computedX = bx;
        body.computedY = by;

        const r = body.radius * scaleFactor;

        if (body.isCentral) {
          // Core
          const coreGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
          coreGrad.addColorStop(0, `hsla(${h}, ${s}%, 85%, 1)`);
          coreGrad.addColorStop(0.6, `hsla(${h}, ${s}%, 60%, 0.9)`);
          coreGrad.addColorStop(1, `hsla(${h}, ${s}%, 40%, 0.7)`);
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();

          // Ring around center
          ctx.strokeStyle = `hsla(${h}, ${s * 0.5}%, 60%, 0.3)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(bx, by, r * 1.8, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Regular planet with shading adapting to theme
          const planetGrad = ctx.createRadialGradient(bx - r * 0.25, by - r * 0.25, r * 0.1, bx, by, r);
          planetGrad.addColorStop(0, `hsla(${h}, ${s * 0.2}%, 80%, 0.95)`);
          planetGrad.addColorStop(0.5, `hsla(${h}, ${s * 0.4}%, 55%, 0.85)`);
          planetGrad.addColorStop(1, `hsla(${h}, ${s * 0.6}%, 30%, 0.75)`);
          ctx.fillStyle = planetGrad;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();

          // Subtle colored rim
          ctx.strokeStyle = `hsla(${h}, ${s}%, 65%, 0.6)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(bx, by, r + 1, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label
        if (body.name) {
          ctx.font = `bold ${Math.max(9, 10 * scaleFactor)}px monospace`;
          ctx.fillStyle = `hsla(${h}, ${s * 0.3}%, 85%, 0.9)`;
          ctx.fillText(body.name, bx + r + 6, by + 3);
        }
      });

      // --- Draw moons ---
      moons.forEach(moon => {
        moon.angle += moon.speed;
        const parent = bodies[moon.parentIdx];
        if (!parent) return;

        const px = parent.computedX;
        const py = parent.computedY;
        const mr = moon.orbitRadius * scaleFactor;
        const moonX = px + Math.cos(moon.angle) * mr;
        const moonY = py + Math.sin(moon.angle) * mr * 0.5; // Slightly elliptical

        // Moon orbit path
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = `hsla(${h}, ${s * 0.3}%, 55%, 0.3)`;
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.ellipse(px, py, mr, mr * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Moon body
        const moonR = moon.radius * scaleFactor;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s * 0.2}%, 70%, 0.9)`;
        ctx.fill();

        // Moon label
        ctx.font = `${Math.max(8, 8 * scaleFactor)}px monospace`;
        ctx.fillStyle = `hsla(${h}, ${s * 0.3}%, 75%, 0.7)`;
        ctx.fillText(moon.name, moonX + moonR + 3, moonY + 2);
      });

      // --- Floating crosshair markers ---
      markers.forEach(m => {
        m.drift += m.driftSpeed;
        const mx = (m.x * 0.5 + 0.5) * canvas.width + Math.sin(m.drift) * 10;
        const my = (m.y * 0.5 + 0.5) * canvas.height + Math.cos(m.drift) * 10;
        const opacity = 0.2 + Math.sin(time * 0.5 + m.drift) * 0.1;

        drawCrosshair(mx, my, m.size * scaleFactor, opacity);
        if (m.label) drawLabel(mx, my, m.label, opacity * 0.8);
      });

      // --- Decorative lines (bottom-right corner) ---
      const linesX = canvas.width - 60;
      const linesY = canvas.height - 50;
      ctx.strokeStyle = `hsla(${h}, ${s * 0.5}%, 50%, 0.4)`;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(linesX, linesY + i * 6);
        ctx.lineTo(linesX + 30 + i * 5, linesY + i * 6);
        ctx.stroke();
      }

      // --- Coordinate markers along edges ---
      ctx.font = '9px monospace';
      ctx.fillStyle = `hsla(${h}, ${s * 0.3}%, 50%, 0.5)`;
      for (let i = 0; i < 5; i++) {
        const yy = canvas.height * (i + 1) / 6;
        ctx.fillText(`L${i + 1}`, 8, yy);
        // Small tick mark
        ctx.strokeStyle = `hsla(${h}, ${s * 0.3}%, 50%, 0.3)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(20, yy);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [color, palette]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}