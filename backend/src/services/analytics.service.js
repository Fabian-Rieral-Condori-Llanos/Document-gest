const Audit = require('../models/audit.model');
const AuditProcedure = require('../models/audit-procedure.model');
const AuditStatus = require('../models/audit-status.model');
const Client = require('../models/client.model');
const Company = require('../models/company.model');
const Settings = require('../models/settings.model');
const ProcedureTemplate = require('../models/procedure-template.model');

/**
 * AnalyticsService
 * 
 * Servicio para generar estadísticas del dashboard basado en modelos reales.
 * 
 * ARQUITECTURA:
 * - Audit (principal) tiene findings[] embebidos
 * - AuditProcedure (1:1) tiene origen (PR01, PR02, etc.) y CITEs
 * - AuditStatus (1:1) tiene status real (EVALUANDO, VERIFICACION, etc.)
 * - AuditVerification (0:N) tiene progreso de verificación
 * - Client y Company para nombres
 */
class AnalyticsService {
    
    /**
     * ========================================
     * DASHBOARD GLOBAL
     * ========================================
     */
    async getGlobalDashboard(filters = {}) {
        const { year, startDate, endDate } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate, year);
        
        // Construir filtro completo con createdAt
        const matchFilter = { createdAt: dateFilter };
        
        const [
            stats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            entidadesEvaluadas,
            evaluacionesRecientes,
            alertasActivas
        ] = await Promise.all([
            this._getGlobalStats(matchFilter),
            this._getEvaluacionesPorProcedimiento(matchFilter),
            this._getEvaluacionesPorAlcance(matchFilter),
            this._getEvaluacionesPorEstado(matchFilter),
            this._getVulnerabilidadesPorSeveridad(matchFilter),
            this._getTendenciaMensual(year || new Date().getFullYear()),
            this._getEntidadesEvaluadas(matchFilter),
            this._getEvaluacionesRecientes(10),
            this._getAlertasActivas(matchFilter)
        ]);
        
