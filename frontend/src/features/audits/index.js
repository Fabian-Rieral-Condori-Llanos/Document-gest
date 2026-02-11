// Audits Feature Module
// Export all slices and selectors

// Main Audits
export {
  default as auditsReducer,
  // Thunks
  fetchAudits,
  fetchAuditById,
  createAudit,
  deleteAudit,
  updateAuditGeneral,
  updateAuditState,
  fetchAuditFindings,
  fetchAuditFinding,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  moveAuditFinding,
  importVulnerabilities,
  fetchAuditSections,
  // Actions
  setFilters,
  clearFilters,
  clearSelectedAudit,
  clearSelectedFinding,
  clearError,
  setPage,
  setLimit,
  // Selectors
  selectAllAudits,
  selectAuditsLoading,
  selectAuditsError,
  selectSelectedAudit,
  selectSelectedAuditLoading,
  selectSelectedAuditError,
  selectAuditFindings,
  selectFindingsLoading,
  selectFindingsError,
  selectSelectedFinding,
  selectSelectedFindingLoading,
  selectSelectedFindingError,
  selectAuditSections,
  selectSectionsLoading,
  selectAuditsFilters,
  selectAuditsPagination,
  selectFilteredAudits,
  // Constants
  AUDIT_STATES,
  AUDIT_TYPES,
  AUDIT_STATE_LABELS,
  AUDIT_TYPE_LABELS,
  AUDIT_STATE_COLORS,
} from './auditsSlice';

// Audit Status
export {
  default as auditStatusReducer,
  // Thunks
  fetchAuditStatuses,
  fetchAuditStatusByAuditId,
  fetchAuditStatusHistory,
  fetchAuditStatusStats,
  fetchAuditStatusTypes,
  createAuditStatus,
  updateAuditStatusByAuditId,
  deleteAuditStatus,
  // Actions
  setFilters as setStatusFilters,
  clearFilters as clearStatusFilters,
  clearSelectedStatus,
  clearError as clearStatusError,
  // Selectors
  selectAllAuditStatuses,
  selectAuditStatusLoading,
  selectAuditStatusError,
  selectSelectedAuditStatus,
  selectSelectedAuditStatusLoading,
  selectAuditStatusStats,
  selectAuditStatusStatsLoading,
  selectAuditStatusHistory,
  selectAuditStatusHistoryLoading,
  selectAuditStatusTypes,
  selectAuditStatusFilters,
  selectFilteredAuditStatuses,
  // Constants
  AUDIT_STATUS_TYPES,
  AUDIT_STATUS_COLORS,
  AUDIT_STATUS_LABELS,
} from './auditStatusSlice';

// Audit Verifications
export {
  default as auditVerificationsReducer,
  // Thunks
  fetchAuditVerifications,
  fetchAuditVerificationById,
  fetchAuditVerificationsByAuditId,
  fetchAuditVerificationStats,
  fetchVerificationStatuses,
  createAuditVerification,
  updateAuditVerification,
  finalizeAuditVerification,
  deleteAuditVerification,
  updateVerificationFinding,
  // Actions
  setFilters as setVerificationFilters,
  clearFilters as clearVerificationFilters,
  clearSelectedVerification,
  clearError as clearVerificationError,
  // Selectors
  selectAllVerifications,
  selectVerificationsLoading,
  selectVerificationsError,
  selectSelectedVerification,
  selectSelectedVerificationLoading,
  selectVerificationStats,
  selectVerificationStatsLoading,
  selectVerificationStatuses,
  selectVerificationFilters,
  selectFilteredVerifications,
  // Constants
  VERIFICATION_STATUS,
  VERIFICATION_RESULT,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_RESULT_LABELS,
} from './auditVerificationsSlice';

// Audit Procedures
export {
  default as auditProceduresReducer,
  // Thunks
  fetchAuditProcedures,
  fetchAuditProcedureById,
  fetchAuditProcedureByAuditId,
  fetchAuditProcedureStats,
  fetchAlcanceTipos,
  searchAuditProcedures,
  createAuditProcedure,
  updateAuditProcedure,
  updateAuditProcedureByAuditId,
  deleteAuditProcedure,
  updateProcedureSolicitud,
  updateProcedureInstructivo,
  updateProcedureInforme,
  updateProcedureRespuesta,
  updateProcedureNotas,
  updateProcedureRetest,
  // Actions
  setFilters as setProcedureFilters,
  clearFilters as clearProcedureFilters,
  clearSelectedProcedure,
  clearError as clearProcedureError,
  // Selectors
  selectAllProcedures,
  selectProceduresLoading,
  selectProceduresError,
  selectSelectedProcedure,
  selectSelectedProcedureLoading,
  selectProcedureStats,
  selectProcedureStatsLoading,
  selectAlcanceTipos,
  selectProcedureFilters,
  selectFilteredProcedures,
  // Constants
  ALCANCE_TIPOS,
  ALCANCE_LABELS,
  ALCANCE_COLORS,
  DOCUMENT_SECTIONS,
} from './auditProceduresSlice';