'use client';

import { useEffect, useRef } from 'react';

export default function AntigravityDots({ color = '#6C63FF' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        // Mouse tracking for the antigravity/repulsion effect
        let mouse = { x: null, y: null, radius: 130 };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };

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

        class Particle {
            constructor() {
                // Sleek, tiny dots instead of giant balls
                this.radius = Math.random() * 1.5 + 0.5;
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;

                // Weight/mass of the particle affects how fast it scatters
                this.density = (Math.random() * 20) + 2;

                // Constant gentle drifting speed
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
            }

            update() {
                // Continuous drifting
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off screen edges softly
                if (this.x > canvas.width || this.x < 0) {
                    this.vx = -this.vx;
                }
                if (this.y > canvas.height || this.y < 0) {
                    this.vy = -this.vy;
                }

                // Antigravity (Mouse Repulsion Physics)
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouse.radius) {
                        // Calculate vector to push particle away
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;

                        // Particles closer to the mouse get pushed harder
                        const force = (mouse.radius - distance) / mouse.radius;

                        const directionX = forceDirectionX * force * this.density;
                        const directionY = forceDirectionY * force * this.density;

                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                // Sleek white/gray dot that fits the dark glassmorphic theme
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
                ctx.closePath();
            }
        }

        const init = () => {
            particles = [];
            // Optimal density for connecting lines
            const numberOfParticles = Math.floor((canvas.width * canvas.height) / 8000);
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };
        init();

        const connect = () => {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = (dx * dx) + (dy * dy);

                    // Connect dots that are close to each other
                    if (distance < 14000) {
                        let opacity = 1 - (distance / 14000);

                        // Draw lines using the primary theme color for a cohesive look
                        ctx.globalAlpha = opacity * 0.4;
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0; // Reset alpha
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color]);

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
                pointerEvents: 'none', // Critical: Lets users click on cards/buttons "through" the background
            }}
        />
    );
}