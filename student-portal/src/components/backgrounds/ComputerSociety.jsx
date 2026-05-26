'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Computer Society — Cinematic Code Rain v2
 * Multi-layered cascading glyph waterfall with:
 *   - Depth-of-field layers (near/mid/far) at different speeds & opacities
 *   - Luminous head particles with radial bloom
 *   - Chromatic shimmer on each glyph (hue-shifted from base color)
 *   - Radial vignette overlay tinted to the bootcamp color
 *   - Full adaptive coloring from the `color` prop
 */
export default function CodeRain({ color = '#0076D6' }) {
  const canvasRef = useRef(null);

  // Parse hex color once into HSL for procedural palette generation
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
    let lastDrawTime = 0;
    const frameInterval = 55; // ~18 FPS for that cinematic terminal feel

    // Katakana + Latin + symbol charset
    const kana = Array.from({ length: 45 }, (_, i) => String.fromCharCode(0xFF71 + i));
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>[]{}=+-~'.split('');
    const chars = [...kana, ...latin];

    const fontSize = 15;
    const layers = [
      { speed: 1.2, opacity: 0.10, blur: false, scale: 0.7 },   // far
      { speed: 0.85, opacity: 0.22, blur: false, scale: 0.85 },  // mid
      { speed: 0.55, opacity: 0.45, blur: false, scale: 1.0 },   // near
    ];

    let layerDrops = [];
    let layerActive = [];
    let layerTrails = [];

    const initLayer = (layerIdx) => {
      const cols = Math.floor(canvas.width / (fontSize * layers[layerIdx].scale));
      layerDrops[layerIdx] = Array.from({ length: cols }, () => Math.random() * -80);
      layerActive[layerIdx] = new Set();
      // trail length per column
      layerTrails[layerIdx] = Array.from({ length: cols }, () => 8 + Math.floor(Math.random() * 18));
      for (let i = 0; i < cols; i++) {
        if (Math.random() < 0.85) layerActive[layerIdx].add(i);
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      layers.forEach((_, i) => initLayer(i));
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const draw = (timestamp) => {
      animationId = requestAnimationFrame(draw);
      if (timestamp - lastDrawTime < frameInterval) return;
      lastDrawTime = timestamp;

      // Trailing fade
      ctx.fillStyle = 'rgba(5, 5, 12, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { h, s, l } = palette;

      layers.forEach((layer, li) => {
        const drops = layerDrops[li];
        const active = layerActive[li];
        const trails = layerTrails[li];
        if (!drops) return;

        const scaledFont = Math.round(fontSize * layer.scale);
        ctx.font = `bold ${scaledFont}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.textAlign = 'center';

        for (let i = 0; i < drops.length; i++) {
          if (!active.has(i)) continue;

          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * scaledFont + scaledFont / 2;
          const y = Math.floor(drops[i]) * scaledFont;

          // Draw trail glyphs with fading color
          const trailLen = trails[i];
          for (let t = 1; t <= Math.min(trailLen, 6); t++) {
            const trailY = y - t * scaledFont;
            if (trailY < 0) break;
            const trailChar = chars[Math.floor(Math.random() * chars.length)];
            const trailOpacity = layer.opacity * (1 - t / trailLen) * 0.8;
            const hueShift = (h + t * 3) % 360;
            ctx.fillStyle = `hsla(${hueShift}, ${s}%, ${Math.min(l + 10, 80)}%, ${trailOpacity})`;
            ctx.fillText(trailChar, x, trailY);
          }

          // Head glyph — brightest
          const headHue = (h + Math.sin(timestamp * 0.001 + i) * 15) % 360;
          ctx.fillStyle = `hsla(${headHue}, ${Math.min(s + 20, 100)}%, ${Math.min(l + 30, 90)}%, ${Math.min(1, layer.opacity * 2)})`;
          ctx.fillText(char, x, y);

          // Bloom glow on head
          const bloomRadius = scaledFont * 1.8;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, bloomRadius);
          grad.addColorStop(0, `hsla(${headHue}, ${s}%, ${Math.min(l + 20, 85)}%, ${layer.opacity * 0.4})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(x - bloomRadius, y - bloomRadius, bloomRadius * 2, bloomRadius * 2);

          // Reset drop
          if (y > canvas.height && Math.random() > 0.96) {
            drops[i] = 0;
            trails[i] = 8 + Math.floor(Math.random() * 18);
          }
          drops[i] += layer.speed;
        }
      });

      // Radial vignette overlay tinted to bootcamp color
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.9
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, `hsla(${h}, ${s}%, ${Math.max(l - 30, 5)}%, 0.6)`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
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