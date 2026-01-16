import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileDown, FileText, Loader2, Settings, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  generatePDF,
  generateAndSavePDF,
  downloadSavedPDF,
  selectPDFLoading,
  selectPDFStatus,
} from '../../features/reportInstances';
import { pdfApi } from '../../api/endpoints';

/**
 * Componente con acciones de generación y descarga de PDF
 */
export default function PDFActions({ reportInstanceId, reportName }) {
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

  const filename = `${reportName?.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_') || 'report'}.pdf`;

  const handleGenerate = async () => {
    await dispatch(generatePDF({ reportInstanceId, options, filename }));
  };

  const handleGenerateAndSave = async () => {
    await dispatch(generateAndSavePDF({ reportInstanceId, options }));
    toast.success('PDF guardado en el servidor');
  };

  const handleDownloadSaved = async () => {
    await dispatch(downloadSavedPDF({ reportInstanceId, filename }));
  };

  const handlePreview = () => {
    // Abrir preview en nueva pestaña
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
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Descargar PDF
        </button>

        {/* Botón de preview */}
        <button
          onClick={handlePreview}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Vista previa"
        >
          <Eye className="w-5 h-5" />
        </button>

        {/* Botón de opciones */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Opciones de PDF"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Panel de opciones */}
      {showOptions && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-20">
          <h4 className="font-medium text-gray-900 mb-4">Opciones de PDF</h4>
          
          <div className="space-y-4">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato de página
              </label>
              <select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            {/* Orientación */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Horizontal</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.landscape}
                  onChange={(e) => setOptions({ ...options, landscape: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* Header/Footer */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Encabezado/Pie</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.displayHeaderFooter}
                  onChange={(e) => setOptions({ ...options, displayHeaderFooter: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* Fondo */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Imprimir fondo</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.printBackground}
                  onChange={(e) => setOptions({ ...options, printBackground: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <button
              onClick={handleGenerateAndSave}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Guardar en servidor
            </button>
          </div>

          {/* PDF guardado previamente */}
          {pdfStatus?.lastExport && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">
                Último PDF: {new Date(pdfStatus.lastExport.exportedAt).toLocaleString()}
              </p>
              <button
                onClick={handleDownloadSaved}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
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
}
