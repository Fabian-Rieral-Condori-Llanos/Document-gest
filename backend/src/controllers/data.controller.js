const LanguageService = require('../services/language.service');
const AuditTypeService = require('../services/audit-type.service');
const Response = require('../utils/httpResponse');

// Cargar modelos para datos adicionales
const mongoose = require('mongoose');

/**
 * Data Controller
 * 
 * Maneja las peticiones HTTP para datos auxiliares como:
 * - Languages
 * - Audit Types
 * - Vulnerability Types
 * - Vulnerability Categories
 * - Custom Fields
 * - Custom Sections
 */
class DataController {
    // ============================================
    // LANGUAGES
    // ============================================

    /**
     * GET /api/data/languages
     */
    static async getLanguages(req, res) {
        try {
            const languages = await LanguageService.getAll();
            Response.Ok(res, languages);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/languages
     */
    static async createLanguage(req, res) {
        try {
            const { language, locale } = req.body;

            if (!language || !locale) {
                return Response.BadParameters(res, 'Language and locale are required');
            }

            const result = await LanguageService.create({ language, locale });
            Response.Created(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/languages
     * Actualiza todos los idiomas
     */
    static async updateLanguages(req, res) {
        try {
            const languages = req.body;

            if (!Array.isArray(languages)) {
                return Response.BadParameters(res, 'Languages must be an array');
            }

            const result = await LanguageService.updateAll(languages);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/languages/:locale
     */
    static async deleteLanguage(req, res) {
        try {
            const result = await LanguageService.delete(req.params.locale);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // AUDIT TYPES
    // ============================================

    /**
     * GET /api/data/audit-types
     */
    static async getAuditTypes(req, res) {
        try {
            const auditTypes = await AuditTypeService.getAll();
            Response.Ok(res, auditTypes);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/audit-types
     */
    static async createAuditType(req, res) {
        try {
            const result = await AuditTypeService.create(req.body);
            Response.Created(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/audit-types/:id
     */
    static async updateAuditType(req, res) {
        try {
            const result = await AuditTypeService.update(req.params.id, req.body);
            Response.Ok(res, result);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/audit-types/:id
     */
    static async deleteAuditType(req, res) {
        try {
            await AuditTypeService.delete(req.params.id);
            Response.Ok(res, 'Audit type deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // VULNERABILITY TYPES
    // ============================================

    /**
     * GET /api/data/vulnerability-types
     */
    static async getVulnerabilityTypes(req, res) {
        try {
            const VulnerabilityType = mongoose.model('VulnerabilityType');
            const types = await VulnerabilityType.find()
                .sort({ order: 1 })
                .select('-_id name locale')
                .exec();
            Response.Ok(res, types);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/vulnerability-types
     */
    static async updateVulnerabilityTypes(req, res) {
        try {
            const VulnerabilityType = mongoose.model('VulnerabilityType');
            const types = req.body;

            if (!Array.isArray(types)) {
                return Response.BadParameters(res, 'Vulnerability types must be an array');
            }

            await VulnerabilityType.deleteMany();
            if (types.length > 0) {
                await VulnerabilityType.insertMany(types);
            }

            Response.Ok(res, 'Vulnerability types updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/vulnerability-types
     */
    static async createVulnerabilityType(req, res) {
        try {
            const VulnerabilityType = mongoose.model('VulnerabilityType');
            
            // Verificar si ya existe
            const existing = await VulnerabilityType.findOne({ name: req.body.name, locale: req.body.locale });
            if (existing) {
                return Response.BadParameters(res, 'Vulnerability type already exists');
            }

            const type = new VulnerabilityType(req.body);
            const saved = await type.save();
            Response.Created(res, saved);
        } catch (err) {
            if (err.code === 11000) {
                return Response.BadParameters(res, 'Vulnerability type already exists');
            }
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/vulnerability-types/:name
     */
    static async deleteVulnerabilityType(req, res) {
        try {
            const VulnerabilityType = mongoose.model('VulnerabilityType');
            const type = await VulnerabilityType.findOneAndDelete({ name: req.params.name });

            if (!type) {
                return Response.NotFound(res, 'Vulnerability type not found');
            }

            Response.Ok(res, 'Vulnerability type deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // VULNERABILITY CATEGORIES
    // ============================================

    /**
     * GET /api/data/vulnerability-categories
     */
    static async getVulnerabilityCategories(req, res) {
        try {
            const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
            const categories = await VulnerabilityCategory.find()
                .sort({ order: 1 })
                .select('name sortValue sortOrder sortAuto')
                .exec();
            Response.Ok(res, categories);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/vulnerability-categories
     */
    static async updateVulnerabilityCategories(req, res) {
        try {
            const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
            const categories = req.body;

            if (!Array.isArray(categories)) {
                return Response.BadParameters(res, 'Vulnerability categories must be an array');
            }

            await VulnerabilityCategory.deleteMany();
            if (categories.length > 0) {
                await VulnerabilityCategory.insertMany(categories);
            }

            Response.Ok(res, 'Vulnerability categories updated successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/vulnerability-categories
     */
    static async createVulnerabilityCategory(req, res) {
        try {
            const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
            const category = new VulnerabilityCategory(req.body);
            const saved = await category.save();
            Response.Created(res, saved);
        } catch (err) {
            if (err.code === 11000) {
                return Response.BadParameters(res, 'Vulnerability category already exists');
            }
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/vulnerability-categories/:id
     */
    static async deleteVulnerabilityCategory(req, res) {
        try {
            const VulnerabilityCategory = mongoose.model('VulnerabilityCategory');
            const category = await VulnerabilityCategory.findByIdAndDelete(req.params.id);

            if (!category) {
                return Response.NotFound(res, 'Vulnerability category not found');
            }

            Response.Ok(res, 'Vulnerability category deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // CUSTOM FIELDS
    // ============================================

    /**
     * GET /api/data/custom-fields
     */
    static async getCustomFields(req, res) {
        try {
            const CustomField = mongoose.model('CustomField');
            const fields = await CustomField.find()
                .sort({ position: 1 })
                .exec();
            Response.Ok(res, fields);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/custom-fields
     */
    static async createCustomField(req, res) {
        try {
            const CustomField = mongoose.model('CustomField');
            const field = new CustomField(req.body);
            const saved = await field.save();
            Response.Created(res, saved);
        } catch (err) {
            if (err.code === 11000) {
                return Response.BadParameters(res, 'Custom field already exists');
            }
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/custom-fields/:id
     */
    static async updateCustomField(req, res) {
        try {
            const CustomField = mongoose.model('CustomField');
            const field = await CustomField.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if (!field) {
                return Response.NotFound(res, 'Custom field not found');
            }

            Response.Ok(res, field);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/custom-fields/:id
     */
    static async deleteCustomField(req, res) {
        try {
            const CustomField = mongoose.model('CustomField');
            const field = await CustomField.findByIdAndDelete(req.params.id);

            if (!field) {
                return Response.NotFound(res, 'Custom field not found');
            }

            Response.Ok(res, 'Custom field deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    // ============================================
    // CUSTOM SECTIONS
    // ============================================

    /**
     * GET /api/data/sections
     */
    static async getCustomSections(req, res) {
        try {
            const CustomSection = mongoose.model('CustomSection');
            const sections = await CustomSection.find()
                .sort({ order: 1 })
                .select('field name icon')
                .exec();
            Response.Ok(res, sections);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/data/sections
     */
    static async createCustomSection(req, res) {
        try {
            const CustomSection = mongoose.model('CustomSection');

            // Obtener el último orden
            const lastDoc = await CustomSection.findOne({}, {}, { sort: { order: -1 } });
            const newOrder = (lastDoc && lastDoc.order) ? lastDoc.order + 1 : 1;

            const section = new CustomSection({
                ...req.body,
                order: newOrder
            });

            const saved = await section.save();
            Response.Created(res, saved);
        } catch (err) {
            if (err.code === 11000) {
                return Response.BadParameters(res, 'Section already exists');
            }
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/data/sections/:id
     */
    static async updateCustomSection(req, res) {
        try {
            const CustomSection = mongoose.model('CustomSection');
            const section = await CustomSection.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if (!section) {
                return Response.NotFound(res, 'Section not found');
            }

            Response.Ok(res, section);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/data/sections/:id
     */
    static async deleteCustomSection(req, res) {
        try {
            const CustomSection = mongoose.model('CustomSection');
            const section = await CustomSection.findByIdAndDelete(req.params.id);

            if (!section) {
                return Response.NotFound(res, 'Section not found');
            }

            Response.Ok(res, 'Section deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = DataController;