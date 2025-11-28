import { useState, useMemo } from 'react';
import { ChevronLeft, Plus, Stethoscope, Activity, FileText, ScrollText, ImageIcon, Trash2, Edit, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  useMedications,
  useReports,
  useHealthData,
  usePlans,
  useCreateHealthData,
  useUpdateHealthData,
  useDeleteHealthData,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useUpdateFamilyMember
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';

const FamilyMemberDetails = ({ member, onBack }) => {
  const { data: medications = [] } = useMedications();
  const { data: reports = [] } = useReports();
  const { data: healthData = [] } = useHealthData(member.id);
  const { data: plans = [] } = usePlans(member.id);
  
  const createHealthData = useCreateHealthData();
  const updateHealthData = useUpdateHealthData();
  const deleteHealthData = useDeleteHealthData();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const updateFamilyMember = useUpdateFamilyMember();
  
  const memberReports = reports.filter(r => r.familyMemberId === member.id);
  const [subTab, setSubTab] = useState('vitals');
  const [docFilter, setDocFilter] = useState('Report');
  const [docSortBy, setDocSortBy] = useState('date-desc'); // Default: newest first
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [showAddData, setShowAddData] = useState(false);
  const [newPlan, setNewPlan] = useState({ medId: '', dosage: '1', frequency: '1' });
  const [newData, setNewData] = useState({ type: 'Blood Pressure', value: '', date: new Date().toISOString().slice(0, 10), unit: 'mmHg' });
  const [doctorDate, setDoctorDate] = useState(member.lastDoctorVisit || '');
  const [deleteHealthDataConfirm, setDeleteHealthDataConfirm] = useState({ isOpen: false, memberId: null, dataId: null, type: '', date: '' });
  const [deletePlanConfirm, setDeletePlanConfirm] = useState({ isOpen: false, memberId: null, planId: null, medicationName: '' });

  const metricTypes = useMemo(() => {
    const defaultTypes = ['Blood Pressure', 'Glucose'];
    const existingTypes = healthData.map(d => d.type);
    return [...new Set([...defaultTypes, ...existingTypes])];
  }, [healthData]);

  const resetPlanForm = () => {
    setNewPlan({ medId: '', dosage: '1', frequency: '1' });
    setEditingPlanId(null);
    setShowAddPlan(false);
  };

  const handleEditPlan = (plan) => {
    setNewPlan({
      medId: plan.medicationId || '',
      dosage: plan.dosage?.toString() || '1',
      frequency: plan.frequency?.toString() || '1'
    });
    setEditingPlanId(plan.id);
    setShowAddPlan(true);
  };

  const handleAddPlan = async () => {
    if (!newPlan.medId) return;
    const selectedMed = medications.find(m => m.id === newPlan.medId);
    const planData = {
      medicationId: selectedMed.id,
      medicationName: selectedMed.name,
      price: selectedMed.price,
      packSize: selectedMed.packSize,
      dosage: Number(newPlan.dosage),
      frequency: Number(newPlan.frequency)
    };

    try {
      if (editingPlanId) {
        await updatePlan.mutateAsync({
          familyMemberId: member.id,
          planId: editingPlanId,
          updates: planData
        });
      } else {
        await createPlan.mutateAsync({
          familyMemberId: member.id,
          plan: planData
        });
      }
      resetPlanForm();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleAddData = async () => {
    if (!newData.value) return;
    try {
      await createHealthData.mutateAsync({
        familyMemberId: member.id,
        data: newData
      });
      setShowAddData(false);
      setNewData({ ...newData, value: '' });
    } catch (error) {
      console.error('Failed to add health data:', error);
    }
  };

  const updateDoctorVisit = async (date) => {
    setDoctorDate(date);
    try {
      await updateFamilyMember.mutateAsync({
        id: member.id,
        updates: { lastDoctorVisit: date }
      });
    } catch (error) {
      console.error('Failed to update doctor visit:', error);
    }
  };

  const handleDeleteHealthDataClick = (dataId, type, date) => {
    setDeleteHealthDataConfirm({ isOpen: true, memberId: member.id, dataId, type, date });
  };

  const handleDeleteHealthDataConfirm = async () => {
    if (deleteHealthDataConfirm.memberId && deleteHealthDataConfirm.dataId) {
      try {
        await deleteHealthData.mutateAsync({
          familyMemberId: deleteHealthDataConfirm.memberId,
          dataId: deleteHealthDataConfirm.dataId
        });
      } catch (error) {
        console.error('Failed to delete health data:', error);
      }
    }
    setDeleteHealthDataConfirm({ isOpen: false, memberId: null, dataId: null, type: '', date: '' });
  };

  const handleDeletePlanClick = (planId, medicationName) => {
    setDeletePlanConfirm({ isOpen: true, memberId: member.id, planId, medicationName });
  };

  const handleDeletePlanConfirm = async () => {
    if (deletePlanConfirm.memberId && deletePlanConfirm.planId) {
      try {
        await deletePlan.mutateAsync({
          familyMemberId: deletePlanConfirm.memberId,
          planId: deletePlanConfirm.planId
        });
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
    setDeletePlanConfirm({ isOpen: false, memberId: null, planId: null, medicationName: '' });
  };

  const calculateCost = (plan) => {
    const daily = plan.dosage * plan.frequency;
    const monthly = daily * 30;
    const packs = Math.ceil(monthly / plan.packSize);
    const cost = packs * plan.price;
    return { monthly, packs, cost };
  };

  // Filter and sort documents
  const filteredDocs = useMemo(() => {
    let filtered = memberReports.filter(r => (r.category || 'Report') === docFilter);
    
    // Sort documents
    filtered.sort((a, b) => {
      switch (docSortBy) {
        case 'date-desc': // Newest first (default)
          return new Date(b.date) - new Date(a.date);
        case 'date-asc': // Oldest first
          return new Date(a.date) - new Date(b.date);
        case 'title-asc': // A-Z
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc': // Z-A
          return (b.title || '').localeCompare(a.title || '');
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
    
    return filtered;
  }, [memberReports, docFilter, docSortBy]);

  const generateChartData = (type) => {
    return healthData.filter(d => d.type === type).map(d => {
      if (type === 'Blood Pressure') {
        const [sys, dia] = d.value.split('/').map(Number);
        return { date: d.date, systolic: sys, diastolic: dia, id: d.id };
      }
      return { date: d.date, value: Number(d.value), id: d.id };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#27335D] text-slate-600 dark:text-[#94a3b8]">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{member.name}</h2>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">{member.relation} Profile</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-[#27335D] pb-1">
        <button onClick={() => setSubTab('vitals')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'vitals' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>
          Vitals & Overview
        </button>
        <button onClick={() => setSubTab('plan')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'plan' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>
          Medicine Plan
        </button>
        <button onClick={() => setSubTab('reports')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'reports' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>
          Documents
        </button>
      </div>

      {subTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Stethoscope size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Last Doctor Visit</p>
                <input 
                  type="date" 
                  value={doctorDate} 
                  onChange={(e) => updateDoctorVisit(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none"
                />
              </div>
            </Card>
            <Card className="flex flex-col justify-center items-center">
              <Button onClick={() => setShowAddData(true)} className="w-full">
                <Plus size={16} /> Add Health Data
              </Button>
            </Card>
          </div>

          {showAddData && (
            <Card className="border-emerald-500 border">
              <h3 className="font-semibold mb-4">Add Health Record</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Metric Type</label>
                  <input 
                    list="metrics" 
                    className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm"
                    value={newData.type}
                    onChange={e => setNewData({...newData, type: e.target.value})}
                    placeholder="Select or Type..."
                  />
                  <datalist id="metrics">
                    <option value="Blood Pressure" />
                    <option value="Glucose" />
                    <option value="Cholesterol" />
                    <option value="Hemoglobin" />
                    <option value="Weight" />
                  </datalist>
                </div>
                <div><Input label="Value" placeholder="e.g. 120/80 or 95" value={newData.value} onChange={e => setNewData({...newData, value: e.target.value})} className="mb-0" /></div>
                <div><Input label="Unit" placeholder="e.g. mmHg" value={newData.unit} onChange={e => setNewData({...newData, unit: e.target.value})} className="mb-0" /></div>
                <div><Input label="Date" type="date" value={newData.date} onChange={e => setNewData({...newData, date: e.target.value})} className="mb-0" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowAddData(false)}>Cancel</Button>
                <Button onClick={handleAddData}>Save Record</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metricTypes.map(type => {
              const data = generateChartData(type);
              if (data.length === 0) return null;

              return (
                <Card key={type} className="min-h-[300px] relative group">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="text-emerald-500" size={20} /> {type}
                    </h3>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {type === 'Blood Pressure' ? (
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend />
                          <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" />
                        </LineChart>
                      ) : (
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {healthData
                      .filter(d => d.type === type)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(d => (
                        <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#111725] rounded-lg group/item hover:bg-slate-100 dark:hover:bg-[#27335D]">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">{d.value} {d.unit}</span>
                            <span className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(d.date).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteHealthDataClick(d.id, d.type, d.date)}
                            className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                </Card>
              );
            })}
            {healthData.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                No health data recorded yet. Click "Add Health Data" to start tracking vitals.
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'plan' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Monthly Medication Plan</h3>
            <Button onClick={() => { resetPlanForm(); setShowAddPlan(true); }} className="h-8 text-xs">{showAddPlan ? 'Cancel' : 'Add Medicine'}</Button>
          </div>

          {showAddPlan && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-[#111725] rounded-lg border border-slate-200 dark:border-[#27335D]">
              {editingPlanId && (
                <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Editing: {plans.find(p => p.id === editingPlanId)?.medicationName}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Select Medicine</label>
                  <select 
                    className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC]"
                    value={newPlan.medId}
                    onChange={e => setNewPlan({...newPlan, medId: e.target.value})}
                    disabled={!!editingPlanId}
                  >
                    <option value="">Select from Database...</option>
                    {medications.map(m => <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>)}
                  </select>
                </div>
                <div><Input label="Dose (Qty)" type="number" value={newPlan.dosage} onChange={e => setNewPlan({...newPlan, dosage: e.target.value})} className="mb-0" /></div>
                <div><Input label="Freq (Daily)" type="number" value={newPlan.frequency} onChange={e => setNewPlan({...newPlan, frequency: e.target.value})} className="mb-0" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={resetPlanForm} className="flex-1">Cancel</Button>
                <Button onClick={handleAddPlan} className="flex-1">{editingPlanId ? 'Update Plan' : 'Add to Plan'}</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Medicine</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Monthly Qty</th>
                  <th className="px-4 py-3">Packs Needed</th>
                  <th className="px-4 py-3">Est. Cost</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                {plans.map(plan => {
                  const { monthly, packs, cost } = calculateCost(plan);
                  return (
                    <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors group">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#F8FAFC]">{plan.medicationName}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">{plan.dosage} tablet(s) x {plan.frequency}/day</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-[#F8FAFC]">{monthly}</td>
                      <td className="px-4 py-3"><Badge variant="warning">{packs} packs</Badge></td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{cost} BDT</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditPlan(plan)}
                            className="text-slate-400 hover:text-emerald-500 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePlanClick(plan.id, plan.medicationName)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {plans.length === 0 && <p className="text-center text-slate-500 py-8">No medicines added to monthly plan yet.</p>}
          </div>
        </Card>
      )}

      {subTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setDocFilter('Report')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${docFilter === 'Report' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1B2430]'}`}
              >
                <FileText size={16} /> Reports
              </button>
              <button 
                onClick={() => setDocFilter('Prescription')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${docFilter === 'Prescription' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1B2430]'}`}
              >
                <ScrollText size={16} /> Prescriptions
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-500 dark:text-[#94a3b8]" />
              <label className="text-xs text-slate-600 dark:text-[#94a3b8]">Sort:</label>
              <select
                value={docSortBy}
                onChange={(e) => setDocSortBy(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-[#1B2430]/50 rounded-xl border border-dashed border-slate-300 dark:border-[#27335D]">
              <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-[#27335D] mb-3" />
              <p className="text-slate-500 dark:text-[#94a3b8]">No {docFilter.toLowerCase()}s found for {member.name}.</p>
              <p className="text-xs text-slate-400">Go to the main 'Documents' tab to upload and assign.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDocs.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg">
                  <div className="flex items-center gap-4">
                    {report.type === 'Scanned Image' && report.title.startsWith('Extracted') ? (
                      <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-black overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                        {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC]">{report.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(report.date).toLocaleDateString()}</p>
                        {report.type === 'Scanned Image' && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                            Image
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge>{report.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteHealthDataConfirm.isOpen}
        onClose={() => setDeleteHealthDataConfirm({ isOpen: false, memberId: null, dataId: null, type: '', date: '' })}
        onConfirm={handleDeleteHealthDataConfirm}
        title="Delete Health Data"
        message={`Are you sure you want to delete the ${deleteHealthDataConfirm.type} record from ${new Date(deleteHealthDataConfirm.date).toLocaleDateString()}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={deletePlanConfirm.isOpen}
        onClose={() => setDeletePlanConfirm({ isOpen: false, memberId: null, planId: null, medicationName: '' })}
        onConfirm={handleDeletePlanConfirm}
        title="Delete Medication Plan"
        message={`Are you sure you want to remove "${deletePlanConfirm.medicationName}" from the medication plan? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default FamilyMemberDetails;
