import { useState, useMemo } from 'react';
import { Calculator, X, Check } from 'lucide-react';
import Button from '../Button/Button';
import Card from '../Card/Card';

/**
 * CVSS 3.1 Calculator Component
 * Implementación oficial del algoritmo CVSS 3.1 según FIRST
 * https://www.first.org/cvss/v3.1/specification-document
 */

// Definición de métricas CVSS 3.1 con valores oficiales
const CVSS31_METRICS = {
  AV: {
    name: 'Attack Vector',
    label: 'Vector de Ataque',
    options: [
      { value: 'N', label: 'Network', short: 'Red', score: 0.85 },
      { value: 'A', label: 'Adjacent', short: 'Adyacente', score: 0.62 },
      { value: 'L', label: 'Local', short: 'Local', score: 0.55 },
      { value: 'P', label: 'Physical', short: 'Físico', score: 0.2 },
    ],
  },
  AC: {
    name: 'Attack Complexity',
    label: 'Complejidad del Ataque',
    options: [
      { value: 'L', label: 'Low', short: 'Baja', score: 0.77 },
      { value: 'H', label: 'High', short: 'Alta', score: 0.44 },
    ],
  },
  PR: {
    name: 'Privileges Required',
    label: 'Privilegios Requeridos',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno', scopeUnchanged: 0.85, scopeChanged: 0.85 },
      { value: 'L', label: 'Low', short: 'Bajos', scopeUnchanged: 0.62, scopeChanged: 0.68 },
      { value: 'H', label: 'High', short: 'Altos', scopeUnchanged: 0.27, scopeChanged: 0.50 },
    ],
  },
  UI: {
    name: 'User Interaction',
    label: 'Interacción del Usuario',
    options: [
      { value: 'N', label: 'None', short: 'Ninguna', score: 0.85 },
      { value: 'R', label: 'Required', short: 'Requerida', score: 0.62 },
    ],
  },
  S: {
    name: 'Scope',
    label: 'Alcance',
    options: [
      { value: 'U', label: 'Unchanged', short: 'Sin cambios' },
      { value: 'C', label: 'Changed', short: 'Cambiado' },
    ],
  },
  C: {
    name: 'Confidentiality',
    label: 'Confidencialidad',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno', score: 0 },
      { value: 'L', label: 'Low', short: 'Bajo', score: 0.22 },
      { value: 'H', label: 'High', short: 'Alto', score: 0.56 },
    ],
  },
  I: {
    name: 'Integrity',
    label: 'Integridad',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno', score: 0 },
      { value: 'L', label: 'Low', short: 'Bajo', score: 0.22 },
      { value: 'H', label: 'High', short: 'Alto', score: 0.56 },
    ],
  },
  A: {
    name: 'Availability',
    label: 'Disponibilidad',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno', score: 0 },
      { value: 'L', label: 'Low', short: 'Bajo', score: 0.22 },
      { value: 'H', label: 'High', short: 'Alto', score: 0.56 },
    ],
  },
};

/**
 * Función de redondeo oficial CVSS 3.1 (Roundup)
 * Redondea hacia arriba al decimal más cercano
 */
const roundUp = (value) => {
  const intInput = Math.round(value * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
};

/**
 * Calcular score CVSS 3.1 según especificación oficial de FIRST
 */
const calculateCVSS31Score = (metrics) => {
  const { AV, AC, PR, UI, S, C, I, A } = metrics;
  
  // Verificar que todas las métricas estén presentes
  if (!AV || !AC || !PR || !UI || !S || !C || !I || !A) {
    return { score: 0, severity: 'None' };
  }

  // Obtener valores de las métricas
  const avMetric = CVSS31_METRICS.AV.options.find(o => o.value === AV);
  const acMetric = CVSS31_METRICS.AC.options.find(o => o.value === AC);
  const prMetric = CVSS31_METRICS.PR.options.find(o => o.value === PR);
  const uiMetric = CVSS31_METRICS.UI.options.find(o => o.value === UI);
  const cMetric = CVSS31_METRICS.C.options.find(o => o.value === C);
  const iMetric = CVSS31_METRICS.I.options.find(o => o.value === I);
  const aMetric = CVSS31_METRICS.A.options.find(o => o.value === A);

  if (!avMetric || !acMetric || !prMetric || !uiMetric || !cMetric || !iMetric || !aMetric) {
    return { score: 0, severity: 'None' };
  }

  // Obtener valor de PR basado en Scope
  const prValue = S === 'C' ? prMetric.scopeChanged : prMetric.scopeUnchanged;

  // Calcular ISS (Impact Sub Score)
  const iss = 1 - ((1 - cMetric.score) * (1 - iMetric.score) * (1 - aMetric.score));

  // Calcular Impact según Scope
  let impact;
  if (S === 'U') {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  // Calcular Exploitability
  const exploitability = 8.22 * avMetric.score * acMetric.score * prValue * uiMetric.score;

  // Calcular Base Score
  let score;
  if (impact <= 0) {
    score = 0;
  } else if (S === 'U') {
    score = roundUp(Math.min(impact + exploitability, 10));
  } else {
    score = roundUp(Math.min(1.08 * (impact + exploitability), 10));
  }

  // Determinar severidad
  let severity;
  if (score === 0) severity = 'None';
  else if (score <= 3.9) severity = 'Low';
  else if (score <= 6.9) severity = 'Medium';
  else if (score <= 8.9) severity = 'High';
  else severity = 'Critical';

  return { score, severity, iss, impact, exploitability };
};

// Parsear vector CVSS existente
const parseVector = (vector) => {
  const metrics = {};
  if (!vector || !vector.startsWith('CVSS:3.1/')) return metrics;

  const parts = vector.replace('CVSS:3.1/', '').split('/');
  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) {
      metrics[key] = value;
    }
  });

  return metrics;
};

