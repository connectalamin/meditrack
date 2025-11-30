import { useState, useEffect, useMemo } from 'react';
import { Upload, Trash2, FileText, ScrollText, Edit, X, Eye, Download, ArrowUpDown, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  useReports,
  useFamilyMembers,
  useCreateReport,
  useUpdateReport,
  useDeleteReport 
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ReportViewer from '../../components/reports/ReportViewer';

const ReportsTab = () => {
  const { data: reports = [] } = useReports();
  const { data: family = [] } = useFamilyMembers();
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const [title, setTitle] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [category, setCategory] = useState('Report');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('date-desc'); // Default: newest first
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [filterFileType, setFilterFileType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (editingId) {
      const report = reports.find(r => r.id === editingId);
      if (report) {
        setTitle(report.title || '');
        setSelectedMember(report.familyMemberId || '');
        setCategory(report.category || 'Report');
      }
    }
  }, [editingId, reports]);

  const resetForm = () => {
    setTitle('');
    setSelectedMember('');
    setCategory('Report');
    setEditingId(null);
    setSelectedFile(null);
  };

  const handleEdit = (report) => {
    setEditingId(report.id);
    setTitle(report.title || '');
    setSelectedMember(report.familyMemberId || '');
    setCategory(report.category || 'Report');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    const memberName = family.find(m => m.id === selectedMember)?.name || 'Unassigned';

    // Determine file type from actual file
    let fileType = 'PDF';
    
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const fileMimeType = selectedFile.type;
      
      if (fileMimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
        fileType = 'Scanned Image';
      } else if (fileMimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        fileType = 'PDF';
      }
    }

    const reportData = {
      title,
      date: editingId ? reports.find(r => r.id === editingId)?.date : new Date().toISOString(),
      type: fileType,
      category: category,
      familyMemberId: selectedMember || null,
      familyMemberName: memberName
    };

    try {
      if (editingId) {
        await updateReport.mutateAsync({
          id: editingId,
          updates: reportData,
          file: selectedFile
        });
      } else {
        await createReport.mutateAsync({
          report: reportData,
          file: selectedFile
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report: ' + error.message);
    }
  };

  const handleDeleteClick = (id, title) => {
    setDeleteConfirm({ isOpen: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteReport.mutateAsync(deleteConfirm.id);
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, title: '' });
  };

  const handleView = (report) => {
    setViewingReport(report);
  };

  const handleDownload = (report) => {
    if (!report.fileUrl) {
      alert('No file available for download');
      return;
    }

    // Use the same API URL logic as the main api.js
    const API_BASE_URL = import.meta.env.VITE_API_URL || 
      (window.location.hostname !== 'localhost' 
        ? 'https://meditrack-server-nine.vercel.app/api' 
        : 'http://localhost:5000/api');
    const baseUrl = API_BASE_URL.replace('/api', '');
    const fileUrl = report.fileUrl.startsWith('http') 
      ? report.fileUrl 
      : `${baseUrl}${report.fileUrl}`;
    
    const isPDF = report.type === 'PDF' || fileUrl.toLowerCase().endsWith('.pdf');
    const extension = isPDF ? 'pdf' : (fileUrl.match(/\.(\w+)$/)?.[1] || 'jpg');
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${report.title}.${extension}`;
    link.target = '_blank'; // Fallback if download doesn't work
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];

    // Apply filters
    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }

    if (filterMember !== 'all') {
      if (filterMember === 'unassigned') {
        filtered = filtered.filter(r => !r.familyMemberId);
      } else {
        filtered = filtered.filter(r => r.familyMemberId === filterMember);
      }
    }

    if (filterFileType !== 'all') {
      filtered = filtered.filter(r => r.type === filterFileType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': // Newest first (default)
          return new Date(b.date) - new Date(a.date);
        case 'date-asc': // Oldest first
          return new Date(a.date) - new Date(b.date);
        case 'title-asc': // A-Z
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc': // Z-A
          return (b.title || '').localeCompare(a.title || '');
        case 'category-asc': // Category A-Z
          return (a.category || '').localeCompare(b.category || '');
        case 'category-desc': // Category Z-A
          return (b.category || '').localeCompare(a.category || '');
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  }, [reports, sortBy, filterCategory, filterMember, filterFileType]);

  const hasActiveFilters = filterCategory !== 'all' || filterMember !== 'all' || filterFileType !== 'all';

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterMember('all');
    setFilterFileType('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Documents</h2>
        {editingId && (
          <Button variant="secondary" onClick={resetForm}>
            <X size={18} /> Cancel Edit
          </Button>
        )}
      </div>

      <Card>
        {editingId && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Editing: {reports.find(r => r.id === editingId)?.title}</p>
          </div>
        )}

        {!editingId && (
          <div className="mb-4 p-4 border-2 border-dashed border-slate-300 dark:border-[#27335D] rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#27335D]/20 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
              accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.gif,.webp" 
            />
            <div className="h-12 w-12 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
              <Upload size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {selectedFile ? selectedFile.name : 'Upload PDF or Image File'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
              {selectedFile ? 'Click to change file' : 'Click to select a PDF or image document'}
            </p>
            {selectedFile && (
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }} 
                className="mt-2 h-7 text-xs"
              >
                Remove File
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <Input label="Document Title" placeholder="e.g. Lab Report Jan 2024" value={title} onChange={e => setTitle(e.target.value)} className="mb-0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">Doc Type</label>
            <select 
              className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Report">Medical Report</option>
              <option value="Prescription">Prescription</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">Assign To</label>
            <select 
              className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="">General (Unassigned)</option>
              {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="mr-2">Cancel</Button>
            )}
            <Button type="submit" className="w-full" disabled={!title || (!selectedFile && !editingId)}>
              <Upload size={18} />
              {editingId ? 'Update' : 'Upload'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Sorting and Filtering Controls */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#27335D]/80'
              }`}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                  {[filterCategory !== 'all', filterMember !== 'all', filterFileType !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-slate-500 dark:text-[#94a3b8]" />
              <label className="text-sm text-slate-600 dark:text-[#94a3b8]">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="category-asc">Category (A-Z)</option>
                <option value="category-desc">Category (Z-A)</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#27335D] grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Categories</option>
                <option value="Report">Medical Report</option>
                <option value="Prescription">Prescription</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-2">Family Member</label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Members</option>
                <option value="unassigned">Unassigned</option>
                {family.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-2">File Type</label>
              <select
                value={filterFileType}
                onChange={(e) => setFilterFileType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Types</option>
                <option value="PDF">PDF</option>
                <option value="Scanned Image">Image</option>
              </select>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#27335D]">
          <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
            Showing {filteredAndSortedReports.length} of {reports.length} documents
          </p>
        </div>
      </Card>

      <div className="grid gap-3">
        {filteredAndSortedReports.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-[#64748b] mb-3" />
              <p className="text-slate-500 dark:text-[#94a3b8]">
                {hasActiveFilters ? 'No documents match your filters.' : 'No documents yet.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="mt-3 text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredAndSortedReports.map(report => (
          <div
            key={report.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg group hover:border-emerald-500/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-1">{report.title}</h4>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className="text-slate-500 dark:text-[#94a3b8] whitespace-nowrap">
                    {new Date(report.date).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {report.category || 'Report'}
                  </span>
                  {report.familyMemberName && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full whitespace-nowrap">
                      {report.familyMemberName}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full whitespace-nowrap">
                    {report.type === 'Scanned Image' ? 'Image' : report.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto sm:ml-4 shrink-0">
              {report.fileUrl && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleView(report);
                    }}
                    className="text-slate-400 dark:text-[#94a3b8] hover:text-blue-500 p-2 transition-colors touch-manipulation relative z-10"
                    title="View"
                    type="button"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDownload(report);
                    }}
                    className="text-slate-400 dark:text-[#94a3b8] hover:text-emerald-500 p-2 transition-colors touch-manipulation relative z-10"
                    title="Download"
                    type="button"
                  >
                    <Download size={16} />
                  </button>
                </>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleEdit(report);
                }} 
                className="text-slate-400 dark:text-[#94a3b8] hover:text-emerald-500 p-2 transition-colors touch-manipulation relative z-10"
                title="Edit"
                type="button"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteClick(report.id, report.title);
                }} 
                className="text-slate-400 dark:text-[#94a3b8] hover:text-red-500 p-2 transition-colors touch-manipulation relative z-10"
                title="Delete"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ReportViewer
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        report={viewingReport}
      />
    </div>
  );
};

export default ReportsTab;
