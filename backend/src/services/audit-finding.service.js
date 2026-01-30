const mongoose = require('mongoose');
const Audit = mongoose.model('Audit');

/**
 * Audit Finding Service
 * 
 * Maneja todas las operaciones relacionadas con findings/hallazgos
 * dentro de una auditoría.
 * 
 * FLUJO DE FINDINGS:
 * ==================
 * 1. Crear finding con datos básicos
 * 2. Editar/completar información (title, description, remediation, CVSS, etc.)
 * 3. Marcar estado (redacting=1, done=0)
 * 4. En verificaciones: actualizar retestStatus (ok, ko, partial, unknown)
 * 
 * SEVERIDADES (basadas en CVSS):
 * - Crítica: 9.0 - 10.0
 * - Alta: 7.0 - 8.9
 * - Media: 4.0 - 6.9
 * - Baja: 0.1 - 3.9
 * - Informativa: 0.0
 */
class AuditFindingService {
    
    // ============================================
    // CONSULTAS
    // ============================================

    /**
     * Obtiene todos los findings de una auditoría
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {Object} options - Opciones de filtrado
     */
    static async getAll(isAdmin, auditId, userId, options = {}) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('findings sortFindings type');
        query.populate({
            path: 'findings.customFields.customField',
            select: 'label fieldType text'
        });

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        let findings = audit.findings;

        // Aplicar filtros opcionales
        if (options.category) {
            findings = findings.filter(f => f.category === options.category);
        }
        if (options.status !== undefined) {
            findings = findings.filter(f => f.status === options.status);
        }
        if (options.retestStatus) {
            findings = findings.filter(f => f.retestStatus === options.retestStatus);
        }
        if (options.severity) {
            findings = findings.filter(f => 
                this._getSeverityFromCvss(f.cvssv3 || f.cvssv4) === options.severity
            );
        }

