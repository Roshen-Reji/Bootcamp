'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Industrial Applications — Living Blueprint v2
 * A precision engineering canvas with:
 *   - Technical grid with subtle parallax shift
 *   - Rotating gear assemblies with interlocking motion
 *   - Animated dimension lines and measurement annotations
 *   - Scanning crosshair with trailing arc
 *   - Pulsating draft markers at grid intersections
 *   - Fully color-adaptive to bootcamp theme
 */
export default function BlueprintGrid({ color = '#F39C12' }) {
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

    const gridSpacing = 50;

    // Gear assemblies
    const gears = Array.from({ length: 8 }, (_, i) => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 25 + Math.random() * 50;
      const direction = i % 2 === 0 ? 1 : -1;
      return {
        x, y, radius,
        teeth: 8 + Math.floor(Math.random() * 10),
        speed: direction * (0.002 + Math.random() * 0.004),
        hueOffset: Math.random() * 30 - 15,
      };
    });

    // Measurement annotations
    const annotations = Array.from({ length: 4 }, () => ({
      x1: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
      y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
      width: 80 + Math.random() * 200,
      label: `${(Math.random() * 200 + 10).toFixed(1)}mm`,
    }));

    // Draft markers at grid intersections
    const markers = [];
    for (let x = gridSpacing * 2; x < canvas.width; x += gridSpacing * 3) {
      for (let y = gridSpacing * 2; y < canvas.height; y += gridSpacing * 3) {
        if (Math.random() > 0.65) {
          markers.push({
            x, y,
            pulsePhase: Math.random() * Math.PI * 2,
            type: Math.random() > 0.5 ? 'cross' : 'circle',
          });
        }
      }
    }

    const drawGear = (x, y, radius, teeth, rotation, hueOffset) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      const gearHue = (h + hueOffset) % 360;
      const strokeColor = `hsla(${gearHue}, ${s}%, ${Math.min(l + 10, 60)}%, 0.3)`;

      // Outer teeth
      ctx.beginPath();
      const toothDepth = radius * 0.14;
      for (let i = 0; i < teeth; i++) {
        const a1 = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.4) / teeth) * Math.PI * 2;
        const a3 = ((i + 0.6) / teeth) * Math.PI * 2;
        const a4 = ((i + 1) / teeth) * Math.PI * 2;

        ctx.lineTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
        ctx.lineTo(Math.cos(a2) * (radius + toothDepth), Math.sin(a2) * (radius + toothDepth));
        ctx.lineTo(Math.cos(a3) * (radius + toothDepth), Math.sin(a3) * (radius + toothDepth));
        ctx.lineTo(Math.cos(a4) * radius, Math.sin(a4) * radius);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${gearHue}, ${s}%, ${Math.min(l + 10, 60)}%, 0.25)`;
      ctx.stroke();

      // Spokes
      for (let sp = 0; sp < 4; sp++) {
        const sa = (sp / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * radius * 0.2, Math.sin(sa) * radius * 0.2);
        ctx.lineTo(Math.cos(sa) * radius * 0.5, Math.sin(sa) * radius * 0.5);
        ctx.strokeStyle = `hsla(${gearHue}, ${s}%, ${Math.min(l + 10, 60)}%, 0.2)`;
        ctx.stroke();
      }

      // Center hole
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

      // Gear glow
      const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.3);
      glowGrad.addColorStop(0, `hsla(${gearHue}, ${s}%, ${Math.min(l + 20, 70)}%, 0.15)`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Parallax offset
      const parallaxX = Math.sin(time * 0.001) * 3;
      const parallaxY = Math.cos(time * 0.0008) * 3;

      // Sub-grid
      ctx.strokeStyle = `hsla(${h}, ${s * 0.3}%, ${Math.max(l * 0.2, 8)}%, 0.08)`;
      ctx.lineWidth = 0.5;
      const subGrid = gridSpacing / 5;
      for (let x = parallaxX % subGrid; x < canvas.width; x += subGrid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = parallaxY % subGrid; y < canvas.height; y += subGrid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Main grid
      ctx.strokeStyle = `hsla(${h}, ${s * 0.4}%, ${Math.max(l * 0.25, 10)}%, 0.2)`;
      ctx.lineWidth = 1.2;
      for (let x = parallaxX % gridSpacing; x < canvas.width; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = parallaxY % gridSpacing; y < canvas.height; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draft markers
      markers.forEach(marker => {
        const pulse = 0.5 + Math.sin(time * 0.02 + marker.pulsePhase) * 0.5;
        const markerColor = `hsla(${h}, ${s}%, ${Math.min(l + 20, 70)}%, ${0.25 + pulse * 0.25})`;

        if (marker.type === 'cross') {
          const sz = 5;
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(marker.x - sz, marker.y); ctx.lineTo(marker.x + sz, marker.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(marker.x, marker.y - sz); ctx.lineTo(marker.x, marker.y + sz);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, 4, 0, Math.PI * 2);
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Measurement annotations
      annotations.forEach(ann => {
        const annColor = `hsla(${h}, ${s}%, ${Math.min(l + 15, 65)}%, 0.4)`;
        const endX = ann.x1 + ann.width;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(ann.x1, ann.y);
        ctx.lineTo(endX, ann.y);
        ctx.strokeStyle = annColor;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // End ticks
        ctx.beginPath();
        ctx.moveTo(ann.x1, ann.y - 5); ctx.lineTo(ann.x1, ann.y + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(endX, ann.y - 5); ctx.lineTo(endX, ann.y + 5);
        ctx.stroke();

        // Label
        ctx.font = '11px monospace';
        ctx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(l + 20, 70)}%, 0.5)`;
        ctx.textAlign = 'center';
        ctx.fillText(ann.label, ann.x1 + ann.width / 2, ann.y - 6);
      });

      // Rotating gears
      gears.forEach(gear => {
        drawGear(gear.x, gear.y, gear.radius, gear.teeth, time * gear.speed, gear.hueOffset);
      });

      // Scanning crosshair
      const scanX = canvas.width * 0.5 + Math.sin(time * 0.003) * canvas.width * 0.3;
      const scanY = canvas.height * 0.5 + Math.cos(time * 0.002) * canvas.height * 0.25;
      const scanHue = (h + 15) % 360;

      ctx.strokeStyle = `hsla(${scanHue}, ${s}%, ${Math.min(l + 20, 70)}%, 0.3)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(scanX, scanY, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(scanX, scanY, 35, -Math.PI * 0.3 + time * 0.01, Math.PI * 0.3 + time * 0.01);
      ctx.stroke();

      // Crosshair lines
      const chLen = 12;
      ctx.beginPath();
      ctx.moveTo(scanX - chLen, scanY); ctx.lineTo(scanX + chLen, scanY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scanX, scanY - chLen); ctx.lineTo(scanX, scanY + chLen);
      ctx.stroke();

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
