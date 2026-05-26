'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Student Branch — Full Screen Flowing Particle Terrain
 * A dense, screen-filling particle sea with subtle wave height
 * and smaller, more refined dots.
 */
export default function NodeNetwork({ color = '#00629B' }) {
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
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Increase grid size to completely fill the screen
    const cols = 100;
    const rows = 120;
    const spacing = 35; // tighter spacing

    const { h, s, l } = palette;

    const draw = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      time += 0.012; // Smooth animation

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const focalLength = 350;
      
      // We want to tilt the grid so it fills the screen vertically
      const tilt = 0.8; // Radians
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);

      const focusZ = 800; // Focal plane

      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.7);
      glowGrad.addColorStop(0, `hsla(${h}, ${s}%, ${Math.max(l * 0.15, 4)}%, 0.6)`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let iz = rows; iz > 0; iz--) {
        for (let ix = 0; ix < cols; ix++) {
          
          // Infinite Scroll Math
          const speed = 25; // Travel speed
          const zScroll = time * speed;
          const zShift = zScroll % spacing;
          const zIdxOffset = zScroll / spacing;

          // 3D coordinates relative to center
          const x = (ix - cols / 2) * spacing;
          
          // Z shifts forward smoothly, wrapping seamlessly
          const z = (iz - rows / 3) * spacing - zShift; 
          
          // Wave evaluated at the moving logical index
          const logicalIz = iz + zIdxOffset;

          // Much shorter wave amplitude as requested, smoothly evaluating over logical positions
          const y = Math.sin(ix * 0.15 + time * 0.5) * 15 
                  + Math.sin(logicalIz * 0.15 + time * 0.5) * 15 
                  + Math.sin((ix + logicalIz) * 0.1 + time * 0.5) * 10;

          // Apply Tilt (Rotate around X axis)
          const ry = y * cosTilt - z * sinTilt;
          const rz = y * sinTilt + z * cosTilt;

          const zDepth = rz + 600; // Camera offset
          
          if (zDepth > 10) { // Only draw if in front of camera
            const scale = focalLength / zDepth;
            const screenX = cx + x * scale;
            const screenY = cy + ry * scale;

            // Smaller dots and tighter blur
            const blur = Math.abs(zDepth - focusZ) / 600;
            
            // Base radius is much smaller
            const baseRadius = 0.8 * scale;
            const radius = Math.max(0.2, baseRadius + blur * 2);
            
            let opacity = 1 - Math.min(1, blur * 1.8);
            
            if (zDepth < 200) {
              opacity *= Math.max(0, (zDepth - 50) / 150);
            }
            if (zDepth > 1800) {
              opacity *= Math.max(0, 1 - (zDepth - 1800) / 800);
            }

            if (opacity > 0.02) {
              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
              
              // Lightness variation
              const heightIntensity = (y + 40) / 80; 
              const lValue = Math.min(l + heightIntensity * 25, 95);
              
              ctx.fillStyle = `hsla(${h}, ${s}%, ${lValue}%, ${opacity})`;
              ctx.fill();
            }
          }
        }
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
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
