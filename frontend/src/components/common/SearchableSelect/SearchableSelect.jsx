import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * SearchableSelect - Select con búsqueda integrada
 * 
 * Props:
 * @param {string} value - Valor seleccionado
 * @param {function} onChange - Callback (value) => void
 * @param {array} options - [{value, label, subtitle?, group?, disabled?}]
 * @param {string} placeholder - Placeholder
 * @param {string} searchPlaceholder - Placeholder del buscador
 * @param {string} label - Label del campo
 * @param {string} error - Mensaje de error
 * @param {boolean} disabled - Deshabilitado
 * @param {boolean} clearable - Permite limpiar
 * @param {boolean} required - Campo requerido
 * @param {boolean} groupBy - Agrupa por 'group'
 * @param {string} emptyMessage - Sin opciones
 * @param {string} noResultsMessage - Sin resultados
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  label,
  error,
  disabled = false,
  clearable = true,
  required = false,
  groupBy = false,
  emptyMessage = 'No hay opciones',
  noResultsMessage = 'Sin resultados',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Opción seleccionada
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Filtrar opciones
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase().trim();
    return options.filter(opt => {
      return (
        opt.label?.toLowerCase().includes(s) ||
        opt.subtitle?.toLowerCase().includes(s) ||
        opt.group?.toLowerCase().includes(s)
      );
    });
  }, [options, search]);

  // Agrupar opciones
  const groupedOptions = useMemo(() => {
    if (!groupBy) return null;
    const groups = {};
    filteredOptions.forEach(opt => {
      const g = opt.group || 'Sin grupo';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    });
    // Ordenar: grupos con nombre primero
    const sorted = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Sin grupo') return 1;
        if (b === 'Sin grupo') return -1;
        return a.localeCompare(b);
      })
      .forEach(k => { sorted[k] = groups[k]; });
    return sorted;
  }, [filteredOptions, groupBy]);

  // Click fuera cierra
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Scroll al highlighted
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Teclado
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(p => p < filteredOptions.length - 1 ? p + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(p => p > 0 ? p - 1 : filteredOptions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions]);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(-1);
      setSearch('');
    }
  };

  // Render opción
  const renderOption = (opt, idx) => {
    const isSelected = opt.value === value;
    const isHighlighted = idx === highlightedIndex;
    return (
      <div
        key={opt.value}
        data-index={idx}
        onClick={() => handleSelect(opt)}
        className={`
          px-3 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2
          ${isHighlighted ? 'bg-primary-500/20' : ''}
          ${isSelected ? 'bg-primary-500/10' : ''}
          ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-tertiary'}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm truncate">{opt.label}</div>
          {opt.subtitle && (
            <div className="text-xs text-gray-500 truncate mt-0.5">{opt.subtitle}</div>
          )}
        </div>
        {isSelected && <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-danger-400 ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`
          w-full px-3 py-2.5 bg-bg-tertiary border rounded-lg cursor-pointer
          flex items-center justify-between gap-2 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-gray-700'}
          ${error ? 'border-danger-500' : ''}
        `}
      >
        <div className={`flex-1 truncate ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
          {selectedOption ? (
            <div className="flex flex-col">
              <span className="text-sm">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-xs text-gray-500">{selectedOption.subtitle}</span>
              )}
            </div>
          ) : (
            <span className="text-sm">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-danger-400">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Options */}
          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">{emptyMessage}</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">{noResultsMessage}</div>
            ) : groupBy && groupedOptions ? (
              Object.entries(groupedOptions).map(([groupName, opts]) => (
                <div key={groupName}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-bg-tertiary/50 sticky top-0 uppercase tracking-wide">
                    {groupName}
                  </div>
                  {opts.map((opt) => {
                    const idx = filteredOptions.findIndex(o => o.value === opt.value);
                    return renderOption(opt, idx);
                  })}
                </div>
              ))
            ) : (
              filteredOptions.map((opt, idx) => renderOption(opt, idx))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;