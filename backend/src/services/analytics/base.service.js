const Settings = require('../../models/settings.model');

/**
 * AnalyticsBaseService
 * 
 * Servicio base con métodos compartidos para todos los servicios de analytics.
 * Incluye helpers para CVSS, fechas, y análisis de findings.
 */
class AnalyticsBaseService {
    
    /**
     * ========================================
     * FILTROS DE FECHA
     * ========================================
     */
    
    /**
     * Construir filtro de fechas para MongoDB
     * @param {String} startDate - Fecha inicio ISO
     * @param {String} endDate - Fecha fin ISO
     * @param {Number} year - Año para filtrar
     * @returns {Object} Filtro de fecha { $gte, $lte }
     */
    buildDateFilter(startDate, endDate, year) {
        const filter = {};
        
        if (startDate && endDate) {
            filter.$gte = new Date(startDate);
            filter.$lte = new Date(endDate);
        } else if (year) {
            filter.$gte = new Date(`${year}-01-01T00:00:00.000Z`);
            filter.$lte = new Date(`${year}-12-31T23:59:59.999Z`);
        } else {
            const currentYear = new Date().getFullYear();
            filter.$gte = new Date(`${currentYear}-01-01T00:00:00.000Z`);
            filter.$lte = new Date(`${currentYear}-12-31T23:59:59.999Z`);
        }
        
        return filter;
    }
    
    /**
     * Obtener año actual o el especificado
     * @param {Number} year 
     * @returns {Number}
     */
    getYear(year) {
        return year || new Date().getFullYear();
    }
    
    /**
     * ========================================
     * CÁLCULOS CVSS
     * ========================================
     */
    
    /**
     * Extraer score aproximado del vector CVSS
     * @param {String} cvssVector - Vector CVSS v3 o v4
     * @returns {Number} Score aproximado
     */
    extractCVSSScore(cvssVector) {
        if (!cvssVector) return 0;
        
        // Aproximación basada en componentes críticos
        if (cvssVector.includes('AV:N') && cvssVector.includes('PR:N')) {
            if (cvssVector.includes('C:H') && cvssVector.includes('I:H') && cvssVector.includes('A:H')) {
                return 9.5; // Crítico
            }
            if (cvssVector.includes('C:H') || cvssVector.includes('I:H') || cvssVector.includes('A:H')) {
                return 7.5; // Alto
            }
            return 5.0; // Medio
        }
        
        if (cvssVector.includes('AV:L') || cvssVector.includes('PR:H')) {
            return 4.0; // Bajo
        }
        
        return 3.0; // Info
    }
    
    /**
     * Obtener etiqueta de severidad basada en CVSS
     * @param {String} cvssVector 
     * @returns {String} Etiqueta de severidad
     */
    getSeverityLabel(cvssVector) {
        const score = this.extractCVSSScore(cvssVector);
        
        if (score >= 9.0) return 'Crítica';
        if (score >= 7.0) return 'Alta';
        if (score >= 4.0) return 'Media';
        if (score > 0) return 'Baja';
        return 'Info';
    }
    
    /**
     * Obtener etiqueta de estado de retest
     * @param {String} retestStatus 
     * @returns {String}
     */
    getRetestStatusLabel(retestStatus) {
        const labels = {
            'ok': 'Remediada',
            'ko': 'No Remediada',
            'partial': 'Parcial',
            'unknown': 'Sin Verificar'
        };
        return labels[retestStatus] || 'Sin Verificar';
    }
    
    /**
     * Obtener colores de CVSS desde settings
     * @returns {Promise<Object>}
     */
    async getCVSSColors() {
        const settings = await Settings.findOne({}).select('report.public.cvssColors').lean();
        return settings?.report?.public?.cvssColors || {
            criticalColor: '#dc2626',
            highColor: '#ea580c',
            mediumColor: '#d97706',
            lowColor: '#65a30d',
            noneColor: '#0891b2'
        };
    }
    
    /**
     * ========================================
     * ANÁLISIS DE FINDINGS
     * ========================================
     */
    
