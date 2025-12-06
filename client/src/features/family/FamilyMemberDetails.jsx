import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Plus, Stethoscope, Activity, FileText, ScrollText, ImageIcon, Trash2, Edit, ArrowUpDown, Info, X, Download } from 'lucide-react';
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
  useUpdateFamilyMember,
  useDeleteReport
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import TimePicker from '../../components/ui/TimePicker';
import Select from '../../components/ui/Select';
import Autocomplete from '../../components/ui/Autocomplete';
import { pdfAPI } from '../../utils/api';
import {
  getMetricConfig,
  getDefaultUnit,
  getSupportedUnits,
  hasUnitConversion,
  convertValue,
  getNormalRanges,
  getPredefinedMetricTypes
} from '../../utils/healthMetrics';

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
  const deleteReport = useDeleteReport();
  
  const memberReports = reports.filter(r => r.familyMemberId === member.id);
  const [subTab, setSubTab] = useState('vitals');
  const [docFilter, setDocFilter] = useState('Report');
  const [docSortBy, setDocSortBy] = useState('date-desc'); // Default: newest first
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [showAddData, setShowAddData] = useState(false);
  const [newPlan, setNewPlan] = useState({ medId: '', dosage: '1', frequency: '1' });
  const [newData, setNewData] = useState({ type: 'Blood Pressure', value: '', date: new Date().toISOString().slice(0, 10), time: '', unit: getDefaultUnit('Blood Pressure') || 'mmHg' });
  const [doctorDate, setDoctorDate] = useState(member.lastDoctorVisit || '');
  const [deleteHealthDataConfirm, setDeleteHealthDataConfirm] = useState({ isOpen: false, memberId: null, dataId: null, type: '', date: '' });
  const [deletePlanConfirm, setDeletePlanConfirm] = useState({ isOpen: false, memberId: null, planId: null, medicationName: '' });
  const [deleteReportConfirm, setDeleteReportConfirm] = useState({ isOpen: false, reportId: null, reportTitle: '' });
  const [displayUnits, setDisplayUnits] = useState({}); // Track display unit for each metric type
  const [showRangesModal, setShowRangesModal] = useState({ type: null, unit: null });
  const [editingDataId, setEditingDataId] = useState(null);
  
  // Pagination states for documents
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const [docItemsPerPage] = useState(10);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setDocCurrentPage(1);
  }, [docFilter, docSortBy]);

  const metricTypes = useMemo(() => {
    const predefinedTypes = getPredefinedMetricTypes(); // Blood Pressure, Glucose, Hemoglobin
    const existingTypes = healthData.map(d => d.type);
    return [...new Set([...predefinedTypes, ...existingTypes])];
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
      if (editingDataId) {
        // Update existing record
        await updateHealthData.mutateAsync({
          familyMemberId: member.id,
          dataId: editingDataId,
          updates: newData
        });
        setEditingDataId(null);
      } else {
        // Create new record
      await createHealthData.mutateAsync({
        familyMemberId: member.id,
        data: newData
      });
      }
      setShowAddData(false);
      const defaultUnit = getDefaultUnit(newData.type) || '';
      setNewData({ type: newData.type, value: '', date: new Date().toISOString().slice(0, 10), time: '', unit: defaultUnit });
    } catch (error) {
      console.error('Failed to save health data:', error);
    }
  };

  const handleEditHealthDataClick = (data) => {
    setNewData({
      type: data.type,
      value: data.value,
      unit: data.unit || getDefaultUnit(data.type) || '',
      date: data.date,
      time: data.time || ''
    });
    setEditingDataId(data.id);
    setShowAddData(true);
  };

  const handleCancelEdit = () => {
    setShowAddData(false);
    setEditingDataId(null);
    const defaultUnit = getDefaultUnit(newData.type) || '';
    setNewData({ type: newData.type, value: '', date: new Date().toISOString().slice(0, 10), time: '', unit: defaultUnit });
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

  const handleDeleteReportClick = (reportId, reportTitle) => {
    setDeleteReportConfirm({ isOpen: true, reportId, reportTitle });
  };

  const handleDeleteReportConfirm = async () => {
    if (deleteReportConfirm.reportId) {
      try {
        await deleteReport.mutateAsync(deleteReportConfirm.reportId);
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
    setDeleteReportConfirm({ isOpen: false, reportId: null, reportTitle: '' });
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
  
  // Pagination calculations for documents
  const docTotalPages = Math.ceil(filteredDocs.length / docItemsPerPage);
  const docStartIndex = (docCurrentPage - 1) * docItemsPerPage;
  const docEndIndex = docStartIndex + docItemsPerPage;
  const paginatedDocs = filteredDocs.slice(docStartIndex, docEndIndex);

  const generateChartData = (type) => {
    const displayUnit = displayUnits[type] || getDefaultUnit(type) || null;
    const config = getMetricConfig(type);
    
    return healthData.filter(d => d.type === type).map(d => {
      if (type === 'Blood Pressure') {
        const [sys, dia] = d.value.split('/').map(Number);
        return { date: d.date, systolic: sys, diastolic: dia, id: d.id };
      }
      
      // Handle unit conversion for display
      let displayValue = Number(d.value);
      if (config?.hasConversion && displayUnit && d.unit && d.unit !== displayUnit) {
        const converted = convertValue(d.value, type, d.unit, displayUnit);
        displayValue = parseFloat(converted) || displayValue;
      }
      
      return { date: d.date, value: displayValue, id: d.id, originalUnit: d.unit };
    });
  };

  // Handle metric type change - update default unit
  const handleMetricTypeChange = (type) => {
    const defaultUnit = getDefaultUnit(type) || '';
    setNewData({ ...newData, type, unit: defaultUnit });
  };

  // Helper function to calculate time-based averages
  const calculateTimeBasedAverages = (records, type, displayUnit, hasConversion) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const getValue = (record) => {
      if (type === 'Blood Pressure') {
        const [sys, dia] = record.value.split('/').map(Number);
        return { systolic: sys, diastolic: dia };
      }
      let val = Number(record.value);
      if (hasConversion && displayUnit && record.unit && record.unit !== displayUnit) {
        val = parseFloat(convertValue(record.value, type, record.unit, displayUnit)) || val;
      }
      return val;
    };

    const filterByDate = (startDate) => {
      return records.filter(r => {
        const recordDate = new Date(r.date + (r.time ? `T${r.time}` : ''));
        return recordDate >= startDate;
      });
    };

    const calculateAvg = (filteredRecords) => {
      if (filteredRecords.length === 0) return null;
      if (type === 'Blood Pressure') {
        const avgSys = filteredRecords.reduce((sum, r) => {
          const val = getValue(r);
          return sum + (isNaN(val.systolic) ? 0 : val.systolic);
        }, 0) / filteredRecords.length;
        const avgDia = filteredRecords.reduce((sum, r) => {
          const val = getValue(r);
          return sum + (isNaN(val.diastolic) ? 0 : val.diastolic);
        }, 0) / filteredRecords.length;
        return `${Math.round(avgSys)}/${Math.round(avgDia)}`;
      } else {
        const avg = filteredRecords.reduce((sum, r) => {
          const val = getValue(r);
          return sum + (isNaN(val) ? 0 : val);
        }, 0) / filteredRecords.length;
        return avg.toFixed(2);
      }
    };

    return {
      oneWeek: { avg: calculateAvg(filterByDate(oneWeekAgo)), count: filterByDate(oneWeekAgo).length },
      oneMonth: { avg: calculateAvg(filterByDate(oneMonthAgo)), count: filterByDate(oneMonthAgo).length },
      threeMonths: { avg: calculateAvg(filterByDate(threeMonthsAgo)), count: filterByDate(threeMonthsAgo).length }
    };
  };

  // Download individual metric as PDF
  const downloadMetricAsPDF = async (type) => {
    try {
      const response = await pdfAPI.downloadMetricPDF(member.id, type);
      
      // Verify response is OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate PDF');
      }
      
      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vital-log-${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Check if blob is actually a PDF (first 4 bytes should be %PDF)
      const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array);
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file format');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error.message || 'PDF generation failed. Please try again.');
    }
  };

  // Download all vitals as PDF
  const downloadAllVitalsAsPDF = async () => {
    try {
      if (healthData.length === 0) {
        alert('No health data available to download.');
        return;
      }

      const response = await pdfAPI.downloadAllVitalsPDF(member.id);
      
      // Verify response is OK
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate PDF');
      }
      
      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vital-report-${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      
      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Check if blob is actually a PDF (first 4 bytes should be %PDF)
      const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array);
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file format');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error.message || 'PDF generation failed. Please try again.');
    }
  };

  // Calculate monthly summary analytics
  const monthlySummary = useMemo(() => {
    const summary = {};
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Group health data by month and metric type
    healthData.forEach(d => {
      const date = new Date(d.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!summary[monthKey]) {
        summary[monthKey] = {
          monthName,
          metrics: {}
        };
      }
      
      if (!summary[monthKey].metrics[d.type]) {
        summary[monthKey].metrics[d.type] = {
          type: d.type,
          values: [],
          unit: d.unit || getDefaultUnit(d.type) || '',
          count: 0
        };
      }
      
      // Handle Blood Pressure specially
      if (d.type === 'Blood Pressure') {
        const [sys, dia] = d.value.split('/').map(Number);
        if (!isNaN(sys) && !isNaN(dia)) {
          summary[monthKey].metrics[d.type].values.push({ systolic: sys, diastolic: dia });
          summary[monthKey].metrics[d.type].count++;
        }
      } else {
        // Handle unit conversion for display
        const displayUnit = displayUnits[d.type] || getDefaultUnit(d.type) || d.unit || '';
        const config = getMetricConfig(d.type);
        let value = Number(d.value);
        
        if (config?.hasConversion && displayUnit && d.unit && d.unit !== displayUnit) {
          const converted = convertValue(d.value, d.type, d.unit, displayUnit);
          value = parseFloat(converted) || value;
          summary[monthKey].metrics[d.type].unit = displayUnit;
        }
        
        if (!isNaN(value)) {
          summary[monthKey].metrics[d.type].values.push(value);
          summary[monthKey].metrics[d.type].count++;
        }
      }
    });
    
    // Calculate averages for each month and metric
    const result = Object.entries(summary)
      .map(([monthKey, data]) => {
        const metrics = Object.values(data.metrics)
          .filter(metric => metric.values.length > 0) // Only include metrics with data
          .map(metric => {
            if (metric.type === 'Blood Pressure') {
              const avgSystolic = metric.values.reduce((sum, v) => sum + v.systolic, 0) / metric.values.length;
              const avgDiastolic = metric.values.reduce((sum, v) => sum + v.diastolic, 0) / metric.values.length;
              return {
                ...metric,
                average: `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)}`,
                avgSystolic: Math.round(avgSystolic),
                avgDiastolic: Math.round(avgDiastolic)
              };
            } else {
              const avg = metric.values.reduce((sum, v) => sum + v, 0) / metric.values.length;
              return {
                ...metric,
                average: parseFloat(avg.toFixed(2))
              };
            }
          });
        
        return {
          monthKey,
          monthName: data.monthName,
          isCurrentMonth: monthKey === currentMonth,
          metrics
        };
      })
      .filter(month => month.metrics.length > 0) // Only show months with at least one metric
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)) // Sort by month, newest first
      .slice(0, 6); // Show last 6 months
    
    return result;
  }, [healthData, displayUnits]);

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
            <Card className="flex flex-col justify-center items-center gap-2">
              <Button onClick={() => setShowAddData(true)} className="w-full">
                <Plus size={16} /> Add Health Data
              </Button>
              {healthData.length > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={downloadAllVitalsAsPDF} 
                  className="w-full text-xs"
                >
                  <Download size={14} /> Download All Vitals as PDF
                </Button>
              )}
            </Card>
          </div>

          {showAddData && (
            <Card className="border-2 border-emerald-500/50 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <Activity className="text-emerald-600 dark:text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {editingDataId ? 'Edit Health Record' : 'Add Health Record'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                      {editingDataId ? 'Update the health data record' : 'Record a new health measurement'}
                    </p>
                  </div>
                </div>
                {editingDataId && (
                  <Badge variant="success">Editing</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">
                    Metric Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] shadow-sm appearance-none cursor-pointer hover:border-slate-600 dark:hover:border-slate-400"
                      value={newData.type}
                      onChange={e => handleMetricTypeChange(e.target.value)}
                    >
                      {getPredefinedMetricTypes().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      {(() => {
                        // Add any custom types from existing health data that aren't predefined
                        const predefined = getPredefinedMetricTypes();
                        const customTypes = [...new Set(healthData.map(d => d.type).filter(t => !predefined.includes(t)))];
                        if (customTypes.length > 0) {
                          return (
                            <>
                              <option disabled style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>──────────</option>
                              {customTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </>
                          );
                        }
                        return null;
                      })()}
                      <option value="__custom__" style={{ fontWeight: '500', color: '#10b981' }}>+ Add Custom Type</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    {/* Show custom input when "Add Custom Type" is selected */}
                    {newData.type === '__custom__' && (
                      <input
                        type="text"
                        className="w-full mt-2 bg-white dark:bg-[#1B2430] border-2 border-emerald-500 dark:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm placeholder-slate-400 dark:placeholder-[#64748b]"
                        placeholder="Type new metric name..."
                        autoFocus
                        onBlur={e => {
                          if (e.target.value.trim()) {
                            handleMetricTypeChange(e.target.value.trim());
                          } else {
                            handleMetricTypeChange('Blood Pressure');
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleMetricTypeChange(e.target.value.trim());
                            e.preventDefault();
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Input 
                    label="Value" 
                    placeholder={newData.type === 'Blood Pressure' ? 'e.g. 120/80' : 'e.g. 95'} 
                    value={newData.value} 
                    onChange={e => setNewData({...newData, value: e.target.value})} 
                    className="mb-0" 
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const supportedUnits = getSupportedUnits(newData.type);
                    const config = getMetricConfig(newData.type);
                    
                    if (supportedUnits.length > 0 && config) {
                      // Use dropdown for predefined metrics
                      return (
                        <div className="relative">
                          <select
                            className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] shadow-sm appearance-none cursor-pointer hover:border-slate-600 dark:hover:border-slate-400"
                            value={newData.unit}
                            onChange={e => setNewData({...newData, unit: e.target.value})}
                          >
                            {supportedUnits.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          </div>
                        </div>
                      );
                    } else {
                      // Free-form input for custom metrics
                      return (
                  <input 
                          type="text"
                          className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] shadow-sm"
                          placeholder="e.g. mmHg"
                          value={newData.unit}
                          onChange={e => setNewData({...newData, unit: e.target.value})}
                        />
                      );
                    }
                  })()}
                </div>
                
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">
                    Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={newData.date} 
                      onChange={e => setNewData({...newData, date: e.target.value})} 
                      className="flex-1 min-w-0 bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg px-2.5 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all"
                    />
                    <div className="w-24 flex-shrink-0">
                      <TimePicker
                        value={newData.time}
                        onChange={(time) => setNewData({...newData, time})}
                        placeholder="Time"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-[#27335D]">
                <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleAddData} disabled={!newData.value || !newData.unit}>
                  {editingDataId ? 'Update Record' : 'Save Record'}
                </Button>
              </div>
            </Card>
          )}

          {/* Monthly Summary Analytics */}
          {monthlySummary.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="font-semibold text-base text-slate-900 dark:text-[#F8FAFC]">Monthly Averages</h3>
              </div>
              
              <div className="space-y-2">
                {monthlySummary.map((monthData) => (
                  <div key={monthData.monthKey} className={`p-2.5 rounded-lg border ${monthData.isCurrentMonth ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50/30 dark:bg-blue-500/5' : 'border-slate-200 dark:border-[#27335D] bg-slate-50/50 dark:bg-[#111725]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">{monthData.monthName}</span>
                        {monthData.isCurrentMonth && (
                          <Badge variant="success" className="text-xs py-0 px-1.5">Current</Badge>
                        )}
                      </div>
                    </div>
                    
                    {monthData.metrics.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {monthData.metrics.map((metric) => (
                          <div key={metric.type} className="p-2 bg-white dark:bg-[#1B2430] rounded border border-slate-200 dark:border-[#27335D]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-600 dark:text-[#94a3b8] truncate">{metric.type}</span>
                              <span className="text-[10px] text-slate-400 dark:text-[#64748b] ml-1">{metric.count}</span>
                            </div>
                            {metric.type === 'Blood Pressure' ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metric.average}</span>
                                <span className="text-[10px] text-slate-500 dark:text-[#94a3b8]">{metric.unit || 'mmHg'}</span>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metric.average}</span>
                                <span className="text-[10px] text-slate-500 dark:text-[#94a3b8]">{metric.unit}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metricTypes.map(type => {
              const data = generateChartData(type);
              if (data.length === 0) return null;

              const config = getMetricConfig(type);
              const hasConversion = hasUnitConversion(type);
              const supportedUnits = getSupportedUnits(type);
              const currentDisplayUnit = displayUnits[type] || getDefaultUnit(type) || (data[0]?.originalUnit || '');
              const normalRanges = getNormalRanges(type, currentDisplayUnit);

              return (
                <Card key={type} className="min-h-[300px] relative group">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="text-emerald-500" size={20} /> {type}
                    </h3>
                      {normalRanges && (
                        <button
                          onClick={() => setShowRangesModal({ type, unit: currentDisplayUnit })}
                          className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                          title="View normal ranges"
                        >
                          <Info size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadMetricAsPDF(type)}
                        className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#27335D]"
                        title="Download as PDF"
                      >
                        <Download size={16} />
                      </button>
                      {hasConversion && supportedUnits.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Unit:</span>
                          <select
                            className="text-xs bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded px-2 py-1 text-slate-900 dark:text-[#F8FAFC]"
                            value={currentDisplayUnit}
                            onChange={e => setDisplayUnits({ ...displayUnits, [type]: e.target.value })}
                          >
                            {supportedUnits.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {!hasConversion && currentDisplayUnit && (
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">{currentDisplayUnit}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {type === 'Blood Pressure' ? (
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend />
                          <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" />
                        </LineChart>
                      ) : (
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" />
                          <YAxis label={{ value: currentDisplayUnit || '', angle: -90, position: 'insideLeft' }} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value) => [`${value} ${currentDisplayUnit || ''}`, 'Value']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {healthData
                      .filter(d => d.type === type)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(d => {
                        // Get display value and unit
                        const displayUnit = displayUnits[type] || getDefaultUnit(type) || d.unit || '';
                        let displayValue = d.value;
                        if (hasConversion && displayUnit && d.unit && d.unit !== displayUnit) {
                          displayValue = convertValue(d.value, type, d.unit, displayUnit);
                        }
                        return (
                        <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#111725] rounded-lg group/item hover:bg-slate-100 dark:hover:bg-[#27335D]">
                          <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
                                {displayValue} {displayUnit || d.unit}
                                {hasConversion && d.unit !== displayUnit && (
                                  <span className="text-xs text-slate-400 ml-1">({d.value} {d.unit})</span>
                                )}
                              </span>
                            <span className="text-xs text-slate-500 dark:text-[#94a3b8]">
                              {new Date(d.date).toLocaleDateString()}
                              {d.time && <span className="ml-1">• {d.time}</span>}
                            </span>
                          </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditHealthDataClick(d)}
                                className="text-slate-400 hover:text-emerald-500 transition-colors"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                          <button
                            onClick={() => handleDeleteHealthDataClick(d.id, d.type, d.date)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                          </div>
                        );
                      })}
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
                  <Autocomplete
                    label="Select Medicine"
                    value={newPlan.medId}
                    onChange={(value) => setNewPlan({...newPlan, medId: value})}
                    placeholder="Type medicine name, generic name, or category to search..."
                    disabled={!!editingPlanId}
                    options={medications.map(m => ({
                      value: m.id,
                      label: `${m.name}${m.genericName ? ` (${m.genericName})` : ''}${m.strength ? ` - ${m.strength}` : ''}${m.category ? ` [${m.category}]` : ''}`,
                      searchText: `${m.name} ${m.genericName || ''} ${m.category || ''} ${m.strength || ''}`.toLowerCase()
                    }))}
                  />
                </div>
                <div><Input label="Dose (Qty)" type="number" step="0.1" min="0.1" value={newPlan.dosage} onChange={e => setNewPlan({...newPlan, dosage: e.target.value})} className="mb-0" /></div>
                <div><Input label="Freq (Daily)" type="number" value={newPlan.frequency} onChange={e => setNewPlan({...newPlan, frequency: e.target.value})} className="mb-0" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={resetPlanForm} className="flex-1">Cancel</Button>
                <Button onClick={handleAddPlan} className="flex-1">{editingPlanId ? 'Update Plan' : 'Add to Plan'}</Button>
              </div>
            </div>
          )}

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {plans.map(plan => {
              const { monthly, packs, cost } = calculateCost(plan);
              return (
                <div key={plan.id} className="border border-slate-200 dark:border-[#27335D] rounded-lg p-4 bg-slate-50/50 dark:bg-[#111725]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-[#F8FAFC] mb-1">
                        {plan.medicationName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        {plan.dosage % 1 === 0 ? plan.dosage : plan.dosage.toFixed(1)} tablet(s) × {plan.frequency}/day
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
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
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Monthly Qty</p>
                      <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">{monthly}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Packs Needed</p>
                      <Badge variant="warning">{packs} packs</Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Est. Cost</p>
                      <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">{cost.toFixed(2)} BDT</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {plans.length === 0 && <p className="text-center text-slate-500 py-8">No medicines added to monthly plan yet.</p>}
            {plans.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-slate-200 dark:border-[#27335D] bg-slate-50 dark:bg-[#111725] rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Total Monthly Cost:</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-[#34D399]">
                    {plans.reduce((total, plan) => {
                      const { cost } = calculateCost(plan);
                      return total + cost;
                    }, 0).toFixed(2)} BDT
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">{plan.dosage % 1 === 0 ? plan.dosage : plan.dosage.toFixed(1)} tablet(s) x {plan.frequency}/day</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-[#F8FAFC]">{monthly}</td>
                      <td className="px-4 py-3"><Badge variant="warning">{packs} packs</Badge></td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{cost.toFixed(2)} BDT</td>
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
              {plans.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-[#111725] border-t-2 border-slate-200 dark:border-[#27335D]">
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-right font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Total Monthly Cost:
                    </td>
                    <td className="px-4 py-4 font-bold text-lg text-emerald-600 dark:text-[#34D399]">
                      {plans.reduce((total, plan) => {
                        const { cost } = calculateCost(plan);
                        return total + cost;
                      }, 0).toFixed(2)} BDT
                    </td>
                    <td className="px-4 py-4"></td>
                  </tr>
                </tfoot>
              )}
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
            <>
              <div className="text-xs text-slate-500 dark:text-[#94a3b8] mb-2">
                Showing {filteredDocs.length === 0 ? 0 : docStartIndex + 1}-{Math.min(docEndIndex, filteredDocs.length)} of {filteredDocs.length} {docFilter.toLowerCase()}(s)
              </div>
            <div className="grid gap-3">
                {paginatedDocs.map(report => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {report.type === 'Scanned Image' && report.title.startsWith('Extracted') ? (
                      <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-black overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                        {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-2">{report.title}</h4>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(report.date).toLocaleDateString()}</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full whitespace-nowrap">
                            {report.type === 'Scanned Image' ? 'Image' : report.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                      onClick={() => handleDeleteReportClick(report.id, report.title)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination Controls */}
              {docTotalPages > 1 && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#27335D]">
                  <div className="text-sm text-slate-500 dark:text-[#94a3b8]">
                    Page {docCurrentPage} of {docTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDocCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={docCurrentPage === 1}
                      className="px-3 py-1.5 text-xs"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, docTotalPages) }, (_, i) => {
                        let pageNum;
                        if (docTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (docCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (docCurrentPage >= docTotalPages - 2) {
                          pageNum = docTotalPages - 4 + i;
                        } else {
                          pageNum = docCurrentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setDocCurrentPage(pageNum)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                              docCurrentPage === pageNum
                                ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725] font-medium'
                                : 'bg-white dark:bg-[#1B2430] border border-slate-300 dark:border-[#27335D] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#27335D]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setDocCurrentPage(prev => Math.min(docTotalPages, prev + 1))}
                      disabled={docCurrentPage === docTotalPages}
                      className="px-3 py-1.5 text-xs"
                    >
                      Next
                    </Button>
                  </div>
            </div>
              )}
            </>
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

      <ConfirmModal
        isOpen={deleteReportConfirm.isOpen}
        onClose={() => setDeleteReportConfirm({ isOpen: false, reportId: null, reportTitle: '' })}
        onConfirm={handleDeleteReportConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteReportConfirm.reportTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Normal Ranges Modal */}
      {showRangesModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowRangesModal({ type: null, unit: null })}>
          <div 
            className="bg-white dark:bg-[#1B2430] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-[#27335D]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Normal Ranges: {showRangesModal.type}
                </h3>
                <button
                  onClick={() => setShowRangesModal({ type: null, unit: null })}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {showRangesModal.type === 'Blood Pressure' && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-[#94a3b8] mb-3">
                      {getNormalRanges('Blood Pressure')?.note}
                    </p>
                    <div className="space-y-2">
                      {getNormalRanges('Blood Pressure')?.categories.map((cat, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-1">{cat.name}</div>
                          <div className="text-sm text-slate-600 dark:text-[#94a3b8]">
                            Systolic: {cat.systolic} • Diastolic: {cat.diastolic}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {showRangesModal.type === 'Glucose' && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-[#94a3b8] mb-3">
                      {getNormalRanges('Glucose', showRangesModal.unit) && getMetricConfig('Glucose')?.normalRanges?.note}
                    </p>
                    <div className="space-y-2">
                      {getNormalRanges('Glucose', showRangesModal.unit) && Object.entries(getNormalRanges('Glucose', showRangesModal.unit)).map(([testType, range]) => (
                        <div key={testType} className="p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-1">{testType}</div>
                          <div className="text-sm text-slate-600 dark:text-[#94a3b8]">
                            {range} {showRangesModal.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {showRangesModal.type === 'Hemoglobin' && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-[#94a3b8] mb-3">
                      {getNormalRanges('Hemoglobin', showRangesModal.unit) && getMetricConfig('Hemoglobin')?.normalRanges?.note}
                    </p>
                    <div className="space-y-2">
                      {getNormalRanges('Hemoglobin', showRangesModal.unit) && Object.entries(getNormalRanges('Hemoglobin', showRangesModal.unit)).map(([gender, range]) => (
                        <div key={gender} className="p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-1">{gender}</div>
                          <div className="text-sm text-slate-600 dark:text-[#94a3b8]">
                            {range} {showRangesModal.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowRangesModal({ type: null, unit: null })}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberDetails;
