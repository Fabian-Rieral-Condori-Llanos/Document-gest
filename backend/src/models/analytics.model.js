const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Analytics Model
 * 
 * Modelo para cachear estadísticas pre-calculadas.
 * Se actualiza periódicamente mediante un job scheduler.
 */

const AnalyticsSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    data: {
        // Estadísticas generales
        totalAudits: { type: Number, default: 0 },
        activeAudits: { type: Number, default: 0 },
        completedAudits: { type: Number, default: 0 },
        totalVulnerabilities: { type: Number, default: 0 },
        criticalVulns: { type: Number, default: 0 },
        highVulns: { type: Number, default: 0 },
        mediumVulns: { type: Number, default: 0 },
        lowVulns: { type: Number, default: 0 },
        
        // Datos por tipo de auditoría
        auditsByType: [{
            type: String,
            count: Number,
            percentage: Number
        }],
        
        // Datos por procedimiento ACGII
        auditsByProcedure: [{
            procedureId: String,
            procedureName: String,
            count: Number
        }],
        
        // Vulnerabilidades por categoría
        vulnsByCategory: [{
            category: String,
            count: Number,
            critical: Number,
            high: Number,
            medium: Number,
            low: Number
        }],
        
        // Tendencias mensuales (últimos 12 meses)
        monthlyTrends: [{
            month: String,
            audits: Number,
            vulnerabilities: Number,
            remediated: Number
        }],
        
        // Top entidades
        topEntities: [{
            entityId: String,
            entityName: String,
            auditCount: Number,
            criticalVulns: Number,
            highVulns: Number,
            remediationRate: Number
        }],
        
        // Estados de auditorías
        auditsByStatus: [{
            status: String,
            count: Number,
            percentage: Number
        }],
        
        // Tasa de remediación
        remediationStats: {
            totalVulns: Number,
            remediatedVulns: Number,
            remediationRate: Number,
            avgRemediationTime: Number // en días
        }
    }
}, {
    timestamps: true
});

// Índice compuesto para búsquedas eficientes
AnalyticsSchema.index({ type: 1, date: -1 });

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = Analytics;