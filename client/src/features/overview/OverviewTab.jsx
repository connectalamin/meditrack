import { useState, useMemo } from 'react';
import { Database, Users, FileText, ShoppingBag, Calculator, ArrowRight, Calendar, Activity, Heart } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { 
  useMedications, 
  useFamilyMembers, 
  useReports,
  useAllPlans 
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatCard from './StatCard';
import * as api from '../../utils/api';
import PurchaseList from './PurchaseList';

const OverviewTab = () => {
  const [showPurchaseList, setShowPurchaseList] = useState(false);
  const { data: medications = [] } = useMedications();
  const { data: family = [] } = useFamilyMembers();
  const { data: reports = [] } = useReports();
  const { data: plans = {} } = useAllPlans();

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

  // Health analytics (for Health Tracking + Vitals Tracked)
  const healthDataQueries = useQueries({
    queries: family.map(member => ({
      queryKey: ['healthData', member.id],
      queryFn: () => api.healthDataAPI.getByMember(member.id),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  const healthDataMap = useMemo(() => {
    const map = {};
    family.forEach((member, index) => {
      if (healthDataQueries[index]) {
        map[member.id] = healthDataQueries[index].data || [];
      }
    });
    return map;
  }, [family, healthDataQueries]);

  const healthDataTrends = useMemo(() => {
    const allHealthData = Object.values(healthDataMap).flat();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentData = allHealthData
      .filter(hd => {
        const dataDate = new Date(hd.date);
        return dataDate >= sixMonthsAgo;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const monthlyData = {};
    recentData.forEach(hd => {
      const date = new Date(hd.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey]++;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      records: count,
    }));
  }, [healthDataMap]);

  const healthDataTypes = useMemo(() => {
    const allHealthData = Object.values(healthDataMap).flat();
    const typeCounts = {};

    allHealthData.forEach(hd => {
      typeCounts[hd.type] = (typeCounts[hd.type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [healthDataMap]);


  if (showPurchaseList) {
    return <PurchaseList onBack={() => setShowPurchaseList(false)} />;
  }

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-[#34D399] mb-1">
            Overview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            Family Dashboard
          </h2>
          <p className="text-slate-500 dark:text-[#94a3b8] mt-2 text-sm md:text-base">
            Shared overview of medications, family members, and monthly plans.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-[#022c22] px-4 py-1 border border-emerald-100 dark:border-[#16a34a]/40">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-[#6ee7b7] uppercase tracking-[0.16em]">
              In Sync
            </span>
          </div>
          <div className="bg-white dark:bg-[#1A202C] border border-slate-200/80 dark:border-[#2D3748]/60 px-4 py-2 rounded-xl text-xs md:text-sm text-slate-600 dark:text-[#e2e8f0] font-mono shadow-sm">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Database Medicines" value={stats.meds} icon={Database} color="emerald" />
        <StatCard title="Family Members" value={stats.family} icon={Users} color="blue" />
        <StatCard title="Total Reports" value={stats.reports} icon={FileText} color="pink" />
      </div>

      {/* Summary row: 3 cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Monthly Costs by Member (summary) */}
        <Card className="bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Monthly Costs</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">By family member</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-[#022c22] text-emerald-700 dark:text-[#6ee7b7] border border-emerald-100 dark:border-[#16a34a]/40">
              <Calculator className="h-3.5 w-3.5" /> Summary
            </span>
          </div>
          {memberCosts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              No monthly plans yet. Add medicines to a member to see costs here.
            </p>
          ) : (
            <div className="space-y-2">
              {memberCosts.slice(0, 3).map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-[#e2e8f0]">
                    {member.name}
                    {member.relation && ` (${member.relation})`}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {member.cost.toLocaleString()} BDT
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Family Overview */}
        <Card className="bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Family Overview</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Quick statistics</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <span className="text-xs text-slate-600 dark:text-[#94a3b8]">Family members</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">{family.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <span className="text-xs text-slate-600 dark:text-[#94a3b8]">Active plans</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {Object.values(plans).flat().length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <span className="text-xs text-slate-600 dark:text-[#94a3b8]">Total medicines</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {medications.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Total Monthly Cost (all meds) */}
        <Card className="bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Total Monthly Cost</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">All medications</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-500">
                {totalMonthlyCost.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#94a3b8]">BDT / month</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
              Across {memberCosts.length} family member{memberCosts.length === 1 ? '' : 's'} with plans.
            </p>
          </div>
        </Card>
      </div>
      
      {/* Health analytics row: Health Tracking + Vitals Tracked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Activity className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Health Tracking</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Records over the last months</p>
            </div>
          </div>
          {healthDataTrends.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthDataTrends.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 11,
                      color: '#1e293b',
                    }}
                    formatter={(value) => [`${value} record${value === 1 ? '' : 's'}`, 'Entries']}
                  />
                  <Line
                    type="monotone"
                    dataKey="records"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#60A5FA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-slate-400 dark:text-[#64748b] text-sm">
              No health data tracked yet.
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
              <Heart className="text-pink-600 dark:text-pink-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Vitals Tracked</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">By type</p>
            </div>
          </div>
          {healthDataTypes.length > 0 ? (
            <div className="space-y-3">
              {healthDataTypes.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-[#94a3b8]">{item.name}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-slate-400 dark:text-[#64748b] text-sm">
              No vitals recorded yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;

