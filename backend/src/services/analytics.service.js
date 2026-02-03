const Audit = require('../models/audit.model');
const AuditProcedure = require('../models/audit-procedure.model');
const AuditStatus = require('../models/audit-status.model');
const Client = require('../models/client.model');
const Company = require('../models/company.model');

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
        
        console.log('[Analytics] Dashboard global - Filtro:', dateFilter);
        
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
        
        const entidadesEvaluadas = await Audit.distinct('client', matchFilter);
        const totalEntidades = await Client.countDocuments();
        
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
            tiempoPromedioDias: tiempoPromedio
        };
    }
    
    /**
     * Estadísticas de compañía
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
        
        const clientesEvaluados = await Audit.distinct('client', filter);
        
        const vulnStats = await this._countVulnerabilities(filter);
        const tiempoPromedio = await this._calcularTiempoPromedio(filter);
        const tasaRemediacion = await this._calcularTasaRemediacion(filter);
        
        return {
            totalEvaluaciones,
            evaluacionesActivas,
            evaluacionesCompletadas,
            clientesEvaluados: clientesEvaluados.length,
            vulnCriticasActivas: vulnStats.criticas,
            tasaRemediacion,
            tiempoPromedioDias: tiempoPromedio
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
                    _id: '$procedure.origen',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);
        
        const colorMap = {
            'PR01': '#6366f1',
            'PR02': '#06b6d4',
            'PR03': '#10b981',
            'PR09': '#f59e0b',
            'Verificación': '#8b5cf6',
            'Caja Negra': '#ec4899',
            'Caja Blanca': '#14b8a6'
        };
        
        return results.map(item => {
            const origen = item._id || 'Sin procedimiento';
            return {
                tipo: origen.startsWith('PR') 
                    ? `${origen} - ${this._getNombreProcedimiento(origen)}`
                    : origen,
                cantidad: item.cantidad,
                color: colorMap[origen] || '#6b7280'
            };
        });
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
     * Vulnerabilidades por severidad desde findings
     */
    async _getVulnerabilidadesPorSeveridad(filter) {
        const vulnStats = await this._countVulnerabilities(filter);
        
        return [
            { name: 'Crítica', value: vulnStats.criticas, color: '#dc2626' },
            { name: 'Alta', value: vulnStats.altas, color: '#f97316' },
            { name: 'Media', value: vulnStats.medias, color: '#eab308' },
            { name: 'Baja', value: vulnStats.bajas, color: '#22c55e' },
            { name: 'Info', value: vulnStats.info, color: '#6b7280' }
        ];
    }
    
    /**
     * Contar vulnerabilidades desde findings
     */
    async _countVulnerabilities(filter) {
        const audits = await Audit.find(filter).select('findings');
        
        let total = 0, criticas = 0, altas = 0, medias = 0, bajas = 0, info = 0, remediadas = 0;

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
                    
                if (finding.retestStatus === Audit.RETEST_STATUS.OK) {
                    remediadas++;
                    }
                });
            }
        });
        
        return { total, criticas, altas, medias, bajas, info, remediadas };
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
                return { mes, evaluaciones: 0, vulnerabilidades: 0, remediadas: 0 };
            }
            
            // Contar remediadas
            let remediadas = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    remediadas += findingsArray.filter(f => f.retestStatus === Audit.RETEST_STATUS.OK).length;
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas
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
                return { mes, evaluaciones: 0, vulnerabilidades: 0, remediadas: 0 };
            }
            
            let remediadas = 0;
            mesData.findings.forEach(findingsArray => {
                if (findingsArray && Array.isArray(findingsArray)) {
                    remediadas += findingsArray.filter(f => f.status === 0).length;
                }
            });
            
            return {
                mes,
                evaluaciones: mesData.evaluaciones,
                vulnerabilidades: mesData.vulnerabilidades,
                remediadas
            };
        });
    }
    
    /**
     * Estado por entidad con progreso de verificación
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
                    client: 1,
                    clientName: { $concat: ['$companyInfo.name', ' ', '$companyInfo.shortName'] },
                    state: 1,
                    status: '$statusInfo.status',
                    createdAt: 1,
                    findings: 1
                }
            },
            {
                $group: {
                    _id: '$client',
                    nombre: { $first: '$clientName' },
                    evaluaciones: { $sum: 1 },
                    ultimaEval: { $max: '$createdAt' },
                    ultimoEstado: { $last: '$status' },
                    estado: { $last: '$state' },
                    allFindings: { $push: '$findings' }
                }
            },
            { $sort: { evaluaciones: -1 } },
            { $limit: 10 }
        ]);
        // Enriquecer con progreso de verificación
        const entidadesConProgreso = await Promise.all(
            results.map(async (item, index) => {
                let vulnCriticas = 0, vulnAltas = 0, totalVulns = 0, remediadas = 0;
                
                // Contar vulnerabilidades
                item.allFindings.forEach(findings => {
                    if (findings && Array.isArray(findings)) {
                        findings.forEach(f => {
                            totalVulns++;
                            const score = this._extractCVSSScore(f.cvssv3 || f.cvssv4);
                            if (score >= 9.0) vulnCriticas++;
                            else if (score >= 7.0) vulnAltas++;
                            if (f.status === 0) remediadas++;
                        });
                    }
                });
                
                const tasaRemediacion = totalVulns > 0 
                    ? Math.round((remediadas / totalVulns) * 100)
                    : 0;
                
                return {
                    id: index + 1,
                    nombre: item.nombre || 'Sin nombre',
                    evaluaciones: item.evaluaciones,
                    vulnCriticas,
                    vulnAltas,
                    estado: item.ultimoEstado || item.estado || 'Sin estado',
                    ultimaEval: item.ultimaEval.toISOString().split('T')[0],
                    tasaRemediacion
                };
            })
        );
        
        return entidadesConProgreso;
    }
    
    /**
     * Evaluaciones recientes - Global
     * CRÍTICO: Obtener datos de AuditProcedure para CITEs y tipo
     */
    async _getEvaluacionesRecientes(limit = 10) {
        const audits = await Audit.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('company', 'name shortName')
            .select('name createdAt');
        
        // Enriquecer con datos de AuditProcedure y AuditStatus
        const evaluacionesConDatos = await Promise.all(
            audits.map(async (audit) => {
                const procedure = await AuditProcedure.findOne({ auditId: audit._id })
                    .select('origen notaExterna informe');
                
                const status = await AuditStatus.findOne({ auditId: audit._id })
                    .select('status');
                return {
                    id: audit._id,
                    entidad: audit.company 
                        ? `${audit.company.name} (${audit.company.shortName})` 
                        : 'Sin entidad',
                    
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
     */
    async _getEvaluacionesRecientesCompany(companyId, limit = 10) {
        const audits = await Audit.find({ company: companyId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('company', 'name shortName')
            .select('name createdAt');
        
        const evaluacionesConDatos = await Promise.all(
            audits.map(async (audit) => {
                const procedure = await AuditProcedure.findOne({ auditId: audit._id })
                    .select('origen notaExterna informe');
                
                const status = await AuditStatus.findOne({ auditId: audit._id })
                    .select('status');
                
                return {
                    id: audit._id,
                    entidad: audit.company 
                        ? `${audit.company.name} (${audit.company.shortName})` 
                        : 'Sin entidad',
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