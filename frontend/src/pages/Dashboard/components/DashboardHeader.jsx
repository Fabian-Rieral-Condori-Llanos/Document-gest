/**
 * DashboardHeader.jsx
 * 
 * Header del Dashboard con título, filtros y alertas.
 */

import { useState } from 'react';
import { Shield, Bell, RefreshCw, Calendar, ChevronDown, X, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

const DashboardHeader = ({ 
  year, 
  onYearChange, 
  yearOptions,
  alertas = [],
  viewedAlerts = [],
  onRefresh, 
  refreshing = false,
  onMarkAlertViewed,
  onMarkAllAlertsViewed
}) => {
  const [showAlertasPanel, setShowAlertasPanel] = useState(false);
  
  const unviewedAlerts = alertas.filter((_, idx) => !viewedAlerts.includes(`${year}-${idx}`));

  const handleMarkAllViewed = () => {
    onMarkAllAlertsViewed?.();
    setShowAlertasPanel(false);
  };

  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary-500/10">
          <Shield size={28} className="text-primary-400" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Centro de Gestión de Incidentes Informáticos</p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          disabled={refreshing} 
          className="p-2.5 rounded-lg bg-bg-secondary border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-colors disabled:opacity-50" 
          title="Actualizar datos"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
        
        {/* Alerts Button */}
        <div className="relative">
          <button 
            onClick={() => setShowAlertasPanel(!showAlertasPanel)} 
            className="p-2.5 rounded-lg bg-bg-secondary border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            {unviewedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unviewedAlerts.length}
              </span>
            )}
          </button>
          
          {/* Alerts Panel */}
          {showAlertasPanel && (
            <div className="absolute right-0 top-12 w-96 bg-bg-secondary border border-gray-700 rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">
                  Alertas {unviewedAlerts.length > 0 && `(${unviewedAlerts.length} nuevas)`}
                </h3>
                <div className="flex items-center gap-2">
                  {unviewedAlerts.length > 0 && (
                    <button 
                      onClick={handleMarkAllViewed} 
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                      <Eye size={12} /> Marcar vistas
                    </button>
                  )}
                  <button onClick={() => setShowAlertasPanel(false)} className="text-gray-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alertas?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                    <p>No hay alertas activas</p>
                  </div>
                ) : (
                  alertas.map((alerta, idx) => {
                    const isViewed = viewedAlerts.includes(`${year}-${idx}`);
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 border-b border-gray-800 last:border-0 transition-colors ${isViewed ? 'opacity-50' : ''} ${
                          alerta.tipo === 'critica' ? 'bg-red-500/5' : alerta.tipo === 'alta' ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle 
                            size={16} 
                            className={
                              alerta.tipo === 'critica' ? 'text-red-400' : 
                              alerta.tipo === 'alta' ? 'text-orange-400' : 'text-yellow-400'
                            } 
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">{alerta.mensaje}</p>
                            <p className="text-xs text-gray-500 mt-1">{alerta.fecha}</p>
                          </div>
                          {!isViewed && (
                            <button 
                              onClick={() => onMarkAlertViewed?.(idx)} 
                              className="p-1 text-gray-500 hover:text-white" 
                              title="Marcar como vista"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Year Selector */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-secondary border border-gray-700">
          <Calendar size={16} className="text-gray-400" />
          <select 
            value={year} 
            onChange={(e) => onYearChange(e.target.value)} 
            className="bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            {yearOptions.map(y => (
              <option key={y} value={y} className="bg-bg-secondary">Gestión {y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
