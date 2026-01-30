const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ReportTemplate = require('../models/report-template.model');

/**
 * ReportTemplateService
 * 
 * Lógica de negocio para plantillas de reportes.
 * Incluye conversión de DOCX a formato editable.
 */
class ReportTemplateService {
    
    /**
     * Obtiene todas las plantillas
     */
    static async getAll(filters = {}) {
        const query = {};
        
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        
        if (filters.category) {
            query.category = filters.category;
        }
        
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }
        
        return ReportTemplate.find(query)
            .select('name description category language isActive isSystem version thumbnail createdAt updatedAt')
            .populate('createdBy', 'username firstname lastname')
            .sort({ name: 1 });
    }
    
    /**
     * Obtiene plantillas activas (para selectores)
     */
    static async getActive() {
        return ReportTemplate.getActive();
    }
    
    /**
     * Obtiene una plantilla por ID
     */
    static async getById(id, includeContent = true) {
        const select = includeContent 
            ? '-versionHistory' 
            : 'name description category language isActive version thumbnail';
            
        const template = await ReportTemplate.findById(id)
            .select(select)
            .populate('createdBy', 'username firstname lastname')
            .populate('updatedBy', 'username firstname lastname');
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        return template;
    }
    
    /**
     * Crea una nueva plantilla
     */
    static async create(data, userId) {
        // Verificar nombre único
        const existing = await ReportTemplate.findOne({ name: data.name });
        if (existing) {
            throw { fn: 'BadParameters', message: 'A template with this name already exists' };
        }
        
        const templateData = {
            name: data.name,
            description: data.description || '',
            content: data.content || ReportTemplate.schema.path('content').default(),
            variables: data.variables || [],
            sections: data.sections || [],
            styles: data.styles || {},
            header: data.header || null,
            footer: data.footer || null,
            coverPage: data.coverPage || null,
            category: data.category || 'security-audit',
            language: data.language || 'es',
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdBy: userId
        };
        
        const template = new ReportTemplate(templateData);
        await template.save();
        
        return template;
    }
    
    /**
     * Crea plantilla desde archivo DOCX
     */
    static async createFromDocx(fileBuffer, fileName, data, userId) {
        try {
            // Convertir DOCX a HTML/JSON
            const content = await this._convertDocxToTipTap(fileBuffer);
            
            const templateData = {
                ...data,
                content,
                originalExtension: 'docx',
                originalFile: {
                    filename: fileName,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: fileBuffer.length,
                    uploadedAt: new Date()
                }
            };
            
            return this.create(templateData, userId);
        } catch (err) {
            console.error('[ReportTemplate] Error converting DOCX:', err);
            throw { fn: 'BadParameters', message: 'Error processing DOCX file: ' + err.message };
        }
    }
    
    /**
     * Convierte DOCX a formato TipTap JSON
     * @private
     */
    static async _convertDocxToTipTap(fileBuffer) {
        // Usar mammoth para convertir DOCX a HTML
        const mammoth = require('mammoth');
        
        const result = await mammoth.convertToHtml(
            { buffer: fileBuffer },
            {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Title'] => h1.title:fresh",
                    "b => strong",
                    "i => em",
                    "u => u",
                    "strike => s"
                ],
                convertImage: mammoth.images.imgElement(function(image) {
                    return image.read("base64").then(function(imageBuffer) {
                        return {
                            src: "data:" + image.contentType + ";base64," + imageBuffer
                        };
                    });
                })
            }
        );
        
        // Convertir HTML a TipTap JSON
        const tipTapContent = this._htmlToTipTap(result.value);
        
        // Log de warnings si hay
        if (result.messages.length > 0) {
            console.log('[ReportTemplate] DOCX conversion warnings:', result.messages);
        }
        
        return tipTapContent;
    }
    
    /**
     * Convierte HTML a formato TipTap JSON
     * @private
     */
    static _htmlToTipTap(html) {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        const doc = dom.window.document.body;
        
        const content = [];
        
        const processNode = (node) => {
            if (node.nodeType === 3) { // Text node
                const text = node.textContent;
                if (text.trim()) {
                    return { type: 'text', text };
                }
                return null;
            }
            
            if (node.nodeType !== 1) return null; // Not element node
            
            const tagName = node.tagName.toLowerCase();
            
            switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    return {
                        type: 'heading',
                        attrs: { level: parseInt(tagName[1]) },
                        content: processChildren(node)
                    };
                    
                case 'p':
                    const pContent = processChildren(node);
                    if (pContent.length === 0) {
                        return { type: 'paragraph' };
                    }
                    return {
                        type: 'paragraph',
                        content: pContent
                    };
                    
                case 'ul':
                    return {
                        type: 'bulletList',
                        content: Array.from(node.children).map(li => ({
                            type: 'listItem',
                            content: [{ type: 'paragraph', content: processChildren(li) }]
                        }))
                    };
                    
                case 'ol':
                    return {
                        type: 'orderedList',
                        content: Array.from(node.children).map(li => ({
                            type: 'listItem',
                            content: [{ type: 'paragraph', content: processChildren(li) }]
                        }))
                    };
                    
                case 'table':
                    return processTable(node);
                    
                case 'img':
                    return {
                        type: 'image',
                        attrs: {
                            src: node.getAttribute('src'),
                            alt: node.getAttribute('alt') || '',
                            title: node.getAttribute('title') || ''
                        }
                    };
                    
                case 'br':
                    return { type: 'hardBreak' };
                    
                case 'hr':
                    return { type: 'horizontalRule' };
                    
                case 'blockquote':
                    return {
                        type: 'blockquote',
                        content: processChildren(node).map(c => 
                            c.type === 'text' ? { type: 'paragraph', content: [c] } : c
                        )
                    };
                    
                case 'pre':
                case 'code':
                    if (tagName === 'pre' || node.parentElement?.tagName.toLowerCase() !== 'pre') {
                        return {
                            type: 'codeBlock',
                            content: [{ type: 'text', text: node.textContent }]
                        };
                    }
                    return { type: 'text', text: node.textContent, marks: [{ type: 'code' }] };
                    
                case 'strong':
                case 'b':
                    return processInlineWithMark(node, 'bold');
                    
                case 'em':
                case 'i':
                    return processInlineWithMark(node, 'italic');
                    
                case 'u':
                    return processInlineWithMark(node, 'underline');
                    
                case 's':
                case 'strike':
                    return processInlineWithMark(node, 'strike');
                    
                case 'a':
                    return {
                        type: 'text',
                        text: node.textContent,
                        marks: [{
                            type: 'link',
                            attrs: {
                                href: node.getAttribute('href'),
                                target: node.getAttribute('target') || '_blank'
                            }
                        }]
                    };
                    
                case 'span':
                case 'div':
                    // Process children and return them directly
                    return processChildren(node);
                    
                default:
                    // Unknown element, try to process children
                    return processChildren(node);
            }
        };
        
        const processChildren = (node) => {
            const children = [];
            for (const child of node.childNodes) {
                const processed = processNode(child);
                if (processed) {
                    if (Array.isArray(processed)) {
                        children.push(...processed.filter(Boolean));
                    } else {
                        children.push(processed);
                    }
                }
            }
            return children;
        };
        
        const processInlineWithMark = (node, markType) => {
            const children = processChildren(node);
            return children.map(child => {
                if (child.type === 'text') {
                    return {
                        ...child,
                        marks: [...(child.marks || []), { type: markType }]
                    };
                }
                return child;
            });
        };
        
        const processTable = (tableNode) => {
            const rows = [];
            const tbody = tableNode.querySelector('tbody') || tableNode;
            const thead = tableNode.querySelector('thead');
            
            if (thead) {
                for (const tr of thead.querySelectorAll('tr')) {
                    rows.push({
                        type: 'tableRow',
                        content: Array.from(tr.querySelectorAll('th, td')).map(cell => ({
                            type: 'tableHeader',
                            content: [{ type: 'paragraph', content: processChildren(cell) }]
                        }))
                    });
                }
            }
            
            for (const tr of tbody.querySelectorAll('tr')) {
                rows.push({
                    type: 'tableRow',
                    content: Array.from(tr.querySelectorAll('td, th')).map(cell => ({
                        type: 'tableCell',
                        content: [{ type: 'paragraph', content: processChildren(cell) }]
                    }))
                });
            }
            
            return {
                type: 'table',
                content: rows
            };
        };
        
        // Process all root children
        for (const child of doc.childNodes) {
            const processed = processNode(child);
            if (processed) {
                if (Array.isArray(processed)) {
                    content.push(...processed.filter(Boolean));
                } else {
                    content.push(processed);
                }
            }
        }
        
        return {
            type: 'doc',
            content: content.length > 0 ? content : [{ type: 'paragraph' }]
        };
    }
    
    /**
     * Actualiza una plantilla
     */
    static async update(id, data, userId) {
        const template = await ReportTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        if (template.isSystem) {
            throw { fn: 'Forbidden', message: 'System templates cannot be modified' };
        }
        
        // Verificar nombre único si cambió
        if (data.name && data.name !== template.name) {
            const existing = await ReportTemplate.findOne({ 
                name: data.name, 
                _id: { $ne: id } 
            });
            if (existing) {
                throw { fn: 'BadParameters', message: 'A template with this name already exists' };
            }
            template.name = data.name;
        }
        
        // Actualizar campos permitidos
        const allowedFields = [
            'description', 'content', 'variables', 'sections', 'styles',
            'header', 'footer', 'coverPage', 'category', 'language', 'isActive'
        ];
        
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                template[field] = data[field];
            }
        }
        
        template.updatedBy = userId;
        
        await template.save();
        
        return template;
    }
    
    /**
     * Actualiza solo el contenido (para edición en tiempo real)
     */
    static async updateContent(id, content, userId) {
        const template = await ReportTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        template.content = content;
        template.updatedBy = userId;
        
        await template.save();
        
        return { success: true, version: template.version };
    }
    
    /**
     * Activa/desactiva una plantilla
     */
    static async toggle(id, userId) {
        const template = await ReportTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        template.isActive = !template.isActive;
        template.updatedBy = userId;
        
        await template.save();
        
        return template;
    }
    
    /**
     * Elimina una plantilla
     */
    static async delete(id) {
        const template = await ReportTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        if (template.isSystem) {
            throw { fn: 'Forbidden', message: 'System templates cannot be deleted' };
        }
        
        // Verificar si hay instancias usando esta plantilla
        const ReportInstance = require('../models/report-instance.model');
        const usageCount = await ReportInstance.countDocuments({ templateId: id });
        
        if (usageCount > 0) {
            throw { 
                fn: 'BadParameters', 
                message: `Cannot delete: ${usageCount} report(s) are using this template. Consider deactivating instead.` 
            };
        }
        
        await ReportTemplate.findByIdAndDelete(id);
        
        return { message: 'Report template deleted successfully' };
    }
    
    /**
     * Clona una plantilla
     */
    static async clone(id, newName, userId) {
        const template = await ReportTemplate.findById(id);
        
        if (!template) {
            throw { fn: 'NotFound', message: 'Report template not found' };
        }
        
        // Verificar nombre único
        const existing = await ReportTemplate.findOne({ name: newName });
        if (existing) {
            throw { fn: 'BadParameters', message: 'A template with this name already exists' };
        }
        
        const cloned = template.clone(newName);
        cloned.createdBy = userId;
        cloned.updatedBy = null;
        
        await cloned.save();
        
        return cloned;
    }
    
    /**
     * Obtiene las variables del sistema
     */
    static getSystemVariables() {
        return ReportTemplate.SYSTEM_VARIABLES;
    }
    
    /**
     * Obtiene las categorías disponibles
     */
    static getCategories() {
        return ReportTemplate.CATEGORIES;
    }
    
    /**
     * Obtiene estadísticas
     */
    static async getStats() {
        const ReportInstance = require('../models/report-instance.model');
        
        const [total, active, byCategory, usage] = await Promise.all([
            ReportTemplate.countDocuments(),
            ReportTemplate.countDocuments({ isActive: true }),
            ReportTemplate.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            ReportInstance.aggregate([
                { $group: { _id: '$templateId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);
        
        // Obtener nombres de templates más usados
        const topTemplateIds = usage.map(u => u._id);
        const topTemplates = await ReportTemplate.find({ _id: { $in: topTemplateIds } })
            .select('name');
        
        const topUsage = usage.map(u => {
            const template = topTemplates.find(t => t._id.toString() === u._id.toString());
            return {
                templateId: u._id,
                name: template?.name || 'Unknown',
                usageCount: u.count
            };
        });
        
        return {
            total,
            active,
            inactive: total - active,
            byCategory: byCategory.reduce((acc, c) => {
                acc[c._id] = c.count;
                return acc;
            }, {}),
            topUsage
        };
    }

    /**
     * Obtiene formatos de numeración de página disponibles
     */
    static getPageNumberFormats() {
        return ReportTemplate.PAGE_NUMBER_FORMATS;
    }

    static getDefaultHeaderConfig() {
        return ReportTemplate.DEFAULT_HEADER_CONFIG;
    }

    static getDefaultFooterConfig() {
        return ReportTemplate.DEFAULT_FOOTER_CONFIG;
    }

    /**
     * Inicializa plantillas por defecto
     */
    static async initializeDefaults(userId) {
        const defaults = [
            {
                name: 'Informe de Evaluación de Seguridad',
                description: 'Plantilla estándar para informes de evaluación de seguridad informática.',
                category: 'security-audit',
                language: 'es',
                isSystem: true,
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 1 },
                            content: [{ type: 'text', text: 'Informe de Evaluación de Seguridad' }]
                        },
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'Cliente: ' },
                                { type: 'text', text: '{{client.name}}', marks: [{ type: 'highlight' }] }
                            ]
                        },
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'Fecha: ' },
                                { type: 'text', text: '{{document.date}}', marks: [{ type: 'highlight' }] }
                            ]
                        },
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'Resumen Ejecutivo' }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Escriba aquí el resumen ejecutivo del informe...' }]
                        },
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'Alcance' }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '{{audit.scope}}', marks: [{ type: 'highlight' }] }]
                        },
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'Hallazgos' }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Total de vulnerabilidades encontradas: ' },
                                { type: 'text', text: '{{stats.total}}', marks: [{ type: 'highlight' }] }]
                        },
                        {
                            type: 'bulletList',
                            content: [
                                {
                                    type: 'listItem',
                                    content: [{
                                        type: 'paragraph',
                                        content: [
                                            { type: 'text', text: 'Críticas: ' },
                                            { type: 'text', text: '{{stats.critical}}', marks: [{ type: 'highlight' }] }
                                        ]
                                    }]
                                },
                                {
                                    type: 'listItem',
                                    content: [{
                                        type: 'paragraph',
                                        content: [
                                            { type: 'text', text: 'Altas: ' },
                                            { type: 'text', text: '{{stats.high}}', marks: [{ type: 'highlight' }] }
                                        ]
                                    }]
                                },
                                {
                                    type: 'listItem',
                                    content: [{
                                        type: 'paragraph',
                                        content: [
                                            { type: 'text', text: 'Medias: ' },
                                            { type: 'text', text: '{{stats.medium}}', marks: [{ type: 'highlight' }] }
                                        ]
                                    }]
                                },
                                {
                                    type: 'listItem',
                                    content: [{
                                        type: 'paragraph',
                                        content: [
                                            { type: 'text', text: 'Bajas: ' },
                                            { type: 'text', text: '{{stats.low}}', marks: [{ type: 'highlight' }] }
                                        ]
                                    }]
                                }
                            ]
                        },
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'Detalle de Vulnerabilidades' }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '{{#each vulnerabilities}}', marks: [{ type: 'code' }] }]
                        },
                        {
                            type: 'heading',
                            attrs: { level: 3 },
                            content: [{ type: 'text', text: '{{title}}', marks: [{ type: 'highlight' }] }]
                        },
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'Severidad: ', marks: [{ type: 'bold' }] },
                                { type: 'text', text: '{{severity}}', marks: [{ type: 'highlight' }] }
                            ]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '{{description}}', marks: [{ type: 'highlight' }] }]
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: '{{/each}}', marks: [{ type: 'code' }] }]
                        }
                    ]
                },
                sections: [
                    { id: 'cover', name: 'Portada', order: 0, required: true },
                    { id: 'executive-summary', name: 'Resumen Ejecutivo', order: 1, required: true },
                    { id: 'scope', name: 'Alcance', order: 2, required: true },
                    { id: 'methodology', name: 'Metodología', order: 3, required: false },
                    { id: 'findings-summary', name: 'Resumen de Hallazgos', order: 4, required: true },
                    { id: 'findings-detail', name: 'Detalle de Vulnerabilidades', order: 5, required: true, repeatable: true, repeatOver: 'vulnerabilities' },
                    { id: 'recommendations', name: 'Recomendaciones', order: 6, required: false },
                    { id: 'appendix', name: 'Anexos', order: 7, required: false }
                ]
            }
        ];
        
        const created = [];
        
        for (const template of defaults) {
            const exists = await ReportTemplate.findOne({ name: template.name });
            
            if (!exists) {
                const newTemplate = new ReportTemplate({
                    ...template,
                    createdBy: userId
                });
                await newTemplate.save();
                created.push(newTemplate);
            }
        }
        
        return {
            message: `Initialized ${created.length} default template(s)`,
            created
        };
    }
}

module.exports = ReportTemplateService;
