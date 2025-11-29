import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Edit, Search } from 'lucide-react';
import { 
  useMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication 
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';

const MedicationDatabaseTab = () => {
  const { data: medications = [], isLoading } = useMedications();
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const deleteMedication = useDeleteMedication();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', strength: '', price: '', packSize: '', unit: 'tablets' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [infoFilter, setInfoFilter] = useState('all'); // 'all' | 'missingPrice' | 'missingInfo'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedMeds = useMemo(() => {
    return [...medications].sort((a, b) => a.name.localeCompare(b.name));
  }, [medications]);

  const filteredMeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const bySearch = !term
      ? sortedMeds
      : sortedMeds.filter((med) => {
          const name = med.name?.toLowerCase() || '';
          const strength = med.strength?.toLowerCase() || '';
          return name.includes(term) || strength.includes(term);
        });

    if (infoFilter === 'missingPrice') {
      return bySearch.filter((med) => !med.price || med.price <= 0);
    }

    if (infoFilter === 'missingInfo') {
      return bySearch.filter((med) => {
        const noPrice = !med.price || med.price <= 0;
        const noStrength = !med.strength;
        const noPack = !med.packSize || med.packSize <= 0;
        return noPrice || noStrength || noPack;
      });
    }

    return bySearch;
  }, [sortedMeds, searchTerm, infoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMeds.length / itemsPerPage));

  const paginatedMeds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMeds.slice(start, start + itemsPerPage);
  }, [filteredMeds, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({ name: '', strength: '', price: '', packSize: '', unit: 'tablets' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name || '',
      strength: med.strength || '',
      price: med.price?.toString() || '',
      packSize: med.packSize?.toString() || '1',
      unit: med.unit || 'tablets'
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const medicationData = {
      ...formData,
      price: formData.price ? Number(formData.price) : 0,
      packSize: formData.packSize ? Number(formData.packSize) : 1
    };

    try {
      if (editingId) {
        await updateMedication.mutateAsync({
          id: editingId,
          updates: medicationData
        });
      } else {
        await createMedication.mutateAsync(medicationData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save medication:', error);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteMedication.mutateAsync(deleteConfirm.id);
      } catch (error) {
        console.error('Failed to delete medication:', error);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Global Medication Database</h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Shared list of medicines for the family</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748b]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-[#27335D] bg-white dark:bg-[#111725] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setInfoFilter('all')}
              className={`px-2 py-1 rounded-full border ${
                infoFilter === 'all'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-[#34D399] dark:bg-[#34D399]/10 dark:text-[#34D399]'
                  : 'border-slate-200 dark:border-[#27335D] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#27335D]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setInfoFilter('missingPrice')}
              className={`px-2 py-1 rounded-full border ${
                infoFilter === 'missingPrice'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-slate-200 dark:border-[#27335D] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#27335D]'
              }`}
            >
              Missing price
            </button>
            <button
              type="button"
              onClick={() => setInfoFilter('missingInfo')}
              className={`px-2 py-1 rounded-full border ${
                infoFilter === 'missingInfo'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-500/10 dark:text-red-300'
                  : 'border-slate-200 dark:border-[#27335D] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#27335D]'
              }`}
            >
              Incomplete info
            </button>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="whitespace-nowrap">
            {showForm ? <X size={18} /> : <Plus size={18} />} {editingId ? 'Cancel Edit' : 'Add New'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-[#F8FAFC]">
            {editingId ? 'Edit Medication' : 'Add New Medication'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Input label="Name" placeholder="e.g. Napa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <Input label="Strength" placeholder="500mg" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
              <Input label="Price (Optional)" type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <Input label="Qty Per Pack" type="number" placeholder="10" value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update Medication' : 'Save to Database'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedMeds.map(med => (
          <Card key={med.id} className="p-4 flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC]">{med.name}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(med)} 
                    className="text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(med.id, med.name)} 
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-[#94a3b8]">{med.strength}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#27335D] flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-[#94a3b8]">{med.packSize} {med.unit}/pack</span>
              <span className="font-bold text-emerald-600 dark:text-[#34D399]">
                {med.price > 0 ? `${med.price} BDT` : 'Price N/A'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredMeds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-[#94a3b8]">
          <div>
            Showing{' '}
            <span className="font-medium text-slate-700 dark:text-[#F8FAFC]">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className="font-medium text-slate-700 dark:text-[#F8FAFC]">
              {Math.min(currentPage * itemsPerPage, filteredMeds.length)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-slate-700 dark:text-[#F8FAFC]">
              {filteredMeds.length}
            </span>{' '}
            medicines
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-slate-200 dark:border-[#27335D] text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#27335D]"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] h-7 rounded text-xs flex items-center justify-center border ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-[#34D399] dark:bg-[#34D399]/10 dark:text-[#34D399]'
                        : 'border-slate-200 dark:border-[#27335D] hover:bg-slate-100 dark:hover:bg-[#27335D]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-slate-200 dark:border-[#27335D] text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#27335D]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Medication"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default MedicationDatabaseTab;
