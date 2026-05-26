'use client';

import { useEffect, useRef, useMemo } from 'react';

/**
 * Robotics & Automation — Neon Circuit Board v2
 * A living circuit schematic with:
 *   - Right-angle trace paths that pulse with traveling energy packets
 *   - Pulsating junction nodes with layered glow halos
 *   - Animated data flow particles racing along traces
 *   - Hexagonal PCB-style background pattern
 *   - Dynamic color-adaptive neon aesthetic
 */
export default function CircuitBoard({ color = '#E74C3C' }) {
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
      generateCircuit();
    };

    const { h, s, l } = palette;

    let nodes = [];
    let traces = [];
    let dataPackets = [];

    const generateCircuit = () => {
      nodes = [];
      traces = [];
      dataPackets = [];

      const gridSize = 45;
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);

      // Generate nodes on grid intersections
      for (let c = 1; c < cols; c++) {
        for (let r = 1; r < rows; r++) {
          if (Math.random() > 0.72) {
            const type = Math.random();
            nodes.push({
              x: c * gridSize,
              y: r * gridSize,
              radius: type > 0.8 ? 3.5 : type > 0.4 ? 2.5 : 1.8,
              type: type > 0.8 ? 'junction' : type > 0.4 ? 'via' : 'pad',
              pulsePhase: Math.random() * Math.PI * 2,
              pulseSpeed: 0.015 + Math.random() * 0.025,
              hueOffset: Math.random() * 30 - 15,
            });
          }
        }
      }

      // Generate traces between nearby nodes (right-angle routing)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = Math.abs(nodes[i].x - nodes[j].x);
          const dy = Math.abs(nodes[i].y - nodes[j].y);
          const manDist = dx + dy;
          if (manDist < gridSize * 5 && manDist > gridSize * 0.5 && Math.random() > 0.55) {
            const routeHorizontalFirst = Math.random() > 0.5;
            traces.push({
              from: nodes[i],
              to: nodes[j],
              routeHorizontalFirst,
              hueOffset: Math.random() * 20 - 10,
            });

            // Create data packets traveling along traces
            if (Math.random() > 0.6) {
              dataPackets.push({
                traceIdx: traces.length - 1,
                progress: Math.random(),
                speed: 0.002 + Math.random() * 0.004,
                size: 1.5 + Math.random() * 2,
              });
            }
          }
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const getTracePoint = (trace, t) => {
      const { from, to, routeHorizontalFirst } = trace;
      if (routeHorizontalFirst) {
        const midX = to.x, midY = from.y;
        if (t <= 0.5) {
          const segT = t * 2;
          return { x: from.x + (midX - from.x) * segT, y: from.y };
        } else {
          const segT = (t - 0.5) * 2;
          return { x: midX, y: midY + (to.y - midY) * segT };
        }
      } else {
        const midX = from.x, midY = to.y;
        if (t <= 0.5) {
          const segT = t * 2;
          return { x: from.x, y: from.y + (midY - from.y) * segT };
        } else {
          const segT = (t - 0.5) * 2;
          return { x: midX + (to.x - midX) * segT, y: midY };
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Subtle hex grid pattern
      const hexSize = 30;
      const hexH = hexSize * Math.sqrt(3);
      ctx.strokeStyle = `hsla(${h}, ${s * 0.3}%, ${Math.max(l * 0.2, 8)}%, 0.1)`;
      ctx.lineWidth = 0.5;
      for (let row = 0; row < canvas.height / hexH + 1; row++) {
        for (let col = 0; col < canvas.width / (hexSize * 1.5) + 1; col++) {
          const cx = col * hexSize * 1.5;
          const cy = row * hexH + (col % 2 ? hexH / 2 : 0);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const angle = (Math.PI / 3) * k - Math.PI / 6;
            const px = cx + hexSize * 0.8 * Math.cos(angle);
            const py = cy + hexSize * 0.8 * Math.sin(angle);
            k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Draw traces
      traces.forEach(trace => {
        const { from, to, routeHorizontalFirst, hueOffset } = trace;
        const traceHue = (h + hueOffset) % 360;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        if (routeHorizontalFirst) {
          ctx.lineTo(to.x, from.y);
          ctx.lineTo(to.x, to.y);
        } else {
          ctx.lineTo(from.x, to.y);
          ctx.lineTo(to.x, to.y);
        }
        ctx.strokeStyle = `hsla(${traceHue}, ${s}%, ${Math.min(l + 10, 55)}%, 0.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Animate data packets
      dataPackets.forEach(packet => {
        packet.progress += packet.speed;
        if (packet.progress > 1) packet.progress = 0;

        const trace = traces[packet.traceIdx];
        if (!trace) return;

        const pos = getTracePoint(trace, packet.progress);
        const packetHue = (h + trace.hueOffset + 10) % 360;

        // Packet glow
        const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, packet.size * 6);
        glowGrad.addColorStop(0, `hsla(${packetHue}, ${Math.min(s + 20, 100)}%, ${Math.min(l + 30, 80)}%, 0.6)`);
        glowGrad.addColorStop(0.5, `hsla(${packetHue}, ${s}%, ${Math.min(l + 15, 65)}%, 0.2)`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, packet.size * 6, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Packet core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, packet.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${packetHue}, ${Math.min(s + 20, 100)}%, ${Math.min(l + 35, 90)}%, 1)`;
        ctx.fill();
      });

      // Draw nodes with layered glow
      nodes.forEach(node => {
        const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
        const nodeHue = (h + node.hueOffset) % 360;
        const glowIntensity = 0.25 + pulse * 0.15;

        // Outer glow halo
        const outerR = node.radius * 10;
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, outerR);
        grad.addColorStop(0, `hsla(${nodeHue}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 25, 75)}%, ${glowIntensity})`);
        grad.addColorStop(0.4, `hsla(${nodeHue}, ${s}%, ${Math.min(l + 15, 60)}%, ${glowIntensity * 0.5})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Mid ring (for junction nodes)
        if (node.type === 'junction') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${nodeHue}, ${s}%, ${Math.min(l + 20, 70)}%, ${0.3 + pulse * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Core
        const coreR = node.radius + pulse * 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${nodeHue}, ${Math.min(s + 15, 100)}%, ${Math.min(l + 30, 80)}%, ${0.6 + pulse * 0.3})`;
        ctx.fill();
      });

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
