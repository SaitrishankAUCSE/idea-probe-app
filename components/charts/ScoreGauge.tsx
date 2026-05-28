"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 160 }: ScoreGaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Color logic based on score
  const getColor = () => {
    if (score >= 80) return "#10B981"; // success
    if (score >= 50) return "#F59E0B"; // warning
    return "#EF4444"; // danger
  };

  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow based on score color */}
      <div 
        className="absolute inset-0 rounded-full blur-[30px] opacity-20"
        style={{ backgroundColor: getColor() }}
      />
      
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Fill indicator */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}60)`
          }}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-foreground tracking-tighter">
          {Math.round(currentScore)}
        </span>
        <span className="text-xs text-foreground-tertiary font-medium uppercase tracking-widest mt-1">
          Score
        </span>
      </div>
    </div>
  );
}