    /**
     * Analizar findings y obtener estadísticas
     * @param {Array} findings - Array de findings
     * @returns {Object} Estadísticas de findings
     */
    analyzeFindings(findings) {
        let total = 0, criticas = 0, altas = 0, medias = 0, bajas = 0, info = 0;
        let remediadas = 0, noRemediadas = 0, parciales = 0, sinVerificar = 0;
        
        (findings || []).forEach(finding => {
            total++;
            const score = this.extractCVSSScore(finding.cvssv3 || finding.cvssv4);
            
            if (score >= 9.0) criticas++;
            else if (score >= 7.0) altas++;
            else if (score >= 4.0) medias++;
            else if (score > 0) bajas++;
            else info++;
            
            switch (finding.retestStatus) {
                case 'ok': remediadas++; break;
                case 'ko': noRemediadas++; break;
                case 'partial': parciales++; break;
                default: sinVerificar++; break;
            }
        });
        
        return {
            total,
            criticas,
            altas,
            medias,
            bajas,
            info,
            remediadas,
            noRemediadas,
            parciales,
            sinVerificar,
            verificadas: remediadas + noRemediadas + parciales,
            tasaRemediacion: total > 0 ? Math.round((remediadas / total) * 100) : 0
        };
    }
    
    /**
     * Agrupar findings por categoría
     * @param {Array} findings 
     * @returns {Array}
     */
    groupFindingsByCategory(findings) {
        const grouped = {};
        
        (findings || []).forEach(f => {
            const category = f.vulnType || 'Sin categoría';
            
            if (!grouped[category]) {
                grouped[category] = {
                    category,
                    total: 0,
                    criticas: 0,
                    altas: 0,
                    medias: 0,
                    bajas: 0,
                    info: 0,
                    remediadas: 0
                };
            }
            
            grouped[category].total++;
            
            const score = this.extractCVSSScore(f.cvssv3 || f.cvssv4);
            if (score >= 9.0) grouped[category].criticas++;
            else if (score >= 7.0) grouped[category].altas++;
            else if (score >= 4.0) grouped[category].medias++;
            else if (score > 0) grouped[category].bajas++;
            else grouped[category].info++;
            
            if (f.retestStatus === 'ok') grouped[category].remediadas++;
        });
        
        return Object.values(grouped).sort((a, b) => b.total - a.total);
    }
    
    /**
     * ========================================
     * CÁLCULOS DE RIESGO
     * ========================================
     */
    
    /**
     * Calcular nivel de riesgo de una entidad
     * @param {Object} empresa - Datos de la empresa
     * @returns {Object} { nivel, color, prioridad }
     */
    calcularNivelRiesgo(empresa) {
        const { criticasActivas = 0, altasActivas = 0 } = empresa;
        
        if (criticasActivas >= 5 || (criticasActivas >= 3 && altasActivas >= 10)) {
            return { nivel: 'CRÍTICO', color: '#dc2626', prioridad: 1 };
        }
        if (criticasActivas >= 2 || (criticasActivas >= 1 && altasActivas >= 5)) {
            return { nivel: 'ALTO', color: '#ea580c', prioridad: 2 };
        }
        if (criticasActivas >= 1 || altasActivas >= 3) {
            return { nivel: 'MEDIO', color: '#d97706', prioridad: 3 };
        }
        if (altasActivas >= 1) {
            return { nivel: 'BAJO', color: '#65a30d', prioridad: 4 };
        }
        return { nivel: 'MÍNIMO', color: '#22c55e', prioridad: 5 };
    }
    
    /**
     * ========================================
     * FORMATEO DE DATOS
     * ========================================
     */
    
    /**
     * Formatear fecha a string ISO (solo fecha)
     * @param {Date} date 
     * @returns {String|null}
     */
    formatDate(date) {
        if (!date) return null;
        return new Date(date).toISOString().split('T')[0];
    }
    
    /**
     * Calcular días entre dos fechas
     * @param {Date} startDate 
     * @param {Date} endDate 
     * @returns {Number}
     */
    calcularDias(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.abs(Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }
    
    /**
     * ========================================
     * NOMBRES DE MESES
     * ========================================
     */
    
    /**
     * Obtener nombres de meses en español
     * @returns {Array<String>}
     */
    getNombresMeses() {
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }
    
    /**
     * ========================================
     * MERGE DE FILTROS
     * ========================================
     */
    
    /**
     * Combinar filtro base con filtro de permisos
     * @param {Object} baseFilter - Filtro base (ej: { createdAt: {...} })
     * @param {Object} permissionFilter - Filtro de permisos (ej: { company: { $in: [...] } })
     * @returns {Object} Filtro combinado
     */
    mergeFilters(baseFilter, permissionFilter) {
        if (!permissionFilter || Object.keys(permissionFilter).length === 0) {
            return baseFilter;
        }
        
        return { ...baseFilter, ...permissionFilter };
    }
}

module.exports = new AnalyticsBaseService();
