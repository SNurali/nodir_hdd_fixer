"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export function CyberBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const drawGrid = () => {
      const gridSize = 50;
      ctx.strokeStyle = isDark 
        ? "rgba(14, 165, 233, 0.03)" 
        : "rgba(14, 165, 233, 0.05)";
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const drawParticles = () => {
      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(14, 165, 233, ${particle.opacity})`
          : `rgba(99, 102, 241, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = isDark
              ? `rgba(14, 165, 233, ${0.1 * (1 - distance / 150)})`
              : `rgba(99, 102, 241, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Canvas for particles and grid */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.8 }}
      />

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px]">
        <div 
          className={`w-full h-full rounded-full blur-[120px] animate-pulse ${
            isDark 
              ? "bg-gradient-to-br from-sky-500/20 via-indigo-500/10 to-purple-500/20" 
              : "bg-gradient-to-br from-sky-300/30 via-indigo-300/20 to-purple-300/30"
          }`}
          style={{ animationDuration: "4s" }}
        />
      </div>

      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px]">
        <div 
          className={`w-full h-full rounded-full blur-[100px] animate-pulse ${
            isDark 
              ? "bg-gradient-to-tr from-purple-500/15 via-pink-500/10 to-sky-500/15" 
              : "bg-gradient-to-tr from-purple-300/25 via-pink-300/20 to-sky-300/25"
          }`}
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
      </div>

      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px]">
        <div 
          className={`w-full h-full rounded-full blur-[80px] animate-pulse ${
            isDark 
              ? "bg-gradient-to-br from-cyan-500/10 to-emerald-500/10" 
              : "bg-gradient-to-br from-cyan-300/20 to-emerald-300/20"
          }`}
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      {/* Tech Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// Simplified background for auth pages
export function CyberBackgroundSimple() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px]">
        <div 
          className={`w-full h-full rounded-full blur-[100px] ${
            isDark 
              ? "bg-gradient-to-br from-sky-500/25 via-indigo-500/15 to-purple-500/25" 
              : "bg-gradient-to-br from-sky-300/40 via-indigo-300/30 to-purple-300/40"
          }`}
        />
      </div>

      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px]">
        <div 
          className={`w-full h-full rounded-full blur-[80px] ${
            isDark 
              ? "bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-sky-500/20" 
              : "bg-gradient-to-tr from-purple-300/30 via-pink-300/25 to-sky-300/30"
          }`}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className={`absolute inset-0 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`}
        style={{
          backgroundImage: `
            linear-gradient(${isDark ? 'rgba(14, 165, 233, 0.5)' : 'rgba(99, 102, 241, 0.5)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? 'rgba(14, 165, 233, 0.5)' : 'rgba(99, 102, 241, 0.5)'} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

// Animated binary/data stream background
export function DataStreamBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      // Render every 2nd frame for performance
      if (frameCount % 2 !== 0) {
        requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = isDark 
        ? "rgba(2, 6, 23, 0.05)" 
        : "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = isDark ? "#0ea5e9" : "#6366f1";
      ctx.font = "14px monospace";

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 20;
        ctx.fillText(char, x, y * 20);

        if (y * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ opacity: isDark ? 0.15 : 0.08 }}
    />
  );
}
