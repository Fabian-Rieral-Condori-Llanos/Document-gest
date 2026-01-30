import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../../hooks/useAuth';
import { selectCurrentUser } from '../../../features/auth/authSelectors';
import {
  LayoutDashboard,
  ClipboardList,
  Activity,
  CheckCircle2,
  FileText,
  Shield,
  Building2,
  Landmark,
  Users,
  FileBox,
  Database,
  Settings,
  Layers,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  Lock
} from 'lucide-react';

// Configuración de navegación
const navigationConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardList,
    isSection: true,
    children: [
      { id: 'audits', label: 'Evaluaciones', icon: ClipboardList, path: '/audits' },
      { id: 'audit-status', label: 'Seguimiento', icon: Activity, path: '/audit-status' },
      { id: 'audit-verifications', label: 'Verificaciones', icon: CheckCircle2, path: '/audit-verifications' },
      { id: 'audit-procedures', label: 'Procedimientos', icon: FileText, path: '/audit-procedures' },
    ],
  },
  {
    id: 'vulnerabilities-section',
    label: 'Vulnerabilidades',
    icon: Shield,
    isSection: true,
    children: [
      { id: 'vulnerabilities', label: 'Base de Conocimiento', icon: Shield, path: '/vulnerabilities' },
    ],
  },
  {
    id: 'entities-section',
    label: 'Entidades',
    icon: Building2,
    isSection: true,
    children: [
      { id: 'clients', label: 'Entidades', icon: Building2, path: '/clients' },
      { id: 'companies', label: 'Empresas', icon: Landmark, path: '/companies' },
    ],
  },
  {
    id: 'admin-section',
    label: 'Administración',
    icon: Users,
    isSection: true,
    requiredRole: 'admin',
    children: [
      { id: 'users', label: 'Usuarios', icon: Users, path: '/users' },
      { id: 'procedure-templates', label: 'Plantillas Procedimientos', icon: FileText, path: '/procedure-templates' },
      { id: 'report-templates', label: 'Plantillas Reportes', icon: FileBox, path: '/report-templates' },
      { id: 'alcance-templates', label: 'Plantillas Alcance', icon: FileBox, path: '/alcance-templates' },
      { id: 'backups', label: 'Backups', icon: Database, path: '/backups' },
    ],
  },
  {
    id: 'config-section',
    label: 'Configuración',
    icon: Settings,
    isSection: true,
    requiredRole: 'admin',
    children: [
      { id: 'data', label: 'Datos del Sistema', icon: Layers, path: '/data' },
      { id: 'settings', label: 'Configuración', icon: Settings, path: '/settings' },
    ],
  },
];

// Componente de item de navegación
const NavItem = ({ item, isCollapsed, isActive, onClick }) => {
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive: linkActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${linkActive || isActive
          ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500'
          : 'text-gray-400 hover:bg-bg-tertiary hover:text-gray-200 border-l-2 border-transparent'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : ''}`} />
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
    </NavLink>
  );
};

// Componente de sección colapsable
const NavSection = ({ section, isCollapsed, expandedSections, toggleSection, onItemClick }) => {
  const Icon = section.icon;
  const isExpanded = expandedSections.includes(section.id);
  const location = useLocation();
  
  // Verificar si algún hijo está activo
  const hasActiveChild = section.children?.some(child => 
    location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  );

  if (isCollapsed) {
    // En modo colapsado, mostrar solo iconos con tooltip
    return (
      <div className="space-y-1">
        {section.children?.map(child => (
          <NavItem 
            key={child.id} 
            item={child} 
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header de sección */}
      <button
        onClick={() => toggleSection(section.id)}
        className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
          ${hasActiveChild 
            ? 'text-primary-400' 
            : 'text-gray-500 hover:text-gray-300'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {section.label}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      
      {/* Items de la sección */}
      <div className={`
        space-y-1 overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {section.children?.map(child => (
          <div key={child.id} className="pl-2">
            <NavItem 
              item={child} 
              isCollapsed={isCollapsed}
              onClick={onItemClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente principal Navbar
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['evaluaciones', 'vulnerabilities-section']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const user = useSelector(selectCurrentUser);
  const { logout } = useAuth();
  const location = useLocation();
  const navRef = useRef(null);
  const triggerRef = useRef(null);
  const userMenuRef = useRef(null);

  // Detectar movimiento del mouse para mostrar/ocultar navbar
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Mostrar navbar cuando el mouse está en el borde izquierdo
      if (e.clientX <= 20 && !isOpen) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  // Cerrar navbar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        navRef.current && 
        !navRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
      
      // Cerrar menú de usuario
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar navbar al cambiar de ruta (en móvil)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = () => {
    // Cerrar en móvil al seleccionar item
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  // Filtrar navegación según rol del usuario
  const filteredNavigation = navigationConfig.filter(item => {
    // Si el item requiere un rol específico
    if (item.requiredRole) {
      // Si no hay usuario o no tiene rol, ocultar
      if (!user || !user.role) {
        return false;
      }
      // Si el rol no coincide, ocultar
      if (user.role !== item.requiredRole) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      {/* Botón trigger para móvil y desktop */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-secondary border border-gray-700
          hover:bg-bg-tertiary transition-all duration-300
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6 text-gray-400" />
      </button>

      {/* Overlay para móvil */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Navbar lateral */}
      <nav
        ref={navRef}
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-bg-secondary border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
        onMouseLeave={() => {
          // Solo ocultar en desktop
          if (window.innerWidth >= 1024) {
            setIsOpen(false);
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">ACGII</h1>
                <p className="text-xs text-gray-500 truncate">Centro de Gestión</p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {filteredNavigation.map(item => {
            if (item.isSection) {
              return (
                <NavSection
                  key={item.id}
                  section={item}
                  isCollapsed={isCollapsed}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  onItemClick={handleItemClick}
                />
              );
            }
            return (
              <NavItem 
                key={item.id} 
                item={item} 
                isCollapsed={isCollapsed}
                onClick={handleItemClick}
              />
            );
          })}
        </div>

        {/* Footer - Usuario */}
        <div className="border-t border-gray-800 p-3">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                w-full flex items-center gap-3 p-2 rounded-lg
                hover:bg-bg-tertiary transition-all duration-200
                ${showUserMenu ? 'bg-bg-tertiary' : ''}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {/* Avatar */}
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold text-sm flex-shrink-0">
                {user?.firstname?.charAt(0)?.toUpperCase() || 'U'}
                {user?.lastname?.charAt(0)?.toUpperCase() || ''}
              </div>
              
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.firstname} {user?.lastname}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDown className={`
                    w-4 h-4 text-gray-500 transition-transform duration-200
                    ${showUserMenu ? 'rotate-180' : ''}
                  `} />
                </>
              )}
            </button>

            {/* Menú desplegable */}
            <div className={`
              absolute bottom-full left-0 right-0 mb-2 py-2
              bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl
              transition-all duration-200 origin-bottom
              ${showUserMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}>
              <NavLink
                to="/profile"
                onClick={() => {
                  setShowUserMenu(false);
                  handleItemClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-bg-secondary hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Mi Perfil</span>
              </NavLink>
              
              <hr className="my-2 border-gray-700" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-danger-400 hover:bg-danger-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;