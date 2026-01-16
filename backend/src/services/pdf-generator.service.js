const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const ReportInstance = require('../models/report-instance.model');
const ReportTemplate = require('../models/report-template.model');

/**
 * PDFGeneratorService
 * 
 * Servicio para generación de PDF a partir de contenido TipTap.
 * Usa Puppeteer para renderizar HTML a PDF con alta fidelidad.
 * 
 * Flujo:
 * 1. Obtener ReportInstance con contenido y datos inyectados
 * 2. Convertir contenido TipTap JSON a HTML
 * 3. Procesar variables Handlebars con datos inyectados
 * 4. Aplicar estilos CSS
 * 5. Renderizar con Puppeteer a PDF
 */

class PDFGeneratorService {
    constructor() {
        this.browser = null;
        this.browserPromise = null;
        
        // Registrar helpers de Handlebars
        this._registerHandlebarsHelpers();
    }

    /**
     * Registra helpers personalizados de Handlebars
     * @private
     */
    _registerHandlebarsHelpers() {
        // Helper para formatear fechas
        Handlebars.registerHelper('formatDate', (date, format) => {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            
            const pad = (n) => n.toString().padStart(2, '0');
            
            const replacements = {
                'YYYY': d.getFullYear(),
                'MM': pad(d.getMonth() + 1),
                'DD': pad(d.getDate()),
                'HH': pad(d.getHours()),
                'mm': pad(d.getMinutes()),
                'ss': pad(d.getSeconds())
            };
            
            let result = format || 'DD/MM/YYYY';
            for (const [key, value] of Object.entries(replacements)) {
                result = result.replace(key, value);
            }
            return result;
        });

        // Helper para comparación
        Handlebars.registerHelper('eq', (a, b) => a === b);
        Handlebars.registerHelper('ne', (a, b) => a !== b);
        Handlebars.registerHelper('gt', (a, b) => a > b);
        Handlebars.registerHelper('gte', (a, b) => a >= b);
        Handlebars.registerHelper('lt', (a, b) => a < b);
        Handlebars.registerHelper('lte', (a, b) => a <= b);

        // Helper para operaciones lógicas
        Handlebars.registerHelper('and', (...args) => {
            args.pop(); // Remover options
            return args.every(Boolean);
        });
        Handlebars.registerHelper('or', (...args) => {
            args.pop();
            return args.some(Boolean);
        });

        // Helper para uppercase/lowercase
        Handlebars.registerHelper('uppercase', (str) => str ? str.toUpperCase() : '');
        Handlebars.registerHelper('lowercase', (str) => str ? str.toLowerCase() : '');
        Handlebars.registerHelper('capitalize', (str) => {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        });

        // Helper para índice en loops (1-based)
        Handlebars.registerHelper('inc', (value) => parseInt(value) + 1);

        // Helper para severidad con color
        Handlebars.registerHelper('severityColor', (severity) => {
            const colors = {
                'Crítica': '#dc2626',
                'Critical': '#dc2626',
                'Alta': '#ea580c',
                'High': '#ea580c',
                'Media': '#ca8a04',
                'Medium': '#ca8a04',
                'Baja': '#16a34a',
                'Low': '#16a34a',
                'Informativa': '#2563eb',
                'Info': '#2563eb'
            };
            return colors[severity] || '#6b7280';
        });

        // Helper para severidad con badge HTML
        Handlebars.registerHelper('severityBadge', (severity) => {
            const color = Handlebars.helpers.severityColor(severity);
            return new Handlebars.SafeString(
                `<span class="severity-badge" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em;">${severity}</span>`
            );
        });

        // Helper para imágenes base64
        Handlebars.registerHelper('image', (src, options) => {
            if (!src) return '';
            const width = options.hash.width || 'auto';
            const height = options.hash.height || 'auto';
            const alt = options.hash.alt || '';
            return new Handlebars.SafeString(
                `<img src="${src}" alt="${alt}" style="max-width: ${width}; height: ${height};" />`
            );
        });

        // Helper para saltos de página
        Handlebars.registerHelper('pageBreak', () => {
            return new Handlebars.SafeString('<div class="page-break"></div>');
        });

        // Helper para JSON stringify (para debug)
        Handlebars.registerHelper('json', (context) => {
            return JSON.stringify(context, null, 2);
        });

        // Helper para default value
        Handlebars.registerHelper('default', (value, defaultValue) => {
            return value || defaultValue;
        });

        // Helper para pluralización
        Handlebars.registerHelper('plural', (count, singular, plural) => {
            return count === 1 ? singular : plural;
        });
    }

