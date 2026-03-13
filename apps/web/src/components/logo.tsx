"use client";

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function Logo({ size = 48, className = "", animated = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Градиенты */}
        <linearGradient id="diskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        
        <linearGradient id="diskGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        <linearGradient id="wrenchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {/* Фильтр свечения */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Внешнее свечение */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="url(#diskGradient)"
        strokeWidth="0.5"
        opacity="0.3"
        className={animated ? "animate-pulse" : ""}
        style={{ animationDuration: "3s" }}
      />

      {/* Основной диск HDD */}
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="#0f172a"
        stroke="url(#diskGradient)"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Внутренний круг диска */}
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="url(#diskGradientDark)"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Спираль дорожек диска */}
      <path
        d="M32 20 A12 12 0 0 1 44 32 A8 8 0 0 1 36 40 A4 4 0 0 1 32 36"
        fill="none"
        stroke="url(#diskGradientDark)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        className={animated ? "origin-center" : ""}
        style={animated ? { animation: "spin 8s linear infinite" } : {}}
      />

      {/* Центральная ось диска */}
      <circle cx="32" cy="32" r="4" fill="#1e293b" stroke="url(#wrenchGradient)" strokeWidth="2" />
      <circle cx="32" cy="32" r="2" fill="url(#wrenchGradient)" />

      {/* Гаечный ключ */}
      <g transform="translate(32, 32) rotate(-45) translate(-32, -32)">
        {/* Ручка ключа */}
        <rect
          x="30"
          y="8"
          width="4"
          height="20"
          rx="1"
          fill="url(#wrenchGradient)"
          filter="url(#glow)"
        />
        {/* Головка ключа */}
        <path
          d="M26 28h12v6c0 2-1.5 4-3 4h-6c-1.5 0-3-2-3-4v-6z"
          fill="url(#wrenchGradient)"
          filter="url(#glow)"
        />
        {/* Внутренность головки */}
        <path
          d="M29 30h6v4c0 1-0.5 2-1.5 2h-3c-1 0-1.5-1-1.5-2v-4z"
          fill="#0f172a"
        />
      </g>

      {/* Стрелки восстановления данных */}
      <g opacity="0.8">
        {/* Верхняя стрелка */}
        <path
          d="M32 4 L34 8 L30 8 Z"
          fill="url(#wrenchGradient)"
          style={animated ? { animation: "pulse 2s ease-in-out infinite" } : {}}
        />
        <line x1="32" y1="8" x2="32" y2="14" stroke="url(#wrenchGradient)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Правая стрелка */}
        <path
          d="M60 32 L56 34 L56 30 Z"
          fill="url(#wrenchGradient)"
          style={animated ? { animation: "pulse 2s ease-in-out infinite 0.5s" } : {}}
        />
        <line x1="56" y1="32" x2="50" y2="32" stroke="url(#wrenchGradient)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Нижняя стрелка */}
        <path
          d="M32 60 L30 56 L34 56 Z"
          fill="url(#wrenchGradient)"
          style={animated ? { animation: "pulse 2s ease-in-out infinite 1s" } : {}}
        />
        <line x1="32" y1="56" x2="32" y2="50" stroke="url(#wrenchGradient)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Левая стрелка */}
        <path
          d="M4 32 L8 30 L8 34 Z"
          fill="url(#wrenchGradient)"
          style={animated ? { animation: "pulse 2s ease-in-out infinite 1.5s" } : {}}
        />
        <line x1="8" y1="32" x2="14" y2="32" stroke="url(#wrenchGradient)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Точки данных */}
      <circle cx="20" cy="20" r="1.5" fill="#22d3ee" opacity="0.8" />
      <circle cx="44" cy="20" r="1.5" fill="#22d3ee" opacity="0.6" />
      <circle cx="20" cy="44" r="1.5" fill="#22d3ee" opacity="0.7" />
      <circle cx="44" cy="44" r="1.5" fill="#22d3ee" opacity="0.5" />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </svg>
  );
}

// Упрощённая версия логотипа для favicon/маленьких размеров
export function LogoSimple({ size = 32, className = "" }: Omit<LogoProps, "animated">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="simpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="wrenchSimple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      
      <circle cx="32" cy="32" r="28" fill="#0f172a" stroke="url(#simpleGradient)" strokeWidth="3" />
      <circle cx="32" cy="32" r="4" fill="#1e293b" stroke="url(#wrenchSimple)" strokeWidth="2" />
      
      {/* Упрощённый ключ */}
      <g transform="translate(32, 32) rotate(-45) translate(-32, -32)">
        <rect x="30" y="10" width="4" height="18" rx="1" fill="url(#wrenchSimple)" />
        <path d="M26 28h12v6c0 2-1.5 4-3 4h-6c-1.5 0-3-2-3-4v-6z" fill="url(#wrenchSimple)" />
      </g>
    </svg>
  );
}

// Текстовый логотип
interface LogoTextProps {
  showIcon?: boolean;
  iconSize?: number;
  className?: string;
}

export function LogoText({ showIcon = true, iconSize = 40, className = "" }: LogoTextProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && <Logo size={iconSize} />}
      <div className="flex flex-col">
        <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          RECOVERY.UZ
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
          Data Recovery Service
        </span>
      </div>
    </div>
  );
}
