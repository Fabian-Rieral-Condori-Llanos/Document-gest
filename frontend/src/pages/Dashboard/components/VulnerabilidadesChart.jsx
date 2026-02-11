import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  ChevronDown, PieChartIcon, BarChart3, Activity, Target,
  Loader2, Shield, CheckCircle, XCircle, AlertTriangle, Clock
} from 'lucide-react';

/**
 * VulnerabilidadesChart - Componente flexible para vulnerabilidades y verificaciones
 * 
 * Muestra datos de:
 * - Vulnerabilidades por Severidad
 * - Estado de Verificación (remediadas, no remediadas, parciales, sin verificar)
 * 
 * Con múltiples tipos de gráficos intercambiables
 */
const VulnerabilidadesChart = ({
  vulnerabilidadesPorSeveridad = [],
  verificacion = {},
  loading = false,
  title = 'Análisis de Vulnerabilidades',
}) => {
  const [selectedSource, setSelectedSource] = useState('severidad');
  const [chartType, setChartType] = useState('donut');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showChartDropdown, setShowChartDropdown] = useState(false);

  // Opciones de fuente de datos
  const sourceOptions = [
    { key: 'severidad', label: 'Por Severidad', icon: AlertTriangle },
    { key: 'verificacion', label: 'Estado Verificación', icon: CheckCircle },
  ];

  // Tipos de gráficos disponibles
  const chartTypes = [
    { key: 'donut', label: 'Donut', icon: PieChartIcon },
    { key: 'pie', label: 'Circular', icon: PieChartIcon },
    { key: 'bar', label: 'Barras Horizontal', icon: BarChart3 },
    { key: 'barVertical', label: 'Barras Vertical', icon: BarChart3 },
    { key: 'radar', label: 'Radar', icon: Target },
  ];

  // Preparar datos de verificación
  const verificacionData = useMemo(() => {
    if (!verificacion || Object.keys(verificacion).length === 0) {
      return [];
    }
    
    return [
      { 
        name: 'Remediadas', 
        value: verificacion.remediadas || 0, 
        color: '#22c55e',
        icon: CheckCircle
      },
      { 
        name: 'No Remediadas', 
        value: verificacion.noRemediadas || 0, 
        color: '#ef4444',
        icon: XCircle
      },
      { 
        name: 'Parciales', 
        value: verificacion.parciales || 0, 
        color: '#f59e0b',
        icon: AlertTriangle
      },
      { 
        name: 'Sin Verificar', 
        value: verificacion.sinVerificar || 0, 
        color: '#6b7280',
        icon: Clock
      },
    ].filter(item => item.value > 0 || selectedSource === 'verificacion');
  }, [verificacion, selectedSource]);

  // Datos según la fuente seleccionada
  const currentData = useMemo(() => {
    if (selectedSource === 'severidad') {
      return vulnerabilidadesPorSeveridad.map(item => ({
        name: item.name,
        value: item.value || 0,
        color: item.color || '#6b7280',
      }));
    }
    return verificacionData;
  }, [selectedSource, vulnerabilidadesPorSeveridad, verificacionData]);

  // Total
  const total = useMemo(() => {
    return currentData.reduce((sum, item) => sum + item.value, 0);
  }, [currentData]);

  // Stats de verificación para mostrar
  const verificacionStats = useMemo(() => {
    if (!verificacion) return null;
    const totalVerif = verificacion.totalVerificadas || 0;
    const remediadas = verificacion.remediadas || 0;
    const tasaExito = totalVerif > 0 ? Math.round((remediadas / totalVerif) * 100) : 0;
    
    return {
      totalVerificadas: totalVerif,
      tasaExito,
    };
  }, [verificacion]);

  // Labels actuales
  const currentSourceOption = sourceOptions.find(s => s.key === selectedSource);
  const currentChartOption = chartTypes.find(c => c.key === chartType);
  const SourceIcon = currentSourceOption?.icon || AlertTriangle;
  const ChartIcon = currentChartOption?.icon || PieChartIcon;

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-bg-secondary border border-gray-700 rounded-lg p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-white font-medium text-sm">{data.name}</span>
          </div>
          <p className="text-gray-400 text-xs">
            Cantidad: <span className="text-white font-semibold">{data.value}</span>
          </p>
          <p className="text-gray-500 text-xs">
            {percentage}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Renderizar gráfico
  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-500" />
        </div>
      );
    }

    if (currentData.length === 0 || total === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <Shield size={40} className="mb-2 opacity-50" />
          <span className="text-sm">Sin datos disponibles</span>
        </div>
      );
    }

    switch (chartType) {
      case 'donut':
        return (
          <div className="flex items-center h-full">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-28 space-y-1.5 pr-2">
              {currentData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-[10px] text-gray-400 truncate flex-1" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name.substring(0, 8)}${name.length > 8 ? '..' : ''} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal vertical={false} />
              <XAxis type="number" stroke="#6b7280" fontSize={11} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#6b7280" 
                fontSize={10} 
                width={80}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'barVertical':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentData} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={9}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={currentData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis 
                dataKey="name" 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 'auto']} 
                tick={{ fill: '#6b7280', fontSize: 9 }}
              />
              <Radar
                name="Cantidad"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.4}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-bg-secondary rounded-xl border border-gray-800 p-5">
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        
        <div className="flex items-center gap-2">
          {/* Selector de fuente de datos */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowChartDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-gray-600 transition-colors"
            >
              <SourceIcon size={14} />
              <span className="max-w-[90px] truncate hidden sm:inline">{currentSourceOption?.label}</span>
              <ChevronDown size={14} className={`transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSourceDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSourceDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 min-w-[180px] py-1">
                  {sourceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSelectedSource(option.key);
                          setShowSourceDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-secondary transition-colors ${
                          selectedSource === option.key ? 'text-primary-400 bg-primary-500/10' : 'text-gray-300'
                        }`}
                      >
                        <Icon size={14} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Selector de tipo de gráfico */}
          <div className="relative">
            <button
              onClick={() => {
                setShowChartDropdown(!showChartDropdown);
                setShowSourceDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-gray-600 transition-colors"
            >
              <ChartIcon size={14} />
              <ChevronDown size={14} className={`transition-transform ${showChartDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showChartDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChartDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 min-w-[160px] py-1">
                  {chartTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.key}
                        onClick={() => {
                          setChartType(type.key);
                          setShowChartDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-secondary transition-colors ${
                          chartType === type.key ? 'text-primary-400 bg-primary-500/10' : 'text-gray-300'
                        }`}
                      >
                        <Icon size={14} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Total badge */}
          <span className="px-2 py-1 bg-bg-tertiary text-xs text-gray-400 rounded-lg">
            {total} total
          </span>
        </div>
      </div>

      {/* Stats de verificación si está seleccionado */}
      {selectedSource === 'verificacion' && verificacionStats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-bg-tertiary rounded-lg p-2.5 border border-gray-700">
            <div className="text-lg font-bold text-white">{verificacionStats.totalVerificadas}</div>
            <div className="text-[10px] text-gray-400">Total Verificadas</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-2.5 border border-gray-700">
            <div className={`text-lg font-bold ${verificacionStats.tasaExito >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {verificacionStats.tasaExito}%
            </div>
            <div className="text-[10px] text-gray-400">Tasa de Éxito</div>
          </div>
        </div>
      )}

      {/* Chart container */}
      <div className={selectedSource === 'verificacion' && verificacionStats ? 'h-44' : 'h-60'}>
        {renderChart()}
      </div>
    </div>
  );
};

export default VulnerabilidadesChart;