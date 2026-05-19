'use client';

import { useEffect, useRef } from 'react';

/**
 * Robotics & Automation — Animated circuit board traces
 * Glowing pathways with nodes that light up sequentially
 */
export default function CircuitBoard({ color = '#E74C3C' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const gridSize = 40;
    const nodes = [];
    const traces = [];

    // Generate grid nodes
    for (let x = gridSize; x < canvas.width; x += gridSize) {
      for (let y = gridSize; y < canvas.height; y += gridSize) {
        if (Math.random() > 0.7) {
          nodes.push({
            x, y,
            radius: 2 + Math.random() * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.03,
          });
        }
      }
    }

    // Generate traces between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < gridSize * 3 && Math.random() > 0.6) {
          traces.push({
            from: nodes[i],
            to: nodes[j],
            progress: Math.random(),
            speed: 0.001 + Math.random() * 0.003,
          });
        }
      }
    }

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Draw traces
      traces.forEach(trace => {
        trace.progress += trace.speed;
        if (trace.progress > 1) trace.progress = 0;

        ctx.beginPath();
        
        // Draw the line (right-angle paths for circuit feel)
        const midX = trace.to.x;
        const midY = trace.from.y;
        
        ctx.moveTo(trace.from.x, trace.from.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(trace.to.x, trace.to.y);
        
        ctx.strokeStyle = `${color}10`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Animated pulse along trace
        const px = trace.from.x + (midX - trace.from.x) * Math.min(trace.progress * 2, 1);
        const py = trace.from.y + (midY - trace.from.y) * Math.min(trace.progress * 2, 1);
        const px2 = trace.progress > 0.5 ? midX + (trace.to.x - midX) * ((trace.progress - 0.5) * 2) : midX;
        const py2 = trace.progress > 0.5 ? midY + (trace.to.y - midY) * ((trace.progress - 0.5) * 2) : midY;

        const dotX = trace.progress <= 0.5 ? px : px2;
        const dotY = trace.progress <= 0.5 ? py : py2;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `${color}30`;
        ctx.fill();
      });

      // Draw nodes with pulsing glow
      nodes.forEach(node => {
        const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
        const glowRadius = node.radius + pulse * 2;
        const opacity = 0.08 + pulse * 0.04;

        // Glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius * 4);
        grad.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}18`;
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
        opacity: 0.7,
      }}
    />
  );
}
