import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  ChevronDown, BarChart3, PieChartIcon, TrendingUp, 
  Activity, Target, Loader2 
} from 'lucide-react';

/**
 * DistributionChart - Componente flexible para mostrar distribuciones
 * 
 * Soporta múltiples fuentes de datos y tipos de gráficos intercambiables
 * 
 * @param {Object} props
 * @param {Object} props.dataSources - Objeto con las diferentes fuentes de datos
 *   { procedimiento: [...], alcance: [...], tipo: [...] }
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.title - Título del componente
 */
const DistributionChart = ({
  dataSources = {},
  loading = false,
  title = 'Distribución de Evaluaciones',
  defaultSource = 'procedimiento',
  defaultChartType = 'bar',
}) => {
  const [selectedSource, setSelectedSource] = useState(defaultSource);
  const [chartType, setChartType] = useState(defaultChartType);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showChartDropdown, setShowChartDropdown] = useState(false);

  // Definir fuentes de datos disponibles
  const sourceOptions = [
    { key: 'procedimiento', label: 'Por Procedimiento', dataKey: 'tipo' },
    { key: 'alcance', label: 'Por Alcance', dataKey: 'alcance' },
    { key: 'estado', label: 'Por Estado', dataKey: 'estado' },
    { key: 'tipo', label: 'Por Tipo de Evaluación', dataKey: 'tipoEvaluacion' },
  ];

  // Tipos de gráficos disponibles
  const chartTypes = [
    { key: 'bar', label: 'Barras Horizontal', icon: BarChart3 },
    { key: 'barVertical', label: 'Barras Vertical', icon: BarChart3 },
    { key: 'pie', label: 'Circular (Pie)', icon: PieChartIcon },
    { key: 'donut', label: 'Donut', icon: PieChartIcon },
    { key: 'line', label: 'Líneas', icon: TrendingUp },
    { key: 'area', label: 'Área', icon: Activity },
    { key: 'radar', label: 'Radar', icon: Target },
  ];

  // Obtener datos según la fuente seleccionada
  const currentData = useMemo(() => {
    console.log('Selected Source:', dataSources);
    console.log('Selected Source Key:', selectedSource);
    switch (selectedSource) {
        case 'procedimiento':
            return dataSources.evaluacionesPorProcedimiento || [];
        case 'alcance':
            return dataSources.evaluacionesPorAlcance || [];
        case 'estado':
            return dataSources.evaluacionesPorEstado || [];
        case 'tipo':
            return dataSources.evaluacionesPorTipo || [];
        default:
        return [];
    }
  }, [selectedSource, dataSources]);

  const ORDER = ['EVALUANDO', 'PENDIENTE', 'COMPLETADO'];

  // Normalizar datos para los gráficos
  const normalizedData = useMemo(() => {
    const sortedData = [...currentData].sort((a, b) => {
        const nameA = a.estado || '';
        const nameB = b.estado || '';

        return ORDER.indexOf(nameA) - ORDER.indexOf(nameB);
    });

    const colorPalette = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ef4444', // Red
        '#14b8a6', // Teal
    ];
    
    return sortedData.map((item, index) => ({
      name: item.tipo || item.alcance || item.estado || item.name || `Item ${index + 1}`,
      value: item.cantidad || item.value || 0,
      color: item.color || colorPalette[index % colorPalette.length],
    }));
  }, [currentData]);

  // Calcular total
  const total = useMemo(() => {
    return normalizedData.reduce((sum, item) => sum + item.value, 0);
  }, [normalizedData]);

  // Obtener label de fuente actual
  const currentSourceLabel = sourceOptions.find(s => s.key === selectedSource)?.label || 'Seleccionar';
  const currentChartLabel = chartTypes.find(c => c.key === chartType)?.label || 'Seleccionar';
  const CurrentChartIcon = chartTypes.find(c => c.key === chartType)?.icon || BarChart3;

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-secondary border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium text-sm">{data.name}</p>
          <p className="text-gray-400 text-xs mt-1">
            Cantidad: <span className="text-white font-semibold">{data.value}</span>
          </p>
          <p className="text-gray-500 text-xs">
            {((data.value / total) * 100).toFixed(1)}% del total
          </p>
        </div>
      );
    }
    return null;
  };

  // Renderizar gráfico según el tipo seleccionado
  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-500" />
        </div>
      );
    }

    if (normalizedData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          Sin datos disponibles
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#6b7280" fontSize={11} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#6b7280" 
                fontSize={10} 
                width={120} 
                tickLine={false}
                tick={({ x, y, payload }) => (
                  <text x={x} y={y} dy={4} textAnchor="end" fill="#9ca3af" fontSize={10}>
                    {payload.value.length > 18 ? `${payload.value.substring(0, 18)}...` : payload.value}
                  </text>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'barVertical':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalizedData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={({ x, y, payload }) => (
                  <text x={x} y={y} dy={10} textAnchor="end" fill="#9ca3af" fontSize={9} transform={`rotate(-45, ${x}, ${y})`}>
                    {payload.value.length > 12 ? `${payload.value.substring(0, 12)}...` : payload.value}
                  </text>
                )}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <div className="flex items-center h-full">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={normalizedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {normalizedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-32 space-y-1.5 pr-2">
              {normalizedData.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-[10px] text-gray-400 truncate flex-1" title={item.name}>
                    {item.name.length > 12 ? `${item.name.substring(0, 12)}...` : item.name}
                  </span>
                  <span className="text-[10px] text-white font-medium">{item.value}</span>
                </div>
              ))}
              {normalizedData.length > 6 && (
                <div className="text-[10px] text-gray-500">+{normalizedData.length - 6} más</div>
              )}
            </div>
          </div>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={normalizedData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={normalizedData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis 
                dataKey="name" 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 'auto']} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
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
              <span className="max-w-[100px] truncate">{currentSourceLabel}</span>
              <ChevronDown size={14} className={`transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSourceDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSourceDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 min-w-[160px] py-1">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSelectedSource(option.key);
                        setShowSourceDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-secondary transition-colors ${
                        selectedSource === option.key ? 'text-primary-400 bg-primary-500/10' : 'text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
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
              <CurrentChartIcon size={14} />
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

      {/* Chart container */}
      <div className="h-60">
        {renderChart()}
      </div>
    </div>
  );
};

export default DistributionChart;