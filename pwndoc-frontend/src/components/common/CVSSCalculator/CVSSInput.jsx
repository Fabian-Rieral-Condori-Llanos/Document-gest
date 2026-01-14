import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calculator, AlertCircle } from 'lucide-react';
import { fetchSettingsPublic, selectSettings } from '../../../features/settings';
import CVSS31Calculator from './CVSS31Calculator';
import CVSS40Calculator from './CVSS40Calculator';

/**
 * CVSSInput Component
 * Muestra inputs para CVSS 3.1 y/o CVSS 4.0 según la configuración del sistema
 * Incluye botones para abrir las calculadoras correspondientes
 */

// Tabla de lookup CVSS 4.0 (las más comunes)
const CVSS40_LOOKUP = {
  "000000": 10, "000001": 9.9, "000010": 9.8, "000011": 9.5, "000020": 9.5, "000021": 9.2,
  "000100": 10, "000101": 9.6, "000110": 9.3, "000111": 8.7, "000120": 9.1, "000121": 8.1,
  "000200": 9.3, "000201": 9, "000210": 8.9, "000211": 8, "000220": 8.1, "000221": 6.8,
  "001000": 9.8, "001001": 9.5, "001010": 9.5, "001011": 9.2, "001020": 9, "001021": 8.4,
  "001100": 9.3, "001101": 9.2, "001110": 8.9, "001111": 8.1, "001120": 8.1, "001121": 6.5,
  "001200": 8.8, "001201": 8, "001210": 7.8, "001211": 7, "001220": 6.9, "001221": 4.8,
  "010000": 9.9, "010001": 9.7, "010010": 9.5, "010011": 9.2, "010020": 9.2, "010021": 8.5,
  "010100": 9.5, "010101": 9.1, "010110": 9, "010111": 8.3, "010120": 8.4, "010121": 7.1,
  "100000": 9.8, "100001": 9.5, "100010": 9.4, "100011": 8.7, "100020": 9.1, "100021": 8.1,
  "110000": 9.5, "110001": 9, "110010": 8.8, "110011": 7.6, "110020": 7.6, "110021": 7,
  "200000": 9.3, "200001": 8.7, "200010": 8.6, "200011": 7.2, "200020": 7.5, "200021": 5.8,
};

/**
 * Función de redondeo oficial CVSS 3.1 (Roundup)
 */
const roundUp = (value) => {
  const intInput = Math.round(value * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
};

/**
 * Calcular score CVSS 3.1 para display en el input
 */
const calculateCVSS31Score = (vector) => {
  if (!vector || !vector.startsWith('CVSS:3.1/')) return null;
  
  const metrics = {};
  const parts = vector.replace('CVSS:3.1/', '').split('/');
  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) metrics[key] = value;
  });

  const { AV, AC, PR, UI, S, C, I, A } = metrics;
  if (!AV || !AC || !PR || !UI || !S || !C || !I || !A) return null;

  // Valores de métricas
  const avScores = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const acScores = { L: 0.77, H: 0.44 };
  const prScopedScores = { 
    N: { U: 0.85, C: 0.85 }, 
    L: { U: 0.62, C: 0.68 }, 
    H: { U: 0.27, C: 0.50 } 
  };
  const uiScores = { N: 0.85, R: 0.62 };
  const ciaScores = { N: 0, L: 0.22, H: 0.56 };

  // Obtener valores
  const avVal = avScores[AV];
  const acVal = acScores[AC];
  const prVal = prScopedScores[PR]?.[S];
  const uiVal = uiScores[UI];
  const cVal = ciaScores[C];
  const iVal = ciaScores[I];
  const aVal = ciaScores[A];

  if (avVal === undefined || acVal === undefined || prVal === undefined || 
      uiVal === undefined || cVal === undefined || iVal === undefined || aVal === undefined) {
    return null;
  }

  // Calcular ISS
  const iss = 1 - ((1 - cVal) * (1 - iVal) * (1 - aVal));

  // Calcular Impact
  let impact;
  if (S === 'U') {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  // Calcular Exploitability
  const exploitability = 8.22 * avVal * acVal * prVal * uiVal;

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

  return { score, severity };
};

/**
 * Calcular MacroVector para CVSS 4.0
 */
