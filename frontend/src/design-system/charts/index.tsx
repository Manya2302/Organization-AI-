import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, RadialBarChart, RadialBar
} from 'recharts';

// ─── AREA CHART (TRENDS) ──────────────────────────────────────
interface AreaChartProps {
  data: any[];
  dataKeys: string[];
  colors: string[];
  xKey: string;
  height?: number;
}

export const PremiumAreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKeys,
  colors,
  xKey,
  height = 200
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {dataKeys.map((key, i) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i]} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={colors[i]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#161a29" />
          <XAxis dataKey={xKey} stroke="#4a5875" fontSize={10} />
          <YAxis stroke="#4a5875" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#080d1a', borderColor: '#161a29', borderRadius: '12px' }}
            labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
            itemStyle={{ fontSize: '10px' }}
          />
          {dataKeys.map((key, i) => (
            <Area 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={colors[i]} 
              fillOpacity={1} 
              fill={`url(#grad-${key})`} 
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── BAR CHART (BAR GRAPHS) ──────────────────────────────────
interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

export const PremiumBarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#2563eb',
  height = 200
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#161a29" />
          <XAxis dataKey={xKey} stroke="#4a5875" fontSize={10} />
          <YAxis stroke="#4a5875" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#080d1a', borderColor: '#161a29', borderRadius: '12px' }}
            labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
            itemStyle={{ fontSize: '10px' }}
          />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── RADIAL BAR CHART (READINESS DIAL) ─────────────────────────
interface RadialChartProps {
  score: number;
  label: string;
  color?: string;
  height?: number;
}

export const PremiumRadialChart: React.FC<RadialChartProps> = ({
  score,
  label,
  color = '#06b6d4',
  height = 180
}) => {
  const data = [
    {
      name: label,
      value: score,
      fill: color,
    }
  ];

  return (
    <div style={{ width: '100%', height }} className="relative flex items-center justify-center">
      <ResponsiveContainer>
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="70%" 
          outerRadius="90%" 
          barSize={10} 
          data={data}
          startAngle={180}
          endAngle={-180}
        >
          <RadialBar
            background={{ fill: '#1a2540' }}
            dataKey="value"
            cornerRadius={5}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{score}%</span>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};
