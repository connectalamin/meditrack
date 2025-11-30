import { X, Download, ExternalLink, FileText } from 'lucide-react';
import Button from '../ui/Button';

const ReportViewer = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  // Use the same API URL logic as the main api.js
  // Set VITE_API_URL in .env.local for local development
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meditrack-server-nine.vercel.app/api';
  const baseUrl = API_BASE_URL.replace('/api', '');
  const fileUrl = report.fileUrl 
    ? (report.fileUrl.startsWith('http') ? report.fileUrl : `${baseUrl}${report.fileUrl}`)
    : null;

  // Determine file type - prioritize file extension over report.type
  const getFileType = () => {
    if (!fileUrl) return null;
    const urlLower = fileUrl.toLowerCase();
    if (urlLower.endsWith('.pdf')) return 'pdf';
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl)) return 'image';
    // Fallback to report.type if extension doesn't match
    if (report.type === 'PDF') return 'pdf';
    if (report.type === 'Scanned Image') return 'image';
    return null;
  };

  const fileType = getFileType();
  const isPDF = fileType === 'pdf';
  const isImage = fileType === 'image';

  const handleDownload = () => {
    if (!fileUrl) return;
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${report.title}.${isPDF ? 'pdf' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1B2430] w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-[#27335D] flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">{report.title}</h3>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">
              {new Date(report.date).toLocaleDateString()} • {report.category || 'Report'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {fileUrl && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-1 text-xs px-2 py-1.5"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1 text-xs px-2 py-1.5"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-1.5"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-[#111725] relative">
          {!fileUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText className="text-slate-400 dark:text-[#94a3b8] mb-4" size={48} />
              <p className="text-slate-500 dark:text-[#94a3b8] text-lg">No file available</p>
              <p className="text-slate-400 dark:text-[#64748b] text-sm mt-2">
                This report doesn't have an associated file.
              </p>
            </div>
          ) : isPDF ? (
            <iframe
              src={`${fileUrl}#toolbar=1&zoom=page-fit`}
              className="absolute inset-0 w-full h-full border-0 bg-white"
              title={report.title}
              style={{ border: 'none' }}
              onError={() => {
                console.error('Failed to load PDF');
              }}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full w-full overflow-auto">
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src={fileUrl}
                  alt={report.title}
                  className="max-w-full max-h-full object-contain mx-auto"
                  style={{ 
                    maxHeight: '100%', 
                    maxWidth: '100%',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center text-slate-500 dark:text-[#94a3b8]';
                    errorDiv.textContent = 'Failed to load image';
                    e.target.parentElement.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText className="text-slate-400 dark:text-[#94a3b8] mb-4" size={48} />
              <p className="text-slate-500 dark:text-[#94a3b8]">Unsupported file type</p>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="mt-4"
              >
                <Download size={16} />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;

