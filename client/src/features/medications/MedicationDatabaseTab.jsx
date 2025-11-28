import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
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

  const sortedMeds = useMemo(() => {
    return [...medications].sort((a, b) => a.name.localeCompare(b.name));
  }, [medications]);

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Global Medication Database</h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Shared list of medicines for the family</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {editingId ? 'Cancel Edit' : 'Add New'}
        </Button>
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
        {sortedMeds.map(med => (
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
