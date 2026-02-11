import { useMemo } from 'react';
import { 
  Building2, 
  Landmark,
  University,
  Factory,
  MapPin,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

/**
 * DistribucionCategoria
 * 
 * Componente para mostrar la distribución de entidades por nivel organizacional y categoría.
 */

// Configuración de categorías
const CATEGORIAS_CONFIG = {
  // Nivel Central
  MINISTERIO: { label: 'Ministerio', icon: Landmark, color: '#3b82f6' },
  UNIVERSIDAD: { label: 'Universidad', icon: University, color: '#8b5cf6' },
  DESCONCENTRADO: { label: 'Desconcentrado', icon: Building2, color: '#06b6d4' },
  EMPRESA_CENTRAL: { label: 'Empresa Central', icon: Factory, color: '#10b981' },
  DESCENTRALIZADO: { label: 'Descentralizado', icon: Building2, color: '#14b8a6' },
  // Nivel Territorial
  GOBERNACION: { label: 'Gobernación', icon: Landmark, color: '#f59e0b' },
  EMPRESA_GOBERNACION: { label: 'Empresa Gobernación', icon: Factory, color: '#f97316' },
  MUNICIPIO: { label: 'Municipio', icon: MapPin, color: '#ef4444' },
  EMPRESA_MUNICIPAL: { label: 'Empresa Municipal', icon: Factory, color: '#ec4899' },
  // Sin categoría
  'Sin categoría': { label: 'Sin categoría', icon: Building2, color: '#6b7280' }
};

const NIVELES_CONFIG = {
  CENTRAL: { label: 'Nivel Central', color: '#3b82f6', bgColor: 'bg-blue-500/10' },
  TERRITORIAL: { label: 'Nivel Territorial', color: '#f59e0b', bgColor: 'bg-amber-500/10' },
  'Sin nivel': { label: 'Sin nivel', color: '#6b7280', bgColor: 'bg-gray-500/10' }
};

/**
 * Barra de categoría
 */
const CategoriaBar = ({ categoria, cantidad, conCuadroDeMando, maxCantidad }) => {
  const config = CATEGORIAS_CONFIG[categoria] || CATEGORIAS_CONFIG['Sin categoría'];
  const Icon = config.icon;
  const widthPercent = maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="w-4 h-4 text-gray-400" style={{ color: config.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300 truncate">{config.label}</span>
          <span className="text-sm font-medium text-white ml-2">{cantidad}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${widthPercent}%`,
              backgroundColor: config.color
            }}
          />
        </div>
      </div>
      {conCuadroDeMando > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
          CM: {conCuadroDeMando}
        </span>
      )}
    </div>
  );
};

/**
 * Sección de nivel
 */
const NivelSection = ({ nivel, total, conCuadroDeMando, categorias, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = NIVELES_CONFIG[nivel] || NIVELES_CONFIG['Sin nivel'];
  
  // Encontrar la categoría con más entidades para escalar las barras
  const maxCantidad = useMemo(() => {
    return Math.max(...categorias.map(c => c.cantidad), 1);
  }, [categorias]);
  
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 ${config.bgColor} hover:bg-opacity-75 transition-colors`}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className="font-medium text-white">{config.label}</span>
          <span 
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {total} entidades
          </span>
        </div>
        {conCuadroDeMando > 0 && (
          <span className="text-xs text-purple-400">
            {conCuadroDeMando} en Cuadro de Mando
          </span>
        )}
      </button>
      
      {/* Contenido */}
      {expanded && (
        <div className="p-3 bg-bg-tertiary space-y-2">
          {categorias.map((cat, idx) => (
            <CategoriaBar 
              key={idx}
              categoria={cat.categoria}
              cantidad={cat.cantidad}
              conCuadroDeMando={cat.conCuadroDeMando}
              maxCantidad={maxCantidad}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Resumen visual tipo donut
 */
const ResumenDonut = ({ distribucion }) => {
  const total = useMemo(() => {
    return distribucion?.reduce((sum, n) => sum + n.total, 0) || 0;
  }, [distribucion]);
  
  const segments = useMemo(() => {
    if (!distribucion || total === 0) return [];
    
    let cumulative = 0;
    return distribucion.map(nivel => {
      const config = NIVELES_CONFIG[nivel.nivel] || NIVELES_CONFIG['Sin nivel'];
      const percent = (nivel.total / total) * 100;
      const start = cumulative;
      cumulative += percent;
      
      return {
        nivel: nivel.nivel,
        label: config.label,
        color: config.color,
        percent,
        start,
        total: nivel.total
      };
    });
  }, [distribucion, total]);
  
  return (
    <div className="flex items-center gap-6">
      {/* Donut chart simulado con bordes */}
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="18"
              cy="18"
              r="15.91549430918954"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={-seg.start + 25}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{total}</span>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="flex-1 space-y-1">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-gray-300">{seg.label}</span>
            </div>
            <span className="text-white font-medium">
              {seg.total} <span className="text-gray-500">({seg.percent.toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Componente principal
 */
const DistribucionCategoria = ({ distribucion, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!distribucion || distribucion.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-bg-secondary rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Distribución por Categoría</h3>
            <p className="text-sm text-gray-400">
              Nivel Central vs Territorial
            </p>
          </div>
        </div>
      </div>
      
      {/* Resumen */}
      <div className="mb-6 p-4 bg-bg-tertiary rounded-lg">
        <ResumenDonut distribucion={distribucion} />
      </div>
      
      {/* Detalle por nivel */}
      <div className="space-y-3">
        {distribucion.map((nivel, idx) => (
          <NivelSection 
            key={idx}
            nivel={nivel.nivel}
            total={nivel.total}
            conCuadroDeMando={nivel.conCuadroDeMando}
            categorias={nivel.categorias}
            defaultExpanded={idx === 0}
          />
        ))}
      </div>
    </div>
  );
};

export default DistribucionCategoria;
