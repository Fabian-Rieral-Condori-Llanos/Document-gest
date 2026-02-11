import { useMemo } from 'react';
import { 
  TrendingUp, 
  Building2, 
  FileCheck, 
  FileX,
  Award,
  BarChart3
} from 'lucide-react';

/**
 * NivelMadurezStats
 * 
 * Componente para mostrar estadísticas de nivel de madurez de las entidades.
 * Escala 1-5: Inicial, Básico, Intermedio, Avanzado, Óptimo
 */

// Configuración de niveles
const NIVELES_CONFIG = {
  1: { label: 'Inicial', color: '#ef4444', bgColor: 'bg-red-500/10', textColor: 'text-red-400' },
  2: { label: 'Básico', color: '#f97316', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400' },
  3: { label: 'Intermedio', color: '#eab308', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
  4: { label: 'Avanzado', color: '#22c55e', bgColor: 'bg-green-500/10', textColor: 'text-green-400' },
  5: { label: 'Óptimo', color: '#3b82f6', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400' },
  0: { label: 'Sin asignar', color: '#6b7280', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400' }
};

/**
 * Barra de progreso para un nivel
 */
const NivelBar = ({ nivel, cantidad, porcentaje, total }) => {
  const config = NIVELES_CONFIG[nivel] || NIVELES_CONFIG[0];
  const widthPercent = total > 0 ? (cantidad / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Indicador de nivel */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.bgColor}`}>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {nivel === 0 ? '?' : nivel}
        </span>
      </div>
      
      {/* Label */}
      <div className="w-24">
        <span className="text-sm text-gray-300">{config.label}</span>
      </div>
      
      {/* Barra de progreso */}
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${widthPercent}%`,
            backgroundColor: config.color
          }}
        />
      </div>
      
      {/* Cantidad y porcentaje */}
      <div className="w-20 text-right">
        <span className="text-sm font-medium text-white">{cantidad}</span>
        <span className="text-xs text-gray-400 ml-1">({porcentaje}%)</span>
      </div>
    </div>
  );
};

/**
 * Card de promedio de madurez
 */
const PromedioCard = ({ promedio, label, totalEvaluadas }) => {
  const nivelRedondeado = Math.round(promedio) || 0;
  const config = NIVELES_CONFIG[nivelRedondeado] || NIVELES_CONFIG[0];
  
  // Calcular posición en la escala (0-100%)
  const positionPercent = promedio > 0 ? ((promedio - 1) / 4) * 100 : 0;
  
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-400" />
          <span className="text-sm font-medium text-gray-300">Promedio de Madurez</span>
        </div>
        <span className="text-xs text-gray-500">{totalEvaluadas} evaluadas</span>
      </div>
      
      {/* Valor grande */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl font-bold ${config.textColor}`}>
          {promedio > 0 ? promedio.toFixed(1) : '-'}
        </span>
        <span className="text-lg text-gray-400">/ 5</span>
        <span className={`text-sm ${config.textColor}`}>({label})</span>
      </div>
      
      {/* Escala visual */}
      <div className="relative h-2 bg-gray-700 rounded-full">
        {/* Gradiente de fondo */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6)'
          }}
        />
        
        {/* Indicador de posición */}
        {promedio > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 transition-all duration-500"
            style={{ 
              left: `calc(${positionPercent}% - 8px)`,
              borderColor: config.color
            }}
          />
        )}
      </div>
      
      {/* Labels de escala */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">1</span>
        <span className="text-xs text-gray-500">2</span>
        <span className="text-xs text-gray-500">3</span>
        <span className="text-xs text-gray-500">4</span>
        <span className="text-xs text-gray-500">5</span>
      </div>
    </div>
  );
};

/**
 * Card de documentación
 */
const DocumentacionCard = ({ documentacion }) => {
  const items = [
    { label: 'Con PISI', value: documentacion?.conPisi || 0, percent: documentacion?.porcentajePisi || 0, icon: FileCheck },
    { label: 'Sin PISI', value: documentacion?.sinPisi || 0, percent: 100 - (documentacion?.porcentajePisi || 0), icon: FileX },
    { label: 'Con Plan Contingencia', value: documentacion?.conPlanContingencia || 0, percent: documentacion?.porcentajePlanContingencia || 0, icon: FileCheck },
  ];
  
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary-400" />
        <span className="text-sm font-medium text-gray-300">Documentación</span>
      </div>
      
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.label.includes('Sin') ? 'text-red-400' : 'text-green-400'}`} />
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{item.value}</span>
              <span className="text-xs text-gray-500">({parseFloat(item.percent).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Componente principal
 */
const NivelMadurezStats = ({ companyStats, loading = false }) => {
  const { porNivelMadurez, promedioMadurez, documentacion, totalEntidades } = companyStats || {};
  
  // Calcular total para porcentajes de barras
  const totalConNivel = useMemo(() => {
    if (!porNivelMadurez) return 0;
    return porNivelMadurez.reduce((sum, n) => sum + (n.cantidad || 0), 0);
  }, [porNivelMadurez]);
  
  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!companyStats) {
    return null;
  }
  
  return (
    <div className="bg-bg-secondary rounded-xl p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Nivel de Madurez</h3>
            <p className="text-sm text-gray-400">
              {totalEntidades} entidades · Escala 1-5
            </p>
          </div>
        </div>
      </div>
      
      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Distribución por nivel */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Distribución por Nivel</h4>
          {porNivelMadurez?.filter(n => n.nivel !== 0).map((nivel) => (
            <NivelBar 
              key={nivel.nivel}
              nivel={nivel.nivel}
              cantidad={nivel.cantidad}
              porcentaje={nivel.porcentaje}
              total={totalConNivel}
            />
          ))}
          
          {/* Sin asignar */}
          {porNivelMadurez?.find(n => n.nivel === 0)?.cantidad > 0 && (
            <NivelBar 
              nivel={0}
              cantidad={porNivelMadurez.find(n => n.nivel === 0).cantidad}
              porcentaje={porNivelMadurez.find(n => n.nivel === 0).porcentaje}
              total={totalConNivel}
            />
          )}
        </div>
        
        {/* Columna derecha: Promedio y documentación */}
        <div className="space-y-4">
          <PromedioCard 
            promedio={promedioMadurez?.promedio || 0}
            label={promedioMadurez?.label || 'Sin datos'}
            totalEvaluadas={promedioMadurez?.totalEvaluadas || 0}
          />
          
          <DocumentacionCard documentacion={documentacion} />
        </div>
      </div>
    </div>
  );
};

export default NivelMadurezStats;
