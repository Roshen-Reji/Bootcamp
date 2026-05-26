'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Student Branch — Cosmic Node Network v2
 * An immersive constellation network with:
 *   - Orbital drift & subtle gravitational attraction between nodes
 *   - Luminous connection gradients that pulse with a heartbeat
 *   - Mouse proximity creates an expanding "nebula" glow zone
 *   - Adaptive coloring from bootcamp theme
 *   - Organic node halos with soft radial bloom
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
    const ctx = canvas.getContext('2d');
    let animationId;
    let mouse = { x: -9999, y: -9999 };
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e) => { mouse = { x: e.clientX, y: e.clientY }; };
    const handleMouseOut = () => { mouse = { x: -9999, y: -9999 }; };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mouseout', handleMouseOut);

    const nodeCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 12000));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: 1 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.003 + Math.random() * 0.008,
      hueOffset: Math.random() * 40 - 20,
    }));

    const maxDist = 180;
    const mouseRadius = 220;

    const { h, s, l } = palette;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      // Draw a deep space radial gradient backdrop tinted to color
      const bgGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.7
      );
      bgGrad.addColorStop(0, `hsla(${h}, ${s * 0.4}%, ${Math.max(l * 0.15, 3)}%, 0.4)`);
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update positions
      nodes.forEach(node => {
        // Orbital wobble
        node.x += node.vx + Math.sin(time * node.orbitSpeed * 60 + node.phase) * 0.15;
        node.y += node.vy + Math.cos(time * node.orbitSpeed * 60 + node.phase) * 0.15;

        // Bounce
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Mouse attraction
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 1) {
          node.vx += dx * 0.00008;
          node.vy += dy * 0.00008;
        }

        // Speed limit
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 0.7) {
          node.vx *= 0.7 / speed;
          node.vy *= 0.7 / speed;
        }
      });

      // Draw connections with gradient lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const intensity = (1 - dist / maxDist);
            const pulse = 0.5 + Math.sin(time * 2 + i * 0.1) * 0.5;
            const opacity = intensity * 0.4 * (0.8 + pulse * 0.5);

            const lineGrad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            const hue1 = (h + nodes[i].hueOffset) % 360;
            const hue2 = (h + nodes[j].hueOffset) % 360;
            lineGrad.addColorStop(0, `hsla(${hue1}, ${s}%, ${Math.min(l + 20, 75)}%, ${opacity})`);
            lineGrad.addColorStop(1, `hsla(${hue2}, ${s}%, ${Math.min(l + 20, 75)}%, ${opacity})`);

            ctx.beginPath();
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = intensity * 2.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes with halos
      nodes.forEach(node => {
        const nodeHue = (h + node.hueOffset) % 360;
        const pulse = 0.7 + Math.sin(time * 3 + node.phase) * 0.3;

        // Outer halo bloom
        const haloRadius = node.radius * 8;
        const haloGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
        haloGrad.addColorStop(0, `hsla(${nodeHue}, ${s}%, ${Math.min(l + 15, 70)}%, ${0.2 * pulse})`);
        haloGrad.addColorStop(0.5, `hsla(${nodeHue}, ${s}%, ${Math.min(l + 10, 60)}%, ${0.1 * pulse})`);
        haloGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${nodeHue}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 35, 85)}%, ${0.9 * pulse})`;
        ctx.fill();
      });

      // Mouse nebula glow
      const mDist = Math.sqrt((mouse.x - canvas.width / 2) ** 2 + (mouse.y - canvas.height / 2) ** 2);
      if (mDist < Math.max(canvas.width, canvas.height)) {
        const nebulaGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouseRadius * 1.5);
        nebulaGrad.addColorStop(0, `hsla(${h}, ${s}%, ${Math.min(l + 20, 70)}%, 0.15)`);
        nebulaGrad.addColorStop(0.6, `hsla(${(h + 30) % 360}, ${s}%, ${Math.min(l + 10, 60)}%, 0.08)`);
        nebulaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(mouse.x - mouseRadius * 1.5, mouse.y - mouseRadius * 1.5, mouseRadius * 3, mouseRadius * 3);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseout', handleMouseOut);
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
