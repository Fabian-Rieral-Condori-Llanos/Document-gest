const mongoose = require('mongoose');
const Audit = mongoose.model('Audit');

/**
 * Audit Section Service
 * 
 * Maneja todas las operaciones relacionadas con secciones
 * personalizadas dentro de una auditoría.
 */
class AuditSectionService {
    /**
     * Obtiene todas las secciones de una auditoría
     */
    static async getAll(isAdmin, auditId, userId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('sections');
        query.populate('sections.customFields.customField', 'label fieldType text');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        return audit.sections;
    }

    /**
     * Obtiene una sección específica
     */
    static async getById(isAdmin, auditId, userId, sectionId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('sections');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const section = audit.sections.id(sectionId);
        if (!section) {
            throw { fn: 'NotFound', message: 'Section not found' };
        }

        return section;
    }

    /**
     * Obtiene una sección por nombre de campo
     */
    static async getByField(isAdmin, auditId, userId, field) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId },
                { reviewers: userId }
            ]);
        }

        query.select('sections');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const section = audit.sections.find(s => s.field === field);
        if (!section) {
            throw { fn: 'NotFound', message: 'Section not found' };
        }

        return section;
    }

    /**
     * Crea una nueva sección
     */
    static async create(isAdmin, auditId, userId, sectionData) {
        // Verificar que no exista una sección con el mismo field
        let query = Audit.findOneAndUpdate(
            { 
                _id: auditId,
                'sections.field': { $ne: sectionData.field }
            },
            { $push: { sections: sectionData } },
            { new: true }
        );

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Section already exists or Insufficient Privileges' };
        }

        return 'Audit Section created successfully';
    }

    /**
     * Actualiza una sección
     */
    static async update(isAdmin, auditId, userId, sectionId, updateData) {
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

        const section = audit.sections.id(sectionId);
        if (!section) {
            throw { fn: 'NotFound', message: 'Section not found' };
        }

        // Actualizar campos
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                section[key] = updateData[key];
            }
        });

        await audit.save();
        return 'Audit Section updated successfully';
    }

    /**
     * Actualiza una sección por nombre de campo
     */
    static async updateByField(isAdmin, auditId, userId, field, updateData) {
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

        const section = audit.sections.find(s => s.field === field);
        if (!section) {
            throw { fn: 'NotFound', message: 'Section not found' };
        }

        // Actualizar campos
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                section[key] = updateData[key];
            }
        });

        await audit.save();
        return 'Audit Section updated successfully';
    }

    /**
     * Elimina una sección
     */
    static async delete(isAdmin, auditId, userId, sectionId) {
        let query = Audit.findById(auditId);

        if (!isAdmin) {
            query.or([
                { creator: userId },
                { collaborators: userId }
            ]);
        }

        query.select('sections');

        const audit = await query.exec();
        if (!audit) {
            throw { fn: 'NotFound', message: 'Audit not found or Insufficient Privileges' };
        }

        const section = audit.sections.id(sectionId);
        if (!section) {
            throw { fn: 'NotFound', message: 'Section not found' };
        }

        audit.sections.pull(sectionId);
        await audit.save();

        return 'Audit Section deleted successfully';
    }

    /**
     * Actualiza los campos personalizados de una sección
     */
    static async updateCustomFields(isAdmin, auditId, userId, sectionId, customFields) {
        return this.update(isAdmin, auditId, userId, sectionId, { customFields });
    }

    /**
     * Inicializa las secciones de una auditoría desde CustomSection
     */
    static async initializeFromTemplate(isAdmin, auditId, userId, customSections) {
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

        // Agregar secciones que no existan
        for (const cs of customSections) {
            const exists = audit.sections.find(s => s.field === cs.field);
            if (!exists) {
                audit.sections.push({
                    field: cs.field,
                    name: cs.name,
                    text: '',
                    customFields: []
                });
            }
        }

        await audit.save();
        return 'Sections initialized successfully';
    }
}

module.exports = AuditSectionService;