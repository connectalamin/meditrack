import { useState, useRef, useEffect } from 'react';
import { 
  useFamilyMembers,
  useMedications,
  useAllPlans,
  usePurchaseListItems,
  useCreatePurchaseListItem,
  useUpdatePurchaseListItem,
  useDeletePurchaseListItem,
  useUpdatePlan
} from '../../hooks/useData';
import { ArrowLeft, ShoppingBag, Users, Download, FileText, File, Check, ChevronDown, Copy, Plus, Edit, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PurchaseList = ({ onBack }) => {
  const [textCopied, setTextCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [monthlyMemberSelection, setMonthlyMemberSelection] = useState('all'); // 'all' or 'select'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [formData, setFormData] = useState({ medicationId: '', medicationName: '', quantity: '', price: '' });
  
  const contentRef = useRef(null);
  const downloadMenuRef = useRef(null);
  
  const { data: family = [] } = useFamilyMembers();
  const { data: medications = [] } = useMedications();
  const { data: plans = {} } = useAllPlans();
  const { data: purchaseListItems = [] } = usePurchaseListItems();
  
  const createPurchaseListItem = useCreatePurchaseListItem();
  const updatePurchaseListItem = useUpdatePurchaseListItem();
  const deletePurchaseListItem = useDeletePurchaseListItem();
  const updatePlan = useUpdatePlan();

  // Reset form
  const resetForm = () => {
    setFormData({ medicationId: '', medicationName: '', quantity: '', price: '' });
    setEditingItem(null);
    setShowAddForm(false);
  };

  // Handle medication selection
  const handleMedicationSelect = (medicationId) => {
    const medication = medications.find(m => m.id === medicationId);
    if (medication) {
      setFormData({
        medicationId: medication.id,
        medicationName: medication.name,
        quantity: '1',
        price: medication.price?.toString() || '0'
      });
    }
  };

  // Handle add/edit medicine
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicationName || !formData.quantity || !formData.price) return;

    try {
      const itemData = {
        medicationId: formData.medicationId || null,
        medicationName: formData.medicationName,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price)
      };

      if (editingItem) {
        await updatePurchaseListItem.mutateAsync({
          id: editingItem.id,
          updates: itemData
        });
      } else {
        await createPurchaseListItem.mutateAsync(itemData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving purchase list item:', error);
    }
  };

  // Handle edit click
  const handleEdit = (item) => {
    setFormData({
      medicationId: item.medicationId || '',
      medicationName: item.medicationName,
      quantity: item.quantity.toString(),
      price: item.price.toString()
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deletePurchaseListItem.mutateAsync(deleteConfirm.id);
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Calculate monthly medicine needs for a plan
  const calculateCost = (plan) => {
    const daily = plan.dosage * plan.frequency;
    const monthly = daily * 30;
    const packs = Math.ceil(monthly / plan.packSize);
    const cost = packs * plan.price;
    return { monthly, packs, cost };
  };

  // Get medication details from database
  const getMedicationDetails = (medicationId) => {
    return medications.find(m => m.id === medicationId) || null;
  };

  // Get monthly medicines from selected family members
  const getMonthlyMedicines = () => {
    const monthlyItems = [];
    const membersToProcess = monthlyMemberSelection === 'all' 
      ? family 
      : family.filter(m => selectedMembers.includes(m.id));

    membersToProcess.forEach(member => {
      const memberPlans = plans[member.id] || [];
      memberPlans.forEach(plan => {
        const medDetails = getMedicationDetails(plan.medicationId);
        const { monthly, packs, cost } = calculateCost(plan);
        monthlyItems.push({
          id: `monthly-${plan.id}`,
          type: 'monthly',
          medicationName: plan.medicationName,
          strength: medDetails?.strength || '',
          monthly,
          packs,
          cost,
          dosage: plan.dosage,
          frequency: plan.frequency,
          memberName: member.name,
          memberId: member.id,
          planId: plan.id,
          medicationId: plan.medicationId
        });
      });
    });

    return monthlyItems;
  };

  // Get medicines (from purchase list items)
  const getNormalMedicines = () => {
    return purchaseListItems.map(item => ({
      id: item.id,
      type: 'normal',
      medicationName: item.medicationName,
      strength: item.medication?.strength || '',
      quantity: item.quantity,
      price: item.price,
      cost: item.totalCost,
      medicationId: item.medicationId
    }));
  };

  // Combine all medicines
  const getAllMedicines = () => {
    const normal = getNormalMedicines();
    const monthly = includeMonthly ? getMonthlyMedicines() : [];
    return [...normal, ...monthly];
  };

  const allMedicines = getAllMedicines();
  const totalCost = allMedicines.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalPacks = allMedicines.reduce((sum, item) => {
    if (item.type === 'monthly') return sum + item.packs;
    return sum + item.quantity;
  }, 0);

  // Generate text content for download
  const generateTextContent = () => {
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let text = `PURCHASE LIST\n`;
    text += `Generated on: ${date}\n`;
    text += `\n${'='.repeat(50)}\n\n`;
    text += `SUMMARY\n`;
    text += `Total Medicines: ${allMedicines.length}\n`;
    text += `Total Items: ${totalPacks}\n`;
    text += `Estimated Cost: ${totalCost.toLocaleString()} BDT\n`;
    text += `\n${'='.repeat(50)}\n\n`;

    // Medicines
    const normalMedicines = allMedicines.filter(m => m.type === 'normal');
    if (normalMedicines.length > 0) {
      text += `MEDICINES\n${'-'.repeat(50)}\n`;
      normalMedicines.forEach((item, idx) => {
        text += `${idx + 1}. ${item.medicationName}`;
        if (item.strength) text += ` (${item.strength})`;
        text += `\n`;
        text += `   Quantity: ${item.quantity} | Price: ${item.price.toLocaleString()} BDT | Total: ${item.cost.toLocaleString()} BDT\n\n`;
      });
      text += `\n`;
    }

    // Monthly medicines
    if (includeMonthly) {
      const monthlyMedicines = allMedicines.filter(m => m.type === 'monthly');
      if (monthlyMedicines.length > 0) {
        text += `MONTHLY MEDICINES\n${'-'.repeat(50)}\n`;
        monthlyMedicines.forEach((item, idx) => {
          text += `${idx + 1}. ${item.medicationName}`;
          if (item.strength) text += ` (${item.strength})`;
          text += ` - ${item.memberName}\n`;
          text += `   Schedule: ${item.dosage} tablet(s) × ${item.frequency}/day\n`;
          text += `   Monthly Qty: ${item.monthly} | Packs: ${item.packs} | Cost: ${item.cost.toLocaleString()} BDT\n\n`;
        });
      }
    }
    
    return text;
  };

  // Download as Text
  const downloadAsText = () => {
    const text = generateTextContent();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download as PDF
  const downloadAsPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.setFontSize(18);
      doc.text('PURCHASE LIST', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 14, 28);
      
      let yPos = 38;
      doc.setFontSize(12);
      doc.text('SUMMARY', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Medicines: ${allMedicines.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Items: ${totalPacks}`, 14, yPos);
      yPos += 6;
      doc.text(`Estimated Cost: ${totalCost.toLocaleString()} BDT`, 14, yPos);
      yPos += 10;
      
      // Medicines
      const normalMedicines = allMedicines.filter(m => m.type === 'normal');
      if (normalMedicines.length > 0) {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('MEDICINES', 14, yPos);
        yPos += 8;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        normalMedicines.forEach((item, idx) => {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          let medName = `${idx + 1}. ${item.medicationName}`;
          if (item.strength) medName += ` (${item.strength})`;
          doc.text(medName, 16, yPos);
          yPos += 6;
          doc.setFontSize(9);
          doc.text(`Quantity: ${item.quantity} | Price: ${item.price.toLocaleString()} BDT | Total: ${item.cost.toLocaleString()} BDT`, 20, yPos);
          yPos += 8;
        });
        yPos += 5;
      }

      // Monthly medicines
      if (includeMonthly) {
        const monthlyMedicines = allMedicines.filter(m => m.type === 'monthly');
        if (monthlyMedicines.length > 0) {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('MONTHLY MEDICINES', 14, yPos);
          yPos += 8;
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
          monthlyMedicines.forEach((item, idx) => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            let medName = `${idx + 1}. ${item.medicationName}`;
            if (item.strength) medName += ` (${item.strength}) - ${item.memberName}`;
            doc.text(medName, 16, yPos);
            yPos += 6;
            doc.setFontSize(9);
            doc.text(`Schedule: ${item.dosage} tablet(s) × ${item.frequency}/day`, 20, yPos);
            yPos += 5;
            doc.text(`Monthly Qty: ${item.monthly} | Packs: ${item.packs} | Cost: ${item.cost.toLocaleString()} BDT`, 20, yPos);
            yPos += 8;
          });
        }
      }
      
      doc.save(`purchase-list-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF generation failed. Please try downloading as text instead.');
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    const text = generateTextContent();
    copyToClipboard(text, setTextCopied);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text, setState) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setState(true);
        setTimeout(() => setState(false), 2000);
      }).catch(() => {
        fallbackCopyToClipboard(text, setState);
      });
    } else {
      fallbackCopyToClipboard(text, setState);
    }
  };

  // Fallback copy method
  const fallbackCopyToClipboard = (text, setState) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setState(true);
      setTimeout(() => setState(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
    document.body.removeChild(textArea);
  };

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadMenu]);

  // Reset member selection when switching to 'all'
  useEffect(() => {
    if (monthlyMemberSelection === 'all') {
      setSelectedMembers([]);
    }
  }, [monthlyMemberSelection]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft size={20} />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">Purchase List</h2>
            <p className="text-slate-500 dark:text-[#94a3b8] mt-1">Manage your medicine purchase list</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyText}
            className="flex items-center gap-2"
          >
            {textCopied ? <Check size={16} /> : <Copy size={16} />}
            {textCopied ? 'Copied!' : 'Copy Text'}
          </Button>
          <div className="relative" ref={downloadMenuRef}>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <Download size={16} />
              Download
              <ChevronDown size={16} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
            </Button>
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg shadow-lg z-10 min-w-[180px]">
                <button
                  onClick={() => {
                    downloadAsPDF();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#27335D] flex items-center gap-2 rounded-t-lg transition-colors"
                >
                  <File size={16} />
                  Download as PDF
                </button>
                <button
                  onClick={() => {
                    downloadAsText();
                    setShowDownloadMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#27335D] flex items-center gap-2 rounded-b-lg transition-colors"
                >
                  <FileText size={16} />
                  Download as Text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options Card */}
      <Card className="py-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeMonthly"
              checked={includeMonthly}
              onChange={(e) => setIncludeMonthly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 dark:bg-[#1B2430] dark:border-[#27335D]"
            />
            <label htmlFor="includeMonthly" className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC] cursor-pointer">
              Include Monthly Medicines
            </label>
          </div>

          {includeMonthly && (
            <div className="ml-5 space-y-1.5 border-l-2 border-slate-200 dark:border-[#27335D] pl-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="memberSelection"
                    value="all"
                    checked={monthlyMemberSelection === 'all'}
                    onChange={(e) => setMonthlyMemberSelection(e.target.value)}
                    className="w-3.5 h-3.5 text-emerald-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-[#F8FAFC]">All Family Members</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="memberSelection"
                    value="select"
                    checked={monthlyMemberSelection === 'select'}
                    onChange={(e) => setMonthlyMemberSelection(e.target.value)}
                    className="w-3.5 h-3.5 text-emerald-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-[#F8FAFC]">Select Family Members</span>
                </label>
              </div>

              {monthlyMemberSelection === 'select' && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-4">
                  {family.map(member => (
                    <label key={member.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="w-3.5 h-3.5 text-emerald-600"
                      />
                      <span className="text-xs text-slate-600 dark:text-[#94a3b8]">
                        {member.name} {member.relation && `(${member.relation})`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-l-4 border-l-amber-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
              <ShoppingBag className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Total Items</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{allMedicines.length} Medicines</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
              <ShoppingBag className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{totalPacks} {totalPacks === 1 ? 'Item' : 'Items'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
              <ShoppingBag className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Estimated Cost</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{totalCost.toLocaleString()} BDT</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {editingItem ? 'Edit Medicine' : 'Add Medicine'}
            </h3>
            <Button variant="ghost" onClick={resetForm} className="p-2">
              <X size={20} />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-[#94a3b8] mb-1.5">
                Select from Database (Optional)
              </label>
              <select
                className="w-full bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded-lg px-4 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={formData.medicationId}
                onChange={(e) => handleMedicationSelect(e.target.value)}
              >
                <option value="">Select from Database...</option>
                {medications.map(m => (
                  <option key={m.id} value={m.id}>{m.name} {m.strength && `(${m.strength})`}</option>
                ))}
              </select>
            </div>
            <Input
              label="Medicine Name"
              type="text"
              value={formData.medicationName}
              onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <Input
                label="Price (BDT)"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingItem ? 'Update' : 'Add'} Medicine
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Medicines List */}
      {allMedicines.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto text-slate-400 dark:text-[#94a3b8] mb-4" size={48} />
            <p className="text-slate-500 dark:text-[#94a3b8] text-lg">No medicines in purchase list</p>
            <p className="text-slate-400 dark:text-[#64748b] text-sm mt-2">
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)} className="mt-4">
                  <Plus size={16} /> Add Medicine
                </Button>
              )}
            </p>
          </div>
        </Card>
      ) : (
        <div ref={contentRef} className="space-y-6">
          {/* Medicines Section */}
          {getNormalMedicines().length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC]">Medicines</h3>
                {!showAddForm && (
                  <Button onClick={() => setShowAddForm(true)} size="sm">
                    <Plus size={16} /> Add Medicine
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-l-lg">Medicine</th>
                      <th className="px-4 py-3 text-center">Quantity</th>
                      <th className="px-4 py-3 text-center">Price</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                    {getNormalMedicines().map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                              {item.medicationName}
                            </p>
                            {item.strength && (
                              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{item.strength}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.price.toLocaleString()} BDT
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {item.cost.toLocaleString()} BDT
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="p-1.5"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setDeleteConfirm({ isOpen: true, id: item.id, name: item.medicationName })}
                              className="p-1.5 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Monthly Medicines Section */}
          {includeMonthly && getMonthlyMedicines().length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4">Monthly Medicines</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-l-lg">Medicine</th>
                      <th className="px-4 py-3 text-left">Member</th>
                      <th className="px-4 py-3 text-left">Schedule</th>
                      <th className="px-4 py-3 text-center">Monthly Qty</th>
                      <th className="px-4 py-3 text-center">Packs</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                    {getMonthlyMedicines().map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                              {item.medicationName}
                            </p>
                            {item.strength && (
                              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{item.strength}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">
                          {item.memberName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">
                          {item.dosage} tablet(s) × {item.frequency}/day
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.monthly}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="warning">{item.packs} packs</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {item.cost.toLocaleString()} BDT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Show add button if no medicines */}
          {getNormalMedicines().length === 0 && !showAddForm && (
            <Card>
              <div className="text-center py-8">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus size={16} /> Add Medicine
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteConfirm.name}" from the purchase list?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default PurchaseList;
