import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSelectors';
import { hydrateAuth } from '../features/auth/authSlice';
import { getProfile } from '../features/auth/authThunks';

// Layout
import { MainLayout } from '../components/layout';

// Guards
import PrivateRoute from './PrivateRoute';
import RoleGuard, { AdminOnly } from './RoleGuard';

// Pages - Auth
import Login from '../pages/Auth/Login';
import Setup from '../pages/Auth/Setup';

// Pages - Main
import Dashboard from '../pages/Dashboard/Dashboard';

// Pages - Users
import { UsersPage, UserFormPage } from '../pages/Users';

// Pages - Profile
import { ProfilePage } from '../pages/Profile';

// Pages - Clients (Entidades)
import { ClientsPage, ClientFormPage } from '../pages/Clients';

// Pages - Companies (Empresas)
import { CompaniesPage, CompanyFormPage } from '../pages/Companies';

// Pages - Vulnerabilities (Base de Conocimiento)
import { VulnerabilitiesPage, VulnerabilityFormPage, VulnerabilityDetailPage } from '../pages/Vulnerabilities';

// Pages - Data (Datos del Sistema)
import { DataPage } from '../pages/Data';

// Pages - Settings (Configuración)
import { SettingsPage } from '../pages/Settings';

// Pages - Audits (Evaluaciones)
import { AuditsPage, AuditFormPage, AuditDetailPage, FindingFormPage, FindingDetailPage } from '../pages/Audits';

// Pages - Procedure Templates (Admin)
import { ProcedureTemplatesPage } from '../pages/ProcedureTemplates';

// Pages - Report Templates (Admin)
import { ReportTemplatesPage, ReportTemplateEditorPage } from '../pages/ReportTemplates';

// Pages - Reports (Editor de reportes de auditorías)
import { ReportEditorPage } from '../pages/Reports';

// Pages - Alcance Templates (Admin)
import { AlcanceTemplatesPage } from '../pages/AlcanceTemplates';

// Pages - Backups (Admin)
import { BackupsPage } from '../pages/Backups';

// Pages - Error
import NotFound from '../pages/NotFound/NotFound';
import Forbidden from '../pages/Forbidden/Forbidden';
import AuditStatusPage from '../pages/AuditStatus/AuditStatusPage';
import { AuditVerificationsPage, VerificationDetailPage } from '../pages/AuditVerifications';
import { AuditProceduresPage } from '../pages/AuditProcedures';

