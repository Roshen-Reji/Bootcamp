'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Multi-Society / Default — Antigravity Particle Field v2
 * An immersive zero-gravity particle ecosystem with:
 *   - Magnetic mouse repulsion creating expanding void zones
 *   - Gradient-tinted connection threads with thickness modulation
 *   - Multi-layered particles (foreground & background) for depth
 *   - Ambient pulse waves radiating from center
 *   - Color-adaptive halos and connection gradients
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
    let animationFrameId;
    let time = 0;

    let mouse = { x: null, y: null, radius: 150 };

    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseOut = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };
    window.addEventListener('resize', resize);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const { h, s, l } = palette;

    let particles = [];

    class Particle {
      constructor(layer) {
        this.layer = layer; // 'far' or 'near'
        this.radius = layer === 'far' ? (0.8 + Math.random() * 1.5) : (1.5 + Math.random() * 2.5);
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.density = (Math.random() * 18) + 3;
        this.vx = (Math.random() - 0.5) * (layer === 'far' ? 0.3 : 0.7);
        this.vy = (Math.random() - 0.5) * (layer === 'far' ? 0.3 : 0.7);
        this.hueOffset = Math.random() * 40 - 20;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges softly
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.y > canvas.height + 10) this.y = -10;
        if (this.y < -10) this.y = canvas.height + 10;

        // Antigravity repulsion
        if (mouse.x != null && mouse.y != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const forceX = (dx / distance) * force * this.density * 0.8;
            const forceY = (dy / distance) * force * this.density * 0.8;
            this.x -= forceX;
            this.y -= forceY;
          }
        }
      }

      draw() {
        const pHue = (h + this.hueOffset) % 360;
        const pulse = 0.6 + Math.sin(time * 0.03 + this.pulsePhase) * 0.4;
        const baseOpacity = this.layer === 'far' ? 0.5 : 0.9;

        // Halo
        if (this.radius > 1) {
          const haloR = this.radius * 6;
          const haloGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloR);
          haloGrad.addColorStop(0, `hsla(${pHue}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 30, 80)}%, ${0.2 * pulse})`);
          haloGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(this.x, this.y, haloR, 0, Math.PI * 2);
          ctx.fillStyle = haloGrad;
          ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pHue}, ${Math.min(s + 15, 100)}%, ${Math.min(l + 40, 90)}%, ${baseOpacity * pulse})`;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const farCount = Math.floor((canvas.width * canvas.height) / 18000);
      const nearCount = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < farCount; i++) particles.push(new Particle('far'));
      for (let i = 0; i < nearCount; i++) particles.push(new Particle('near'));
    };
    init();

    const connectDist = 130;
    const connectDistSq = connectDist * connectDist;

    const connect = () => {
      const nearParticles = particles.filter(p => p.layer === 'near');
      for (let a = 0; a < nearParticles.length; a++) {
        for (let b = a + 1; b < nearParticles.length; b++) {
          const dx = nearParticles[a].x - nearParticles[b].x;
          const dy = nearParticles[a].y - nearParticles[b].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectDistSq) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / connectDist) * 0.7;

            const hue1 = (h + nearParticles[a].hueOffset) % 360;
            const hue2 = (h + nearParticles[b].hueOffset) % 360;

            const lineGrad = ctx.createLinearGradient(
              nearParticles[a].x, nearParticles[a].y,
              nearParticles[b].x, nearParticles[b].y
            );
            lineGrad.addColorStop(0, `hsla(${hue1}, ${s}%, ${Math.min(l + 25, 75)}%, ${opacity})`);
            lineGrad.addColorStop(1, `hsla(${hue2}, ${s}%, ${Math.min(l + 25, 75)}%, ${opacity})`);

            ctx.beginPath();
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = (1 - dist / connectDist) * 2;
            ctx.moveTo(nearParticles[a].x, nearParticles[a].y);
            ctx.lineTo(nearParticles[b].x, nearParticles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Ambient pulse wave from center
      const pulseRadius = ((time * 0.5) % (Math.max(canvas.width, canvas.height) * 0.8));
      const pulseOpacity = Math.max(0, 0.15 * (1 - pulseRadius / (Math.max(canvas.width, canvas.height) * 0.8)));
      if (pulseOpacity > 0.005) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${h}, ${s}%, ${Math.min(l + 20, 70)}%, ${pulseOpacity})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw far particles first (background layer)
      particles.filter(p => p.layer === 'far').forEach(p => { p.update(); p.draw(); });

      // Draw connections
      connect();

      // Draw near particles on top (foreground layer)
      particles.filter(p => p.layer === 'near').forEach(p => { p.update(); p.draw(); });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
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