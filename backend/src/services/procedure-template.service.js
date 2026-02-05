const ProcedureTemplate = require('../models/procedure-template.model');
const AuditProcedure = require('../models/audit-procedure.model');

/**
 * Constantes de configuración
 */
const DEFAULT_COLOR = '#6b7280';
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Valida y normaliza un color hexadecimal
 * @param {string} color - Color a validar
 * @returns {string} - Color válido o default
 */
const validateHexColor = (color) => {
    if (!color || typeof color !== 'string') {
        return DEFAULT_COLOR;
    }
    
    const trimmed = color.trim();
    
    // Si es válido, devolverlo normalizado
    if (HEX_COLOR_REGEX.test(trimmed)) {
        return trimmed.toLowerCase();
    }
    
    return DEFAULT_COLOR;
};

/**
 * ProcedureTemplateService
 * 
 * Lógica de negocio para el manejo de plantillas de procedimientos.
 * Solo administradores pueden crear/editar/eliminar.
 */
class ProcedureTemplateService {
    /**
     * Obtiene todas las plantillas
     * @param {Object} filters - Filtros opcionales
     * @param {boolean} filters.isActive - Filtrar por estado activo
     * @param {string} filters.search - Búsqueda por texto
     */
    static async getAll(filters = {}) {
        const query = {};
        
        // Filtrar por estado activo
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        
        // Búsqueda por texto
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }
        
