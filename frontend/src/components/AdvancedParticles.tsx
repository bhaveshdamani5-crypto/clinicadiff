"use client";
import { useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";

export default function AdvancedParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Track mouse properly
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    // Clear mouse when leaving window
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle Setup for Smooth Antigravity Network
    const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 15000); // Responsive density
    const particles: { 
      x: number; y: number; 
      vx: number; vy: number; 
      baseVx: number; baseVy: number; 
      size: number; alpha: number; color: string;
    }[] = [];

    const colors = ['rgba(59, 130, 246,', 'rgba(6, 182, 212,', 'rgba(14, 165, 233,'];

    for (let i = 0; i < numParticles; i++) {
      const size = Math.random() * 2 + 1;
      const baseVx = (Math.random() - 0.5) * 0.5;
      const baseVy = (Math.random() - 0.5) * 0.5;
      
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: baseVx,
        vy: baseVy,
        baseVx,
        baseVy,
        size,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animationId: number;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const repelRadius = 150; // Mouse interaction radius

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Antigravity Mouse Interaction (Force application)
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          const forceDirectionX = dx / dist;
          const forceDirectionY = dy / dist;
          
          // Apply velocity push
          p.vx += forceDirectionX * force * 0.6;
          p.vy += forceDirectionY * force * 0.6;
        }

        // 2. Friction and Velocity Reset
        // Smoothly return to the natural base velocity
        p.vx = p.vx * 0.95 + p.baseVx * 0.05;
        p.vy = p.vy * 0.95 + p.baseVy * 0.05;

        // 3. Update Position
        p.x += p.vx;
        p.y += p.vy;

        // 4. Wrap around screen smoothly
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;

        // 5. Draw Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.fill();

        // 6. Draw Network Lines (Connecting nearby particles)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ddx = p.x - p2.x;
          const ddy = p.y - p2.y;
          const ddist = Math.sqrt(ddx * ddx + ddy * ddy);

          if (ddist < 120) {
            const lineAlpha = (1 - ddist / 120) * 0.2; // Fade out as they get further
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ display: "block" }}
    />
  );
}