    /**
     * Obtiene o crea una instancia del navegador
     * @private
     */
    async _getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        if (this.browserPromise) {
            return this.browserPromise;
        }

        this.browserPromise = puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none'
            ]
        });

        this.browser = await this.browserPromise;
        this.browserPromise = null;

        // Manejar cierre del navegador
        this.browser.on('disconnected', () => {
            this.browser = null;
        });

        return this.browser;
    }

    /**
     * Genera un PDF a partir de un ReportInstance
     * @param {string} reportInstanceId - ID de la instancia
     * @param {Object} options - Opciones de generación
     */
    async generatePDF(reportInstanceId, options = {}) {
        const {
            format = 'A4',
            landscape = false,
            margins = { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
            displayHeaderFooter = true,
            printBackground = true,
            preferCSSPageSize = false
        } = options;

        // Obtener la instancia del reporte
        const reportInstance = await ReportInstance.findById(reportInstanceId)
            .populate('templateId');

        if (!reportInstance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        // Generar HTML
        const html = await this._generateHTML(reportInstance);

        // Generar PDF
        const browser = await this._getBrowser();
        const page = await browser.newPage();

        try {
            // Configurar la página
            await page.setContent(html, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 30000
            });

            // Esperar a que las imágenes carguen
            await page.evaluate(() => {
                return Promise.all(
                    Array.from(document.images)
                        .filter(img => !img.complete)
                        .map(img => new Promise(resolve => {
                            img.onload = img.onerror = resolve;
                        }))
                );
            });

            // Generar PDF
            const pdfBuffer = await page.pdf({
                format,
                landscape,
                margin: margins,
                displayHeaderFooter,
                printBackground,
                preferCSSPageSize,
                headerTemplate: displayHeaderFooter ? this._generateHeaderTemplate(reportInstance) : '',
                footerTemplate: displayHeaderFooter ? this._generateFooterTemplate(reportInstance) : ''
            });

            return pdfBuffer;
        } finally {
            await page.close();
        }
    }

    /**
     * Genera preview del PDF (menos recursos)
     * @param {string} reportInstanceId
     * @param {number} page - Número de página para preview (0 = todas)
     */
    async generatePreview(reportInstanceId, pageNum = 0) {
        const reportInstance = await ReportInstance.findById(reportInstanceId)
            .populate('templateId');

        if (!reportInstance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        const html = await this._generateHTML(reportInstance);

        const browser = await this._getBrowser();
        const page = await browser.newPage();

        try {
            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            // Para preview, generar como imagen PNG
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: pageNum === 0
            });

            return {
                type: 'image/png',
                data: screenshot
            };
        } finally {
            await page.close();
        }
    }

    /**
     * Genera HTML a partir del ReportInstance
     * @private
     */
    async _generateHTML(reportInstance) {
        const styles = reportInstance.styles || reportInstance.templateId?.styles || {};
        const content = reportInstance.content;
        const data = reportInstance.injectedData || {};

        // Convertir contenido TipTap a HTML
        let bodyHtml = this._tipTapToHtml(content);

        // Procesar variables Handlebars
        try {
            const template = Handlebars.compile(bodyHtml, { strict: false });
            bodyHtml = template(data);
        } catch (err) {
            console.error('[PDFGenerator] Error processing Handlebars:', err);
            // Continuar con el HTML sin procesar
        }

        // Generar CSS
        const css = this._generateCSS(styles);

        // Header y Footer como contenido
        let headerHtml = '';
        let footerHtml = '';

        if (reportInstance.header) {
            headerHtml = this._tipTapToHtml(reportInstance.header);
            try {
                const headerTemplate = Handlebars.compile(headerHtml, { strict: false });
                headerHtml = headerTemplate(data);
            } catch (err) { }
        }

        if (reportInstance.footer) {
            footerHtml = this._tipTapToHtml(reportInstance.footer);
            try {
                const footerTemplate = Handlebars.compile(footerHtml, { strict: false });
                footerHtml = footerTemplate(data);
            } catch (err) { }
        }

        // Cover page
        let coverHtml = '';
        if (reportInstance.coverPage) {
            coverHtml = this._tipTapToHtml(reportInstance.coverPage);
            try {
                const coverTemplate = Handlebars.compile(coverHtml, { strict: false });
                coverHtml = coverTemplate(data);
            } catch (err) { }
            coverHtml = `<div class="cover-page">${coverHtml}</div><div class="page-break"></div>`;
        }

        // Ensamblar documento completo
        return `
<!DOCTYPE html>
<html lang="${data.audit?.language || 'es'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.audit?.name || 'Informe'}</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${coverHtml}
    <div class="document-content">
        ${bodyHtml}
    </div>
</body>
</html>`;
    }

    /**
     * Convierte contenido TipTap JSON a HTML
     * @private
     */
    _tipTapToHtml(content) {
        if (!content) return '';
        if (typeof content === 'string') return content;

        const renderNode = (node) => {
            if (!node) return '';

            switch (node.type) {
                case 'doc':
                    return (node.content || []).map(renderNode).join('');

                case 'text':
                    let text = this._escapeHtml(node.text || '');
                    // Aplicar marks
                    if (node.marks) {
                        node.marks.forEach(mark => {
                            switch (mark.type) {
                                case 'bold':
                                    text = `<strong>${text}</strong>`;
                                    break;
                                case 'italic':
                                    text = `<em>${text}</em>`;
                                    break;
                                case 'underline':
                                    text = `<u>${text}</u>`;
                                    break;
                                case 'strike':
                                    text = `<s>${text}</s>`;
                                    break;
                                case 'code':
                                    text = `<code>${text}</code>`;
                                    break;
                                case 'link':
                                    const href = mark.attrs?.href || '#';
                                    const target = mark.attrs?.target || '_blank';
                                    text = `<a href="${href}" target="${target}">${text}</a>`;
                                    break;
                                case 'highlight':
                                    text = `<span class="variable-highlight">${text}</span>`;
                                    break;
                                case 'textStyle':
                                    const styles = [];
                                    if (mark.attrs?.color) styles.push(`color: ${mark.attrs.color}`);
                                    if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
                                    if (styles.length) {
                                        text = `<span style="${styles.join('; ')}">${text}</span>`;
                                    }
                                    break;
                            }
                        });
                    }
                    return text;

                case 'paragraph':
                    const pContent = (node.content || []).map(renderNode).join('');
                    const pAlign = node.attrs?.textAlign ? ` style="text-align: ${node.attrs.textAlign}"` : '';
                    return `<p${pAlign}>${pContent || '&nbsp;'}</p>`;

                case 'heading':
                    const level = node.attrs?.level || 1;
                    const hContent = (node.content || []).map(renderNode).join('');
                    const hAlign = node.attrs?.textAlign ? ` style="text-align: ${node.attrs.textAlign}"` : '';
                    return `<h${level}${hAlign}>${hContent}</h${level}>`;

                case 'bulletList':
                    const ulContent = (node.content || []).map(renderNode).join('');
                    return `<ul>${ulContent}</ul>`;

                case 'orderedList':
                    const olStart = node.attrs?.start ? ` start="${node.attrs.start}"` : '';
                    const olContent = (node.content || []).map(renderNode).join('');
                    return `<ol${olStart}>${olContent}</ol>`;

                case 'listItem':
                    const liContent = (node.content || []).map(renderNode).join('');
                    return `<li>${liContent}</li>`;

                case 'blockquote':
                    const bqContent = (node.content || []).map(renderNode).join('');
                    return `<blockquote>${bqContent}</blockquote>`;

                case 'codeBlock':
                    const lang = node.attrs?.language || '';
                    const codeContent = (node.content || []).map(n => n.text || '').join('');
                    return `<pre><code class="language-${lang}">${this._escapeHtml(codeContent)}</code></pre>`;

                case 'horizontalRule':
                    return '<hr />';

                case 'hardBreak':
                    return '<br />';

                case 'image':
                    const src = node.attrs?.src || '';
                    const alt = node.attrs?.alt || '';
                    const title = node.attrs?.title || '';
                    const imgWidth = node.attrs?.width ? ` width="${node.attrs.width}"` : '';
                    return `<figure><img src="${src}" alt="${alt}" title="${title}"${imgWidth} />${title ? `<figcaption>${title}</figcaption>` : ''}</figure>`;

                case 'table':
                    const tableContent = (node.content || []).map(renderNode).join('');
                    return `<table>${tableContent}</table>`;

                case 'tableRow':
                    const trContent = (node.content || []).map(renderNode).join('');
                    return `<tr>${trContent}</tr>`;

                case 'tableCell':
                    const colspan = node.attrs?.colspan > 1 ? ` colspan="${node.attrs.colspan}"` : '';
                    const rowspan = node.attrs?.rowspan > 1 ? ` rowspan="${node.attrs.rowspan}"` : '';
                    const tdContent = (node.content || []).map(renderNode).join('');
                    return `<td${colspan}${rowspan}>${tdContent}</td>`;

                case 'tableHeader':
                    const thColspan = node.attrs?.colspan > 1 ? ` colspan="${node.attrs.colspan}"` : '';
                    const thRowspan = node.attrs?.rowspan > 1 ? ` rowspan="${node.attrs.rowspan}"` : '';
                    const thContent = (node.content || []).map(renderNode).join('');
                    return `<th${thColspan}${thRowspan}>${thContent}</th>`;

                default:
                    // Nodo desconocido, intentar renderizar contenido
                    if (node.content) {
                        return (node.content || []).map(renderNode).join('');
                    }
                    return '';
            }
        };

        return renderNode(content);
    }

    /**
     * Escapa caracteres HTML
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        // No escapar variables Handlebars
        return text
            .replace(/&(?!#?\w+;)/g, '&amp;')
            .replace(/<(?!{)/g, '&lt;')
            .replace(/>(?!})/g, '&gt;');
    }

    /**
     * Genera CSS para el documento
     * @private
     */
    _generateCSS(styles) {
        const {
            fontFamily = 'Arial, sans-serif',
            fontSize = 12,
            margins = { top: 25, right: 20, bottom: 25, left: 20 },
            pageSize = 'A4',
            orientation = 'portrait',
            headings = {},
            primaryColor = '#2563eb',
            customCSS = ''
        } = styles;

        return `
/* Reset y base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

@page {
    size: ${pageSize} ${orientation};
    margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
}

body {
    font-family: ${fontFamily};
    font-size: ${fontSize}pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: white;
}

/* Tipografía */
h1, h2, h3, h4, h5, h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: bold;
    line-height: 1.3;
}

h1 {
    font-size: ${headings.h1?.fontSize || 24}pt;
    color: ${headings.h1?.color || '#1a1a1a'};
    border-bottom: 2px solid ${primaryColor};
    padding-bottom: 0.3em;
}

h2 {
    font-size: ${headings.h2?.fontSize || 20}pt;
    color: ${headings.h2?.color || '#1a1a1a'};
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.2em;
}

h3 {
    font-size: ${headings.h3?.fontSize || 16}pt;
    color: ${headings.h3?.color || '#1a1a1a'};
}

p {
    margin-bottom: 0.8em;
    text-align: justify;
}

/* Listas */
ul, ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
}

li {
    margin-bottom: 0.3em;
}

/* Enlaces */
a {
    color: ${primaryColor};
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

/* Código */
code {
    font-family: 'Courier New', monospace;
    background-color: #f3f4f6;
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-size: 0.9em;
}

pre {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
}

pre code {
    background: none;
    padding: 0;
    color: inherit;
}

/* Citas */
blockquote {
    border-left: 4px solid ${primaryColor};
    padding-left: 1em;
    margin: 1em 0;
    color: #4b5563;
    font-style: italic;
}

/* Línea horizontal */
hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1.5em 0;
}

/* Imágenes */
figure {
    margin: 1em 0;
    text-align: center;
}

img {
    max-width: 100%;
    height: auto;
}

figcaption {
    font-size: 0.9em;
    color: #6b7280;
    margin-top: 0.5em;
    font-style: italic;
}

/* Tablas */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.95em;
}

th, td {
    border: 1px solid #d1d5db;
    padding: 0.6em 0.8em;
    text-align: left;
}

th {
    background-color: ${primaryColor};
    color: white;
    font-weight: bold;
}

tr:nth-child(even) {
    background-color: #f9fafb;
}

/* Variables highlight */
.variable-highlight {
    background-color: #fef3c7;
    padding: 0 0.2em;
    border-radius: 2px;
}

/* Salto de página */
.page-break {
    page-break-after: always;
    break-after: page;
}

/* Portada */
.cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    text-align: center;
}

.cover-page h1 {
    border: none;
    font-size: 32pt;
}

/* Badges de severidad */
.severity-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: bold;
}

/* Contenido del documento */
.document-content {
    max-width: 100%;
}

/* CSS personalizado */
${customCSS}
`;
    }

    /**
     * Genera template del header para Puppeteer
     * @private
     */
    _generateHeaderTemplate(reportInstance) {
        const data = reportInstance.injectedData || {};
        return `
<div style="font-size: 9pt; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; color: #6b7280;">
    <span>${data.company?.shortName || data.company?.name || ''}</span>
    <span>${data.audit?.name || ''}</span>
</div>`;
    }

    /**
     * Genera template del footer para Puppeteer
     * @private
     */
    _generateFooterTemplate(reportInstance) {
        const data = reportInstance.injectedData || {};
        return `
<div style="font-size: 9pt; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; color: #6b7280;">
    <span>CONFIDENCIAL</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
</div>`;
    }

    /**
     * Guarda el PDF generado y actualiza el ReportInstance
     * @param {string} reportInstanceId
     * @param {Buffer} pdfBuffer
     * @param {string} userId
     */
    async savePDF(reportInstanceId, pdfBuffer, userId) {
        const reportInstance = await ReportInstance.findById(reportInstanceId);
        if (!reportInstance) {
            throw { fn: 'NotFound', message: 'Report instance not found' };
        }

        // Guardar el archivo
        const filename = `report_${reportInstanceId}_${Date.now()}.pdf`;
        const outputDir = path.join(__dirname, '../../report-outputs');
        
        // Crear directorio si no existe
        await fs.mkdir(outputDir, { recursive: true });
        
        const filePath = path.join(outputDir, filename);
        await fs.writeFile(filePath, pdfBuffer);

        // Actualizar el reporte
        reportInstance.lastExport = {
            exportedAt: new Date(),
            exportedBy: userId,
            fileSize: pdfBuffer.length,
            filePath: `report-outputs/${filename}`
        };
        reportInstance.status = 'exported';

        await reportInstance.save();

        return {
            filename,
            filePath: reportInstance.lastExport.filePath,
            fileSize: pdfBuffer.length,
            exportedAt: reportInstance.lastExport.exportedAt
        };
    }

    /**
     * Genera y guarda el PDF
     * @param {string} reportInstanceId
     * @param {string} userId
     * @param {Object} options
     */
    async generateAndSave(reportInstanceId, userId, options = {}) {
        const pdfBuffer = await this.generatePDF(reportInstanceId, options);
        const result = await this.savePDF(reportInstanceId, pdfBuffer, userId);
        
        return {
            ...result,
            buffer: pdfBuffer
        };
    }

    /**
     * Cierra el navegador (para cleanup)
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

// Singleton
const pdfGenerator = new PDFGeneratorService();

// Cleanup al cerrar la aplicación
process.on('SIGINT', async () => {
    await pdfGenerator.closeBrowser();
});

process.on('SIGTERM', async () => {
    await pdfGenerator.closeBrowser();
});

module.exports = pdfGenerator;
