const DataSchemaService = require('../services/data-schema.service');
const Response = require('../utils/httpResponse');

/**
 * DataSchemaController
 * 
 * Controlador para exponer los esquemas de datos disponibles
 * para el constructor visual de plantillas.
 */
class DataSchemaController {
    
    /**
     * GET /api/data-schemas
     * Obtiene la lista de esquemas disponibles (resumen)
     */
    static async getSchemaList(req, res) {
        try {
            const schemas = DataSchemaService.getSchemaList();
            return Response.Ok(res, schemas);
        } catch (err) {
            console.error('[DataSchema] Error getting schema list:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/data-schemas/all
     * Obtiene todos los esquemas con sus campos (completo)
     */
    static async getAllSchemas(req, res) {
        try {
            const schemas = DataSchemaService.getAvailableSchemas();
            return Response.Ok(res, schemas);
        } catch (err) {
            console.error('[DataSchema] Error getting all schemas:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/data-schemas/:schemaKey
     * Obtiene un esquema específico por su clave
     */
    static async getSchema(req, res) {
        try {
            const { schemaKey } = req.params;
            const schema = DataSchemaService.getSchema(schemaKey);
            
            if (!schema) {
                return Response.NotFound(res, `Schema '${schemaKey}' not found`);
            }
            
            return Response.Ok(res, { key: schemaKey, ...schema });
        } catch (err) {
            console.error('[DataSchema] Error getting schema:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * GET /api/data-schemas/sample-data
     * Obtiene datos de ejemplo para preview
     */
    static async getSampleData(req, res) {
        try {
            const sampleData = DataSchemaService.getSampleData();
            return Response.Ok(res, sampleData);
        } catch (err) {
            console.error('[DataSchema] Error getting sample data:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/data-schemas/generate-variable
     * Genera la sintaxis de variable para usar en templates
     */
    static async generateVariable(req, res) {
        try {
            const { schemaKey, fieldPath, format, isLoop, loopVar } = req.body;
            
            if (!schemaKey || !fieldPath) {
                return Response.BadParameters(res, 'schemaKey and fieldPath are required');
            }
            
            const syntax = DataSchemaService.generateVariableSyntax(
                schemaKey, 
                fieldPath, 
                { format, isLoop, loopVar }
            );
            
            return Response.Ok(res, { syntax });
        } catch (err) {
            console.error('[DataSchema] Error generating variable:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/data-schemas/generate-loop
     * Genera la sintaxis de loop para arrays
     */
    static async generateLoop(req, res) {
        try {
            const { schemaKey, itemVar } = req.body;
            
            if (!schemaKey) {
                return Response.BadParameters(res, 'schemaKey is required');
            }
            
            const syntax = DataSchemaService.generateLoopSyntax(schemaKey, itemVar);
            
            return Response.Ok(res, syntax);
        } catch (err) {
            console.error('[DataSchema] Error generating loop:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/data-schemas/generate-conditional
     * Genera la sintaxis de condicional
     */
    static async generateConditional(req, res) {
        try {
            const { variable, operator, value } = req.body;
            
            if (!variable) {
                return Response.BadParameters(res, 'variable is required');
            }
            
            const syntax = DataSchemaService.generateConditionalSyntax(variable, operator, value);
            
            return Response.Ok(res, syntax);
        } catch (err) {
            console.error('[DataSchema] Error generating conditional:', err);
            return Response.Internal(res, err);
        }
    }
    
    /**
     * POST /api/data-schemas/validate
     * Valida si una variable existe en los esquemas
     */
    static async validateVariable(req, res) {
        try {
            const { variablePath } = req.body;
            
            if (!variablePath) {
                return Response.BadParameters(res, 'variablePath is required');
            }
            
            const result = DataSchemaService.validateVariable(variablePath);
            
            return Response.Ok(res, result);
        } catch (err) {
            console.error('[DataSchema] Error validating variable:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = DataSchemaController;
