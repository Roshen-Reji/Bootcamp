'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Women In Engineering — Celestial Aurora v2
 * Multi-layered, undulating aurora curtains with:
 *   - Stacked translucent wave sheets with independent motion
 *   - Luminous star particles twinkling through the curtains
 *   - Gradient shifts that breathe between complementary hues
 *   - Soft fog layer at the base creating depth
 *   - Fully adaptive to bootcamp color palette
 */
export default function AuroraBorealis({ color = '#6B2D8B' }) {
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

    const { h, s, l } = palette;

    // Wave curtain definitions — each layer moves at different speed
    const curtains = [
      { yBase: 0.20, amplitude: 70,  freq: 0.0020, speed: 0.004, hueShift: -20, opacityBase: 0.15 },
      { yBase: 0.28, amplitude: 90,  freq: 0.0015, speed: 0.006, hueShift: 0,   opacityBase: 0.18 },
      { yBase: 0.35, amplitude: 55,  freq: 0.0030, speed: 0.008, hueShift: 15,  opacityBase: 0.14 },
      { yBase: 0.42, amplitude: 100, freq: 0.0012, speed: 0.003, hueShift: 30,  opacityBase: 0.16 },
      { yBase: 0.22, amplitude: 65,  freq: 0.0025, speed: 0.005, hueShift: -10, opacityBase: 0.12 },
      { yBase: 0.50, amplitude: 45,  freq: 0.0035, speed: 0.009, hueShift: 40,  opacityBase: 0.14 },
      { yBase: 0.30, amplitude: 80,  freq: 0.0018, speed: 0.007, hueShift: 50,  opacityBase: 0.12 },
    ];

    // Stars
    const starCount = Math.min(120, Math.floor((canvas.width * canvas.height) / 15000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      radius: 0.3 + Math.random() * 1.2,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Draw twinkling stars
      stars.forEach(star => {
        const twinkle = 0.2 + (Math.sin(time * 0.02 * star.twinkleSpeed + star.twinklePhase) + 1) * 0.4;
        const starHue = (h + Math.random() * 60 - 30) % 360;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${starHue}, ${Math.min(s + 20, 100)}%, ${Math.min(l + 40, 90)}%, ${twinkle * 0.9})`;
        ctx.fill();

        // Soft star halo
        if (star.radius > 0.8) {
          const haloGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 5);
          haloGrad.addColorStop(0, `hsla(${starHue}, ${s}%, ${Math.min(l + 30, 85)}%, ${twinkle * 0.3})`);
          haloGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 5, 0, Math.PI * 2);
          ctx.fillStyle = haloGrad;
          ctx.fill();
        }
      });

      // Draw aurora curtains
      curtains.forEach(curtain => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 2) {
          const baseY = canvas.height * curtain.yBase;
          const breathe = Math.sin(time * 0.003) * 15;
          const y = baseY + breathe +
            Math.sin(x * curtain.freq + time * curtain.speed) * curtain.amplitude +
            Math.sin(x * curtain.freq * 1.7 + time * curtain.speed * 0.6) * curtain.amplitude * 0.4 +
            Math.cos(x * curtain.freq * 0.4 + time * curtain.speed * 1.5) * curtain.amplitude * 0.25;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        const curtainHue = (h + curtain.hueShift) % 360;
        const breatheOpacity = curtain.opacityBase + Math.sin(time * 0.005 + curtain.hueShift) * 0.02;
        const topY = canvas.height * curtain.yBase - curtain.amplitude;

        const grad = ctx.createLinearGradient(0, topY, 0, canvas.height);
        grad.addColorStop(0, `hsla(${curtainHue}, ${Math.min(s + 15, 100)}%, ${Math.min(l + 20, 70)}%, ${breatheOpacity})`);
        grad.addColorStop(0.3, `hsla(${(curtainHue + 20) % 360}, ${s}%, ${Math.min(l + 10, 60)}%, ${breatheOpacity * 0.6})`);
        grad.addColorStop(0.7, `hsla(${(curtainHue + 40) % 360}, ${s * 0.6}%, ${Math.min(l + 5, 50)}%, ${breatheOpacity * 0.2})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Fog layer at the bottom for depth
      const fogGrad = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      fogGrad.addColorStop(0, 'transparent');
      fogGrad.addColorStop(1, `hsla(${h}, ${s * 0.3}%, ${Math.max(l * 0.1, 3)}%, 0.5)`);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

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
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
