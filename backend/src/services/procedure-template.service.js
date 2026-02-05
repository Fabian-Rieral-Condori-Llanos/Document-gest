const ProcedureTemplate = require('../models/procedure-template.model');

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
     */
    static async create(data, userId) {
        // Verificar que el código no exista
        const existing = await ProcedureTemplate.findOne({ 
            code: data.code.toUpperCase() 
        });
        
        if (existing) {
            throw { fn: 'BadParameters', message: 'A template with this code already exists' };
        }
        
        const templateData = {
            name: data.name,
            code: data.code.toUpperCase(),
            description: data.description || '',
            color: data.color || '#6b7280',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdBy: userId
        };
        
        const template = new ProcedureTemplate(templateData);
        await template.save();
        
        return template;
    }

    /**
     * Actualiza una plantilla (solo admin)
     */
    static async update(id, data, userId) {
        const template = await ProcedureTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        // Si se cambia el código, verificar que no exista
        if (data.code && data.code.toUpperCase() !== template.code) {
            const existing = await ProcedureTemplate.findOne({ 
                code: data.code.toUpperCase(),
                _id: { $ne: id }
            });
            
            if (existing) {
                throw { fn: 'BadParameters', message: 'A template with this code already exists' };
            }
            
            template.code = data.code.toUpperCase();
        }
        
        // Actualizar campos permitidos
        if (data.name !== undefined) template.name = data.name;
        if (data.description !== undefined) template.description = data.description;
        if (data.color !== undefined) template.color = data.color;
        if (data.isActive !== undefined) template.isActive = data.isActive;
        
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
     */
    static async delete(id) {
        const template = await ProcedureTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Procedure template not found' };
        }
        
        // Verificar si hay procedimientos usando este código
        const AuditProcedure = require('../models/audit-procedure.model');
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
     */
    static async getStats() {
        const AuditProcedure = require('../models/audit-procedure.model');
        
        // Contar uso por código de procedimiento
        const usageStats = await AuditProcedure.aggregate([
            {
                $group: {
                    _id: '$origen',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Obtener todas las plantillas
        const templates = await ProcedureTemplate.find().select('name code isActive');
        
        // Combinar datos
        const stats = templates.map(template => {
            const usage = usageStats.find(u => u._id === template.code);
            return {
                id: template._id,
                code: template.code,
                name: template.name,
                color: template.color,
                isActive: template.isActive,
                usageCount: usage ? usage.count : 0
            };
        });
        
        return {
            total: templates.length,
            active: templates.filter(t => t.isActive).length,
            inactive: templates.filter(t => !t.isActive).length,
            templates: stats
        };
    }

    /**
     * Inicializa plantillas por defecto si no existen
     */
    static async initializeDefaults(userId) {
        const defaults = [
            {
                code: 'PR01',
                name: 'Evaluación por Solicitud de Entidades',
                description: 'Procedimiento para evaluaciones de seguridad solicitadas por entidades externas al AGETIC.',
                color: '#2563eb'
            },
            {
                code: 'PR02',
                name: 'Evaluación Interna AGETIC',
                description: 'Procedimiento para evaluaciones de seguridad internas realizadas por iniciativa del AGETIC.',
                color: '#16a34a'
            },
            {
                code: 'PR03',
                name: 'Evaluación Externa',
                description: 'Procedimiento para evaluaciones de seguridad de sistemas externos o de terceros.',
                color: '#db2777'
            },
            {
                code: 'PR09',
                name: 'Evaluación por Solicitud AGETIC',
                description: 'Procedimiento para evaluaciones de seguridad solicitadas internamente por áreas del AGETIC.',
                color: '#d97706'
            },
            {
                code: 'VERIF-001',
                name: 'Verificación',
                description: 'Verificación para la evaluación de seguridad en aplicaciones web.',
                color: '#14b8a6'
            },
            {
                code: 'RETEST-001',
                name: 'Retest',
                description: 'Retest para la reevaluación de vulnerabilidades previamente identificadas.',
                color: '#8b5cf6'
            }
        ];
        
        const created = [];
        
        for (const template of defaults) {
            const exists = await ProcedureTemplate.findOne({ code: template.code });
            
            if (!exists) {
                const newTemplate = await this.create(template, userId);
                created.push(newTemplate);
            }
        }
        
        return {
            message: `Initialized ${created.length} default templates`,
            created
        };
    }
}

module.exports = ProcedureTemplateService;
