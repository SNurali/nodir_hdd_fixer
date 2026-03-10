"use client";

import React, { useEffect, useMemo, useState } from "react";

const MATRIX_EFFECT_STORAGE_KEY = "matrix_effect_enabled";

type MatrixColumn = {
  id: string;
  left: string;
  duration: number;
  delay: number;
  text: string;
};

function createColumn(index: number, total: number): MatrixColumn {
  const chars = "010101001101001011010010101001100101";
  let text = "";
  for (let i = 0; i < 120; i += 1) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    text += `${char}\n`;
  }

  return {
    id: `matrix-col-${index}`,
    left: `${(index / total) * 100}%`,
    duration: 14 + Math.floor(Math.random() * 12),
    delay: Math.floor(Math.random() * 18) * -1,
    text,
  };
}

export default function MatrixRainBackground() {
  const [count, setCount] = useState(16);
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 0);
    const saved = localStorage.getItem(MATRIX_EFFECT_STORAGE_KEY);
    const enabledTimer = window.setTimeout(() => setEnabled(saved !== "0"), 0);

    const updateCount = () => {
      if (window.innerWidth < 640) {
        setCount(8);
        return;
      }
      if (window.innerWidth < 1024) {
        setCount(12);
        return;
      }
      setCount(22);
    };

    const handleMatrixChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setEnabled(customEvent.detail.enabled);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === MATRIX_EFFECT_STORAGE_KEY) {
        setEnabled(event.newValue !== "0");
      }
    };

    updateCount();
    window.addEventListener("matrix-effect-change", handleMatrixChange as EventListener);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("resize", updateCount);
    return () => {
      window.clearTimeout(mountTimer);
      window.clearTimeout(enabledTimer);
      window.removeEventListener("matrix-effect-change", handleMatrixChange as EventListener);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("resize", updateCount);
    };
  }, []);

  const columns = useMemo(() => {
    if (!mounted) {
      return [];
    }
    return Array.from({ length: count }, (_, i) => createColumn(i, count));
  }, [count, mounted]);

  if (!mounted || !enabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_62%)] dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_62%)]" />

      {columns.map((column) => (
        <div
          key={column.id}
          className="matrix-rain-column mix-blend-screen text-[12px] text-emerald-500/20 dark:text-emerald-400/32"
          style={{
            left: column.left,
            animationDuration: `${column.duration}s`,
            animationDelay: `${column.delay}s`,
          }}
        >
          {column.text}
        </div>
      ))}
    </div>
  );
}
