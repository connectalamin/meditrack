import { useState } from 'react';
import { Database, Users, FileText, ShoppingBag, Calculator, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from './StatCard';
import PurchaseList from './PurchaseList';

const OverviewTab = () => {
  const [showPurchaseList, setShowPurchaseList] = useState(false);
  const appContext = useApp();
  const { medications, family, reports, plans } = appContext;

  const stats = {
    meds: medications.length,
    family: family.length,
    reports: reports.length,
  };

  // Calculate monthly medicine needs for a plan
  const calculateCost = (plan) => {
    const daily = plan.dosage * plan.frequency;
    const monthly = daily * 30;
    const packs = Math.ceil(monthly / plan.packSize);
    const cost = packs * plan.price;
    return { monthly, packs, cost };
  };

  // Get all monthly purchase items
  const getMonthlyPurchaseItems = () => {
    const items = [];
    
    family.forEach(member => {
      const memberPlans = plans[member.id] || [];
      memberPlans.forEach(plan => {
        const { monthly, packs, cost } = calculateCost(plan);
        items.push({
          medicationName: plan.medicationName,
          packs,
          cost,
          memberName: member.name,
          memberId: member.id,
        });
      });
    });

    // Group by medication name and aggregate
    const grouped = {};
    items.forEach(item => {
      const key = item.medicationName.toLowerCase();
      if (grouped[key]) {
        grouped[key].packs += item.packs;
        grouped[key].cost += item.cost;
        grouped[key].members.push(item.memberName);
      } else {
        grouped[key] = {
          medicationName: item.medicationName,
          packs: item.packs,
          cost: item.cost,
          members: [item.memberName],
        };
      }
    });

    return Object.values(grouped)
      .sort((a, b) => b.packs - a.packs) // Sort by packs needed (descending)
      .slice(0, 5); // Show top 5
  };

  const purchaseItems = getMonthlyPurchaseItems();
  const totalMonthlyCost = Object.values(plans).flat().reduce((sum, plan) => {
    const { cost } = calculateCost(plan);
    return sum + cost;
  }, 0);

  // Calculate cost per family member
  const getMemberCosts = () => {
    const memberCosts = [];
    family.forEach(member => {
      const memberPlans = plans[member.id] || [];
      const total = memberPlans.reduce((sum, plan) => {
        const { cost } = calculateCost(plan);
        return sum + cost;
      }, 0);
      if (total > 0) {
        memberCosts.push({
          name: member.name,
          relation: member.relation,
          cost: total,
        });
      }
    });
    return memberCosts.sort((a, b) => b.cost - a.cost);
  };

  const memberCosts = getMemberCosts();
  const maxCost = memberCosts.length > 0 ? Math.max(...memberCosts.map(m => m.cost)) : 1;

  if (showPurchaseList) {
    return <PurchaseList onBack={() => setShowPurchaseList(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">Family Dashboard</h2>
          <p className="text-slate-500 dark:text-[#94a3b8] mt-1">Shared Overview & Monthly Plan</p>
        </div>
        <div className="bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] px-4 py-2 rounded-lg text-sm text-emerald-600 dark:text-[#34D399] font-mono shadow-sm dark:shadow-none">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Database Medicines" value={stats.meds} icon={Database} color="emerald" />
        <StatCard title="Family Members" value={stats.family} icon={Users} color="blue" />
        <StatCard title="Total Reports" value={stats.reports} icon={FileText} color="pink" />
      </div>

      {/* New Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Buy This Month</h3>
            <ShoppingBag className="text-amber-500" />
          </div>
          {purchaseItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-[#94a3b8] text-sm">No monthly medicines to purchase</p>
              <p className="text-slate-400 dark:text-[#64748b] text-xs mt-2">
                Add medication plans to see purchase list
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-[#F8FAFC] truncate">
                        {item.medicationName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">
                        {item.packs} {item.packs === 1 ? 'pack' : 'packs'} required
                        {item.members.length <= 2 
                          ? ` for ${item.members.join(' & ')}`
                          : ` for ${item.members.length} members`
                        }
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Badge variant="warning">{item.packs} packs</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-xs flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                onClick={() => setShowPurchaseList(true)}
              >
                View Full Purchase List
                <ArrowRight size={14} />
              </Button>
            </>
          )}
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Est. Monthly Cost</h3>
            <Calculator className="text-emerald-500" />
          </div>
          <div className="flex items-end gap-2 mb-6">
            <span className="text-4xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              {totalMonthlyCost.toLocaleString()}
            </span>
            <span className="text-lg text-slate-500 dark:text-[#94a3b8] mb-1">BDT</span>
          </div>
          {memberCosts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-400 dark:text-[#64748b] text-xs">No monthly plans yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memberCosts.map((member, idx) => {
                const percentage = (member.cost / maxCost) * 100;
                const colorClasses = [
                  'bg-emerald-500',
                  'bg-blue-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-orange-500',
                ];
                const colorClass = colorClasses[idx % colorClasses.length];
                return (
                  <div key={member.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-[#94a3b8]">
                        {member.name}
                        {member.relation && ` (${member.relation})`}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                        {member.cost.toLocaleString()} BDT
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#27335D] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${colorClass} h-full transition-all`} 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;

