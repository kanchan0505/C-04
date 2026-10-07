import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBatches } from '@/store/batchSlice';
import FileUploadDropzone from '@/components/FileUploadDropzone';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { Upload, ArrowRight, CheckCircle, AlertTriangle, Columns } from 'lucide-react';

export default function UploadView() {
  const dispatch = useDispatch();
  const { items: batches } = useSelector(state => state.batches);
  const [step, setStep] = useState('upload'); // upload | preview | mapping | processing | done
  const [selectedBatch, setSelectedBatch] = useState('');
  const [files, setFiles] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const SYSTEM_FIELDS = [
    { key: 'rollNumber', label: 'Roll Number', required: true },
    { key: 'name', label: 'Student Name', required: true },
    { key: 'semester', label: 'Semester', required: true },
    { key: 'result', label: 'Result Status', required: true },
    { key: 'sgpa', label: 'SGPA', required: false },
    { key: 'percentage', label: 'Percentage', required: false },
  ];

  const handleFileSelect = useCallback(async (fileList) => {
    setFiles(fileList);
    setError(null);

    if (fileList.length === 0) return;

    // Upload file to get preview/auto-mapping
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0]);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.preview) {
        setPreviewData(data);
        if (data.autoMap) {
          setColumnMap(data.autoMap);
        }
        setStep('preview');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to process file: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMapColumns = useCallback(() => {
    setStep('mapping');
  }, []);

  const handleSubmit = useCallback(async () => {
    setStep('processing');
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('columnMap', JSON.stringify(columnMap));
      if (selectedBatch) formData.append('batchId', selectedBatch);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setUploadResult(data);
        setStep('done');
      } else {
        setError(data.error || 'Upload failed');
        setStep('mapping');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setStep('mapping');
    } finally {
      setLoading(false);
    }
  }, [files, columnMap, selectedBatch]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFiles([]);
    setPreviewData(null);
    setColumnMap({});
    setUploadResult(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Data Ingestion</h1>
        <p className="text-surface-400 text-sm">Upload multi-semester Excel result files to populate student records</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 sm:gap-4">
        {['Upload', 'Preview', 'Map Columns', 'Process'].map((label, i) => {
          const stepNames = ['upload', 'preview', 'mapping', 'done'];
          const stepIdx = stepNames.indexOf(step);
          const isActive = i <= stepIdx || (step === 'processing' && i <= 3);
          const isCurrent = i === stepIdx || (step === 'processing' && i === 3);
          return (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isCurrent ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
                isActive ? 'bg-accent-500/10 text-accent-400' :
                'bg-white/5 text-surface-500'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive && !isCurrent ? 'bg-accent-500 text-white' : ''
                }`}>
                  {isActive && !isCurrent ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <ArrowRight size={14} className="text-surface-600" />}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card p-4 border-danger-500/30 flex items-center gap-3">
          <AlertTriangle size={18} className="text-danger-400 shrink-0" />
          <p className="text-sm text-danger-400">{error}</p>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-surface-300 mb-3">Select Batch (Optional)</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20"
              id="batch-select"
            >
              <option value="">Auto-detect / None</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batchCode}</option>
              ))}
            </select>
          </div>
          <FileUploadDropzone onFileSelect={handleFileSelect} />
          {loading && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-surface-400">Processing file...</span>
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && previewData && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">File Preview</h3>
                <p className="text-sm text-surface-400">{previewData.totalRows} rows detected • {previewData.headers.length} columns</p>
              </div>
              <button
                onClick={handleMapColumns}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors"
                id="map-columns-btn"
              >
                <Columns size={16} />
                Map Columns
              </button>
            </div>

            {/* Sample Data Preview */}
            <div className="overflow-x-auto">
              <table className="nba-table">
                <thead>
                  <tr>
                    {previewData.headers.map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {previewData.headers.map(h => (
                        <td key={h}>{String(row[h] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step: Column Mapping */}
      {step === 'mapping' && previewData && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Columns size={20} className="text-primary-400" />
              Column Mapping
            </h3>
            <p className="text-sm text-surface-400 mb-6">
              Map your Excel column headers to the system&apos;s expected fields.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SYSTEM_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    {field.label} {field.required && <span className="text-danger-400">*</span>}
                  </label>
                  <select
                    value={columnMap[field.key] || ''}
                    onChange={(e) => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
                  >
                    <option value="">— Select column —</option>
                    {previewData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 rounded-xl bg-white/5 text-surface-300 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!columnMap.rollNumber || !columnMap.semester || !columnMap.result}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 text-white text-sm font-semibold hover:from-accent-500 hover:to-accent-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20"
                id="process-upload-btn"
              >
                <Upload size={16} />
                Process & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Processing Upload</h3>
          <p className="text-sm text-surface-400">Parsing, validating, and importing student records...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && uploadResult && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-accent-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Import Complete</h3>
          <p className="text-surface-400 mb-6">
            <span className="text-accent-400 font-semibold">{uploadResult.processed}</span> records processed
            {uploadResult.errors > 0 && (
              <> • <span className="text-warning-400 font-semibold">{uploadResult.errors}</span> errors</>
            )}
            {' '} out of {uploadResult.total} total rows
          </p>

          {uploadResult.errors > 0 && uploadResult.errorDetails?.length > 0 && (
            <div className="text-left mb-6">
              <h4 className="text-sm font-semibold text-warning-400 mb-2">Error Details:</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {uploadResult.errorDetails.map((err, i) => (
                  <p key={i} className="text-xs text-surface-400">
                    Row: {JSON.stringify(err.row).slice(0, 80)}... — {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors"
            id="upload-another-btn"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}
