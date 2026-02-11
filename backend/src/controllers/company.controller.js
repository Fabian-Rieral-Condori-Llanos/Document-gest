const CompanyService = require('../services/company.service');
const Response = require('../utils/httpResponse');

/**
 * Company Controller
 * 
 * Maneja las peticiones HTTP relacionadas con compañías.
 */
class CompanyController {
    /**
     * GET /api/companies
     * Obtiene todas las compañías con filtros opcionales
     * Query params: status, cuadroDeMando, nivel, categoria, prioritarias
     */
    static async getAll(req, res) {
        try {
            const filters = {};
            
            // Parsear filtros de query
            if (req.query.status !== undefined) {
                filters.status = req.query.status === 'true';
            }
            if (req.query.cuadroDeMando !== undefined) {
                filters.cuadroDeMando = req.query.cuadroDeMando === 'true';
            }
            if (req.query.nivel) {
                filters.nivel = req.query.nivel;
            }
            if (req.query.categoria) {
                filters.categoria = req.query.categoria;
            }
            if (req.query.prioritarias !== undefined) {
                filters.prioritarias = req.query.prioritarias !== 'false';
            }
            
            const companies = await CompanyService.getAll(filters);
            Response.Ok(res, companies);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/activas
     * Obtiene solo compañías activas ordenadas por prioridad
     */
    static async getActivas(req, res) {
        try {
            const companies = await CompanyService.getActivas();
            Response.Ok(res, companies);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/prioritarias
     * Obtiene solo compañías con cuadro de mando activo
     */
    static async getPrioritarias(req, res) {
        try {
            const companies = await CompanyService.getPrioritarias();
            Response.Ok(res, companies);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/estadisticas
     * Obtiene estadísticas de compañías
     */
    static async getEstadisticas(req, res) {
        try {
            const stats = await CompanyService.getEstadisticas();
            Response.Ok(res, stats);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/catalogos
     * Obtiene catálogos de niveles y categorías
     */
    static async getCatalogos(req, res) {
        try {
            const catalogos = await CompanyService.getCatalogos();
            Response.Ok(res, catalogos);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/:id
     * Obtiene una compañía por ID
     * Query params: full=true para obtener todos los campos
     */
    static async getById(req, res) {
        try {
            const full = req.query.full === 'true';
            const company = await CompanyService.getById(req.params.id, full);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * GET /api/companies/:id/full
     * Obtiene una compañía con todos sus campos
     */
    static async getFullById(req, res) {
        try {
            const company = await CompanyService.getFullById(req.params.id);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/companies
     * Crea una nueva compañía
     */
    static async create(req, res) {
        try {
            const { 
                name, shortName, logo, status, cuadroDeMando,
                nivelDeMadurez, nivel, categoria
            } = req.body;

            if (!name) {
                return Response.BadParameters(res, 'Company name is required');
            }

            const companyData = { 
                name, 
                shortName, 
                logo,
                status: status !== undefined ? status : true,
                cuadroDeMando: cuadroDeMando || false,
                nivelDeMadurez,
                nivel,
                categoria
            };
            
            // Limpiar campos undefined
            Object.keys(companyData).forEach(key => {
                if (companyData[key] === undefined) {
                    delete companyData[key];
                }
            });

            const company = await CompanyService.create(companyData);
            Response.Created(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/companies/:id
     * Actualiza una compañía
     */
    static async update(req, res) {
        try {
            const { 
                name, shortName, logo, status, cuadroDeMando,
                nivelDeMadurez, nivel, categoria
            } = req.body;
            
            const updateData = {};

            if (name !== undefined) updateData.name = name;
            if (shortName !== undefined) updateData.shortName = shortName;
            if (logo !== undefined) updateData.logo = logo;
            if (status !== undefined) updateData.status = status;
            if (cuadroDeMando !== undefined) updateData.cuadroDeMando = cuadroDeMando;
            if (nivelDeMadurez !== undefined) updateData.nivelDeMadurez = nivelDeMadurez;
            if (nivel !== undefined) updateData.nivel = nivel;
            if (categoria !== undefined) updateData.categoria = categoria;

            const company = await CompanyService.update(req.params.id, updateData);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/companies/:id/status
     * Actualiza el estado de una compañía
     */
    static async updateStatus(req, res) {
        try {
            const { status } = req.body;
            
            if (status === undefined) {
                return Response.BadParameters(res, 'Status is required');
            }

            const company = await CompanyService.updateStatus(req.params.id, status);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PATCH /api/companies/:id/cuadro-de-mando
     * Actualiza la prioridad de cuadro de mando
     */
    static async updateCuadroDeMando(req, res) {
        try {
            const { cuadroDeMando } = req.body;
            
            if (cuadroDeMando === undefined) {
                return Response.BadParameters(res, 'cuadroDeMando is required');
            }

            const company = await CompanyService.updateCuadroDeMando(req.params.id, cuadroDeMando);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * POST /api/companies/:id/documentos/:tipo
     * Agrega un documento a un array específico
     * Tipos válidos: pisi, actualizacionPisi, borradorPisi, seguimientoPisi,
     *                borradorPlanContingencia, planContingencia, informeTecnico
     */
    static async agregarDocumento(req, res) {
        try {
            const { id, tipo } = req.params;
            const { gestion, fecha, cite, descripcion } = req.body;
            
            if (!gestion) {
                return Response.BadParameters(res, 'Gestión is required');
            }

            const documento = { gestion, fecha, cite, descripcion };
            
            // Limpiar campos undefined
            Object.keys(documento).forEach(key => {
                if (documento[key] === undefined) {
                    delete documento[key];
                }
            });

            const company = await CompanyService.agregarDocumento(id, tipo, documento);
            Response.Created(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * PUT /api/companies/:id/documentos/:tipo/:docId
     * Actualiza un documento específico
     */
    static async actualizarDocumento(req, res) {
        try {
            const { id, tipo, docId } = req.params;
            const { gestion, fecha, cite, descripcion } = req.body;
            
            const documento = {};
            if (gestion !== undefined) documento.gestion = gestion;
            if (fecha !== undefined) documento.fecha = fecha;
            if (cite !== undefined) documento.cite = cite;
            if (descripcion !== undefined) documento.descripcion = descripcion;

            const company = await CompanyService.actualizarDocumento(id, tipo, docId, documento);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/companies/:id/documentos/:tipo/:docId
     * Elimina un documento específico
     */
    static async eliminarDocumento(req, res) {
        try {
            const { id, tipo, docId } = req.params;
            const company = await CompanyService.eliminarDocumento(id, tipo, docId);
            Response.Ok(res, company);
        } catch (err) {
            Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/companies/:id
     * Elimina una compañía
     */
    static async delete(req, res) {
        try {
            await CompanyService.delete(req.params.id);
            Response.Ok(res, 'Company deleted successfully');
        } catch (err) {
            Response.Internal(res, err);
        }
    }
}

module.exports = CompanyController;