"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarChartProps {
  data: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-light p-3 rounded-lg border border-white/10 shadow-xl">
        <p className="font-semibold text-foreground text-sm mb-1">{payload[0].payload.subject}</p>
        <p className="text-primary-light font-bold text-lg">{payload[0].value}/10</p>
      </div>
    );
  }
  return null;
};

export function RadarChart({ data }: RadarChartProps) {
  return (
    <div className="w-full h-[300px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#A1A1AA", fontSize: 12, fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]} 
            tick={false} 
            axisLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Radar
            name="Startup Viability"
            dataKey="A"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorUv)"
            fillOpacity={0.5}
          />
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
