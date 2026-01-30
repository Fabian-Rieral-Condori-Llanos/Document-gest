import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileDown,
  FileText,
  Loader2,
  Settings,
  Eye,
  Save,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  generatePDF,
  generateAndSavePDF,
  downloadSavedPDF,
  selectPDFLoading,
  selectPDFStatus,
} from '../../features/reportInstances';
import { pdfApi } from '../../api/endpoints';

/**
 * PDFActions
 * 
 * Botones y opciones para generación y descarga de PDF.
 */
const PDFActions = ({ reportInstanceId, reportName }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectPDFLoading);
  const pdfStatus = useSelector(selectPDFStatus);

  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState({
    format: 'A4',
    landscape: false,
    displayHeaderFooter: true,
    printBackground: true,
  });

  const filename = `${reportName
    ?.replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '_') || 'report'}.pdf`;

  const handleGenerate = async () => {
    await dispatch(generatePDF({ reportInstanceId, options, filename }));
  };

  const handleGenerateAndSave = async () => {
    await dispatch(generateAndSavePDF({ reportInstanceId, options }));
    setShowOptions(false);
  };

  const handleDownloadSaved = async () => {
    await dispatch(downloadSavedPDF({ reportInstanceId, filename }));
  };

  const handlePreview = () => {
    const previewUrl = pdfApi.getPreviewUrl(reportInstanceId);
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Botón principal de descarga */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          Descargar PDF
        </button>

        {/* Botón de preview */}
        <button
          onClick={handlePreview}
          className="p-2.5 text-gray-400 hover:text-info-400 hover:bg-info-500/10 border border-gray-600 rounded-lg transition-colors"
          title="Vista previa"
        >
          <Eye className="w-5 h-5" />
        </button>

        {/* Botón de opciones */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`p-2.5 border border-gray-600 rounded-lg transition-colors ${
            showOptions
              ? 'text-primary-400 bg-primary-500/10'
              : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
          }`}
          title="Opciones de PDF"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Panel de opciones */}
      {showOptions && (
        <div className="absolute right-0 mt-2 w-80 bg-bg-secondary border border-gray-700 rounded-xl shadow-xl z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h4 className="font-medium text-white">Opciones de PDF</h4>
            <button
              onClick={() => setShowOptions(false)}
              className="p-1 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Formato de página
              </label>
              <select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value })}
                className="w-full px-3 py-2 bg-bg-tertiary border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            {/* Toggle options */}
            {[
              { key: 'landscape', label: 'Orientación horizontal' },
              { key: 'displayHeaderFooter', label: 'Mostrar encabezado/pie' },
              { key: 'printBackground', label: 'Imprimir colores de fondo' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{label}</span>
                <button
                  onClick={() => setOptions({ ...options, [key]: !options[key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    options[key] ? 'bg-primary-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      options[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-700">
            <button
              onClick={handleGenerateAndSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar en servidor
            </button>
          </div>

          {/* PDF guardado previamente */}
          {pdfStatus?.lastExport && (
            <div className="px-4 py-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">
                Último PDF:{' '}
                {new Date(pdfStatus.lastExport.exportedAt).toLocaleString()}
              </p>
              <button
                onClick={handleDownloadSaved}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-bg-tertiary transition-colors"
              >
                <FileText className="w-4 h-4" />
                Descargar guardado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFActions;
