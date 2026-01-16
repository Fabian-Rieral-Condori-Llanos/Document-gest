import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';
import clientsReducer from '../features/clients/clientsSlice';
import companiesReducer from '../features/companies/companiesSlice';
import dataReducer from '../features/data/dataSlice';
import settingsReducer from '../features/settings/settingsSlice';
import vulnerabilitiesReducer from '../features/vulnerabilities/vulnerabilitiesSlice';
import {
  auditsReducer,
  auditStatusReducer,
  auditVerificationsReducer,
  auditProceduresReducer,
} from '../features/audits';
import { procedureTemplatesReducer } from '../features/procedureTemplates';
import { alcanceTemplatesReducer } from '../features/alcanceTemplates';
import { reportTemplatesReducer } from '../features/reportTemplates';
import { reportInstancesReducer } from '../features/reportInstances';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    clients: clientsReducer,
    companies: companiesReducer,
    data: dataReducer,
    settings: settingsReducer,
    vulnerabilities: vulnerabilitiesReducer,
    // Audits module
    audits: auditsReducer,
    auditStatus: auditStatusReducer,
    auditVerifications: auditVerificationsReducer,
    auditProcedures: auditProceduresReducer,
    // Procedure Templates
    procedureTemplates: procedureTemplatesReducer,
    // Alcance Templates
    alcanceTemplates: alcanceTemplatesReducer,
    // Report Templates & Instances
    reportTemplates: reportTemplatesReducer,
    reportInstances: reportInstancesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});