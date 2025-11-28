import { useState } from 'react';
import { X, Plus, Trash2, User, Edit } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';
import FamilyMemberDetails from './FamilyMemberDetails';

const FamilyTab = () => {
  const { family, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useApp();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', relation: '', age: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  const resetForm = () => {
    setFormData({ name: '', relation: '', age: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name || '',
      relation: member.relation || '',
      age: member.age || ''
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (editingId) {
      await updateFamilyMember(editingId, formData);
    } else {
      await addFamilyMember(formData);
    }
    resetForm();
  };

  const handleDeleteClick = (e, id, name) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      await deleteFamilyMember(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  if (selectedMember) {
    return <FamilyMemberDetails member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Family Members</h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Select a member to view their profile, plans, and reports</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-[#F8FAFC]">
            {editingId ? 'Edit Family Member' : 'Add New Family Member'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="flex-1 w-full">
              <Input label="Relationship" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} placeholder="Spouse, Child..." />
            </div>
            <div className="w-24">
              <Input label="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="32" />
            </div>
            <div className="mb-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {family.map(member => (
          <div 
            key={member.id} 
            onClick={() => setSelectedMember(member)} 
            className="bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] p-6 rounded-xl flex flex-col items-center text-center relative group hover:border-emerald-500/50 dark:hover:border-[#34D399]/50 transition-all shadow-sm dark:shadow-none cursor-pointer"
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(member); }} 
                className="text-slate-400 dark:text-[#94a3b8] hover:text-emerald-500 transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={(e) => handleDeleteClick(e, member.id, member.name)} 
                className="text-slate-400 dark:text-[#94a3b8] hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-[#27335D] flex items-center justify-center mb-4 text-slate-600 dark:text-[#F8FAFC]">
              <User size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{member.name}</h3>
            <p className="text-emerald-600 dark:text-[#34D399] text-sm font-medium mb-1">{member.relation}</p>
            <Button variant="outline" className="w-full text-xs h-8 mt-4">View Profile</Button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Family Member"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all associated health data, plans, and reports. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default FamilyTab;