        return await ProcedureTemplate.find(query)
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname')
            .sort({ code: 1 });
    }

    /**
     * Obtiene solo las plantillas activas (para selección en formularios)
     */
    static async getActive() {
        return await ProcedureTemplate.find({ isActive: true })
            .select('name code description')
            .sort({ code: 1 });
    }

    /**
     * Obtiene una plantilla por ID
     */
    static async getById(id) {
        const template = await ProcedureTemplate.findById(id)
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        return template;
    }

    /**
     * Obtiene una plantilla por código
     */
    static async getByCode(code) {
        const template = await ProcedureTemplate.findByCode(code);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        return template;
    }

    /**
     * Crea una nueva plantilla (solo admin)
     * @param {Object} data - Datos de la plantilla
     * @param {string} data.name - Nombre requerido
     * @param {string} data.code - Código único requerido
     * @param {string} [data.description] - Descripción opcional
     * @param {string} [data.color] - Color hex opcional (default: gris)
     * @param {boolean} [data.isActive=true] - Estado activo
     * @param {string} userId - ID del usuario creador
     */
    static async create(data, userId) {
        // Validar campos requeridos
        if (!data.code || typeof data.code !== 'string') {
            throw { fn: 'BadParameters', message: 'Code is required and must be a string' };
        }
        
        if (!data.name || typeof data.name !== 'string') {
            throw { fn: 'BadParameters', message: 'Name is required and must be a string' };
        }
        
        const normalizedCode = data.code.trim().toUpperCase();
        
        // Verificar que el código no exista
        const existing = await ProcedureTemplate.findOne({ code: normalizedCode });
        
        if (existing) {
            throw { fn: 'BadParameters', message: 'A template with this code already exists' };
        }
        
        const templateData = {
            name: data.name.trim(),
            code: normalizedCode,
            description: data.description?.trim() || '',
            color: validateHexColor(data.color),
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdBy: userId
        };
        
        const template = new ProcedureTemplate(templateData);
        await template.save();
        
        return template;
    }

    /**
     * Actualiza una plantilla (solo admin)
     * @param {string} id - ID de la plantilla
     * @param {Object} data - Campos a actualizar
     * @param {string} userId - ID del usuario que actualiza
     */
    static async update(id, data, userId) {
        const template = await ProcedureTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        // Si se cambia el código, verificar que no exista
        if (data.code !== undefined) {
            const normalizedCode = data.code.trim().toUpperCase();
            
            if (normalizedCode !== template.code) {
                const existing = await ProcedureTemplate.findOne({ 
                    code: normalizedCode,
                    _id: { $ne: id }
                });
                
                if (existing) {
                    throw { fn: 'BadParameters', message: 'A template with this code already exists' };
                }
                
                template.code = normalizedCode;
            }
        }
        
        // Actualizar campos permitidos con validación
        if (data.name !== undefined) {
            template.name = data.name.trim();
        }
        if (data.description !== undefined) {
            template.description = data.description.trim();
        }
        if (data.color !== undefined) {
            template.color = validateHexColor(data.color);
        }
        if (data.isActive !== undefined) {
            template.isActive = Boolean(data.isActive);
        }
        
        template.updatedBy = userId;
        
        await template.save();
        
        return template;
    }

    /**
     * Activa/desactiva una plantilla (solo admin)
     */
    static async toggleActive(id, userId) {
        const template = await ProcedureTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        template.isActive = !template.isActive;
        template.updatedBy = userId;
        
        await template.save();
        
        return template;
    }

    /**
     * Elimina una plantilla (solo admin)
     * Nota: Solo se permite si no hay auditorías usando este código
     * @param {string} id - ID de la plantilla a eliminar
     */
    static async delete(id) {
        const template = await ProcedureTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        // Verificar si hay procedimientos usando este código
        const usageCount = await AuditProcedure.countDocuments({ origen: template.code });
        
        if (usageCount > 0) {
            throw { 
                fn: 'BadParameters', 
                message: `Cannot delete: ${usageCount} audit(s) are using this procedure template. Consider deactivating instead.` 
            };
        }
        
        await ProcedureTemplate.findByIdAndDelete(id);
        
        return { message: 'Procedure template deleted successfully' };
    }

    /**
     * Obtiene estadísticas de uso de plantillas
     * Optimizado con Map para O(n) en lugar de O(n²)
     * @returns {Object} Estadísticas de templates
     */
    static async getStats() {
        // Ejecutar ambas queries en paralelo
        const [usageStats, templates] = await Promise.all([
            AuditProcedure.aggregate([
                { $group: { _id: '$origen', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ProcedureTemplate.find().select('name code color isActive').lean()
        ]);
        
        // Crear Map para lookup O(1)
        const usageMap = new Map(
            usageStats.map(stat => [stat._id, stat.count])
        );
        
        // Combinar datos con lookup eficiente
        const stats = templates.map(template => ({
            id: template._id,
            code: template.code,
            name: template.name,
            color: template.color,
            isActive: template.isActive,
            usageCount: usageMap.get(template.code) || 0
        }));
        
        return {
            total: templates.length,
            active: templates.filter(t => t.isActive).length,
            inactive: templates.filter(t => !t.isActive).length,
            templates: stats
        };
    }

    /**
     * Colores por defecto para procedimientos estándar
     * Usado como referencia para inicialización y sincronización
     */
    static DEFAULT_COLORS = {
        'PR01': '#2563eb',      // Azul - Solicitud Entidades
        'PR02': '#16a34a',      // Verde - Interna AGETIC
        'PR03': '#db2777',      // Rosa - Externa
        'PR09': '#d97706',      // Amber - Solicitud AGETIC
        'VERIF-001': '#14b8a6', // Teal - Verificación
        'RETEST-001': '#8b5cf6' // Púrpura - Retest
    };

    /**
     * Inicializa plantillas por defecto si no existen
     */
    static async initializeDefaults(userId) {
        const defaults = [
            {
                code: 'PR01',
                name: 'Evaluación por Solicitud de Entidades',
                description: 'Procedimiento para evaluaciones de seguridad solicitadas por entidades externas al AGETIC.',
                color: this.DEFAULT_COLORS['PR01']
            },
            {
                code: 'PR02',
                name: 'Evaluación Interna AGETIC',
                description: 'Procedimiento para evaluaciones de seguridad internas realizadas por iniciativa del AGETIC.',
                color: this.DEFAULT_COLORS['PR02']
            },
            {
                code: 'PR03',
                name: 'Evaluación Externa',
                description: 'Procedimiento para evaluaciones de seguridad de sistemas externos o de terceros.',
                color: this.DEFAULT_COLORS['PR03']
            },
            {
                code: 'PR09',
                name: 'Evaluación por Solicitud AGETIC',
                description: 'Procedimiento para evaluaciones de seguridad solicitadas internamente por áreas del AGETIC.',
                color: this.DEFAULT_COLORS['PR09']
            },
            {
                code: 'VERIF-001',
                name: 'Verificación',
                description: 'Verificación para la evaluación de seguridad en aplicaciones web.',
                color: this.DEFAULT_COLORS['VERIF-001']
            },
            {
                code: 'RETEST-001',
                name: 'Retest',
                description: 'Retest para la reevaluación de vulnerabilidades previamente identificadas.',
                color: this.DEFAULT_COLORS['RETEST-001']
            }
        ];
        
        const created = [];
        const updated = [];
        
        for (const template of defaults) {
            const exists = await ProcedureTemplate.findOne({ code: template.code });
            
            if (!exists) {
                const newTemplate = await this.create(template, userId);
                created.push(newTemplate);
            } else if (!exists.color || !HEX_COLOR_REGEX.test(exists.color)) {
                // Actualizar templates existentes sin color válido
                exists.color = template.color;
                exists.updatedBy = userId;
                await exists.save();
                updated.push(exists);
            }
        }
        
        return {
            message: `Initialized ${created.length} templates, updated ${updated.length} with missing colors`,
            created,
            updated
        };
    }

    /**
     * Sincroniza colores de todos los templates existentes
     * Útil para migración de datos legacy
     */
    static async syncColors(userId) {
        const templates = await ProcedureTemplate.find({});
        const updated = [];
        
        for (const template of templates) {
            const defaultColor = this.DEFAULT_COLORS[template.code];
            
            // Si no tiene color válido y hay un default, actualizar
            if ((!template.color || !HEX_COLOR_REGEX.test(template.color)) && defaultColor) {
                template.color = defaultColor;
                template.updatedBy = userId;
                await template.save();
                updated.push({ code: template.code, newColor: defaultColor });
            }
        }
        
        return {
            message: `Synchronized colors for ${updated.length} templates`,
            updated
        };
    }
}

module.exports = ProcedureTemplateService;