/**
 * CVSS31Calculator Component
 */
const CVSS31Calculator = ({ 
  value = '', 
  onChange, 
  onClose,
  cvssColors = {},
}) => {
  // Parsear vector inicial
  const initialMetrics = useMemo(() => parseVector(value), [value]);
  
  const [metrics, setMetrics] = useState({
    AV: initialMetrics.AV || '',
    AC: initialMetrics.AC || '',
    PR: initialMetrics.PR || '',
    UI: initialMetrics.UI || '',
    S: initialMetrics.S || '',
    C: initialMetrics.C || '',
    I: initialMetrics.I || '',
    A: initialMetrics.A || '',
  });

  // Calcular score y vector
  const result = useMemo(() => calculateCVSS31Score(metrics), [metrics]);
  const { score, severity } = result;
  
  const vector = useMemo(() => {
    const parts = Object.entries(metrics)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}:${v}`);
    
    if (parts.length === 8) {
      return `CVSS:3.1/${parts.join('/')}`;
    }
    return '';
  }, [metrics]);

  // Obtener color según severidad
  const getSeverityColor = () => {
    switch (severity) {
      case 'None':
        return cvssColors.noneColor || '#4a86e8';
      case 'Low':
        return cvssColors.lowColor || '#008000';
      case 'Medium':
        return cvssColors.mediumColor || '#f9a009';
      case 'High':
        return cvssColors.highColor || '#fe0000';
      case 'Critical':
        return cvssColors.criticalColor || '#212121';
      default:
        return '#6b7280';
    }
  };

  const handleMetricChange = (metric, value) => {
    setMetrics(prev => ({ ...prev, [metric]: value }));
  };

  const handleApply = () => {
    if (vector) {
      onChange(vector);
      onClose();
    }
  };

  const handleClear = () => {
    setMetrics({
      AV: '', AC: '', PR: '', UI: '', S: '', C: '', I: '', A: '',
    });
  };

  const isComplete = Object.values(metrics).every(v => v);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-bg-secondary py-2 -mt-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-500/10 rounded-lg">
              <Calculator className="w-6 h-6 text-danger-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Calculadora CVSS 3.1</h2>
              <p className="text-sm text-gray-400">Selecciona los valores para cada métrica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Display */}
        <div className="mb-6 p-4 bg-bg-tertiary rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: getSeverityColor() }}
              >
                {score.toFixed(1)}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{severity}</p>
                <p className="text-sm text-gray-400">
                  {severity === 'None' && 'Sin impacto (0.0)'}
                  {severity === 'Low' && 'Bajo (0.1 - 3.9)'}
                  {severity === 'Medium' && 'Medio (4.0 - 6.9)'}
                  {severity === 'High' && 'Alto (7.0 - 8.9)'}
                  {severity === 'Critical' && 'Crítico (9.0 - 10.0)'}
                </p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Vector</p>
              <code className="block w-full px-3 py-2 bg-bg-primary rounded text-sm font-mono text-gray-300 break-all">
                {vector || 'Selecciona todas las métricas...'}
              </code>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Exploitability Metrics */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Métricas de Explotabilidad
            </h3>
            <div className="space-y-4">
              {['AV', 'AC', 'PR', 'UI', 'S'].map(metricKey => {
                const metric = CVSS31_METRICS[metricKey];
                return (
                  <div key={metricKey}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {metric.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {metric.options.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleMetricChange(metricKey, option.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            metrics[metricKey] === option.value
                              ? 'bg-primary-500 text-white'
                              : 'bg-bg-tertiary text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <span className="font-bold">{option.value}</span>
                          <span className="ml-1.5 text-xs opacity-75">{option.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact Metrics */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Métricas de Impacto
            </h3>
            <div className="space-y-4">
              {['C', 'I', 'A'].map(metricKey => {
                const metric = CVSS31_METRICS[metricKey];
                return (
                  <div key={metricKey}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {metric.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {metric.options.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleMetricChange(metricKey, option.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            metrics[metricKey] === option.value
                              ? 'bg-primary-500 text-white'
                              : 'bg-bg-tertiary text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <span className="font-bold">{option.value}</span>
                          <span className="ml-1.5 text-xs opacity-75">{option.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Severity Scale */}
            <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Escala de Severidad</h4>
              <div className="flex gap-2">
                {[
                  { label: 'None', color: cvssColors.noneColor || '#4a86e8' },
                  { label: 'Low', color: cvssColors.lowColor || '#008000' },
                  { label: 'Medium', color: cvssColors.mediumColor || '#f9a009' },
                  { label: 'High', color: cvssColors.highColor || '#fe0000' },
                  { label: 'Critical', color: cvssColors.criticalColor || '#212121' },
                ].map(s => (
                  <div 
                    key={s.label}
                    className="flex-1 text-center py-2 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Button variant="ghost" onClick={handleClear}>
            Limpiar
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              icon={Check} 
              onClick={handleApply}
              disabled={!isComplete}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CVSS31Calculator;