        return {
            findings,
            sortFindings: audit.sortFindings,
            total: audit.findings.length,
            filtered: findings.length,
            auditType: audit.type
        };
    }

    /**
     * Obtiene un finding específico
     */
    static async getById(isAdmin, auditId, userId, findingId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('findings type');
        query.populate({
            path: 'findings.customFields.customField',
            select: 'label fieldType text'
        });

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }
        console.log(`[Finding] Audit found. Total findings: ${audit.findings.length}`);
        const finding = audit.findings.id(findingId);
        if (!finding) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        // Agregar información calculada
        const findingObj = finding.toObject();
        findingObj.severity = this._getSeverityFromCvss(finding.cvssv3 || finding.cvssv4);
        findingObj.cvssScore = this._extractCvssScore(finding.cvssv3 || finding.cvssv4);

        return findingObj;
    }

    /**
     * Obtiene el siguiente identificador disponible para findings
     */
    static async getNextIdentifier(auditId) {
        const result = await Audit.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(auditId) } },
            { $unwind: { path: '$findings', preserveNullAndEmptyArrays: true } },
            { $sort: { 'findings.identifier': -1 } },
            { $limit: 1 },
            { $project: { lastIdentifier: '$findings.identifier' } }
        ]);

        if (!result.length || result[0].lastIdentifier === undefined) {
            return 1;
        }

        return result[0].lastIdentifier + 1;
    }

    // ============================================
    // OPERACIONES CRUD
    // ============================================

    /**
     * Crea un nuevo finding
     */
    static async create(isAdmin, auditId, userId, findingData) {
        // Obtener el siguiente identificador
        const identifier = await this.getNextIdentifier(auditId);
        findingData.identifier = identifier;
        findingData.id = new mongoose.Types.ObjectId();

        // Inicializar campos de retest si no existen
        if (!findingData.retestStatus) {
            findingData.retestStatus = 'unknown';
        }
        if (!findingData.retestDescription) {
            findingData.retestDescription = '';
        }

        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        audit.findings.push(findingData);

        // Auto-ordenar si está configurado
        const sortOption = audit.sortFindings?.find(
            s => s.category === (findingData.category || 'No Category')
        );

        await audit.save();

        if (sortOption?.sortAuto) {
            await this.sortFindings(auditId, audit.sortFindings);
        }

        console.log(`[Finding] Created finding ${findingData.id} in audit ${auditId}`);

        return {
            message: 'Finding created successfully',
            findingId: findingData.id,
            identifier: findingData.identifier
        };
    }

    /**
     * Actualiza un finding
     */
    static async update(isAdmin, auditId, userId, findingId, updateData) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const finding = audit.findings.id(findingId);
        if (!finding) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        // Campos actualizables (vulnerabilityId NO es editable, es solo referencia)
        const allowedFields = [
            'title', 
            'vulnType', 
            'description', 
            'observation', 
            'remediation',
            'remediationComplexity', 
            'priority', 
            'references', 
            'cvssv3', 
            'cvssv4',
            'paragraphs', 
            'poc', 
            'scope', 
            'status', 
            'category', 
            'customFields',
            'retestStatus', 
            'retestDescription'
            // NOTA: vulnerabilityId NO está aquí porque es inmutable (referencia al original)
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                finding[field] = updateData[field];
            }
        });

        // Verificar si necesita auto-ordenar
        const sortOption = audit.sortFindings?.find(
            s => s.category === (finding.category || 'No Category')
        );

        await audit.save({ validateBeforeSave: false });

        if (sortOption?.sortAuto) {
            await this.sortFindings(auditId, audit.sortFindings);
        }

        return 'Finding updated successfully';
    }

    /**
     * Actualización parcial de un finding (solo campos específicos)
     */
    static async patch(isAdmin, auditId, userId, findingId, patchData) {
        return this.update(isAdmin, auditId, userId, findingId, patchData);
    }

    /**
     * Elimina un finding
     */
    static async delete(isAdmin, auditId, userId, findingId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        query.select('findings');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const finding = audit.findings.id(findingId);
        if (!finding) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        audit.findings.pull(findingId);
        await audit.save();

        console.log(`[Finding] Deleted finding ${findingId} from audit ${auditId}`);

        return 'Finding deleted successfully';
    }

    /**
     * Elimina múltiples findings
     */
    static async deleteMany(isAdmin, auditId, userId, findingIds) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        let deletedCount = 0;
        for (const findingId of findingIds) {
            const finding = audit.findings.id(findingId);
            if (finding) {
                audit.findings.pull(findingId);
                deletedCount++;
            }
        }

        await audit.save();

        return {
            message: `Deleted ${deletedCount} findings`,
            deletedCount
        };
    }

    // ============================================
    // ORDENAMIENTO
    // ============================================

    /**
     * Mueve un finding a una nueva posición
     */
    static async move(isAdmin, auditId, userId, findingId, newIndex) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        // Encontrar índice actual
        const oldIndex = audit.findings.findIndex(
            f => f._id.toString() === findingId || f.id?.toString() === findingId
        );

        if (oldIndex === -1) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        if (newIndex < 0 || newIndex >= audit.findings.length) {
            throw { fn: 'BadParameters', message: 'Invalid index' };
        }

        const finding = audit.findings[oldIndex];
        audit.findings.splice(oldIndex, 1);
        audit.findings.splice(newIndex, 0, finding);

        audit.markModified('findings');
        await audit.save();

        return 'Finding moved successfully';
    }

    /**
     * Ordena los findings según las opciones de ordenamiento
     */
    static async sortFindings(auditId, sortOptions = null) {
        const audit = await Audit.findById(auditId);
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        const options = sortOptions || audit.sortFindings || [];
        const _ = require('lodash');

        // Obtener categorías de vulnerabilidades
        const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
        const categories = await VulnerabilityCategory.find().sort({ sortOrder: 1 });
        const categoryOrder = categories.map(c => c.name);
        categoryOrder.push('undefined'); // No categorizado al final

        // Agrupar por categoría
        const grouped = _.chain(audit.findings)
            .groupBy('category')
            .toPairs()
            .sort((a, b) => categoryOrder.indexOf(a[0]) - categoryOrder.indexOf(b[0]))
            .map(([category, findings]) => {
                const catName = category === 'undefined' ? 'No Category' : category;
                const sortOpt = options.find(o => o.category === catName) ||
                    categories.find(c => c.name === catName) ||
                    { sortValue: 'cvssScore', sortOrder: 'desc', sortAuto: true };

                return { category: catName, findings, sortOption: sortOpt };
            })
            .value();

        // Ordenar cada grupo
        const sortedFindings = [];
        for (const group of grouped) {
            const order = group.sortOption.sortOrder === 'asc' ? 1 : -1;
            const sortValue = group.sortOption.sortValue;

            const sorted = group.findings.sort((a, b) => {
                let left = this._getSortValue(a, sortValue);
                let right = this._getSortValue(b, sortValue);

                return String(left).localeCompare(String(right), undefined, { numeric: true }) * order;
            });

            sortedFindings.push(...sorted);
        }

        audit.findings = sortedFindings;
        await audit.save();

        return 'Findings sorted successfully';
    }

    /**
     * Actualiza las opciones de ordenamiento
     */
    static async updateSortOptions(isAdmin, auditId, userId, sortOptions) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        audit.sortFindings = sortOptions;
        await audit.save();

        // Re-ordenar si es necesario
        const needsSort = sortOptions.some(o => o.sortAuto);
        if (needsSort) {
            await this.sortFindings(auditId, sortOptions);
        }

        return 'Sort options updated successfully';
    }

    // ============================================
    // RETEST / VERIFICACIÓN
    // ============================================

    /**
     * Actualiza el estado de retest de un finding
     */
    static async updateRetestStatus(isAdmin, auditId, userId, findingId, retestData) {
        const validStatuses = ['ok', 'ko', 'partial', 'unknown'];
        
        if (retestData.status && !validStatuses.includes(retestData.status)) {
            throw { 
                fn: 'BadParameters', 
                message: `Invalid retest status. Must be one of: ${validStatuses.join(', ')}` 
            };
        }

        return this.update(isAdmin, auditId, userId, findingId, {
            retestStatus: retestData.status,
            retestDescription: retestData.description
        });
    }

    /**
     * Actualiza el estado de retest de múltiples findings
     */
    static async updateRetestStatusBulk(isAdmin, auditId, userId, updates) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        let updatedCount = 0;
        for (const update of updates) {
            const finding = audit.findings.id(update.findingId);
            if (finding) {
                if (update.status) finding.retestStatus = update.status;
                if (update.description !== undefined) finding.retestDescription = update.description;
                updatedCount++;
            }
        }

        await audit.save({ validateBeforeSave: false });

        return {
            message: `Updated ${updatedCount} findings`,
            updatedCount
        };
    }

    /**
     * Obtiene resumen de retest de todos los findings
     */
    static async getRetestSummary(auditId) {
        const audit = await Audit.findById(auditId).select('findings type');
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        const summary = {
            total: audit.findings.length,
            ok: 0,
            ko: 0,
            partial: 0,
            unknown: 0,
            findings: []
        };

        for (const finding of audit.findings) {
            const status = finding.retestStatus || 'unknown';
            summary[status]++;
            
            summary.findings.push({
                id: finding._id,
                identifier: finding.identifier,
                title: finding.title,
                category: finding.category,
                severity: this._getSeverityFromCvss(finding.cvssv3 || finding.cvssv4),
                retestStatus: status,
                retestDescription: finding.retestDescription || ''
            });
        }

        // Calcular porcentaje de completitud
        summary.completionPercentage = Math.round(
            ((summary.ok + summary.ko + summary.partial) / summary.total) * 100
        ) || 0;

        return summary;
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    /**
     * Obtiene estadísticas de findings
     */
    static async getStats(auditId) {
        const audit = await Audit.findById(auditId).select('findings type');
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        const stats = {
            total: audit.findings.length,
            byStatus: { done: 0, redacting: 0 },
            byCategory: {},
            byRetestStatus: { ok: 0, ko: 0, unknown: 0, partial: 0 },
            bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
            byVulnType: {},
            averageCvss: 0,
            maxCvss: 0
        };

        let cvssSum = 0;
        let cvssCount = 0;

        for (const finding of audit.findings) {
            // Por estado
            if (finding.status === 0) stats.byStatus.done++;
            else stats.byStatus.redacting++;

            // Por categoría
            const cat = finding.category || 'No Category';
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

            // Por tipo de vulnerabilidad
            if (finding.vulnType) {
                stats.byVulnType[finding.vulnType] = (stats.byVulnType[finding.vulnType] || 0) + 1;
            }

            // Por retest status
            const retestStatus = finding.retestStatus || 'unknown';
            stats.byRetestStatus[retestStatus]++;

            // Por severidad (basado en CVSS)
            const cvssVector = finding.cvssv3 || finding.cvssv4;
            const severity = this._getSeverityFromCvss(cvssVector);
            stats.bySeverity[severity]++;

            // Calcular promedio CVSS
            const score = this._extractCvssScore(cvssVector);
            if (score !== null) {
                cvssSum += score;
                cvssCount++;
                if (score > stats.maxCvss) stats.maxCvss = score;
            }
        }

        stats.averageCvss = cvssCount > 0 ? (cvssSum / cvssCount).toFixed(1) : 0;

        return stats;
    }

    // ============================================
    // DUPLICACIÓN E IMPORTACIÓN
    // ============================================

    /**
     * Duplica un finding
     */
    static async duplicate(isAdmin, auditId, userId, findingId) {
        const finding = await this.getById(isAdmin, auditId, userId, findingId);
        
        const newFinding = { ...finding };
        delete newFinding._id;
        delete newFinding.id;
        delete newFinding.identifier;
        newFinding.title = `${newFinding.title} (Copy)`;
        newFinding.status = 1; // Redacting
        newFinding.retestStatus = 'unknown';
        newFinding.retestDescription = '';

        return this.create(isAdmin, auditId, userId, newFinding);
    }

    /**
     * Importa findings desde otra auditoría
     */
    static async importFromAudit(isAdmin, targetAuditId, sourceAuditId, userId, findingIds = null) {
        const sourceAudit = await Audit.findById(sourceAuditId).select('findings');
        if (!sourceAudit) {
            throw { fn: 'NotFound', message: 'Source audit not found' };
        }

        let findingsToImport = sourceAudit.findings;
        if (findingIds && findingIds.length > 0) {
            findingsToImport = findingsToImport.filter(
                f => findingIds.includes(f._id.toString())
            );
        }

        const imported = [];
        for (const finding of findingsToImport) {
            const newFinding = finding.toObject();
            delete newFinding._id;
            delete newFinding.id;
            delete newFinding.identifier;
            newFinding.status = 1; // Redacting
            newFinding.retestStatus = 'unknown';
            newFinding.retestDescription = '';

            const result = await this.create(isAdmin, targetAuditId, userId, newFinding);
            imported.push(result.findingId);
        }

        return {
            message: `Imported ${imported.length} findings`,
            findingIds: imported
        };
    }

    /**
     * Importa findings desde la biblioteca de vulnerabilidades
     * 
     * IMPORTANTE: Crea una COPIA de la vulnerabilidad en el finding.
     * - Guarda vulnerabilityId como referencia al original
     * - Todos los datos son copiados y pueden editarse independientemente
     * - Editar el finding NO afecta la vulnerabilidad original
     * 
     * @param {boolean} isAdmin
     * @param {string} auditId
     * @param {string} userId
     * @param {string[]} vulnerabilityIds - IDs de vulnerabilidades a importar
     * @param {string} language - Idioma preferido para los textos (default: 'es')
     */
    static async importFromVulnerability(isAdmin, auditId, userId, vulnerabilityIds, language = 'es') {
        const Vulnerability = mongoose.model('Vulnerability');
        
        const vulnerabilities = await Vulnerability.find({
            _id: { $in: vulnerabilityIds }
        });

        if (vulnerabilities.length === 0) {
            throw { fn: 'NotFound', message: 'No vulnerabilities found' };
        }

        const imported = [];
        const errors = [];

        for (const vuln of vulnerabilities) {
            try {
                // Obtener el texto en el idioma correcto
                const detail = vuln.details?.find(d => d.locale === language) || vuln.details?.[0];

                if (!detail) {
                    errors.push({ 
                        vulnerabilityId: vuln._id, 
                        error: 'No details found for vulnerability' 
                    });
                    continue;
                }

                // Crear finding como COPIA de la vulnerabilidad
                const findingData = {
                    // Referencia al original (para trazabilidad)
                    vulnerabilityId: vuln._id,
                    
                    // Datos copiados (editables independientemente)
                    title: detail.title || 'Untitled',
                    vulnType: detail.vulnType || vuln.vulnType,
                    description: detail.description || '',
                    observation: detail.observation || '',
                    remediation: detail.remediation || '',
                    references: detail.references || [],
                    customFields: detail.customFields || [],
                    
                    // Datos globales de la vulnerabilidad
                    remediationComplexity: vuln.remediationComplexity,
                    priority: vuln.priority,
                    cvssv3: vuln.cvssv3,
                    cvssv4: vuln.cvssv4,
                    category: vuln.category,
                    
                    // Estado inicial del finding
                    status: 1, // Redacting
                    retestStatus: 'unknown',
                    retestDescription: '',
                    
                    // Campos vacíos para llenar en la auditoría
                    poc: '',
                    scope: '',
                    paragraphs: []
                };

                const result = await this.create(isAdmin, auditId, userId, findingData);
                imported.push({
                    findingId: result.findingId,
                    vulnerabilityId: vuln._id,
                    title: findingData.title
                });
            } catch (err) {
                errors.push({
                    vulnerabilityId: vuln._id,
                    error: err.message || 'Unknown error'
                });
            }
        }

        return {
            message: `Imported ${imported.length} findings from vulnerabilities`,
            imported,
            errors: errors.length > 0 ? errors : undefined,
            total: vulnerabilityIds.length,
            successful: imported.length,
            failed: errors.length
        };
    }

    /**
     * Importa UNA vulnerabilidad a la auditoría
     * Método conveniente para importar una sola vulnerabilidad
     */
    static async importSingleVulnerability(isAdmin, auditId, userId, vulnerabilityId, language = 'es') {
        const result = await this.importFromVulnerability(
            isAdmin, auditId, userId, [vulnerabilityId], language
        );
        
        if (result.imported.length === 0) {
            throw { 
                fn: 'BadParameters', 
                message: result.errors?.[0]?.error || 'Failed to import vulnerability' 
            };
        }

        return {
            message: 'Vulnerability imported successfully',
            findingId: result.imported[0].findingId,
            vulnerabilityId: result.imported[0].vulnerabilityId,
            title: result.imported[0].title
        };
    }

    /**
     * Verifica si un finding proviene de la biblioteca de vulnerabilidades
     */
    static async isFromVulnerabilityLibrary(auditId, findingId) {
        const audit = await Audit.findById(auditId).select('findings');
        if (!audit) return false;

        const finding = audit.findings.find(f => 
            f.id && f.id.toString() === findingId.toString()
        );
        return finding?.vulnerabilityId != null;
    }

    /**
     * Obtiene la vulnerabilidad original de un finding (si existe)
     */
    static async getOriginalVulnerability(auditId, findingId) {
        const audit = await Audit.findById(auditId).select('findings');
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found' };
        }

        const finding = audit.findings.id(findingId);        
        if (!finding) {
            throw { fn: 'NotFound', message: 'Finding not found' };
        }

        if (!finding.vulnerabilityId) {
            return null; // Finding creado manualmente, no de biblioteca
        }

        const Vulnerability = mongoose.model('Vulnerability');
        const vulnerability = await Vulnerability.findById(finding.vulnerabilityId);
        return await Vulnerability.findById(finding.vulnerabilityId);

    }

    // ============================================
    // MÉTODOS PRIVADOS
    // ============================================

    /**
     * Obtiene el valor para ordenamiento
     * @private
     */
    static _getSortValue(finding, sortValue) {
        // Valores CVSS
        if (['cvssScore', 'cvssTemporalScore', 'cvssEnvironmentalScore'].includes(sortValue)) {
            try {
                const cvss = require('ae-cvss-calculator');
                
                if (finding.cvssv4) {
                    const result = new cvss.Cvss4P0(finding.cvssv4).createJsonSchema();
                    if (sortValue === 'cvssScore') return result.baseScore || 0;
                    if (sortValue === 'cvssTemporalScore') return result.threatScore || 0;
                    if (sortValue === 'cvssEnvironmentalScore') return result.environmentalScore || 0;
                } else if (finding.cvssv3) {
                    const result = new cvss.Cvss3P1(finding.cvssv3).createJsonSchema();
                    if (sortValue === 'cvssScore') return result.baseScore || 0;
                    if (sortValue === 'cvssTemporalScore') return result.temporalScore || 0;
                    if (sortValue === 'cvssEnvironmentalScore') return result.environmentalScore || 0;
                }
            } catch (err) {
                return 0;
            }
        }

        // Valor directo del finding
        if (finding[sortValue] !== undefined) {
            return finding[sortValue];
        }

        // Buscar en customFields
        const customField = finding.customFields?.find(
            cf => cf.customField?.label === sortValue
        );
        if (customField) {
            return customField.text || 0;
        }

        return 0;
    }

    /**
     * Extrae el score numérico de un vector CVSS
     * @private
     */
    static _extractCvssScore(cvssVector) {
        if (!cvssVector) return null;

        try {
            const cvss = require('ae-cvss-calculator');
            
            if (cvssVector.startsWith('CVSS:4')) {
                return new cvss.Cvss4P0(cvssVector).createJsonSchema().baseScore || null;
            } else {
                return new cvss.Cvss3P1(cvssVector).createJsonSchema().baseScore || null;
            }
        } catch (err) {
            // Fallback: intentar extraer manualmente
            const match = cvssVector.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : null;
        }
    }

    /**
     * Obtiene severidad desde vector CVSS
     * @private
     */
    static _getSeverityFromCvss(cvssVector) {
        const score = this._extractCvssScore(cvssVector);
        
        if (score === null) return 'info';
        if (score >= 9.0) return 'critical';
        if (score >= 7.0) return 'high';
        if (score >= 4.0) return 'medium';
        if (score >= 0.1) return 'low';
        return 'info';
    }

    /**
     * Obtiene el label de severidad en español
     * @private
     */
    static _getSeverityLabel(severity) {
        const labels = {
            critical: 'Crítica',
            high: 'Alta',
            medium: 'Media',
            low: 'Baja',
            info: 'Informativa'
        };
        return labels[severity] || severity;
    }
}

module.exports = AuditFindingService;