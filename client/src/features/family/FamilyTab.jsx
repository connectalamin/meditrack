import { useState } from 'react';
import { X, Plus, Trash2, User, Edit } from 'lucide-react';
import { 
  useFamilyMembers,
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useDeleteFamilyMember 
} from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';
import FamilyMemberDetails from './FamilyMemberDetails';

const FamilyTab = () => {
  const { data: family = [], isLoading } = useFamilyMembers();
  const { user } = useAuth();
  const createFamilyMember = useCreateFamilyMember();
  const updateFamilyMember = useUpdateFamilyMember();
  const deleteFamilyMember = useDeleteFamilyMember();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', relation: '', age: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  
  // Check if a family member belongs to the current user
  const isOwnMember = (member) => {
    return member.userId === user?.id;
  };

  // Check if this is the main linked account's self card (should not be deletable)
  const isMainLinkedAccountSelf = (member) => {
    return member.relation === 'Self' && member.userId === user?.linkedFamilyId;
  };

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
    
    try {
      if (editingId) {
        await updateFamilyMember.mutateAsync({
          id: editingId,
          updates: formData
        });
      } else {
        await createFamilyMember.mutateAsync(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save family member:', error);
    }
  };

  const handleDeleteClick = (e, id, name) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteFamilyMember.mutateAsync(deleteConfirm.id);
      } catch (error) {
        console.error('Failed to delete family member:', error);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  if (selectedMember) {
    return <FamilyMemberDetails member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Family Members</h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
            Select a member to view their profile, plans, and reports
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={18} />
            Add Member
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="bg-white/90 dark:bg-[#020617]/90 border-0 shadow-sm p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {editingId ? 'Edit Family Member' : 'Add New Family Member'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
              Store basic details so you can attach plans and documents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
              <Input
                label="Relationship"
                value={formData.relation}
                onChange={e => setFormData({ ...formData, relation: e.target.value })}
                placeholder="Spouse, Child…"
              />
              <Input
                label="Age"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                placeholder="32"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {family.map(member => (
          <div 
            key={member.id} 
            onClick={() => setSelectedMember(member)} 
            className="bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] p-4 rounded-xl flex flex-col items-center text-center relative group hover:border-emerald-500/50 dark:hover:border-[#34D399]/50 transition-all shadow-sm dark:shadow-none cursor-pointer"
          >
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(member); }} 
                className="text-slate-400 dark:text-[#94a3b8] hover:text-emerald-500 transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              {!isMainLinkedAccountSelf(member) && (
                <button 
                  onClick={(e) => handleDeleteClick(e, member.id, member.name)} 
                  className="text-slate-400 dark:text-[#94a3b8] hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-[#27335D] flex items-center justify-center mb-3 text-slate-600 dark:text-[#F8FAFC]">
              <User size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC] mb-1">{member.name}</h3>
            <p className="text-emerald-600 dark:text-[#34D399] text-sm font-medium mb-1">{member.relation}</p>
            {!isOwnMember(member) ? (
              <div className="flex flex-col items-center gap-1 mt-0.5">
                <p className="text-xs text-slate-400 dark:text-[#64748b] italic">
                  From linked account
                </p>
                {isMainLinkedAccountSelf(member) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30">
                    Account owner
                  </span>
                )}
              </div>
            ) : (
              // Invisible placeholder line so the "View Profile" button lines up
              <p className="text-xs mt-0.5 opacity-0 select-none">placeholder</p>
            )}
            <Button variant="outline" className="w-full text-xs h-7 mt-3">View Profile</Button>
          </div>
        ))}
        </div>
      )}

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
