import { useState } from 'react';
import Card from '../../components/common/Card/Card';
import {
  Database,
  Globe,
  FileType,
  Shield,
  FolderTree,
  FormInput,
  LayoutList,
} from 'lucide-react';

// Tabs Components
import LanguagesTab from './tabs/LanguagesTab';
import AuditTypesTab from './tabs/AuditTypesTab';
import VulnerabilityTypesTab from './tabs/VulnerabilityTypesTab';
import VulnerabilityCategoriesTab from './tabs/VulnerabilityCategoriesTab';
import CustomFieldsTab from './tabs/CustomFieldsTab';
import CustomSectionsTab from './tabs/CustomSectionsTab';

/**
 * DataPage - Página de gestión de datos del sistema
 * 
 * Incluye:
 * - Idiomas
 * - Tipos de Auditoría
 * - Tipos de Vulnerabilidad
 * - Categorías de Vulnerabilidad
 * - Campos Personalizados
 * - Secciones Personalizadas
 */

const tabs = [
  { id: 'languages', label: 'Idiomas', icon: Globe },
  { id: 'audit-types', label: 'Tipos de Auditoría', icon: FileType },
  { id: 'vuln-types', label: 'Tipos de Vulnerabilidad', icon: Shield },
  { id: 'vuln-categories', label: 'Categorías', icon: FolderTree },
  { id: 'custom-fields', label: 'Campos Personalizados', icon: FormInput },
  { id: 'custom-sections', label: 'Secciones', icon: LayoutList },
];

const DataPage = () => {
  const [activeTab, setActiveTab] = useState('languages');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'languages':
        return <LanguagesTab />;
      case 'audit-types':
        return <AuditTypesTab />;
      case 'vuln-types':
        return <VulnerabilityTypesTab />;
      case 'vuln-categories':
        return <VulnerabilityCategoriesTab />;
      case 'custom-fields':
        return <CustomFieldsTab />;
      case 'custom-sections':
        return <CustomSectionsTab />;
      default:
        return <LanguagesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-primary-400" />
            Datos del Sistema
          </h1>
          <p className="text-gray-400 mt-1">
            Configuración de idiomas, tipos, categorías y campos personalizados
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-1 bg-bg-secondary rounded-lg border border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DataPage;