const calculateMacroVector = (metrics) => {
  const { AV, AC, AT, PR, UI, VC, VI, VA, SC, SI, SA } = metrics;
  
  // EQ1
  let eq1;
  if (AV === 'N' && PR === 'N' && UI === 'N') {
    eq1 = 0;
  } else if ((AV === 'N' || PR === 'N' || UI === 'N') && !(AV === 'N' && PR === 'N' && UI === 'N')) {
    eq1 = 1;
  } else {
    eq1 = 2;
  }

  // EQ2
  let eq2 = (AC === 'L' && AT === 'N') ? 0 : 1;

  // EQ3
  let eq3;
  if (VC === 'H' && VI === 'H') {
    eq3 = 0;
  } else if (!(VC === 'H' && VI === 'H') && (VC === 'H' || VI === 'H' || VA === 'H')) {
    eq3 = 1;
  } else {
    eq3 = 2;
  }

  // EQ4
  let eq4;
  if (SC === 'H' && SI === 'H') {
    eq4 = 0;
  } else if (!(SC === 'H' && SI === 'H') && (SC === 'H' || SI === 'H' || SA === 'H')) {
    eq4 = 1;
  } else {
    eq4 = 2;
  }

  return `${eq1}${eq2}${eq3}${eq4}00`;
};

/**
 * Calcular score CVSS 4.0 para display en el input
 */
const calculateCVSS40Score = (vector) => {
  if (!vector || !vector.startsWith('CVSS:4.0/')) return null;
  
  const metrics = {};
  const parts = vector.replace('CVSS:4.0/', '').split('/');
  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) metrics[key] = value;
  });

  const requiredKeys = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
  if (!requiredKeys.every(k => metrics[k])) return null;

  const { VC, VI, VA, SC, SI, SA } = metrics;
  
  // Sin impacto
  if (VC === 'N' && VI === 'N' && VA === 'N' && SC === 'N' && SI === 'N' && SA === 'N') {
    return { score: 0, severity: 'None' };
  }

  const macroVector = calculateMacroVector(metrics);
  let score = CVSS40_LOOKUP[macroVector];
  
  if (score === undefined) {
    // Fallback para vectores no en lookup
    score = 5.0;
  }

  let severity;
  if (score === 0) severity = 'None';
  else if (score <= 3.9) severity = 'Low';
  else if (score <= 6.9) severity = 'Medium';
  else if (score <= 8.9) severity = 'High';
  else severity = 'Critical';

  return { score, severity };
};

const CVSSInput = ({
  cvssv3 = '',
  cvssv4 = '',
  onCvssv3Change,
  onCvssv4Change,
  className = '',
}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  
  const [showCvss31Calculator, setShowCvss31Calculator] = useState(false);
  const [showCvss40Calculator, setShowCvss40Calculator] = useState(false);

  // Cargar configuración al montar
  useEffect(() => {
    if (!settings) {
      dispatch(fetchSettingsPublic());
    }
  }, [dispatch, settings]);

  // Obtener configuración
  const scoringMethods = settings?.report?.public?.scoringMethods || { CVSS3: true, CVSS4: false };
  const cvssColors = settings?.report?.public?.cvssColors || {};

  // Obtener color según severidad
  const getSeverityColor = (severity) => {
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

  const cvss31Result = cvssv3 ? calculateCVSS31Score(cvssv3) : null;
  const cvss40Result = cvssv4 ? calculateCVSS40Score(cvssv4) : null;

  // Si no hay ningún método habilitado
  if (!scoringMethods.CVSS3 && !scoringMethods.CVSS4) {
    return (
      <div className={`p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-warning-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">No hay métodos de scoring habilitados en la configuración.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* CVSS 3.1 */}
      {scoringMethods.CVSS3 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            CVSS v3.1
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={cvssv3}
                onChange={(e) => onCvssv3Change(e.target.value)}
                placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
                className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono text-sm pr-24"
              />
              {cvss31Result && (
                <div 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: getSeverityColor(cvss31Result.severity) }}
                >
                  {cvss31Result.score.toFixed(1)} {cvss31Result.severity}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCvss31Calculator(true)}
              className="px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calcular</span>
            </button>
          </div>
        </div>
      )}

      {/* CVSS 4.0 */}
      {scoringMethods.CVSS4 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            CVSS v4.0
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={cvssv4}
                onChange={(e) => onCvssv4Change(e.target.value)}
                placeholder="CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N"
                className="w-full px-3 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono text-sm pr-24"
              />
              {cvss40Result && (
                <div 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: getSeverityColor(cvss40Result.severity) }}
                >
                  {cvss40Result.score.toFixed(1)} {cvss40Result.severity}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCvss40Calculator(true)}
              className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calcular</span>
            </button>
          </div>
        </div>
      )}

      {/* Calculadoras Modal */}
      {showCvss31Calculator && (
        <CVSS31Calculator
          value={cvssv3}
          onChange={onCvssv3Change}
          onClose={() => setShowCvss31Calculator(false)}
          cvssColors={cvssColors}
        />
      )}

      {showCvss40Calculator && (
        <CVSS40Calculator
          value={cvssv4}
          onChange={onCvssv4Change}
          onClose={() => setShowCvss40Calculator(false)}
          cvssColors={cvssColors}
        />
      )}
    </div>
  );
};

export default CVSSInput;