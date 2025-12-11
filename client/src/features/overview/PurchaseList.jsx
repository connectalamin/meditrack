import { useState, useRef, useEffect } from 'react';
import { 
  useFamilyMembers,
  useMedications,
  useAllPlans,
  usePurchaseListItems,
  useCreatePurchaseListItem,
  useUpdatePurchaseListItem,
  useDeletePurchaseListItem,
  useUpdatePlan,
  usePurchaseListLogs,
  useCreatePurchaseListLog
} from '../../hooks/useData';
import { ArrowLeft, ShoppingBag, Download, FileText, File, Check, ChevronDown, Copy, Plus, Edit, Trash2, X, History } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Select from '../../components/ui/Select';
import Autocomplete from '../../components/ui/Autocomplete';

const PurchaseList = ({ onBack }) => {
  const [textCopied, setTextCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [monthlyMemberSelection, setMonthlyMemberSelection] = useState('all'); // 'all' or 'select'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [formData, setFormData] = useState({ medicationId: '', medicationName: '', quantity: '', price: '', discount: '' });
  const [globalDiscount, setGlobalDiscount] = useState('');
  const [monthlyMedicineDiscounts, setMonthlyMedicineDiscounts] = useState({});
  const [monthlyMedicineQuantities, setMonthlyMedicineQuantities] = useState({});
  const [monthlyMedicinePacks, setMonthlyMedicinePacks] = useState({});
  const [savingLog, setSavingLog] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  
  const contentRef = useRef(null);
  const downloadMenuRef = useRef(null);
  
  const { data: family = [] } = useFamilyMembers();
  const { data: medications = [] } = useMedications();
  const { data: plans = {} } = useAllPlans();
  const { data: purchaseListItems = [] } = usePurchaseListItems();
  const { data: purchaseListLogs = [] } = usePurchaseListLogs();
  
  const createPurchaseListItem = useCreatePurchaseListItem();
  const updatePurchaseListItem = useUpdatePurchaseListItem();
  const deletePurchaseListItem = useDeletePurchaseListItem();
  const updatePlan = useUpdatePlan();
  const createPurchaseListLog = useCreatePurchaseListLog();

  // Reset form
  const resetForm = () => {
    setFormData({ medicationId: '', medicationName: '', quantity: '', price: '', discount: '' });
    setEditingItem(null);
    setShowAddForm(false);
  };

  // Handle medication selection
  const handleMedicationSelect = (medicationId) => {
    const medication = medications.find(m => m.id === medicationId);
    if (medication) {
      const packSize = medication.packSize || 1;
      setFormData({
        medicationId: medication.id,
        medicationName: medication.name,
        quantity: packSize.toString(), // Default to 1 pack worth of tablets
        price: medication.price?.toString() || '0',
        discount: ''
      });
    }
  };

  // Handle add/edit medicine
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicationName || !formData.quantity || !formData.price) return;

    try {
      // Quantity is stored as tablets (integer)
      const tabletQuantity = parseInt(formData.quantity);
      const price = parseFloat(formData.price);
      const discount = formData.discount ? parseFloat(formData.discount) : 0;
      
      // Calculate packs and totalCost based on medication's packSize
      const medication = formData.medicationId ? medications.find(m => m.id === formData.medicationId) : null;
      const packSize = medication?.packSize || 1;
      const packs = tabletQuantity / packSize;
      const subtotal = packs * price;
      const discountAmount = discount ? subtotal * (discount / 100) : 0;
      const totalCost = subtotal - discountAmount;
      
      const itemData = {
        medicationId: formData.medicationId || null,
        medicationName: formData.medicationName,
        quantity: tabletQuantity, // Store as tablets
        price: price,
        totalCost: totalCost, // Calculate and send totalCost based on packs
        ...(discount > 0 && { discount: discount })
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
    // Get the original item from purchaseListItems to access discount
    const originalItem = purchaseListItems.find(i => i.id === item.id);
    setFormData({
      medicationId: item.medicationId || '',
      medicationName: item.medicationName,
      quantity: item.quantity.toString(), // quantity is already in tablets
      price: item.price.toString(),
      discount: (originalItem?.discount || item.discount) ? (originalItem?.discount || item.discount).toString() : ''
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirm.id) {
      try {
        // Check if it's a monthly medicine (starts with "monthly-")
        if (deleteConfirm.id.startsWith('monthly-')) {
          // Remove from state for monthly medicines
          setMonthlyMedicineQuantities(prev => {
            const newState = { ...prev };
            delete newState[deleteConfirm.id];
            return newState;
          });
          setMonthlyMedicinePacks(prev => {
            const newState = { ...prev };
            delete newState[deleteConfirm.id];
            return newState;
          });
          setMonthlyMedicineDiscounts(prev => {
            const newState = { ...prev };
            delete newState[deleteConfirm.id];
            return newState;
          });
        } else {
          // Regular purchase list item - delete from database
          await deletePurchaseListItem.mutateAsync(deleteConfirm.id);
        }
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Calculate monthly medicine needs for a plan
  const calculateCost = (plan, adjustedMonthly = null, adjustedPacks = null) => {
    const daily = plan.dosage * plan.frequency;
    const baseMonthly = daily * 30;
    const monthly = adjustedMonthly !== null ? adjustedMonthly : baseMonthly;
    
    // If packs are directly adjusted, use them; otherwise calculate from quantity
    const packs = adjustedPacks !== null ? adjustedPacks : (monthly / plan.packSize);
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
        const itemId = `monthly-${plan.id}`;
        
        // Check for adjusted values (priority: packs > quantity > calculated)
        const adjustedPacks = monthlyMedicinePacks[itemId] !== undefined ? monthlyMedicinePacks[itemId] : null;
        const adjustedMonthly = monthlyMedicineQuantities[itemId] !== undefined ? monthlyMedicineQuantities[itemId] : null;
        
        const { monthly, packs, cost } = calculateCost(plan, adjustedMonthly, adjustedPacks);
        const discount = monthlyMedicineDiscounts[itemId] || 0;
        const subtotal = cost;
        const discountAmount = discount ? subtotal * (discount / 100) : 0;
        const finalCost = subtotal - discountAmount;
        
        monthlyItems.push({
          id: itemId,
          type: 'monthly',
          medicationName: plan.medicationName,
          strength: medDetails?.strength || '',
          monthly,
          packs,
          cost: finalCost,
          subtotal,
          discount,
          discountAmount,
          dosage: plan.dosage,
          frequency: plan.frequency,
          memberName: member.name,
          memberId: member.id,
          planId: plan.id,
          medicationId: plan.medicationId,
          packSize: plan.packSize,
          price: plan.price
        });
      });
    });

    return monthlyItems;
  };

  // Get medicines (from purchase list items)
  const getNormalMedicines = () => {
    return purchaseListItems.map(item => {
      const medication = item.medicationId ? medications.find(m => m.id === item.medicationId) : null;
      const packSize = medication?.packSize || 1;
      // Quantity is stored as tablets, calculate packs
      const packs = item.quantity / packSize;
      const subtotal = packs * item.price;
      const discount = item.discount || 0;
      const discountAmount = discount ? subtotal * (discount / 100) : 0;
      // Use totalCost from database (already includes discount) as final cost
      const finalCost = item.totalCost || (subtotal - discountAmount);
      
      return {
        id: item.id,
        type: 'normal',
        medicationName: item.medicationName,
        strength: item.medication?.strength || '',
        quantity: item.quantity, // tablets
        packs: packs, // calculated packs (can be fractional)
        price: item.price,
        cost: finalCost,
        subtotal,
        discount,
        discountAmount,
        medicationId: item.medicationId,
        packSize: packSize
      };
    });
  };

  // Combine all medicines
  const getAllMedicines = () => {
    const normal = getNormalMedicines();
    const monthly = includeMonthly ? getMonthlyMedicines() : [];
    return [...normal, ...monthly];
  };

  const allMedicines = getAllMedicines();
  const subtotal = allMedicines.reduce((sum, item) => sum + (item.cost || 0), 0);
  const globalDiscountValue = parseFloat(globalDiscount) || 0;
  const globalDiscountAmount = globalDiscountValue ? subtotal * (globalDiscountValue / 100) : 0;
  const totalCost = subtotal - globalDiscountAmount;
  const totalPacks = allMedicines.reduce((sum, item) => {
    if (item.type === 'monthly') return sum + item.packs;
    return sum + (item.packs || 0); // Use packs for regular medicines too
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
    text += `Subtotal: ${subtotal.toLocaleString()} BDT\n`;
    if (globalDiscountValue > 0) {
      text += `Global Discount: ${globalDiscountValue.toFixed(1)}% (${globalDiscountAmount.toLocaleString()} BDT)\n`;
    }
    text += `Final Cost: ${totalCost.toLocaleString()} BDT\n`;
    text += `\n${'='.repeat(50)}\n\n`;

    // Medicines
    const normalMedicines = allMedicines.filter(m => m.type === 'normal');
    if (normalMedicines.length > 0) {
      text += `MEDICINES\n${'-'.repeat(50)}\n`;
      normalMedicines.forEach((item, idx) => {
        text += `${idx + 1}. ${item.medicationName}`;
        if (item.strength) text += ` (${item.strength})`;
        text += `\n`;
        const packsDisplay = item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1);
        text += `   Tablets: ${item.quantity} | Packs: ${packsDisplay} | Price: ${item.price.toLocaleString()} BDT`;
        if (item.discount > 0) {
          text += ` | Discount: ${item.discount.toFixed(1)}%`;
          text += `\n   Subtotal: ${item.subtotal.toLocaleString()} BDT | Final: ${item.cost.toLocaleString()} BDT`;
        } else {
          text += ` | Total: ${item.cost.toLocaleString()} BDT`;
        }
        text += `\n\n`;
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
          text += `   Monthly Qty: ${item.monthly} | Packs: ${item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1)}`;
          if (item.discount > 0) {
            text += ` | Discount: ${item.discount.toFixed(1)}%`;
            text += `\n   Subtotal: ${item.subtotal.toLocaleString()} BDT | Final: ${item.cost.toLocaleString()} BDT`;
          } else {
            text += ` | Cost: ${item.cost.toLocaleString()} BDT`;
          }
          text += `\n\n`;
        });
      }
    }
    
    return text;
  };

  // Save current list as a log entry
  const handleSaveLog = async () => {
    if (allMedicines.length === 0 || savingLog) return;
    setSavingLog(true);
    try {
      const date = new Date();
      const title = `Purchase List - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const content = generateTextContent();

      await createPurchaseListLog.mutateAsync({
        title,
        content,
        totalItems: allMedicines.length,
        totalQuantity: totalPacks,
        totalCost,
        ...(globalDiscountValue > 0 && { discount: globalDiscountValue })
      });
      // After save, go to logs page
      setShowLogs(true);
    } catch (error) {
      console.error('Error saving purchase list log:', error);
      alert('Failed to save purchase list log.');
    } finally {
      setSavingLog(false);
    }
  };

  // Download a single log as PDF
  const downloadLogAsPDF = async (log) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const createdAt = new Date(log.createdAt);
      const dateString = createdAt.toLocaleString();

      doc.setFontSize(16);
      doc.text(log.title || 'Purchase List', 14, 20);
      doc.setFontSize(10);
      doc.text(`Saved on: ${dateString}`, 14, 28);
      doc.text(
        `Medicines: ${log.totalItems} • Quantity: ${log.totalQuantity} • Estimated Cost: ${log.totalCost.toLocaleString()} BDT`,
        14,
        34
      );

      doc.setFontSize(10);
      const leftMargin = 14;
      let y = 44;
      const lineHeight = 5;
      const maxLineWidth = 180;

      const lines = doc.splitTextToSize(log.content || '', maxLineWidth);
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, leftMargin, y);
        y += lineHeight;
      });

      doc.save(
        `${(log.title || 'purchase-list')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}-${createdAt.toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Error generating log PDF:', error);
      alert('PDF generation for this log failed.');
    }
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
      doc.text(`Subtotal: ${subtotal.toLocaleString()} BDT`, 14, yPos);
      yPos += 6;
      if (globalDiscountValue > 0) {
        doc.text(`Global Discount: ${globalDiscountValue.toFixed(1)}% (${globalDiscountAmount.toLocaleString()} BDT)`, 14, yPos);
        yPos += 6;
      }
      doc.text(`Final Cost: ${totalCost.toLocaleString()} BDT`, 14, yPos);
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
          const packsDisplay = item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1);
          if (item.discount > 0) {
            doc.text(`Tablets: ${item.quantity} | Packs: ${packsDisplay} | Price: ${item.price.toLocaleString()} BDT | Discount: ${item.discount.toFixed(1)}%`, 20, yPos);
            yPos += 5;
            doc.text(`Subtotal: ${item.subtotal.toLocaleString()} BDT | Final: ${item.cost.toLocaleString()} BDT`, 20, yPos);
          } else {
            doc.text(`Tablets: ${item.quantity} | Packs: ${packsDisplay} | Price: ${item.price.toLocaleString()} BDT | Total: ${item.cost.toLocaleString()} BDT`, 20, yPos);
          }
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
            const packsDisplay = item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1);
            if (item.discount > 0) {
              doc.text(`Monthly Qty: ${item.monthly} | Packs: ${packsDisplay} | Discount: ${item.discount.toFixed(1)}%`, 20, yPos);
              yPos += 5;
              doc.text(`Subtotal: ${item.subtotal.toLocaleString()} BDT | Final: ${item.cost.toLocaleString()} BDT`, 20, yPos);
            } else {
              doc.text(`Monthly Qty: ${item.monthly} | Packs: ${packsDisplay} | Cost: ${item.cost.toLocaleString()} BDT`, 20, yPos);
            }
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
        <div className="flex items-center justify-end gap-1 sm:gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            onClick={handleCopyText}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm"
          >
            {textCopied ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">
              {textCopied ? 'Copied!' : 'Copy Text'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveLog}
            disabled={allMedicines.length === 0 || savingLog}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">
              {savingLog ? 'Saving...' : 'Save to Log'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLogs((prev) => !prev)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm"
            disabled={purchaseListLogs.length === 0}
          >
            <History size={14} />
            <span className="hidden sm:inline">
              {showLogs ? 'Back to List' : 'View Logs'}
            </span>
          </Button>
          <div className="relative" ref={downloadMenuRef}>
            <Button
              variant="outline"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown size={14} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
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

      {/* Main content vs Logs page */}
      {!showLogs ? (
        <>
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
            <div className="space-y-4">
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
                    <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Subtotal</p>
                    <p className={`text-2xl font-bold ${globalDiscountValue > 0 ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-[#F8FAFC]'}`}>
                      {subtotal.toLocaleString()} BDT
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-amber-200 dark:border-amber-500/20 pt-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1 md:flex-none">
                    <Input
                      label="Global Discount (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(e.target.value)}
                      className="mb-0 w-full md:w-40"
                      placeholder="0"
                    />
                  </div>
                  {globalDiscountValue > 0 && (
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Discount Amount</p>
                        <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                          -{globalDiscountAmount.toLocaleString()} BDT
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Final Cost</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {totalCost.toLocaleString()} BDT
                      </p>
                    </div>
                  </div>
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
              <Autocomplete
                label="Select from Database (Optional)"
                value={formData.medicationId}
                onChange={(value) => handleMedicationSelect(value)}
                placeholder="Type medicine name, generic name, or category to search..."
                options={medications.map(m => ({
                  value: m.id,
                  label: `${m.name}${m.genericName ? ` (${m.genericName})` : ''}${m.strength ? ` - ${m.strength}` : ''}${m.category ? ` [${m.category}]` : ''}`,
                  searchText: `${m.name} ${m.genericName || ''} ${m.category || ''} ${m.strength || ''}`.toLowerCase()
                }))}
              />
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
                label="Quantity (Tablets)"
                type="number"
                min="1"
                step="1"
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
            {formData.medicationId && (() => {
              const medication = medications.find(m => m.id === formData.medicationId);
              if (medication && medication.packSize) {
                const tabletQty = parseFloat(formData.quantity) || 0;
                const calculatedPacks = tabletQty / medication.packSize;
                return (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-[#94a3b8] mb-1.5">
                      Packs
                    </label>
                    <div className="w-full bg-slate-50 dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded-lg px-4 py-2.5 text-slate-900 dark:text-[#F8FAFC]">
                      <Badge variant="warning">
                        {calculatedPacks % 1 === 0 ? calculatedPacks : calculatedPacks.toFixed(1)} packs
                      </Badge>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Discount (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-[#94a3b8] mb-1.5">
                  Final Price (BDT)
                </label>
                <div className="w-full bg-slate-50 dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded-lg px-4 py-2.5 text-slate-900 dark:text-[#F8FAFC]">
                  {(() => {
                    const medication = formData.medicationId ? medications.find(m => m.id === formData.medicationId) : null;
                    const packSize = medication?.packSize || 1;
                    const tabletQty = parseFloat(formData.quantity) || 0;
                    const packs = tabletQty / packSize;
                    const price = parseFloat(formData.price) || 0;
                    const discount = parseFloat(formData.discount) || 0;
                    const subtotal = packs * price;
                    const discountAmount = discount ? subtotal * (discount / 100) : 0;
                    const finalPrice = subtotal - discountAmount;
                    return finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()}
                </div>
              </div>
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
              
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {getNormalMedicines().map((item) => (
                  <div key={item.id} className="border border-slate-200 dark:border-[#27335D] rounded-lg p-4 bg-slate-50/50 dark:bg-[#111725]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {item.medicationName}
                          </p>
                          {item.medicationId && (() => {
                            const med = medications.find(m => m.id === item.medicationId);
                            return med?.category ? (
                              <Badge variant="info" className="text-xs">
                                {med.category}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                        {item.medicationId && (() => {
                          const med = medications.find(m => m.id === item.medicationId);
                          return med?.genericName ? (
                            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                              {med.genericName}
                            </p>
                          ) : null;
                        })()}
                        {item.medicationId && (() => {
                          const med = medications.find(m => m.id === item.medicationId);
                          return med?.strength ? (
                            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                              Strength: {med.strength}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex gap-2 ml-2">
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
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Tablets</p>
                        <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Packs</p>
                        <Badge variant="warning">
                          {item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1)} packs
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Price</p>
                        <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">{item.price.toLocaleString()} BDT</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Discount</p>
                        {item.discount > 0 ? (
                          <p className="font-medium text-red-600 dark:text-red-400">{item.discount.toFixed(1)}%</p>
                        ) : (
                          <p className="font-medium text-slate-400 dark:text-slate-500">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-1">Total Cost</p>
                        {item.discount > 0 ? (
                          <div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-through">
                              {item.subtotal.toLocaleString()} BDT
                            </p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              {(item.cost || 0).toLocaleString()} BDT
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {(item.cost || 0).toLocaleString()} BDT
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-l-lg">Medicine</th>
                      <th className="px-4 py-3 text-center">Tablets</th>
                      <th className="px-4 py-3 text-center">Packs</th>
                      <th className="px-4 py-3 text-center">Price</th>
                      <th className="px-4 py-3 text-center">Discount</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                    {getNormalMedicines().map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                                {item.medicationName}
                              </p>
                              {item.medicationId && (() => {
                                const med = medications.find(m => m.id === item.medicationId);
                                return med?.category ? (
                                  <Badge variant="info" className="text-xs">
                                    {med.category}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                            {item.medicationId && (() => {
                              const med = medications.find(m => m.id === item.medicationId);
                              return med?.genericName ? (
                                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                                  {med.genericName}
                                </p>
                              ) : null;
                            })()}
                            {item.medicationId && (() => {
                              const med = medications.find(m => m.id === item.medicationId);
                              return med?.strength ? (
                                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                                  Strength: {med.strength}
                                </p>
                              ) : null;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="warning">
                            {item.packs % 1 === 0 ? item.packs : item.packs.toFixed(1)} packs
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.price.toLocaleString()} BDT
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 dark:text-[#F8FAFC]">
                          {item.discount > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {item.discount.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.discount > 0 ? (
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                {item.subtotal.toLocaleString()} BDT
                              </p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {(item.cost || 0).toLocaleString()} BDT
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                              {(item.cost || 0).toLocaleString()} BDT
                            </p>
                          )}
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
              
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {getMonthlyMedicines().map((item) => (
                  <div key={item.id} className="border border-slate-200 dark:border-[#27335D] rounded-lg p-4 bg-slate-50/50 dark:bg-[#111725]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {item.medicationName}
                        </p>
                        {item.strength && (
                          <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">{item.strength}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: item.id, name: item.medicationName })}
                        className="p-1.5 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Member:</span>
                        <span className="font-medium text-slate-900 dark:text-[#F8FAFC]">{item.memberName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Schedule:</span>
                        <span className="font-medium text-slate-900 dark:text-[#F8FAFC]">{item.dosage} tablet(s) × {item.frequency}/day</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Monthly Qty:</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={monthlyMedicineQuantities[item.id] !== undefined ? monthlyMedicineQuantities[item.id] : item.monthly}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setMonthlyMedicineQuantities(prev => {
                                const newState = { ...prev };
                                delete newState[item.id];
                                return newState;
                              });
                            } else {
                              const numValue = parseFloat(value);
                              setMonthlyMedicineQuantities(prev => ({
                                ...prev,
                                [item.id]: numValue
                              }));
                              // When quantity changes, recalculate packs (remove pack override)
                              setMonthlyMedicinePacks(prev => {
                                const newState = { ...prev };
                                delete newState[item.id];
                                return newState;
                              });
                            }
                          }}
                          className="w-24 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Packs:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={monthlyMedicinePacks[item.id] !== undefined ? monthlyMedicinePacks[item.id] : item.packs}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setMonthlyMedicinePacks(prev => {
                                const newState = { ...prev };
                                delete newState[item.id];
                                return newState;
                              });
                            } else {
                              const numValue = parseFloat(value);
                              setMonthlyMedicinePacks(prev => ({
                                ...prev,
                                [item.id]: numValue
                              }));
                            }
                          }}
                          className="w-24 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Discount (%):</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discount || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setMonthlyMedicineDiscounts(prev => ({
                              ...prev,
                              [item.id]: value ? parseFloat(value) : 0
                            }));
                          }}
                          className="w-24 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          placeholder="0"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-[#27335D]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Cost:</span>
                          {item.discount > 0 ? (
                            <div className="text-right">
                              <p className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                {item.subtotal.toLocaleString()} BDT
                              </p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {(item.cost || 0).toLocaleString()} BDT
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                              {(item.cost || 0).toLocaleString()} BDT
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-l-lg">Medicine</th>
                      <th className="px-4 py-3 text-left">Member</th>
                      <th className="px-4 py-3 text-left">Schedule</th>
                      <th className="px-4 py-3 text-center">Monthly Qty</th>
                      <th className="px-4 py-3 text-center">Packs</th>
                      <th className="px-4 py-3 text-center">Discount (%)</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
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
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={monthlyMedicineQuantities[item.id] !== undefined ? monthlyMedicineQuantities[item.id] : item.monthly}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setMonthlyMedicineQuantities(prev => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                });
                              } else {
                                const numValue = parseFloat(value);
                                setMonthlyMedicineQuantities(prev => ({
                                  ...prev,
                                  [item.id]: numValue
                                }));
                                // When quantity changes, recalculate packs (remove pack override)
                                setMonthlyMedicinePacks(prev => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                });
                              }
                            }}
                            className="w-20 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={monthlyMedicinePacks[item.id] !== undefined ? monthlyMedicinePacks[item.id] : item.packs}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setMonthlyMedicinePacks(prev => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                });
                              } else {
                                const numValue = parseFloat(value);
                                setMonthlyMedicinePacks(prev => ({
                                  ...prev,
                                  [item.id]: numValue
                                }));
                              }
                            }}
                            className="w-20 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.discount || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMonthlyMedicineDiscounts(prev => ({
                                ...prev,
                                [item.id]: value ? parseFloat(value) : 0
                              }));
                            }}
                            className="w-20 px-2 py-1 text-sm bg-white dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.discount > 0 ? (
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                {item.subtotal.toLocaleString()} BDT
                              </p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {(item.cost || 0).toLocaleString()} BDT
                              </p>
                            </div>
                          ) : (
                            <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                              {(item.cost || 0).toLocaleString()} BDT
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm({ isOpen: true, id: item.id, name: item.medicationName })}
                            className="p-1.5 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
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
        </>
      ) : (
        // Logs "page"
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mb-3">
            Previous Purchase Lists
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-4">
            Select a log to view the full text or download as PDF.
          </p>
          {purchaseListLogs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
              No logs saved yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {purchaseListLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-100 dark:border-[#27335D] rounded-lg p-3 bg-slate-50/60 dark:bg-[#111725]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {log.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                        {new Date(log.createdAt).toLocaleString()} • {log.totalItems} meds •{' '}
                        {log.totalQuantity} items • {log.totalCost.toLocaleString()} BDT
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-xs"
                        onClick={() => {
                          const alreadyOpen = document.getElementById(`log-text-${log.id}`);
                          if (alreadyOpen) {
                            alreadyOpen.classList.toggle('hidden');
                          }
                        }}
                      >
                        <FileText size={12} className="mr-1" />
                        Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-xs"
                        onClick={() => downloadLogAsPDF(log)}
                      >
                        <File size={12} className="mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  <pre
                    id={`log-text-${log.id}`}
                    className="mt-2 max-h-40 overflow-y-auto text-[11px] leading-snug text-slate-700 dark:text-[#E2E8F0] bg-white dark:bg-[#0b1120] border border-slate-100 dark:border-[#27335D] rounded-md p-2 whitespace-pre-wrap hidden"
                  >
                    {log.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Card>
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
