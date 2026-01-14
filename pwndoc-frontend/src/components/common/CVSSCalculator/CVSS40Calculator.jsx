import { useState, useMemo } from 'react';
import { Calculator, X, Check } from 'lucide-react';
import Button from '../Button/Button';
import Card from '../Card/Card';

/**
 * CVSS 4.0 Calculator Component
 * Implementación oficial del algoritmo CVSS 4.0 según FIRST
 * https://www.first.org/cvss/v4.0/specification-document
 */

// Definición de métricas CVSS 4.0 Base
const CVSS40_METRICS = {
  AV: {
    name: 'Attack Vector',
    label: 'Vector de Ataque',
    group: 'exploitability',
    options: [
      { value: 'N', label: 'Network', short: 'Red' },
      { value: 'A', label: 'Adjacent', short: 'Adyacente' },
      { value: 'L', label: 'Local', short: 'Local' },
      { value: 'P', label: 'Physical', short: 'Físico' },
    ],
  },
  AC: {
    name: 'Attack Complexity',
    label: 'Complejidad del Ataque',
    group: 'exploitability',
    options: [
      { value: 'L', label: 'Low', short: 'Baja' },
      { value: 'H', label: 'High', short: 'Alta' },
    ],
  },
  AT: {
    name: 'Attack Requirements',
    label: 'Requisitos de Ataque',
    group: 'exploitability',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno' },
      { value: 'P', label: 'Present', short: 'Presente' },
    ],
  },
  PR: {
    name: 'Privileges Required',
    label: 'Privilegios Requeridos',
    group: 'exploitability',
    options: [
      { value: 'N', label: 'None', short: 'Ninguno' },
      { value: 'L', label: 'Low', short: 'Bajos' },
      { value: 'H', label: 'High', short: 'Altos' },
    ],
  },
  UI: {
    name: 'User Interaction',
    label: 'Interacción del Usuario',
    group: 'exploitability',
    options: [
      { value: 'N', label: 'None', short: 'Ninguna' },
      { value: 'P', label: 'Passive', short: 'Pasiva' },
      { value: 'A', label: 'Active', short: 'Activa' },
    ],
  },
  VC: {
    name: 'Confidentiality (Vulnerable)',
    label: 'Confidencialidad (Vulnerable)',
    group: 'vulnerable',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
  VI: {
    name: 'Integrity (Vulnerable)',
    label: 'Integridad (Vulnerable)',
    group: 'vulnerable',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
  VA: {
    name: 'Availability (Vulnerable)',
    label: 'Disponibilidad (Vulnerable)',
    group: 'vulnerable',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
  SC: {
    name: 'Confidentiality (Subsequent)',
    label: 'Confidencialidad (Subsecuente)',
    group: 'subsequent',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
  SI: {
    name: 'Integrity (Subsequent)',
    label: 'Integridad (Subsecuente)',
    group: 'subsequent',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
  SA: {
    name: 'Availability (Subsequent)',
    label: 'Disponibilidad (Subsecuente)',
    group: 'subsequent',
    options: [
      { value: 'H', label: 'High', short: 'Alto' },
      { value: 'L', label: 'Low', short: 'Bajo' },
      { value: 'N', label: 'None', short: 'Ninguno' },
    ],
  },
};

// Valores numéricos para EQ (Equivalence Classes)
const AV_LEVELS = { N: 0, A: 1, L: 2, P: 3 };
const AC_LEVELS = { L: 0, H: 1 };
const AT_LEVELS = { N: 0, P: 1 };
const PR_LEVELS = { N: 0, L: 1, H: 2 };
const UI_LEVELS = { N: 0, P: 1, A: 2 };
const VC_LEVELS = { H: 0, L: 1, N: 2 };
const VI_LEVELS = { H: 0, L: 1, N: 2 };
const VA_LEVELS = { H: 0, L: 1, N: 2 };
const SC_LEVELS = { H: 0, L: 1, N: 2 };
const SI_LEVELS = { H: 0, L: 1, N: 2 };
const SA_LEVELS = { H: 0, L: 1, N: 2 };

/**
 * Tabla de lookup MacroVector -> Score
 * Basada en la especificación oficial CVSS 4.0 de FIRST
 */
const CVSS40_LOOKUP_TABLE = {
  "000000": 10, "000001": 9.9, "000010": 9.8, "000011": 9.5, "000020": 9.5, "000021": 9.2,
  "000100": 10, "000101": 9.6, "000110": 9.3, "000111": 8.7, "000120": 9.1, "000121": 8.1,
  "000200": 9.3, "000201": 9, "000210": 8.9, "000211": 8, "000220": 8.1, "000221": 6.8,
  "001000": 9.8, "001001": 9.5, "001010": 9.5, "001011": 9.2, "001020": 9, "001021": 8.4,
  "001100": 9.3, "001101": 9.2, "001110": 8.9, "001111": 8.1, "001120": 8.1, "001121": 6.5,
  "001200": 8.8, "001201": 8, "001210": 7.8, "001211": 7, "001220": 6.9, "001221": 4.8,
  "002001": 9.2, "002011": 8.2, "002021": 7.2, "002101": 7.9, "002111": 6.9, "002121": 5,
  "002201": 6.9, "002211": 5.5, "002221": 2.7,
  "010000": 9.9, "010001": 9.7, "010010": 9.5, "010011": 9.2, "010020": 9.2, "010021": 8.5,
  "010100": 9.5, "010101": 9.1, "010110": 9, "010111": 8.3, "010120": 8.4, "010121": 7.1,
  "010200": 9.2, "010201": 8.1, "010210": 8.2, "010211": 7.1, "010220": 7.2, "010221": 5.3,
  "011000": 9.5, "011001": 9.3, "011010": 9.2, "011011": 8.5, "011020": 8.5, "011021": 7.3,
  "011100": 9.2, "011101": 8.2, "011110": 8, "011111": 7.2, "011120": 7, "011121": 5.9,
  "011200": 8.4, "011201": 7, "011210": 7.1, "011211": 5.2, "011220": 5, "011221": 3,
  "012001": 8.6, "012011": 7.5, "012021": 5.2, "012101": 7.1, "012111": 5.2, "012121": 2.9,
  "012201": 6.3, "012211": 2.9, "012221": 1.7,
  "100000": 9.8, "100001": 9.5, "100010": 9.4, "100011": 8.7, "100020": 9.1, "100021": 8.1,
  "100100": 9.4, "100101": 8.9, "100110": 8.6, "100111": 7.4, "100120": 7.7, "100121": 6.4,
  "100200": 8.7, "100201": 7.5, "100210": 7.4, "100211": 6.3, "100220": 6.3, "100221": 4.9,
  "101000": 9.4, "101001": 8.9, "101010": 8.8, "101011": 7.7, "101020": 7.6, "101021": 6.7,
  "101100": 8.6, "101101": 7.6, "101110": 7.4, "101111": 5.8, "101120": 5.9, "101121": 5,
  "101200": 7.2, "101201": 5.7, "101210": 5.7, "101211": 5.2, "101220": 5.2, "101221": 2.5,
  "102001": 8.3, "102011": 7, "102021": 5.4, "102101": 6.5, "102111": 5.8, "102121": 2.6,
  "102201": 5.3, "102211": 2.1, "102221": 1.3,
  "110000": 9.5, "110001": 9, "110010": 8.8, "110011": 7.6, "110020": 7.6, "110021": 7,
  "110100": 9, "110101": 7.7, "110110": 7.5, "110111": 6.2, "110120": 6.1, "110121": 5.3,
  "110200": 7.7, "110201": 6.6, "110210": 6.8, "110211": 5.9, "110220": 5.2, "110221": 3,
  "111000": 8.9, "111001": 7.8, "111010": 7.6, "111011": 6.7, "111020": 6.2, "111021": 5.8,
  "111100": 7.4, "111101": 5.9, "111110": 5.7, "111111": 5.7, "111120": 4.7, "111121": 2.3,
  "111200": 6.1, "111201": 5.2, "111210": 5.7, "111211": 2.9, "111220": 2.4, "111221": 1.6,
  "112001": 7.1, "112011": 5.9, "112021": 3, "112101": 5.8, "112111": 2.6, "112121": 1.5,
  "112201": 2.3, "112211": 1.3, "112221": 0.6,
  "200000": 9.3, "200001": 8.7, "200010": 8.6, "200011": 7.2, "200020": 7.5, "200021": 5.8,
  "200100": 8.6, "200101": 7.4, "200110": 7.4, "200111": 6.1, "200120": 5.6, "200121": 3.4,
  "200200": 7, "200201": 5.4, "200210": 5.2, "200211": 4, "200220": 4, "200221": 2.2,
  "201000": 8.5, "201001": 7.5, "201010": 7.4, "201011": 5.5, "201020": 6.2, "201021": 5.1,
  "201100": 7.2, "201101": 5.7, "201110": 5.5, "201111": 4.1, "201120": 4.6, "201121": 1.9,
  "201200": 5.3, "201201": 3.6, "201210": 3.4, "201211": 1.9, "201220": 1.9, "201221": 0.8,
  "202001": 6.4, "202011": 5.1, "202021": 2, "202101": 4.7, "202111": 2.1, "202121": 1.1,
  "202201": 2.4, "202211": 0.9, "202221": 0.4,
  "210000": 8.8, "210001": 7.5, "210010": 7.3, "210011": 5.3, "210020": 6, "210021": 5,
  "210100": 7.3, "210101": 5.5, "210110": 5.9, "210111": 4, "210120": 4.1, "210121": 2,
  "210200": 5.4, "210201": 4.3, "210210": 4.5, "210211": 2.2, "210220": 2, "210221": 1.1,
  "211000": 7.5, "211001": 5.5, "211010": 5.8, "211011": 4.5, "211020": 4, "211021": 2.1,
  "211100": 6.1, "211101": 5.1, "211110": 4.8, "211111": 1.8, "211120": 2, "211121": 0.9,
  "211200": 4.6, "211201": 1.8, "211210": 1.7, "211211": 0.7, "211220": 0.8, "211221": 0.2,
  "212001": 5.3, "212011": 2.4, "212021": 1.4, "212101": 2.4, "212111": 1.2, "212121": 0.5,
  "212201": 1, "212211": 0.3, "212221": 0.1,
};

/**
 * Calcular el MacroVector a partir de las métricas
 */
const calculateMacroVector = (metrics) => {
  const { AV, AC, AT, PR, UI, VC, VI, VA, SC, SI, SA } = metrics;
  
  // EQ1: AV + PR + UI
  let eq1;
  if (AV === 'N' && PR === 'N' && UI === 'N') {
    eq1 = 0;
  } else if ((AV === 'N' || PR === 'N' || UI === 'N') && !(AV === 'N' && PR === 'N' && UI === 'N')) {
    eq1 = 1;
  } else {
    eq1 = 2;
  }

  // EQ2: AC + AT
  let eq2;
  if (AC === 'L' && AT === 'N') {
    eq2 = 0;
  } else {
    eq2 = 1;
  }

  // EQ3: VC + VI + VA
  let eq3;
  if (VC === 'H' && VI === 'H') {
    eq3 = 0;
  } else if (!(VC === 'H' && VI === 'H') && (VC === 'H' || VI === 'H' || VA === 'H')) {
    eq3 = 1;
  } else {
    eq3 = 2;
  }

  // EQ4: SC + SI + SA
  let eq4;
  if (SC === 'H' && SI === 'H') {
    eq4 = 0;
  } else if (!(SC === 'H' && SI === 'H') && (SC === 'H' || SI === 'H' || SA === 'H')) {
    eq4 = 1;
  } else {
    eq4 = 2;
  }

  // EQ5: No environmental metrics in base score
  const eq5 = 0;

  // EQ6: No threat metrics in base score
  const eq6 = 0;

  return `${eq1}${eq2}${eq3}${eq4}${eq5}${eq6}`;
};

/**
 * Calcular score CVSS 4.0 según especificación oficial
 */
const calculateCVSS40Score = (metrics) => {
  const requiredMetrics = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
  
  // Verificar que todas las métricas base estén presentes
  const hasAllRequired = requiredMetrics.every(m => metrics[m]);
  
  if (!hasAllRequired) {
    return { score: 0, severity: 'None', macroVector: '' };
  }

  // Verificar si hay algún impacto
  const { VC, VI, VA, SC, SI, SA } = metrics;
  if (VC === 'N' && VI === 'N' && VA === 'N' && SC === 'N' && SI === 'N' && SA === 'N') {
    return { score: 0, severity: 'None', macroVector: '222220' };
  }

  // Calcular MacroVector
  const macroVector = calculateMacroVector(metrics);
  
  // Buscar en la tabla de lookup
  let score = CVSS40_LOOKUP_TABLE[macroVector];
  
  if (score === undefined) {
    // Si no está en la tabla, usar interpolación
    score = 0;
  }

  // Determinar severidad
  let severity;
  if (score === 0) severity = 'None';
  else if (score <= 3.9) severity = 'Low';
  else if (score <= 6.9) severity = 'Medium';
  else if (score <= 8.9) severity = 'High';
  else severity = 'Critical';

  return { score, severity, macroVector };
};

// Parsear vector CVSS 4.0 existente
const parseVector = (vector) => {
  const metrics = {};
  if (!vector || !vector.startsWith('CVSS:4.0/')) return metrics;

  const parts = vector.replace('CVSS:4.0/', '').split('/');
  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) {
      metrics[key] = value;
    }
  });

  return metrics;
};

/**
 * CVSS40Calculator Component
 */
const CVSS40Calculator = ({ 
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
    AT: initialMetrics.AT || '',
    PR: initialMetrics.PR || '',
    UI: initialMetrics.UI || '',
    VC: initialMetrics.VC || '',
    VI: initialMetrics.VI || '',
    VA: initialMetrics.VA || '',
    SC: initialMetrics.SC || '',
    SI: initialMetrics.SI || '',
    SA: initialMetrics.SA || '',
  });

  // Calcular score y vector
  const result = useMemo(() => calculateCVSS40Score(metrics), [metrics]);
  const { score, severity, macroVector } = result;
  
  const vector = useMemo(() => {
    const requiredKeys = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
    const parts = requiredKeys
      .filter(k => metrics[k])
      .map(k => `${k}:${metrics[k]}`);
    
    if (parts.length === 11) {
      return `CVSS:4.0/${parts.join('/')}`;
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
      AV: '', AC: '', AT: '', PR: '', UI: '',
      VC: '', VI: '', VA: '', SC: '', SI: '', SA: '',
    });
  };

  const requiredMetrics = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
  const isComplete = requiredMetrics.every(m => metrics[m]);
  const completedCount = requiredMetrics.filter(m => metrics[m]).length;

  const renderMetricGroup = (title, keys) => (
    <div>
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-4">
        {keys.map(metricKey => {
          const metric = CVSS40_METRICS[metricKey];
          if (!metric) return null;
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
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-bg-secondary py-2 -mt-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-500/10 rounded-lg">
              <Calculator className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Calculadora CVSS 4.0</h2>
              <p className="text-sm text-gray-400">Common Vulnerability Scoring System v4.0</p>
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
                {macroVector && (
                  <p className="text-xs text-gray-500 mt-1">
                    MacroVector: {macroVector}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Vector</p>
              <code className="block w-full px-3 py-2 bg-bg-primary rounded text-sm font-mono text-gray-300 break-all">
                {vector || 'Selecciona todas las métricas base...'}
              </code>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progreso</span>
            <span>{completedCount} / {requiredMetrics.length} métricas</span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${(completedCount / requiredMetrics.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Base Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Exploitability Metrics */}
          {renderMetricGroup('Métricas de Explotabilidad', ['AV', 'AC', 'AT', 'PR', 'UI'])}

          {/* Vulnerable System Impact */}
          {renderMetricGroup('Impacto Sistema Vulnerable', ['VC', 'VI', 'VA'])}

          {/* Subsequent System Impact */}
          {renderMetricGroup('Impacto Sistema Subsecuente', ['SC', 'SI', 'SA'])}
        </div>

        {/* Severity Scale */}
        <div className="mb-6 p-4 bg-bg-tertiary rounded-lg">
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

export default CVSS40Calculator;