/**
 * DataSchemaService
 * 
 * Servicio que expone la estructura de todos los modelos disponibles
 * para el constructor visual de plantillas de reportes.
 * 
 * El admin puede explorar estos esquemas y seleccionar qué campos
 * incluir en cada plantilla de reporte.
 */

class DataSchemaService {
    
    /**
     * Obtiene todos los esquemas de datos disponibles para plantillas
     * Organizado jerárquicamente para fácil navegación en el frontend
     */
    static getAvailableSchemas() {
        return {
            // Información principal de la auditoría
            audit: {
                label: 'Auditoría',
                icon: 'clipboard-check',
                description: 'Información general de la evaluación',
                fields: {
                    name: { type: 'text', label: 'Nombre de la Auditoría', example: 'Evaluación de Seguridad Q1 2024' },
                    auditType: { type: 'text', label: 'Tipo de Auditoría', example: 'Penetration Test' },
                    date: { type: 'date', label: 'Fecha', example: '2024-01-15' },
                    date_start: { type: 'date', label: 'Fecha de Inicio', example: '2024-01-10' },
                    date_end: { type: 'date', label: 'Fecha de Fin', example: '2024-01-20' },
                    summary: { type: 'rich-text', label: 'Resumen Ejecutivo', example: 'Resumen de la evaluación...' },
                    language: { type: 'text', label: 'Idioma', example: 'es' },
                    state: { type: 'enum', label: 'Estado', options: ['EDIT', 'REVIEW', 'APPROVED'], example: 'APPROVED' },
                    type: { type: 'enum', label: 'Tipo', options: ['default', 'multi', 'retest'], example: 'default' }
                }
            },

            // Alcance de la auditoría
            scope: {
                label: 'Alcance',
                icon: 'target',
                description: 'Sistemas y hosts evaluados',
                isArray: true,
                arrayLabel: 'Alcances',
                fields: {
                    name: { type: 'text', label: 'Nombre del Alcance', example: 'Infraestructura Web' },
                    hosts: {
                        type: 'array',
                        label: 'Hosts',
                        fields: {
                            hostname: { type: 'text', label: 'Hostname', example: 'server01.ejemplo.com' },
                            ip: { type: 'text', label: 'Dirección IP', example: '192.168.1.100' },
                            os: { type: 'text', label: 'Sistema Operativo', example: 'Ubuntu 22.04' },
                            services: {
                                type: 'array',
                                label: 'Servicios',
                                fields: {
                                    port: { type: 'number', label: 'Puerto', example: 443 },
                                    protocol: { type: 'enum', label: 'Protocolo', options: ['tcp', 'udp'], example: 'tcp' },
                                    name: { type: 'text', label: 'Servicio', example: 'https' },
                                    product: { type: 'text', label: 'Producto', example: 'nginx' },
                                    version: { type: 'text', label: 'Versión', example: '1.18.0' }
                                }
                            }
                        }
                    }
                }
            },

            // Cliente
            client: {
                label: 'Cliente',
                icon: 'building',
                description: 'Información del cliente evaluado',
                fields: {
                    name: { type: 'text', label: 'Nombre del Cliente', example: 'Empresa ABC S.A.' },
                    lastname: { type: 'text', label: 'Apellido (si aplica)', example: '' },
                    email: { type: 'email', label: 'Correo Electrónico', example: 'contacto@empresa.com' },
                    phone: { type: 'text', label: 'Teléfono', example: '+591 2 1234567' },
                    cell: { type: 'text', label: 'Celular', example: '+591 71234567' },
                    title: { type: 'text', label: 'Cargo', example: 'Gerente de TI' },
                    logo: { type: 'image', label: 'Logo del Cliente', example: '[imagen]' }
                }
            },

            // Empresa evaluadora
            company: {
                label: 'Empresa Evaluadora',
                icon: 'briefcase',
                description: 'Información de la empresa que realiza la evaluación',
                fields: {
                    name: { type: 'text', label: 'Nombre de la Empresa', example: 'AGETIC' },
                    shortName: { type: 'text', label: 'Nombre Corto', example: 'AGETIC' },
                    logo: { type: 'image', label: 'Logo de la Empresa', example: '[imagen]' }
                }
            },

            // Creador de la auditoría
            creator: {
                label: 'Creador',
                icon: 'user',
                description: 'Usuario que creó la auditoría',
                fields: {
                    username: { type: 'text', label: 'Nombre de Usuario', example: 'jperez' },
                    firstname: { type: 'text', label: 'Nombre', example: 'Juan' },
                    lastname: { type: 'text', label: 'Apellido', example: 'Pérez' },
                    email: { type: 'email', label: 'Correo', example: 'jperez@agetic.gob.bo' },
                    phone: { type: 'text', label: 'Teléfono', example: '+591 71234567' },
                    role: { type: 'text', label: 'Rol', example: 'admin' }
                }
            },

            // Colaboradores
            collaborators: {
                label: 'Colaboradores',
                icon: 'users',
                description: 'Equipo que participa en la auditoría',
                isArray: true,
                arrayLabel: 'Colaboradores',
                fields: {
                    username: { type: 'text', label: 'Usuario', example: 'mgarcia' },
                    firstname: { type: 'text', label: 'Nombre', example: 'María' },
                    lastname: { type: 'text', label: 'Apellido', example: 'García' },
                    email: { type: 'email', label: 'Correo', example: 'mgarcia@agetic.gob.bo' },
                    phone: { type: 'text', label: 'Teléfono', example: '+591 72345678' },
                    jobTitle: { type: 'text', label: 'Cargo', example: 'Analista de Seguridad' },
                    role: { type: 'text', label: 'Rol', example: 'user' }
                }
            },

            // Revisores
            reviewers: {
                label: 'Revisores',
                icon: 'user-check',
                description: 'Usuarios que revisan y aprueban la auditoría',
                isArray: true,
                arrayLabel: 'Revisores',
                fields: {
                    username: { type: 'text', label: 'Usuario', example: 'supervisor' },
                    firstname: { type: 'text', label: 'Nombre', example: 'Carlos' },
                    lastname: { type: 'text', label: 'Apellido', example: 'López' },
                    role: { type: 'text', label: 'Rol', example: 'admin' }
                }
            },

            // Hallazgos/Vulnerabilidades
            findings: {
                label: 'Hallazgos',
                icon: 'alert-triangle',
                description: 'Vulnerabilidades encontradas en la evaluación',
                isArray: true,
                arrayLabel: 'Vulnerabilidades',
                fields: {
                    identifier: { type: 'number', label: 'ID', example: 1 },
                    title: { type: 'text', label: 'Título', example: 'SQL Injection en formulario de login' },
                    vulnType: { type: 'text', label: 'Tipo de Vulnerabilidad', example: 'Injection' },
                    description: { type: 'rich-text', label: 'Descripción', example: 'Se identificó una vulnerabilidad...' },
                    observation: { type: 'rich-text', label: 'Observación', example: 'Durante las pruebas se detectó...' },
                    remediation: { type: 'rich-text', label: 'Remediación', example: 'Se recomienda implementar...' },
                    remediationComplexity: { 
                        type: 'enum', 
                        label: 'Complejidad de Remediación', 
                        options: [
                            { value: 1, label: 'Baja' },
                            { value: 2, label: 'Media' },
                            { value: 3, label: 'Alta' }
                        ],
                        example: 2 
                    },
                    priority: { 
                        type: 'enum', 
                        label: 'Prioridad', 
                        options: [
                            { value: 1, label: 'Crítica' },
                            { value: 2, label: 'Alta' },
                            { value: 3, label: 'Media' },
                            { value: 4, label: 'Baja' }
                        ],
                        example: 1 
                    },
                    cvssv3: { type: 'text', label: 'CVSS v3', example: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
                    cvssv4: { type: 'text', label: 'CVSS v4', example: '' },
                    cvssScore: { type: 'computed', label: 'Puntuación CVSS', computed: 'cvssv3', example: '9.8' },
                    severity: { 
                        type: 'computed', 
                        label: 'Severidad', 
                        computed: 'cvssv3',
                        example: 'Crítica',
                        options: ['Crítica', 'Alta', 'Media', 'Baja', 'Informativa']
                    },
                    references: { type: 'array-text', label: 'Referencias', example: ['https://owasp.org/...', 'CVE-2024-1234'] },
                    poc: { type: 'rich-text', label: 'Prueba de Concepto', example: 'curl -X POST...' },
                    scope: { type: 'text', label: 'Alcance Afectado', example: 'https://app.ejemplo.com/login' },
                    status: { 
                        type: 'enum', 
                        label: 'Estado', 
                        options: [
                            { value: 0, label: 'Completado' },
                            { value: 1, label: 'En Redacción' }
                        ],
                        example: 0 
                    },
                    category: { type: 'text', label: 'Categoría', example: 'Web Application' },
                    retestStatus: { 
                        type: 'enum', 
                        label: 'Estado de Retest',
                        options: ['ok', 'ko', 'unknown', 'partial'],
                        example: 'unknown'
                    },
                    retestDescription: { type: 'rich-text', label: 'Descripción de Retest', example: '' },
                    paragraphs: {
                        type: 'array',
                        label: 'Párrafos Adicionales',
                        fields: {
                            text: { type: 'rich-text', label: 'Texto', example: 'Detalle adicional...' },
                            images: {
                                type: 'array',
                                label: 'Imágenes',
                                fields: {
                                    image: { type: 'image', label: 'Imagen', example: '[imagen]' },
                                    caption: { type: 'text', label: 'Descripción', example: 'Captura de pantalla' }
                                }
                            }
                        }
                    }
                }
            },

            // Secciones personalizadas
            sections: {
                label: 'Secciones',
                icon: 'file-text',
                description: 'Secciones personalizadas de la auditoría',
                isArray: true,
                arrayLabel: 'Secciones',
                fields: {
                    field: { type: 'text', label: 'Campo', example: 'executive_summary' },
                    name: { type: 'text', label: 'Nombre', example: 'Resumen Ejecutivo' },
                    text: { type: 'rich-text', label: 'Contenido', example: 'Contenido de la sección...' }
                }
            },

            // Estadísticas calculadas
            stats: {
                label: 'Estadísticas',
                icon: 'bar-chart-2',
                description: 'Métricas calculadas automáticamente',
                isComputed: true,
                fields: {
                    total: { type: 'number', label: 'Total de Hallazgos', computed: true, example: 15 },
                    critical: { type: 'number', label: 'Críticas', computed: true, example: 2 },
                    high: { type: 'number', label: 'Altas', computed: true, example: 4 },
                    medium: { type: 'number', label: 'Medias', computed: true, example: 5 },
                    low: { type: 'number', label: 'Bajas', computed: true, example: 3 },
                    info: { type: 'number', label: 'Informativas', computed: true, example: 1 },
                    byCategory: { 
                        type: 'object', 
                        label: 'Por Categoría', 
                        computed: true,
                        example: { 'Web Application': 8, 'Network': 5, 'API': 2 }
                    },
                    byType: { 
                        type: 'object', 
                        label: 'Por Tipo', 
                        computed: true,
                        example: { 'Injection': 3, 'XSS': 2, 'Misconfiguration': 5 }
                    },
                    riskScore: { type: 'number', label: 'Puntuación de Riesgo', computed: true, example: 7.5 }
                }
            },

            // Estado de seguimiento (AuditStatus)
            auditStatus: {
                label: 'Estado de Seguimiento',
                icon: 'activity',
                description: 'Estado actual del proceso de evaluación',
                fields: {
                    status: { 
                        type: 'enum', 
                        label: 'Estado', 
                        options: ['EVALUANDO', 'EN_REVISION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'FINALIZADO'],
                        example: 'EVALUANDO'
                    },
                    observaciones: { type: 'rich-text', label: 'Observaciones', example: 'Pendiente revisión de...' },
                    fechaInicio: { type: 'date', label: 'Fecha de Inicio', example: '2024-01-10' },
                    fechaFin: { type: 'date', label: 'Fecha de Fin', example: '2024-01-20' }
                }
            },

            // Procedimiento (AuditProcedure)
            procedure: {
                label: 'Procedimiento',
                icon: 'list-checks',
                description: 'Información del procedimiento de evaluación',
                fields: {
                    codigo: { type: 'text', label: 'Código', example: 'PR01' },
                    nombre: { type: 'text', label: 'Nombre', example: 'Evaluación por Solicitud de Entidades' },
                    alcance: { type: 'array-text', label: 'Alcance', example: ['Externa', 'Aplicación Web'] },
                    citeRecepcion: { type: 'text', label: 'CITE de Recepción', example: 'AGETIC/2024/001' },
                    citeRespuesta: { type: 'text', label: 'CITE de Respuesta', example: 'AGETIC/2024/002' },
                    citeInforme: { type: 'text', label: 'CITE del Informe', example: 'AGETIC/INF/2024/001' },
                    notas: { type: 'rich-text', label: 'Notas', example: 'Notas adicionales...' }
                }
            },

            // Verificaciones (AuditVerification)
            verifications: {
                label: 'Verificaciones',
                icon: 'check-square',
                description: 'Lista de verificaciones realizadas',
                isArray: true,
                arrayLabel: 'Verificaciones',
                fields: {
                    categoria: { type: 'text', label: 'Categoría', example: 'OWASP Top 10' },
                    item: { type: 'text', label: 'Item', example: 'A01:2021 - Broken Access Control' },
                    descripcion: { type: 'text', label: 'Descripción', example: 'Verificación de controles de acceso' },
                    resultado: { 
                        type: 'enum', 
                        label: 'Resultado',
                        options: ['CUMPLE', 'NO_CUMPLE', 'PARCIAL', 'NO_APLICA', 'PENDIENTE'],
                        example: 'NO_CUMPLE'
                    },
                    observaciones: { type: 'rich-text', label: 'Observaciones', example: 'Se encontraron...' },
                    evidencia: { type: 'rich-text', label: 'Evidencia', example: 'Ver hallazgo #1' }
                }
            },

            // Documento
            document: {
                label: 'Documento',
                icon: 'file',
                description: 'Metadatos del documento generado',
                isComputed: true,
                fields: {
                    date: { type: 'date', label: 'Fecha de Generación', computed: true, example: '2024-01-25' },
                    version: { type: 'text', label: 'Versión', example: '1.0' },
                    pageNumber: { type: 'computed', label: 'Número de Página', computed: true, example: '1' },
                    totalPages: { type: 'computed', label: 'Total de Páginas', computed: true, example: '25' }
                }
            }
        };
    }

    /**
     * Obtiene un esquema específico por nombre
     */
    static getSchema(schemaName) {
        const schemas = this.getAvailableSchemas();
        return schemas[schemaName] || null;
    }

    /**
     * Obtiene la lista de esquemas para el panel de exploración
     * (versión simplificada para mostrar en el sidebar)
     */
    static getSchemaList() {
        const schemas = this.getAvailableSchemas();
        return Object.entries(schemas).map(([key, schema]) => ({
            key,
            label: schema.label,
            icon: schema.icon,
            description: schema.description,
            isArray: schema.isArray || false,
            isComputed: schema.isComputed || false,
            fieldCount: Object.keys(schema.fields).length
        }));
    }

    /**
     * Genera la sintaxis de variable para usar en el template
     * @param {string} schemaKey - Clave del esquema (ej: 'audit', 'client')
     * @param {string} fieldPath - Ruta del campo (ej: 'name', 'hosts.0.ip')
     * @param {Object} options - Opciones adicionales
     */
    static generateVariableSyntax(schemaKey, fieldPath, options = {}) {
        const { format, isLoop, loopVar } = options;
        
        let variable = `${schemaKey}.${fieldPath}`;
        
        // Si es dentro de un loop, usar la variable del loop
        if (isLoop && loopVar) {
            variable = `${loopVar}.${fieldPath}`;
        }
        
        // Aplicar formato si existe
        if (format) {
            switch (format) {
                case 'date':
                    return `{{formatDate ${variable} "DD/MM/YYYY"}}`;
                case 'datetime':
                    return `{{formatDate ${variable} "DD/MM/YYYY HH:mm"}}`;
                case 'uppercase':
                    return `{{uppercase ${variable}}}`;
                case 'lowercase':
                    return `{{lowercase ${variable}}}`;
                case 'currency':
                    return `{{formatCurrency ${variable}}}`;
                default:
                    return `{{${variable}}}`;
            }
        }
        
        return `{{${variable}}}`;
    }

    /**
     * Genera sintaxis para loops (arrays)
     * @param {string} schemaKey - Clave del esquema array
     * @param {string} itemVar - Nombre de la variable para cada item
     */
    static generateLoopSyntax(schemaKey, itemVar = 'item') {
        return {
            start: `{{#each ${schemaKey} as |${itemVar}|}}`,
            end: '{{/each}}',
            itemVar
        };
    }

    /**
     * Genera sintaxis para condicionales
     * @param {string} variable - Variable a evaluar
     * @param {string} operator - Operador (eq, ne, gt, lt, etc.)
     * @param {any} value - Valor a comparar
     */
    static generateConditionalSyntax(variable, operator = 'if', value = null) {
        if (operator === 'if') {
            return {
                start: `{{#if ${variable}}}`,
                else: '{{else}}',
                end: '{{/if}}'
            };
        }
        
        if (operator === 'eq' && value !== null) {
            return {
                start: `{{#if (eq ${variable} "${value}")}}`,
                else: '{{else}}',
                end: '{{/if}}'
            };
        }
        
        return {
            start: `{{#${operator} ${variable}}}`,
            else: '{{else}}',
            end: `{{/${operator}}}`
        };
    }

    /**
     * Valida si una variable existe en los esquemas
     */
    static validateVariable(variablePath) {
        const parts = variablePath.split('.');
        const schemaKey = parts[0];
        const schemas = this.getAvailableSchemas();
        
        if (!schemas[schemaKey]) {
            return { valid: false, error: `Schema '${schemaKey}' not found` };
        }
        
        // Navegar por los campos
        let currentFields = schemas[schemaKey].fields;
        for (let i = 1; i < parts.length; i++) {
            const fieldName = parts[i];
            
            // Ignorar índices numéricos en arrays
            if (!isNaN(fieldName)) continue;
            
            if (!currentFields[fieldName]) {
                return { valid: false, error: `Field '${fieldName}' not found in path` };
            }
            
            // Si el campo es un objeto con sub-campos, navegar más profundo
            if (currentFields[fieldName].fields) {
                currentFields = currentFields[fieldName].fields;
            }
        }
        
        return { valid: true };
    }

    /**
     * Obtiene datos de ejemplo para preview
     */
    static getSampleData() {
        return {
            audit: {
                name: 'Evaluación de Seguridad - Portal Web Institucional',
                auditType: 'Penetration Test',
                date: '2024-01-15',
                date_start: '2024-01-10',
                date_end: '2024-01-20',
                summary: 'Se realizó una evaluación de seguridad completa del portal web institucional, identificando múltiples vulnerabilidades que requieren atención inmediata.',
                language: 'es',
                state: 'APPROVED',
                type: 'default'
            },
            client: {
                name: 'Ministerio de Economía',
                email: 'ti@economia.gob.bo',
                phone: '+591 2 2123456',
                title: 'Dirección de TI',
                logo: null
            },
            company: {
                name: 'Agencia de Gobierno Electrónico y Tecnologías de Información y Comunicación',
                shortName: 'AGETIC',
                logo: null
            },
            creator: {
                username: 'fhurtado',
                firstname: 'Fabian',
                lastname: 'Hurtado',
                email: 'fhurtado@agetic.gob.bo',
                role: 'admin'
            },
            collaborators: [
                { username: 'jperez', firstname: 'Juan', lastname: 'Pérez', jobTitle: 'Analista de Seguridad' },
                { username: 'mgarcia', firstname: 'María', lastname: 'García', jobTitle: 'Pentester Senior' }
            ],
            findings: [
                {
                    identifier: 1,
                    title: 'SQL Injection en formulario de autenticación',
                    vulnType: 'Injection',
                    severity: 'Crítica',
                    cvssv3: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
                    cvssScore: '9.8',
                    description: 'Se identificó una vulnerabilidad de inyección SQL...',
                    remediation: 'Implementar consultas parametrizadas...',
                    category: 'Web Application',
                    status: 0
                },
                {
                    identifier: 2,
                    title: 'Cross-Site Scripting (XSS) Reflejado',
                    vulnType: 'XSS',
                    severity: 'Alta',
                    cvssv3: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
                    cvssScore: '6.1',
                    description: 'Se detectó una vulnerabilidad XSS reflejado...',
                    remediation: 'Sanitizar todas las entradas de usuario...',
                    category: 'Web Application',
                    status: 0
                }
            ],
            stats: {
                total: 15,
                critical: 2,
                high: 4,
                medium: 5,
                low: 3,
                info: 1,
                riskScore: 7.5
            },
            procedure: {
                codigo: 'PR01',
                nombre: 'Evaluación por Solicitud de Entidades',
                alcance: ['Externa', 'Aplicación Web'],
                citeRecepcion: 'ME/DGTI/2024/001',
                citeRespuesta: 'AGETIC/CGII/2024/001'
            },
            document: {
                date: new Date().toISOString().split('T')[0],
                version: '1.0'
            }
        };
    }
}

module.exports = DataSchemaService;
