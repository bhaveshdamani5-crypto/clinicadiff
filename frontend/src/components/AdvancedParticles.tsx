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
    return scrollY.on("change", (v) => { scrollRef.current = v; });
  }, [scrollY]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle Setup
    const numParticles = 150;
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; baseAlpha: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * window.innerWidth * 2,
        y: (Math.random() - 0.5) * window.innerHeight * 2,
        z: Math.random() * 1000 - 500, // -500 to 500 depth
        vx: (Math.random() - 0.5) * 0.2, // Slow motion
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        baseAlpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animationId: number;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const scrollOffset = scrollRef.current;
      const focalLength = 300;
      const cx = w / 2;
      const cy = h / 2;

      // Draw connections
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Movement
        p.x += p.vx;
        p.y += p.vy - scrollOffset * 0.005 * (p.z / 500); // Parallax scroll
        p.z += p.vz;

        // Wrap around bounds softly
        if (p.x < -w) p.x = w;
        if (p.x > w) p.x = -w;
        if (p.y < -h) p.y = h;
        if (p.y > h) p.y = -h;
        if (p.z < -500) p.z = 500;
        if (p.z > 500) p.z = -500;

        // 3D Projection
        const scale = focalLength / (focalLength + p.z);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        // Mouse interaction (repel)
        const dx = mouseRef.current.x - px;
        const dy = mouseRef.current.y - py;
        const distSq = dx * dx + dy * dy;
        const repelRadius = 20000;
        if (distSq < repelRadius) {
          const force = (repelRadius - distSq) / repelRadius;
          p.x -= dx * force * 0.02;
          p.y -= dy * force * 0.02;
        }

        // Draw particle
        if (scale > 0 && px > 0 && px < w && py > 0 && py < h) {
          const alpha = p.baseAlpha * scale * 1.5;
          const r = p.size * scale;
          
          // Glow
          const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
          grad.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
          grad.addColorStop(1, `rgba(59, 130, 246, 0)`);
          
          ctx.beginPath();
          ctx.arc(px, py, r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha + 0.2})`;
          ctx.fill();
        }

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dz2 = p.z - p2.z;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2);

          if (dist2 < 150) {
            const scale2 = focalLength / (focalLength + p2.z);
            const px2 = cx + p2.x * scale2;
            const py2 = cy + p2.y * scale2;

            if (scale > 0 && scale2 > 0) {
              const lineAlpha = (1 - dist2 / 150) * 0.15 * ((scale + scale2) / 2);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px2, py2);
              ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
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
