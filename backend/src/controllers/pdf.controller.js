const pdfGenerator = require('../services/pdf-generator.service');
const ReportInstance = require('../models/report-instance.model');
const Response = require('../utils/httpResponse');
const fs = require('fs').promises;
const path = require('path');

/**
 * PDFController
 * 
 * Controlador para generación y descarga de PDF.
 */
class PDFController {

    /**
     * POST /api/pdf/generate/:reportInstanceId
     * Genera un PDF y lo devuelve directamente
     */
    static async generate(req, res) {
        try {
            const { reportInstanceId } = req.params;
            const options = req.body || {};

            // Validar opciones
            const pdfOptions = {
                format: options.format || 'A4',
                landscape: options.landscape || false,
                margins: options.margins || { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
                displayHeaderFooter: options.displayHeaderFooter !== false,
                printBackground: options.printBackground !== false
            };

            const pdfBuffer = await pdfGenerator.generatePDF(reportInstanceId, pdfOptions);

            // Obtener nombre del reporte para el archivo
            const reportInstance = await ReportInstance.findById(reportInstanceId).select('name');
            const filename = `${reportInstance?.name || 'report'}.pdf`
                .replace(/[^a-zA-Z0-9\-_\s]/g, '')
                .replace(/\s+/g, '_');

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length
            });

            return res.send(pdfBuffer);
        } catch (err) {
            console.error('[PDF] Error generating:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/pdf/generate/:reportInstanceId/save
     * Genera y guarda el PDF en el servidor
     */
    static async generateAndSave(req, res) {
        try {
            const { reportInstanceId } = req.params;
            const userId = req.decodedToken.id;
            const options = req.body || {};

            const result = await pdfGenerator.generateAndSave(reportInstanceId, userId, options);

            // No incluir el buffer en la respuesta
            delete result.buffer;

            return Response.Ok(res, result);
        } catch (err) {
            console.error('[PDF] Error generating and saving:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/pdf/preview/:reportInstanceId
     * Genera un preview del PDF como imagen
     */
    static async preview(req, res) {
        try {
            const { reportInstanceId } = req.params;
            const page = parseInt(req.query.page) || 0;

            const result = await pdfGenerator.generatePreview(reportInstanceId, page);

            res.set({
                'Content-Type': result.type,
                'Cache-Control': 'no-cache'
            });

            return res.send(result.data);
        } catch (err) {
            console.error('[PDF] Error generating preview:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/pdf/download/:reportInstanceId
     * Descarga el último PDF exportado
     */
    static async download(req, res) {
        try {
            const { reportInstanceId } = req.params;

            const reportInstance = await ReportInstance.findById(reportInstanceId)
                .select('name lastExport');

            if (!reportInstance) {
                return Response.NotFound(res, 'Report instance not found');
            }

            if (!reportInstance.lastExport || !reportInstance.lastExport.filePath) {
                return Response.NotFound(res, 'No PDF has been exported yet');
            }

            const filePath = path.join(__dirname, '../../', reportInstance.lastExport.filePath);

            try {
                await fs.access(filePath);
            } catch {
                return Response.NotFound(res, 'PDF file not found on server');
            }

            const filename = `${reportInstance.name || 'report'}.pdf`
                .replace(/[^a-zA-Z0-9\-_\s]/g, '')
                .replace(/\s+/g, '_');

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            return res.sendFile(filePath);
        } catch (err) {
            console.error('[PDF] Error downloading:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * GET /api/pdf/status/:reportInstanceId
     * Obtiene el estado de exportación del PDF
     */
    static async getStatus(req, res) {
        try {
            const { reportInstanceId } = req.params;

            const reportInstance = await ReportInstance.findById(reportInstanceId)
                .select('lastExport status')
                .populate('lastExport.exportedBy', 'username firstname lastname');

            if (!reportInstance) {
                return Response.NotFound(res, 'Report instance not found');
            }

            return Response.Ok(res, {
                status: reportInstance.status,
                lastExport: reportInstance.lastExport || null
            });
        } catch (err) {
            console.error('[PDF] Error getting status:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * POST /api/pdf/preview-html/:reportInstanceId
     * Devuelve el HTML que se usaría para generar el PDF (útil para debug)
     */
    static async previewHtml(req, res) {
        try {
            const { reportInstanceId } = req.params;

            const reportInstance = await ReportInstance.findById(reportInstanceId)
                .populate('templateId');

            if (!reportInstance) {
                return Response.NotFound(res, 'Report instance not found');
            }

            // Usar el método interno para generar HTML
            const html = await pdfGenerator._generateHTML(reportInstance);

            res.set({
                'Content-Type': 'text/html; charset=utf-8'
            });

            return res.send(html);
        } catch (err) {
            console.error('[PDF] Error generating HTML preview:', err);
            return Response.Internal(res, err);
        }
    }

    /**
     * DELETE /api/pdf/:reportInstanceId
     * Elimina el PDF exportado
     */
    static async deletePDF(req, res) {
        try {
            const { reportInstanceId } = req.params;

            const reportInstance = await ReportInstance.findById(reportInstanceId);

            if (!reportInstance) {
                return Response.NotFound(res, 'Report instance not found');
            }

            if (reportInstance.lastExport && reportInstance.lastExport.filePath) {
                const filePath = path.join(__dirname, '../../', reportInstance.lastExport.filePath);
                
                try {
                    await fs.unlink(filePath);
                } catch (err) {
                    console.warn('[PDF] Could not delete file:', err.message);
                }
            }

            reportInstance.lastExport = null;
            if (reportInstance.status === 'exported') {
                reportInstance.status = 'approved';
            }

            await reportInstance.save();

            return Response.Ok(res, { message: 'PDF deleted successfully' });
        } catch (err) {
            console.error('[PDF] Error deleting:', err);
            return Response.Internal(res, err);
        }
    }
}

module.exports = PDFController;
