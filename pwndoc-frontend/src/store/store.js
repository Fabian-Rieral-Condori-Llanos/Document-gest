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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});