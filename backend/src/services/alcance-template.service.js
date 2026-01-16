const AlcanceTemplate = require('../models/alcance-template.model');

/**
 * AlcanceTemplateService
 * 
 * Lógica de negocio para el manejo de plantillas de alcance.
 * Solo administradores pueden crear/editar/eliminar.
 */
class AlcanceTemplateService {
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
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }
        
        return await AlcanceTemplate.find(query)
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname')
            .sort({ name: 1 });
    }

    /**
     * Obtiene solo las plantillas activas (para selección en formularios)
     */
    static async getActive() {
        return await AlcanceTemplate.find({ isActive: true })
            .select('name description color')
            .sort({ name: 1 });
    }

    /**
     * Obtiene una plantilla por ID
     */
    static async getById(id) {
        const template = await AlcanceTemplate.findById(id)
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Alcance template not found' };
        }
        
        return template;
    }

    /**
     * Obtiene una plantilla por nombre
     */
    static async getByName(name) {
        const template = await AlcanceTemplate.findByName(name);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Alcance template not found' };
        }
        
        return template;
    }

    /**
     * Crea una nueva plantilla (solo admin)
     */
    static async create(data, userId) {
        // Verificar que el nombre no exista
        const existing = await AlcanceTemplate.findByName(data.name);
        
        if (existing) {
            throw { fn: 'BadParameters', message: 'An alcance with this name already exists' };
        }
        
        const templateData = {
            name: data.name.trim(),
            description: data.description || '',
            color: data.color || '#6b7280',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdBy: userId
        };
        
        const template = new AlcanceTemplate(templateData);
        await template.save();
        
        return template;
    }

    /**
     * Actualiza una plantilla (solo admin)
     */
    static async update(id, data, userId) {
        const template = await AlcanceTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Alcance template not found' };
        }
        
        // Si se cambia el nombre, verificar que no exista
        if (data.name && data.name.trim().toLowerCase() !== template.name.toLowerCase()) {
            const existing = await AlcanceTemplate.findOne({ 
                name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
                _id: { $ne: id }
            });
            
            if (existing) {
                throw { fn: 'BadParameters', message: 'An alcance with this name already exists' };
            }
            
            template.name = data.name.trim();
        }
        
        // Actualizar campos permitidos
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
        const template = await AlcanceTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Alcance template not found' };
        }
        
        template.isActive = !template.isActive;
        template.updatedBy = userId;
        
        await template.save();
        
        return template;
    }

    /**
     * Elimina una plantilla (solo admin)
     * Nota: Solo se permite si no hay auditorías usando este alcance
     */
    static async delete(id) {
        const template = await AlcanceTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Alcance template not found' };
        }
        
        // Verificar si hay procedimientos usando este alcance
        const AuditProcedure = require('../models/audit-procedure.model');
        const usageCount = await AuditProcedure.countDocuments({ 
            alcance: template.name 
        });
        
        if (usageCount > 0) {
            throw { 
                fn: 'BadParameters', 
                message: `Cannot delete: ${usageCount} audit(s) are using this alcance. Consider deactivating instead.` 
            };
        }
        
        await AlcanceTemplate.findByIdAndDelete(id);
        
        return { message: 'Alcance template deleted successfully' };
    }

    /**
     * Obtiene estadísticas de uso de alcances
     */
    static async getStats() {
        const AuditProcedure = require('../models/audit-procedure.model');
        
        // Contar uso por alcance
        const usageStats = await AuditProcedure.aggregate([
            { $unwind: '$alcance' },
            {
                $group: {
                    _id: '$alcance',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Obtener todas las plantillas
        const templates = await AlcanceTemplate.find().select('name color isActive');
        
        // Combinar datos
        const stats = templates.map(template => {
            const usage = usageStats.find(u => u._id === template.name);
            return {
                id: template._id,
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
     * Inicializa alcances por defecto si no existen
     */
    static async initializeDefaults(userId) {
        const defaults = [
            {
                name: 'Externa',
                description: 'Evaluación de seguridad desde el exterior de la red.',
                color: '#6366f1'
            },
            {
                name: 'Interna',
                description: 'Evaluación de seguridad desde el interior de la red.',
                color: '#06b6d4'
            },
            {
                name: 'Externa e Interna',
                description: 'Evaluación combinada desde el exterior e interior de la red.',
                color: '#10b981'
            },
            {
                name: 'Sistema Específico entidad',
                description: 'Evaluación enfocada en un sistema específico de la entidad.',
                color: '#f59e0b'
            },
            {
                name: 'Sistema Específico Privado-Codigo',
                description: 'Evaluación de código fuente de un sistema específico.',
                color: '#8b5cf6'
            },
            {
                name: 'Aplicación Web',
                description: 'Evaluación de seguridad de aplicaciones web.',
                color: '#ec4899'
            },
            {
                name: 'Aplicación Móvil',
                description: 'Evaluación de seguridad de aplicaciones móviles.',
                color: '#14b8a6'
            },
            {
                name: 'API',
                description: 'Evaluación de seguridad de APIs y servicios web.',
                color: '#f43f5e'
            },
            {
                name: 'Infraestructura',
                description: 'Evaluación de seguridad de infraestructura de red.',
                color: '#84cc16'
            }
        ];
        
        const created = [];
        
        for (const template of defaults) {
            const exists = await AlcanceTemplate.findByName(template.name);
            
            if (!exists) {
                const newTemplate = await this.create(template, userId);
                created.push(newTemplate);
            }
        }
        
        return {
            message: `Initialized ${created.length} default alcance templates`,
            created
        };
    }
}

module.exports = AlcanceTemplateService;