const AppRoutes = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Verificando autenticación...');
      
      // Primero, hidratar desde localStorage
      dispatch(hydrateAuth());
      
      // Verificar si hay una sesión previa
      const hasSession = localStorage.getItem('hasSession') === 'true';
      
      if (hasSession) {
        console.log('Sesión previa detectada, verificando con servidor...');
        
        // Si hay sesión previa, intentar obtener perfil (validará las cookies)
        try {
          console.log('Obteniendo perfil del usuario...');
          await dispatch(getProfile()).unwrap();
          console.log('Perfil obtenido correctamente');
        } catch (error) {
          console.error('Error obteniendo perfil:', error);
          // El interceptor manejará el refresh o logout si es necesario
        }
      } else {
        console.log('No hay sesión previa');
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []); // Solo al montar

  // Mostrar loading mientras verifica
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-500/10 mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-text-secondary">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      
      {/* Rutas Privadas con MainLayout */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Perfil del usuario actual */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* ============================================ */}
        {/* USUARIOS - Solo Admin */}
        {/* ============================================ */}
        <Route path="/users" element={
          <AdminOnly>
            <UsersPage />
          </AdminOnly>
        } />
        <Route path="/users/create" element={
          <AdminOnly>
            <UserFormPage />
          </AdminOnly>
        } />
        <Route path="/users/:username/edit" element={
          <AdminOnly>
            <UserFormPage />
          </AdminOnly>
        } />
        
        {/* ============================================ */}
        {/* EVALUACIONES / AUDITORÍAS */}
        {/* ============================================ */}
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/audits/create" element={<AuditFormPage />} />
        <Route path="/audits/:id" element={<AuditDetailPage />} />
        <Route path="/audits/:id/edit" element={<AuditFormPage />} />
        <Route path="/audits/:auditId/report" element={<ReportEditorPage />} />
        
        {/* Findings (Hallazgos) */}
        <Route path="/audits/:auditId/findings/create" element={<FindingFormPage />} />
        <Route path="/audits/:auditId/findings/:findingId" element={<FindingDetailPage />} />
        <Route path="/audits/:auditId/findings/:findingId/edit" element={<FindingFormPage />} />
        
        {/* Sub-módulos de Auditoría */}
        <Route path="/audit-status" element={<AuditStatusPage />} />
        <Route path="/audit-verifications" element={<AuditVerificationsPage />} />
        <Route path="/audit-verifications/:auditId" element={<VerificationDetailPage />} />
        <Route path="/audit-procedures" element={<AuditProceduresPage />} />
        
        {/* ============================================ */}
        {/* VULNERABILIDADES (Base de Conocimiento) - Todos los roles */}
        {/* ============================================ */}
        <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
        <Route path="/vulnerabilities/create" element={<VulnerabilityFormPage />} />
        <Route path="/vulnerabilities/:id" element={<VulnerabilityDetailPage />} />
        <Route path="/vulnerabilities/:id/edit" element={<VulnerabilityFormPage />} />
        
        {/* ============================================ */}
        {/* ENTIDADES (Clients) - Todos los roles */}
        {/* ============================================ */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/create" element={<ClientFormPage />} />
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        
        {/* ============================================ */}
        {/* EMPRESAS (Companies) - Todos los roles */}
        {/* ============================================ */}
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/create" element={<CompanyFormPage />} />
        <Route path="/companies/:id/edit" element={<CompanyFormPage />} />
        
        {/* ============================================ */}
        {/* ADMINISTRACIÓN - Solo Admin */}
        {/* ============================================ */}
        <Route path="/procedure-templates" element={
          <AdminOnly>
            <ProcedureTemplatesPage />
          </AdminOnly>
        } />
        
        {/* ============================================ */}
        {/* PLANTILLAS DE REPORTES - Admin */}
        {/* ============================================ */}
        <Route path="/report-templates" element={
          <AdminOnly>
            <ReportTemplatesPage />
          </AdminOnly>
        } />
        <Route path="/report-templates/new" element={
          <AdminOnly>
            <ReportTemplateEditorPage />
          </AdminOnly>
        } />
        <Route path="/report-templates/:id/edit" element={
          <AdminOnly>
            <ReportTemplateEditorPage />
          </AdminOnly>
        } />
        <Route path="/report-templates/:id/preview" element={
          <AdminOnly>
            <ReportTemplateEditorPage />
          </AdminOnly>
        } />

        {/* ============================================ */}
        {/* PLANTILLAS DE ALCANCE - Admin */}
        {/* ============================================ */}
        <Route path="/alcance-templates" element={
          <AdminOnly>
            <AlcanceTemplatesPage />
          </AdminOnly>
        } />

        {/* ============================================ */}
        {/* BACKUPS - Solo Admin */}
        {/* ============================================ */}
        <Route path="/backups" element={
          <AdminOnly>
            <BackupsPage />
          </AdminOnly>
        } />
        
        {/* ============================================ */}
        {/* CONFIGURACIÓN */}
        {/* ============================================ */}
        <Route path="/data" element={
          <AdminOnly>
            <DataPage />
          </AdminOnly>
        } />
        <Route path="/settings" element={
          <AdminOnly>
            <SettingsPage />
          </AdminOnly>
        } />
      </Route>
      
      {/* Rutas de Error */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      
      {/* Redirecciones */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

// Componente temporal para páginas en desarrollo
const ComingSoon = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center p-8">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/10 mb-4">
        <span className="text-3xl"></span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-400">Este módulo está en desarrollo</p>
    </div>
  </div>
);

export default AppRoutes;