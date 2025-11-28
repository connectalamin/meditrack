import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Briefcase, Edit } from 'lucide-react';
import { 
  useAppointments, 
  useFamilyMembers,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment 
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AppointmentsTab = () => {
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: family = [] } = useFamilyMembers();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ doctor: '', specialty: '', location: '', date: '', time: '', familyMemberId: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, doctor: '' });

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      if (a.date === b.date) {
        return (a.time || '').localeCompare(b.time || '');
      }
      return a.date.localeCompare(b.date);
    });
  }, [appointments]);

  const resetForm = () => {
    setFormData({ doctor: '', specialty: '', location: '', date: '', time: '', familyMemberId: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (apt) => {
    setFormData({
      doctor: apt.doctor || '',
      specialty: apt.specialty || '',
      location: apt.location || '',
      date: apt.date || '',
      time: apt.time || '',
      familyMemberId: apt.familyMemberId || ''
    });
    setEditingId(apt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctor || !formData.date) return;
    
    const memberName = family.find(m => m.id === formData.familyMemberId)?.name || 'General';

    try {
      if (editingId) {
        await updateAppointment.mutateAsync({
          id: editingId,
          updates: {
            ...formData,
            familyMemberName: memberName,
            familyMemberId: formData.familyMemberId || null
          }
        });
      } else {
        await createAppointment.mutateAsync({
          ...formData,
          familyMemberName: memberName,
          familyMemberId: formData.familyMemberId || null
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleDeleteClick = (id, doctor) => {
    setDeleteConfirm({ isOpen: true, id, doctor });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteAppointment.mutateAsync(deleteConfirm.id);
      } catch (error) {
        console.error('Failed to delete appointment:', error);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, doctor: '' });
  };

  const getCountdown = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { text: "Passed", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" };
    if (days === 0) return { text: "Today", color: "text-red-600", bg: "bg-red-100 dark:bg-red-500/20" };
    if (days === 1) return { text: "Tomorrow", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-500/20" };
    return { text: `In ${days} days`, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-500/20" };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Doctor Appointments</h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Track upcoming visits and schedules</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          {showForm ? <X size={18} /> : <Plus size={18} />} {editingId ? 'Cancel Edit' : 'Add Appointment'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-[#F8FAFC]">
            {editingId ? 'Edit Appointment' : 'Add New Appointment'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Doctor Name" placeholder="Dr. Smith" value={formData.doctor} onChange={e => setFormData({...formData, doctor: e.target.value})} />
              <Input label="Specialty" placeholder="Cardiologist" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
              <Input label="Location" placeholder="City Hospital, Room 302" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mb-0" />
                <Input label="Time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="mb-0" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Appointment For</label>
                <select 
                  className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC]"
                  value={formData.familyMemberId}
                  onChange={(e) => setFormData({...formData, familyMemberId: e.target.value})}
                >
                  <option value="">Select Family Member (Optional)</option>
                  {family.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update Appointment' : 'Schedule Visit'}</Button>
            </div>
          </form>
        </Card>
      )}

      {appointmentsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAppointments.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-[#1B2430]/50 rounded-xl border border-dashed border-slate-300 dark:border-[#27335D]">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 dark:text-[#27335D] mb-3" />
            <p className="text-slate-500 dark:text-[#94a3b8]">No upcoming appointments.</p>
          </div>
        )}
        {sortedAppointments.map(apt => {
          const status = getCountdown(apt.date);
          return (
            <Card key={apt.id} className="relative group hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                  <Briefcase size={24} />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                  {status.text}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">{apt.doctor}</h3>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-emerald-600 dark:text-[#34D399] font-medium">{apt.specialty}</p>
                {apt.familyMemberName && apt.familyMemberName !== 'General' && (
                  <span className="text-xs bg-slate-100 dark:bg-[#27335D] px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    {apt.familyMemberName}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-slate-500 dark:text-[#94a3b8] mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} /> 
                  <span>{new Date(apt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} /> 
                  <span>{apt.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} /> 
                  <span>{apt.location}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-[#27335D] opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(apt)} 
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(apt.id, apt.doctor)} 
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, doctor: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Appointment"
        message={`Are you sure you want to delete the appointment with ${deleteConfirm.doctor}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AppointmentsTab;
