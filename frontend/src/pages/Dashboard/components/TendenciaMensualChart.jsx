/**
 * TendenciaMensualChart.jsx
 * 
 * Gráfico de tendencia mensual de evaluaciones, vulnerabilidades y remediaciones.
 */

import { AreaChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const TendenciaMensualChart = ({ data = [], loading = false, title = 'Tendencia Mensual' }) => {
  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Evals
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Vulns
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Remed
          </span>
        </div>
      </div>
      <div className="h-60">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Sin datos de tendencia
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="mes" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  background: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '12px' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="vulnerabilidades" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorVuln)" 
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="remediadas" 
                stroke="#22c55e" 
                fillOpacity={1} 
                fill="url(#colorRem)" 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="evaluaciones" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TendenciaMensualChart;
