"use client";
import { useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";

export default function DnaHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const animationRef = useRef<number>(0);
  const scrollRef = useRef(0);
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

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const scroll = scrollRef.current * 0.002;
      time += 0.004;

      const totalPoints = 200;
      const helixRadius = w * 0.06;
      const cx = w * 0.5;
      const twists = 8;

      // Build two strands in 3D
      const points1: { x: number; y: number; z: number; angle: number }[] = [];
      const points2: { x: number; y: number; z: number; angle: number }[] = [];

      for (let i = 0; i < totalPoints; i++) {
        const t = i / totalPoints;
        const angle = t * Math.PI * 2 * twists + time * 1.5 + scroll;
        const y = t * h;

        points1.push({
          x: cx + Math.cos(angle) * helixRadius,
          y,
          z: Math.sin(angle),
          angle,
        });
        points2.push({
          x: cx + Math.cos(angle + Math.PI) * helixRadius,
          y,
          z: Math.sin(angle + Math.PI),
          angle: angle + Math.PI,
        });
      }

      // --- Draw rungs (base pairs) ---
      for (let i = 0; i < totalPoints; i += 4) {
        const a = points1[i];
        const b = points2[i];
        const midZ = (a.z + b.z) / 2;
        const alpha = 0.04 + (midZ + 1) * 0.08;

        // Base pair as two colors meeting in middle
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
        grad.addColorStop(0.4, `rgba(147, 197, 253, ${alpha * 0.5})`);
        grad.addColorStop(0.6, `rgba(103, 232, 249, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(34, 211, 238, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Tiny hydrogen bond dots at center
        ctx.beginPath();
        ctx.arc(midX - 3, midY, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(midX + 3, midY, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
        ctx.fill();
      }

      // --- Draw backbone strands with depth ---
      // Sort segments for proper depth rendering
      const drawStrand = (
        points: typeof points1,
        baseColor: [number, number, number]
      ) => {
        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i];
          const pn = points[i + 1];
          const depthAlpha = 0.1 + (p.z + 1) * 0.25;
          const lineWidth = 0.8 + (p.z + 1) * 0.6;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pn.x, pn.y);
          ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${depthAlpha})`;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      };

      // Draw back strand first, then front
      const strand1Front = points1.filter((p) => p.z >= 0);
      const strand1Back = points1.filter((p) => p.z < 0);
      const strand2Front = points2.filter((p) => p.z >= 0);
      const strand2Back = points2.filter((p) => p.z < 0);

      // Back layer
      drawStrand(points1, [59, 130, 246]);
      drawStrand(points2, [34, 211, 238]);

      // --- Draw nucleotide nodes ---
      const drawNodes = (
        points: typeof points1,
        color: [number, number, number]
      ) => {
        for (let i = 0; i < points.length; i += 3) {
          const p = points[i];
          const depth = (p.z + 1) / 2; // 0 to 1
          const radius = 1 + depth * 1.8;
          const alpha = 0.15 + depth * 0.55;

          // Outer glow
          const glowRadius = radius * 4;
          const grd = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, glowRadius
          );
          grd.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha * 0.3})`);
          grd.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // Core node
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
          ctx.fill();

          // Highlight dot (specular)
          if (depth > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
            ctx.fill();
          }
        }
      };

      drawNodes(points1, [59, 130, 246]);
      drawNodes(points2, [34, 211, 238]);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