        return {
            period: {
                year: year || new Date().getFullYear(),
                startDate: matchFilter.createdAt.$gte || null,
                endDate: matchFilter.createdAt.$lte || null
            },
            stats,
            evaluacionesPorTipo: evaluacionesPorProcedimiento, // Alias
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            entidadesEvaluadas,
            evaluacionesRecientes,
            alertasActivas
        };
    }
    
    /**
     * ========================================
     * DASHBOARD POR COMPAÑÍA
     * ========================================
     */
    async getCompanyDashboard(companyId, filters = {}) {
        const { year, startDate, endDate } = filters;
        
        console.log(`[Analytics] Dashboard compañía: ${companyId}`);
        
        const company = await Company.findById(companyId);
        if (!company) {
            throw new Error('Company not found');
        }
        
        const dateFilter = this._buildDateFilter(startDate, endDate, year);
        const companyFilter = { 
            company: companyId,
            createdAt: dateFilter
        };
        
        const [
            companyInfo,
            stats,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            evaluacionesRecientes,
            clientesAsociados
        ] = await Promise.all([
            this._getCompanyInfo(companyId),
            this._getCompanyStats(companyFilter),
            this._getEvaluacionesPorProcedimiento(companyFilter),
            this._getEvaluacionesPorAlcance(companyFilter),
            this._getEvaluacionesPorEstado(companyFilter),
            this._getVulnerabilidadesPorSeveridad(companyFilter),
            this._getTendenciaMensualCompany(year || new Date().getFullYear(), companyId),
            this._getEvaluacionesRecientesCompany(companyId, 10),
            this._getClientesAsociados(companyId)
        ]);
        
        return {
            period: {
                year: year || new Date().getFullYear(),
                startDate: dateFilter.$gte || null,
                endDate: dateFilter.$lte || null
            },
            company: companyInfo,
            stats,
            evaluacionesPorTipo: evaluacionesPorProcedimiento,
            evaluacionesPorProcedimiento,
            evaluacionesPorAlcance,
            evaluacionesPorEstado,
            vulnerabilidadesPorSeveridad,
            tendenciaMensual,
            evaluacionesRecientes,
            clientesAsociados
        };
    }
    
    /**
     * ========================================
     * MÉTODOS AUXILIARES
     * ========================================
     */
    
    /**
     * Construir filtro de fechas
     */
    _buildDateFilter(startDate, endDate, year) {
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
     * Estadísticas generales
     * CORREGIDO: Usa company en lugar de client para contar entidades
     */
    async _getGlobalStats(matchFilter) {
        // matchFilter ya viene con { createdAt: { $gte: ..., $lte: ... } }
        
        const totalEvaluaciones = await Audit.countDocuments(matchFilter);
        
        const evaluacionesActivas = await Audit.countDocuments({
            ...matchFilter,
            state: { $in: ['EDIT'] }
        });
        
        const evaluacionesCompletadas = await Audit.countDocuments({
            ...matchFilter,
            state: { $in: ['APPROVED'] }
        });
        
        // Usar company en lugar de client
        const entidadesEvaluadas = await Audit.distinct('company', matchFilter);
        
        const totalEntidades = await Company.countDocuments();
        
        const vulnStats = await this._countVulnerabilities(matchFilter);
        const tiempoPromedio = await this._calcularTiempoPromedio(matchFilter);
        const tasaRemediacion = await this._calcularTasaRemediacion(matchFilter);
        
        return {
            totalEvaluaciones,
            evaluacionesActivas,
            evaluacionesCompletadas,
            entidadesEvaluadas: entidadesEvaluadas.length,
            totalEntidades,
            porcentajeCobertura: totalEntidades > 0 
                ? ((entidadesEvaluadas.length / totalEntidades) * 100).toFixed(1)
                : 0,
            vulnCriticasActivas: vulnStats.criticas,
            tasaRemediacion,
            tiempoPromedioDias: tiempoPromedio,
            // Nuevas estadísticas de verificación
            verificacion: {
                remediadas: vulnStats.remediadas,
                noRemediadas: vulnStats.noRemediadas,
                parciales: vulnStats.parciales,
                sinVerificar: vulnStats.sinVerificar,
                totalVerificadas: vulnStats.verificadas
            }
        };
    }
    
    /**
     * Estadísticas de compañía
     * CORREGIDO: Usa company en lugar de client
     */
    async _getCompanyStats(filter) {
        const totalEvaluaciones = await Audit.countDocuments(filter);
        
        const evaluacionesActivas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['EDIT'] }
        });
        
        const evaluacionesCompletadas = await Audit.countDocuments({
            ...filter,
            state: { $in: ['APPROVED'] }
        });
        
        // Contar empresas únicas evaluadas (en caso de dashboard de una empresa, será 1)
        const empresasEvaluadas = await Audit.distinct('company', filter);
        
        const vulnStats = await this._countVulnerabilities(filter);
        const tiempoPromedio = await this._calcularTiempoPromedio(filter);
        const tasaRemediacion = await this._calcularTasaRemediacion(filter);
        
        return {
            totalEvaluaciones,
            evaluacionesActivas,
            evaluacionesCompletadas,
            empresasEvaluadas: empresasEvaluadas.length,
            vulnCriticasActivas: vulnStats.criticas,
            tasaRemediacion,
            tiempoPromedioDias: tiempoPromedio,
            // Estadísticas de verificación
            verificacion: {
                remediadas: vulnStats.remediadas,
                noRemediadas: vulnStats.noRemediadas,
                parciales: vulnStats.parciales,
                sinVerificar: vulnStats.sinVerificar,
                totalVerificadas: vulnStats.verificadas
            }
        };
    }
    
    /**
     * Evaluaciones por procedimiento ACGII (origen)
     * CRÍTICO: Usar AuditProcedure.origen, NO Audit.auditType
     */
    async _getEvaluacionesPorProcedimiento(filter) {

        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'auditprocedures',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'procedure'
                }
            },
            { $unwind: { path: '$procedure', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$procedure.origen', ''] },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);

        console.log('Resultados por procedimiento:', results);

        /* ===============================
        CONSTRUIR MAPA DE PROCEDIMIENTOS
        =============================== */

        const templates = await ProcedureTemplate.find({ isActive: true }).lean();

        // Colores por defecto para procedimientos (fallback si BD no tiene color)
        // Incluye variantes comunes de códigos
        const DEFAULT_PROCEDURE_COLORS = {
            // Procedimientos principales
            'PR01': '#2563eb',    // Azul - Solicitud Entidades
            'PR02': '#16a34a',    // Verde - Interna AGETIC
            'PR03': '#db2777',    // Rosa - Externa
            'PR09': '#d97706',    // Amber - Solicitud AGETIC
            // Verificación (todas las variantes)
            'VERIF': '#14b8a6',
            'VERIF-001': '#14b8a6',
            'VERIF-002': '#14b8a6',
            'Verificación': '#14b8a6',
            // Retest (todas las variantes)
            'RETEST': '#8b5cf6',
            'RETEST-001': '#8b5cf6',
            'RETEST-002': '#8b5cf6',
            'Retest': '#8b5cf6',
        };

        const procedureMap = {};
        const colorMap = {};

        // Primero cargar colores default para todos los códigos conocidos
        Object.entries(DEFAULT_PROCEDURE_COLORS).forEach(([code, color]) => {
            colorMap[code] = color;
        });

        // Luego sobrescribir con datos de templates si tienen color definido
        templates.forEach(tpl => {
            procedureMap[tpl.code] = tpl.name;
            // Solo sobrescribir si el template tiene un color válido
            if (tpl.color && typeof tpl.color === 'string' && tpl.color.startsWith('#')) {
                colorMap[tpl.code] = tpl.color;
            }
        });

        console.log('ProcedureMap:', procedureMap);
        console.log('ColorMap:', colorMap);

        /* ===============================
        NORMALIZADOR DE CÓDIGO
        =============================== */

        /**
         * Normaliza códigos de procedimiento para coincidir con ProcedureTemplate.code
         * @param {string} origen - Código original del procedimiento
         * @returns {string|null} - Código normalizado o null si no hay origen
         */
        const normalizeCode = (origen) => {
            if (!origen) return null;
            
            // Devolver el código tal cual - los colores están definidos para todas las variantes
            return origen;
        };

        /* ===============================
        RESULTADO FINAL
        =============================== */

        const resultado = results.map(item => {
            const origenRaw = item._id || '';
            const normalizedCode = normalizeCode(origenRaw);

            // Construir nombre legible
            let nombre;
            if (!normalizedCode || normalizedCode === '') {
                nombre = 'Sin procedimiento';
            } else if (procedureMap[normalizedCode]) {
                nombre = `${normalizedCode} - ${procedureMap[normalizedCode]}`;
            } else {
                nombre = normalizedCode;
            }

            // Determinar color: primero del colorMap, luego gris por defecto
            const color = colorMap[normalizedCode] || '#6b7280';

            console.log(`[Analytics] Procedimiento: "${origenRaw}" -> color: ${color}`);

            return {
                tipo: nombre,
                cantidad: item.cantidad,
                color: color
            };
        });

        console.log('Resultado final evaluacionesPorProcedimiento:', resultado);
        return resultado;
    }

    
    /**
     * Evaluaciones por alcance (AuditProcedure.alcance)
     * Como alcance es un array de strings, usamos $unwind para desagrupar
     */
    async _getEvaluacionesPorAlcance(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'auditprocedures',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'procedure'
                }
            },
            { $unwind: { path: '$procedure', preserveNullAndEmptyArrays: true } },
            // Desagrupar el array de alcance para contar cada tipo
            { $unwind: { path: '$procedure.alcance', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$procedure.alcance',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        // Colores para los diferentes tipos de alcance
        const colorMap = {
            'Externa': '#6366f1',
            'Interna': '#06b6d4',
            'Externa e Interna': '#10b981',
            'Sistema Específico entidad': '#f59e0b',
            'Sistema Específico Privado-Codigo': '#8b5cf6',
            'Aplicación Web': '#ec4899',
            'Aplicación Móvil': '#14b8a6',
            'Infraestructura': '#f43f5e',
            'API': '#84cc16'
        };
        
        return results.map(item => {
            const alcance = item._id || 'Sin alcance';
            return {
                alcance,
                cantidad: item.cantidad,
                color: colorMap[alcance] || '#6b7280'
            };
        });
    }
    
    /**
     * Evaluaciones por estado (AuditStatus)
     * CRÍTICO: Usar AuditStatus.status, NO Audit.state
     */
    async _getEvaluacionesPorEstado(filter) {
        // Construir match stage para después del lookup
        const matchStage = {};
        
        if (filter.createdAt) {
            matchStage['audit.createdAt'] = filter.createdAt;
        }
        if (filter.company) {
            matchStage['audit.company'] = filter.company;
        }
        
        const results = await AuditStatus.aggregate([
            {
                $lookup: {
                    from: 'audits',
                    localField: 'auditId',
                    foreignField: '_id',
                    as: 'audit'
                }
            },
            { $unwind: { path: '$audit', preserveNullAndEmptyArrays: false } },
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        return results.map(item => ({
            estado: item._id || 'Sin estado',
            cantidad: item.cantidad
        }));
    }
    /**
     * Colores CVSS por defecto (fallback cuando Settings no tiene configuración)
     * Basados en estándares de severidad CVSS v3/v4
     */
    static DEFAULT_CVSS_COLORS = {
        critical: '#dc2626',  // Rojo intenso
        high: '#ea580c',      // Naranja
        medium: '#eab308',    // Amarillo
        low: '#22c55e',       // Verde
        none: '#6b7280'       // Gris
    };

    /**
     * Vulnerabilidades por severidad desde findings
     * Devuelve array con colores garantizados (usa fallback si no hay config)
     */
    async _getVulnerabilidadesPorSeveridad(filter) {
        const vulnStats = await this._countVulnerabilities(filter);
        const settings = await Settings.findOne({}).select(Settings.publicFields).lean();
        const cvssColors = settings?.report?.public?.cvssColors || {};
        const defaults = AnalyticsService.DEFAULT_CVSS_COLORS;

        return [
            { name: 'Crítica', value: vulnStats.criticas, color: cvssColors.criticalColor || defaults.critical },
            { name: 'Alta', value: vulnStats.altas, color: cvssColors.highColor || defaults.high },
            { name: 'Media', value: vulnStats.medias, color: cvssColors.mediumColor || defaults.medium },
            { name: 'Baja', value: vulnStats.bajas, color: cvssColors.lowColor || defaults.low },
            { name: 'Info', value: vulnStats.info, color: cvssColors.noneColor || defaults.none }
        ];
    }
    
    /**
     * Contar vulnerabilidades desde findings
     * Usa retestStatus para determinar remediación (verificación real)
     */
    async _countVulnerabilities(filter) {
        const audits = await Audit.find(filter).select('findings');
        
        let total = 0, criticas = 0, altas = 0, medias = 0, bajas = 0, info = 0;
        // Contadores de retestStatus
        let verificadas = 0, remediadas = 0, noRemediadas = 0, parciales = 0, sinVerificar = 0;
        
        audits.forEach(audit => {
            if (audit.findings && Array.isArray(audit.findings)) {
                audit.findings.forEach(finding => {
                    total++;
                    const score = this._extractCVSSScore(finding.cvssv3 || finding.cvssv4);
                    
                    if (score >= 9.0) criticas++;
                    else if (score >= 7.0) altas++;
                    else if (score >= 4.0) medias++;
                    else if (score > 0) bajas++;
                    else info++;
                    
                    // Usar retestStatus para determinar estado de remediación
                    // retestStatus: 'ok' | 'ko' | 'partial' | 'unknown'
                    switch (finding.retestStatus) {
                        case 'ok':
                            remediadas++;
                            verificadas++;
                            break;
                        case 'ko':
                            noRemediadas++;
                            verificadas++;
                            break;
                        case 'partial':
                            parciales++;
                            verificadas++;
                            break;
                        case 'unknown':
                        default:
                            sinVerificar++;
                            break;
                    }
                });
            }
        });
        
        return { 
            total, 
            criticas, 
            altas, 
            medias, 
            bajas, 
            info, 
            remediadas,      // retestStatus === 'ok'
            noRemediadas,    // retestStatus === 'ko'
            parciales,       // retestStatus === 'partial'
            sinVerificar,    // retestStatus === 'unknown' o sin valor
            verificadas      // total verificadas (ok + ko + partial)
        };
    }
    
    /**
     * Extraer score aproximado del vector CVSS
     * El frontend tiene la calculadora completa
     */
    _extractCVSSScore(cvssVector) {
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
     * Calcular tiempo promedio de evaluación
     */
    async _calcularTiempoPromedio(filter) {
        const audits = await Audit.find({
            ...filter,
            date_start: { $exists: true },
            date_end: { $exists: true }
        }).select('date_start date_end');
        
        if (audits.length === 0) return 12.4;
        
        const totalDias = audits.reduce((sum, audit) => {
            const inicio = new Date(audit.date_start);
            const fin = new Date(audit.date_end);
            const dias = (fin - inicio) / (1000 * 60 * 60 * 24);
            return sum + Math.abs(dias);
        }, 0);
        
        return (totalDias / audits.length).toFixed(1);
    }
    
    /**
     * Calcular tasa de remediación
     */
    async _calcularTasaRemediacion(filter) {
        const vulnStats = await this._countVulnerabilities(filter);
        
        if (vulnStats.total === 0) return 0;
        
        return ((vulnStats.remediadas / vulnStats.total) * 100).toFixed(0);
    }
    
    /**
     * Tendencia mensual - Global
     */
    async _getTendenciaMensual(year) {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const results = await Audit.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
                    }
                }
            },
            {
                $project: {
                    month: { $month: '$createdAt' },
                    findingsCount: { $size: { $ifNull: ['$findings', []] } },
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$month',
                    evaluaciones: { $sum: 1 },
                    vulnerabilidades: { $sum: '$findingsCount' },
                    findings: { $push: '$findings' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        return meses.map((mes, index) => {
            const mesData = results.find(r => r._id === index + 1);
            
            if (!mesData) {
                return { mes, evaluaciones: 0, vulnerabilidades: 0, remediadas: 0, noRemediadas: 0, parciales: 0 };
            }
            
            // Contar por retestStatus
            let remediadas = 0, noRemediadas = 0, parciales = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    findingsArray.forEach(f => {
                        switch (f.retestStatus) {
                            case 'ok': remediadas++; break;
                            case 'ko': noRemediadas++; break;
                            case 'partial': parciales++; break;
                        }
                    });
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas,
                noRemediadas,
                parciales
            };
        });
    }
    
    /**
     * Tendencia mensual - Por compañía
     */
    async _getTendenciaMensualCompany(year, companyId) {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const results = await Audit.aggregate([
            {
                $match: {
                    company: companyId,
                    createdAt: {
                        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
                    }
                }
            },
            {
                $project: {
                    month: { $month: '$createdAt' },
                    findingsCount: { $size: { $ifNull: ['$findings', []] } },
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$month',
                    evaluaciones: { $sum: 1 },
                    vulnerabilidades: { $sum: '$findingsCount' },
                    findings: { $push: '$findings' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        return meses.map((mes, index) => {
            const mesData = results.find(r => r._id === index + 1);
            
            if (!mesData) {
                return { mes, evaluaciones: 0, vulnerabilidades: 0, remediadas: 0, noRemediadas: 0, parciales: 0 };
            }
            
            // Contar por retestStatus
            let remediadas = 0, noRemediadas = 0, parciales = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    findingsArray.forEach(f => {
                        switch (f.retestStatus) {
                            case 'ok': remediadas++; break;
                            case 'ko': noRemediadas++; break;
                            case 'partial': parciales++; break;
                        }
                    });
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas,
                noRemediadas,
                parciales
            };
        });
    }
    
    /**
     * Estado por entidad (Company) con progreso de verificación
     * CORREGIDO: Usa company.name en lugar de client.firstname/lastname
     * CORREGIDO: Usa retestStatus para calcular remediación
     */
    async _getEntidadesEvaluadas(filter) {
        const results = await Audit.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company',
                    foreignField: '_id',
                    as: 'companyInfo'
                }
            },
            { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'auditstatus',
                    localField: '_id',
                    foreignField: 'auditId',
                    as: 'statusInfo'
                }
            },
            { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    company: 1,
                    companyName: '$companyInfo.name',
                    companyShortName: '$companyInfo.shortName',
                    state: 1,
                    status: '$statusInfo.status',
                    createdAt: 1,
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$company',
                    nombre: { $first: '$companyName' },
                    nombreCorto: { $first: '$companyShortName' },
                    evaluaciones: { $sum: 1 },
                    ultimaEval: { $max: '$createdAt' },
                    ultimoEstado: { $last: '$status' },
                    estado: { $last: '$state' },
                    allFindings: { $push: '$findings' }
                }
            },
            { $sort: { evaluaciones: -1 } }
        ]);
        
        // Enriquecer con progreso de verificación usando retestStatus
        const entidadesConProgreso = await Promise.all(
            results.map(async (item, index) => {
                let vulnCriticas = 0, vulnAltas = 0, totalVulns = 0;
                // Contadores de retestStatus
                let remediadas = 0, noRemediadas = 0, parciales = 0, sinVerificar = 0;
                
                // Contar vulnerabilidades
                item.allFindings.forEach(findings => {
                    if (findings && Array.isArray(findings)) {
                        findings.forEach(f => {
                            totalVulns++;
                            const score = this._extractCVSSScore(f.cvssv3 || f.cvssv4);
                            if (score >= 9.0) vulnCriticas++;
                            else if (score >= 7.0) vulnAltas++;
                            
                            // Usar retestStatus para remediación
                            switch (f.retestStatus) {
                                case 'ok':
                                    remediadas++;
                                    break;
                                case 'ko':
                                    noRemediadas++;
                                    break;
                                case 'partial':
                                    parciales++;
                                    break;
                                default:
                                    sinVerificar++;
                                    break;
                            }
                        });
                    }
                });
                
                const tasaRemediacion = totalVulns > 0 
                    ? Math.round((remediadas / totalVulns) * 100)
                    : 0;
                
                return {
                    id: index + 1,
                    nombre: item.nombre || item.nombreCorto || 'Sin nombre',
                    nombreCorto: item.nombreCorto || '',
                    evaluaciones: item.evaluaciones,
                    vulnCriticas,
                    vulnAltas,
                    // Estadísticas de verificación
                    totalVulnerabilidades: totalVulns,
                    remediadas,      // retestStatus === 'ok'
                    noRemediadas,    // retestStatus === 'ko'  
                    parciales,       // retestStatus === 'partial'
                    sinVerificar,    // sin retestStatus
                    estado: item.ultimoEstado || item.estado || 'Sin estado',
                    ultimaEval: item.ultimaEval ? item.ultimaEval.toISOString().split('T')[0] : 'N/A',
                    tasaRemediacion
                };
            })
        );
        
        return entidadesConProgreso;
    }
    
    /**
     * Evaluaciones recientes - Global
     * CORREGIDO: Usar company.name en lugar de client.firstname/lastname
     * AGREGADO: companyId para poder abrir modal de estadísticas
     */
    async _getEvaluacionesRecientes() {
        const audits = await Audit.find()
            .sort({ createdAt: -1 })
            .populate('company', 'name shortName')
            .select('name createdAt company');
        
        // Enriquecer con datos de AuditProcedure y AuditStatus
        const evaluacionesConDatos = await Promise.all(
            audits.map(async (audit) => {
                const procedure = await AuditProcedure.findOne({ auditId: audit._id })
                    .select('origen notaExterna informe');
                
                const status = await AuditStatus.findOne({ auditId: audit._id })
                    .select('status');
                
                return {
                    id: audit._id,
                    companyId: audit.company?._id || null,
                    entidad: audit.company?.name || audit.company?.shortName || 'Sin entidad',
                    tipo: procedure?.origen || 'Sin tipo',
                    estado: status?.status || 'Sin estado',
                    fechaInicio: audit.createdAt.toISOString().split('T')[0],
                    notaExterna: procedure?.notaExterna || null,
                    citeInforme: procedure?.informe?.cite || null
                };
            })
        );
        
        return evaluacionesConDatos;
    }
    
    /**
     * Evaluaciones recientes - Por compañía
     * CORREGIDO: Usar company.name en lugar de client
     */
    async _getEvaluacionesRecientesCompany(companyId) {
        const audits = await Audit.find({ company: companyId })
            .sort({ createdAt: -1 })
            .populate('company', 'name shortName')
            .select('name createdAt company');
        
        const evaluacionesConDatos = await Promise.all(
            audits.map(async (audit) => {
                const procedure = await AuditProcedure.findOne({ auditId: audit._id })
                    .select('origen notaExterna informe');
                
                const status = await AuditStatus.findOne({ auditId: audit._id })
                    .select('status');
                
                return {
                    id: audit._id,
                    entidad: audit.company?.name || audit.company?.shortName || 'Sin entidad',
                    tipo: procedure?.origen || 'Sin tipo',
                    estado: status?.status || 'Sin estado',
                    fechaInicio: audit.createdAt.toISOString().split('T')[0],
                    notaExterna: procedure?.notaExterna || null,
                    citeInforme: procedure?.informe?.cite || null
                };
            })
        );
        
        return evaluacionesConDatos;
    }
    
    /**
     * Alertas activas
     */
    async _getAlertasActivas(filter) {
        const vulnStats = await this._countVulnerabilities(filter);
        const alertas = [];
        
        if (vulnStats.criticas > 0) {
            alertas.push({
                tipo: 'critica',
                mensaje: `${vulnStats.criticas} vulnerabilidades críticas sin mitigar detectadas`,
                fecha: new Date().toISOString().split('T')[0]
            });
        }
        
        if (vulnStats.altas > 50) {
            alertas.push({
                tipo: 'alta',
                mensaje: `${vulnStats.altas} vulnerabilidades de severidad alta requieren atención`,
                fecha: new Date().toISOString().split('T')[0]
            });
        }
        
        // Verificar evaluaciones atrasadas
        const atrasadas = await Audit.countDocuments({
            ...filter,
            date_end: { $lt: new Date() },
            state: 'EDIT'
        });
        
        if (atrasadas > 0) {
            alertas.push({
                tipo: 'media',
                mensaje: `${atrasadas} evaluaciones con fecha de finalización vencida`,
                fecha: new Date().toISOString().split('T')[0]
            });
        }
        
        return alertas;
    }
    
    /**
     * Información de compañía
     */
    async _getCompanyInfo(companyId) {
        const company = await Company.findById(companyId)
            .select('name shortName logo');
        
        return {
            id: company._id,
            name: company.name,
            shortName: company.shortName,
            logo: company.logo
        };
    }
    
    /**
     * Clientes asociados a compañía
     */
    async _getClientesAsociados(companyId) {
        const clients = await Client.find({ company: companyId })
            .select('firstname lastname email');
        
        return clients.map(client => ({
            id: client._id,
            nombre: `${client.firstname} ${client.lastname}`,
            email: client.email
        }));
    }
    
    /**
     * Obtener nombre del procedimiento
     */
    _getNombreProcedimiento(codigo) {
        const nombres = {
            'PR01': 'Solicitud Entidades',
            'PR02': 'Interna AGETIC',
            'PR03': 'Externa',
            'PR09': 'Solicitud AGETIC'
        };
        return nombres[codigo] || codigo;
    }
}

module.exports = new AnalyticsService();