import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

export default function FileUploadDropzone({ onFileSelect, accept = '.xlsx,.xls,.csv', multiple = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    if (onFileSelect) onFileSelect(files);
  }, [onFileSelect]);

  const handleChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (onFileSelect) onFileSelect(files);
  }, [onFileSelect]);

  return (
    <div>
      <div
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        id="file-dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          id="file-input"
        />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-2xl ${isDragging ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-surface-400'} transition-all`}>
            <Upload size={32} />
          </div>
          <div>
            <p className="text-base font-medium text-surface-200">
              {isDragging ? 'Drop files here' : 'Drag & drop Excel files here'}
            </p>
            <p className="text-sm text-surface-500 mt-1">or click to browse • .xlsx, .xls, .csv supported</p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 glass-card px-4 py-3">
              <FileSpreadsheet size={18} className="text-accent-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">{file.name}</p>
                <p className="text-xs text-surface-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <CheckCircle size={16} className="text-accent-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
