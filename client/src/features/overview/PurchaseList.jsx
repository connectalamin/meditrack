import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ShoppingBag, Users, Download, FileText, File, Check, ChevronDown, Copy } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const PurchaseList = ({ onBack }) => {
  const [textCopied, setTextCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const contentRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const { family, plans, medications } = useApp();

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

  // Group plans by family member and aggregate by medication
  const getMonthlyPurchaseList = () => {
    const purchaseMap = {}; // { memberId: { member, items: [] } }

    // Process each family member's plans
    family.forEach(member => {
      const memberPlans = plans[member.id] || [];
      
      if (memberPlans.length === 0) return;

      const items = [];
      const medicationMap = {}; // Aggregate same medications

      memberPlans.forEach(plan => {
        const medDetails = getMedicationDetails(plan.medicationId);
        const { monthly, packs, cost } = calculateCost(plan);
        
        const key = plan.medicationName.toLowerCase();
        
        if (medicationMap[key]) {
          // Aggregate if same medication
          medicationMap[key].packs += packs;
          medicationMap[key].monthly += monthly;
          medicationMap[key].cost += cost;
        } else {
          medicationMap[key] = {
            medicationName: plan.medicationName,
            strength: medDetails?.strength || '',
            monthly,
            packs,
            cost,
            dosage: plan.dosage,
            frequency: plan.frequency,
          };
        }
      });

      // Convert map to array
      items.push(...Object.values(medicationMap));

      if (items.length > 0) {
        purchaseMap[member.id] = {
          member,
          items: items.sort((a, b) => a.medicationName.localeCompare(b.medicationName)),
        };
      }
    });

    return purchaseMap;
  };

  const purchaseList = getMonthlyPurchaseList();
  const totalCost = Object.values(purchaseList).reduce((sum, memberData) => {
    return sum + memberData.items.reduce((itemSum, item) => itemSum + item.cost, 0);
  }, 0);

  const allItems = Object.values(purchaseList).flatMap(m => m.items);
  const totalPacks = allItems.reduce((sum, item) => sum + item.packs, 0);

  // Generate text content for download
  const generateTextContent = () => {
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let text = `MONTHLY PURCHASE LIST\n`;
    text += `Generated on: ${date}\n`;
    text += `\n${'='.repeat(50)}\n\n`;
    text += `SUMMARY\n`;
    text += `Total Medicines: ${allItems.length}\n`;
    text += `Total Packs: ${totalPacks}\n`;
    text += `Estimated Cost: ${totalCost.toLocaleString()} BDT\n`;
    text += `\n${'='.repeat(50)}\n\n`;

    Object.values(purchaseList).forEach(({ member, items }) => {
      const memberTotal = items.reduce((sum, item) => sum + item.cost, 0);
      const memberPacks = items.reduce((sum, item) => sum + item.packs, 0);
      
      text += `${member.name.toUpperCase()}`;
      if (member.relation) text += ` (${member.relation})`;
      text += `\n${'-'.repeat(50)}\n`;
      text += `Medicines: ${items.length} | Packs: ${memberPacks} | Total Cost: ${memberTotal.toLocaleString()} BDT\n\n`;
      
      items.forEach((item, idx) => {
        text += `${idx + 1}. ${item.medicationName}`;
        if (item.strength) text += ` (${item.strength})`;
        text += `\n`;
        text += `   Schedule: ${item.dosage} tablet(s) × ${item.frequency}/day\n`;
        text += `   Monthly Qty: ${item.monthly} | Packs: ${item.packs} | Cost: ${item.cost.toLocaleString()} BDT\n\n`;
      });
      
      text += `\n`;
    });
    
    return text;
  };

  // Download as Text
  const downloadAsText = () => {
    const text = generateTextContent();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-purchase-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download as PDF
  const downloadAsPDF = async () => {
    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Title
      doc.setFontSize(18);
      doc.text('MONTHLY PURCHASE LIST', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${date}`, 14, 28);
      
      // Summary
      let yPos = 38;
      doc.setFontSize(12);
      doc.text('SUMMARY', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Medicines: ${allItems.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Packs: ${totalPacks}`, 14, yPos);
      yPos += 6;
      doc.text(`Estimated Cost: ${totalCost.toLocaleString()} BDT`, 14, yPos);
      yPos += 10;
      
      // Family members
      Object.values(purchaseList).forEach(({ member, items }) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const memberTotal = items.reduce((sum, item) => sum + item.cost, 0);
        const memberPacks = items.reduce((sum, item) => sum + item.packs, 0);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        let memberName = member.name.toUpperCase();
        if (member.relation) memberName += ` (${member.relation})`;
        doc.text(memberName, 14, yPos);
        yPos += 8;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(`Medicines: ${items.length} | Packs: ${memberPacks} | Total Cost: ${memberTotal.toLocaleString()} BDT`, 14, yPos);
        yPos += 8;
        
        items.forEach((item, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          let medName = `${idx + 1}. ${item.medicationName}`;
          if (item.strength) medName += ` (${item.strength})`;
          doc.text(medName, 16, yPos);
          yPos += 6;
          
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          doc.text(`Schedule: ${item.dosage} tablet(s) × ${item.frequency}/day`, 20, yPos);
          yPos += 5;
          doc.text(`Monthly Qty: ${item.monthly} | Packs: ${item.packs} | Cost: ${item.cost.toLocaleString()} BDT`, 20, yPos);
          yPos += 8;
        });
        
        yPos += 5;
      });
      
      doc.save(`monthly-purchase-list-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: try using html2pdf if jsPDF fails
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
        // Fallback for older browsers
        fallbackCopyToClipboard(text, setState);
      });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(text, setState);
    }
  };

  // Fallback copy method for older browsers
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
            <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">Monthly Purchase List</h2>
            <p className="text-slate-500 dark:text-[#94a3b8] mt-1">Medicines needed this month by family member</p>
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

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-l-4 border-l-amber-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
              <ShoppingBag className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Total Items</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{allItems.length} Medicines</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
              <ShoppingBag className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">Total Packs</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{totalPacks} Packs</p>
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

      {/* Family Members List */}
      {Object.keys(purchaseList).length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto text-slate-400 dark:text-[#94a3b8] mb-4" size={48} />
            <p className="text-slate-500 dark:text-[#94a3b8] text-lg">No monthly plans found</p>
            <p className="text-slate-400 dark:text-[#64748b] text-sm mt-2">
              Add medication plans to family members to see purchase lists
            </p>
          </div>
        </Card>
      ) : (
        <div ref={contentRef} className="space-y-6">
          {Object.values(purchaseList).map(({ member, items }) => {
            const memberTotal = items.reduce((sum, item) => sum + item.cost, 0);
            const memberPacks = items.reduce((sum, item) => sum + item.packs, 0);

            return (
              <Card key={member.id} className="border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                      {member.name}
                      {member.relation && (
                        <span className="text-sm font-normal text-slate-500 dark:text-[#94a3b8] ml-2">
                          ({member.relation})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
                      {items.length} {items.length === 1 ? 'medicine' : 'medicines'} • {memberPacks} packs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Total Cost</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-[#34D399]">
                      {memberTotal.toLocaleString()} BDT
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                      <tr>
                        <th className="px-4 py-3 text-left rounded-l-lg">Medicine</th>
                        <th className="px-4 py-3 text-left">Schedule</th>
                        <th className="px-4 py-3 text-center">Monthly Qty</th>
                        <th className="px-4 py-3 text-center">Packs</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors">
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchaseList;

