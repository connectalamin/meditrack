import { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, Trash2, FileText, ScrollText, Check, Edit, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

const ReportsTab = () => {
  const { reports, family, addReport, updateReport, deleteReport } = useApp();
  const [title, setTitle] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [category, setCategory] = useState('Report');
  const [mode, setMode] = useState('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedPreview, setScannedPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });

  useEffect(() => {
    if (editingId) {
      const report = reports.find(r => r.id === editingId);
      if (report) {
        setTitle(report.title || '');
        setSelectedMember(report.familyMemberId || '');
        setCategory(report.category || 'Report');
        setMode('quick');
      }
    }
  }, [editingId, reports]);

  const resetForm = () => {
    setTitle('');
    setSelectedMember('');
    setCategory('Report');
    setMode('quick');
    setEditingId(null);
    setScannedPreview(null);
  };

  const handleEdit = (report) => {
    setEditingId(report.id);
    setTitle(report.title || '');
    setSelectedMember(report.familyMemberId || '');
    setCategory(report.category || 'Report');
    setMode('quick');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) return;
    
    const memberName = family.find(m => m.id === selectedMember)?.name || 'Unassigned';

    const reportData = {
      title,
      date: editingId ? reports.find(r => r.id === editingId)?.date : new Date().toISOString(),
      type: mode === 'ocr' ? 'Scanned Image' : 'PDF',
      category: category,
      familyMemberId: selectedMember || null,
      familyMemberName: memberName
    };

    if (editingId) {
      await updateReport(editingId, reportData);
    } else {
      await addReport(reportData);
    }
    resetForm();
  };

  const simulateOCR = (file) => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    
    const previewUrl = URL.createObjectURL(file);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScannedPreview(previewUrl);
          
          if (!title) {
            const mockName = file.name.split('.')[0].replace(/-/g, ' ');
            setTitle(mockName.charAt(0).toUpperCase() + mockName.slice(1));
          }
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleDeleteClick = (id, title) => {
    setDeleteConfirm({ isOpen: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      await deleteReport(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, id: null, title: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Documents</h2>
        {!editingId && (
          <div className="flex bg-slate-100 dark:bg-[#1B2430] p-1 rounded-lg">
            <button 
              onClick={() => setMode('quick')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'quick' ? 'bg-white dark:bg-[#27335D] text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Manual Upload
            </button>
            <button 
              onClick={() => setMode('ocr')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'ocr' ? 'bg-white dark:bg-[#27335D] text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Camera size={14} /> Take Photo & Scan
            </button>
          </div>
        )}
        {editingId && (
          <Button variant="secondary" onClick={resetForm}>
            <X size={18} /> Cancel Edit
          </Button>
        )}
      </div>

      <Card>
        {mode === 'ocr' && !isScanning && !scannedPreview && !editingId && (
          <div className="mb-6 p-8 border-2 border-dashed border-slate-300 dark:border-[#27335D] rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#27335D]/20 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => simulateOCR(e.target.files[0])} 
              accept="image/*" 
              capture="environment" 
            />
            <div className="h-12 w-12 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-full flex items-center justify-center mb-3">
              <Camera size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Take Photo / Upload Image</h3>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">Capture the document clearly. AI will scan and extract details.</p>
          </div>
        )}
        
        {mode === 'ocr' && isScanning && (
          <div className="mb-6 p-8 bg-slate-50 dark:bg-[#111725] rounded-xl flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-xs bg-slate-200 dark:bg-[#27335D] h-2 rounded-full overflow-hidden mb-4">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
            </div>
            <p className="text-sm font-medium text-emerald-600 animate-pulse">Enhancing & Cropping Image...</p>
          </div>
        )}

        {mode === 'ocr' && scannedPreview && !editingId && (
          <div className="mb-6 p-4 border border-slate-200 dark:border-[#27335D] rounded-xl bg-slate-50 dark:bg-[#111725] flex gap-4 items-center animate-in fade-in">
            <div className="h-24 w-24 bg-white dark:bg-black rounded-lg overflow-hidden border border-slate-300 dark:border-[#27335D] relative group">
              <img src={scannedPreview} alt="Scanned" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="text-white" size={20} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Scan Successful</h4>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-2">Image processed and cropped.</p>
              <Button variant="outline" onClick={() => setScannedPreview(null)} className="h-7 text-xs">Retake</Button>
            </div>
          </div>
        )}

        {editingId && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Editing: {reports.find(r => r.id === editingId)?.title}</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <Input label="Document Title" placeholder="e.g. Lab Report Jan 2024" value={title} onChange={e => setTitle(e.target.value)} className="mb-0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Doc Type</label>
            <select 
              className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Report">Medical Report</option>
              <option value="Prescription">Prescription</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Assign To</label>
            <select 
              className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC]"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="">General (Unassigned)</option>
              {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            )}
            <Button type="submit" className="w-full md:w-auto" disabled={isScanning || !title}>
              {mode === 'ocr' ? <CheckCircle size={18} /> : <Upload size={18} />}
              {editingId ? 'Update Document' : (mode === 'ocr' ? 'Save Scanned Document' : 'Upload File')}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-3">
        {reports.map(report => (
          <div key={report.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC]">{report.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(report.date).toLocaleDateString()}</p>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                    {report.category || 'Report'}
                  </span>
                  {report.familyMemberName && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                      {report.familyMemberName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge>{report.type}</Badge>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(report)} 
                  className="text-slate-400 dark:text-[#94a3b8] hover:text-emerald-500 p-2 transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(report.id, report.title)} 
                  className="text-slate-400 dark:text-[#94a3b8] hover:text-red-500 p-2 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default ReportsTab;
