import { useState, useMemo } from 'react';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Loader2, Sparkles, Activity, Shield, Pill, Calendar, DollarSign, Heart, Users } from 'lucide-react';
import { useAIAnalytics } from '../../hooks/useAnalytics';
import { 
  useFamilyMembers, 
  useAllPlans,
  useAppointments,
  useMedications,
  useReports
} from '../../hooks/useData';
import * as api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const AnalyticsTab = () => {
  const queryClient = useQueryClient();
  const { data: aiInsights, isLoading: loading, error: queryError, refetch } = useAIAnalytics();
  const [expandedCards, setExpandedCards] = useState({});
  
  const { data: family = [] } = useFamilyMembers();
  const { data: plansMap = {} } = useAllPlans();
  const { data: appointments = [] } = useAppointments();
  const { data: medications = [] } = useMedications();
  const { data: reports = [] } = useReports();
  
  // Fetch health data for all family members using useQueries
  const healthDataQueries = useQueries({
    queries: family.map(member => ({
      queryKey: ['healthData', member.id],
      queryFn: () => api.healthDataAPI.getByMember(member.id),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });
  
  // Combine all health data into a map
  const healthDataMap = useMemo(() => {
    const map = {};
    family.forEach((member, index) => {
      if (healthDataQueries[index]) {
        map[member.id] = healthDataQueries[index].data || [];
      }
    });
    return map;
  }, [family, healthDataQueries]);
  
  const error = queryError ? queryError.message : null;

  // Calculate monthly medication costs by member
  const monthlyCostsByMember = useMemo(() => {
    const costs = [];
    family.forEach(member => {
      const memberPlans = plansMap[member.id] || [];
      const totalCost = memberPlans.reduce((sum, plan) => {
        const daily = plan.dosage * plan.frequency;
        const monthly = daily * 30;
        const packs = Math.ceil(monthly / plan.packSize);
        return sum + (packs * plan.price);
      }, 0);
      
      if (totalCost > 0 || memberPlans.length > 0) {
        costs.push({
          name: member.name,
          cost: totalCost,
          plans: memberPlans.length
        });
      }
    });
    return costs.sort((a, b) => b.cost - a.cost);
  }, [family, plansMap]);

  // Health data trends (last 6 months)
  const healthDataTrends = useMemo(() => {
    const allHealthData = Object.values(healthDataMap).flat();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentData = allHealthData.filter(hd => {
      const dataDate = new Date(hd.date);
      return dataDate >= sixMonthsAgo;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by month
    const monthlyData = {};
    recentData.forEach(hd => {
      const date = new Date(hd.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey]++;
    });

    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        records: count
      }))
      .slice(-6); // Last 6 months
  }, [healthDataMap]);

  // Medication distribution by family member
  const medicationDistribution = useMemo(() => {
    return family.map(member => ({
      name: member.name,
      value: (plansMap[member.id] || []).length
    })).filter(item => item.value > 0);
  }, [family, plansMap]);

  // Upcoming appointments (next 30 days)
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && aptDate <= thirtyDaysLater;
    }).length;
  }, [appointments]);

  // Health data types distribution
  const healthDataTypes = useMemo(() => {
    const allHealthData = Object.values(healthDataMap).flat();
    const typeCounts = {};
    
    allHealthData.forEach(hd => {
      typeCounts[hd.type] = (typeCounts[hd.type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 types
  }, [healthDataMap]);

  const COLORS = ['#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FBBF24'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {/* Monthly Medication Costs by Member */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Monthly Costs</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">By Family Member</p>
            </div>
          </div>
          {monthlyCostsByMember.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCostsByMember}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      color: '#1e293b',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    itemStyle={{ color: '#1e293b' }}
                    labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                    formatter={(value) => [`৳${value.toFixed(0)}`, 'Cost']}
                  />
                  <Bar dataKey="cost" fill="#34D399" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 dark:text-[#64748b]">
              <p className="text-sm">No medication plans yet</p>
            </div>
          )}
        </Card>

        {/* Health Data Trends */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Activity className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Health Tracking</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Records Over Time</p>
            </div>
          </div>
          {healthDataTrends.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthDataTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      color: '#1e293b',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    itemStyle={{ color: '#1e293b' }}
                    labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                  />
                  <Line type="monotone" dataKey="records" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 dark:text-[#64748b]">
              <p className="text-sm">No health data tracked yet</p>
            </div>
          )}
        </Card>

        {/* Medication Distribution */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Pill className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Medications</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">By Family Member</p>
            </div>
          </div>
          {medicationDistribution.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationDistribution}
                    cx="50%"
                    cy="45%"
                    labelLine={true}
                    label={({ name, percent, value }) => {
                      // Truncate long names and show percentage
                      const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
                      return `${displayName}\n${(percent * 100).toFixed(0)}% (${value})`;
                    }}
                    outerRadius={65}
                    innerRadius={20}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {medicationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#1e293b',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    itemStyle={{ color: '#1e293b' }}
                    labelStyle={{ color: '#1e293b', fontWeight: '600' }}
                    formatter={(value, name) => [`${value} medications`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={60}
                    formatter={(value) => {
                      const item = medicationDistribution.find(d => d.name === value);
                      return item ? `${value} (${item.value})` : value;
                    }}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 dark:text-[#64748b]">
              <p className="text-sm">No medications assigned</p>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Users className="text-amber-600 dark:text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Family Overview</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Quick Statistics</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-500 dark:text-[#94a3b8]" />
                <span className="text-sm text-slate-600 dark:text-[#94a3b8]">Family Members</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{family.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-slate-500 dark:text-[#94a3b8]" />
                <span className="text-sm text-slate-600 dark:text-[#94a3b8]">Active Plans</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                {Object.values(plansMap).flat().length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-500 dark:text-[#94a3b8]" />
                <span className="text-sm text-slate-600 dark:text-[#94a3b8]">Upcoming Appointments</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{upcomingAppointments}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#111725] rounded-lg">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-500 dark:text-[#94a3b8]" />
                <span className="text-sm text-slate-600 dark:text-[#94a3b8]">Health Records</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                {Object.values(healthDataMap).flat().length}
              </span>
            </div>
          </div>
        </Card>

        {/* Health Data Types */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
              <Heart className="text-pink-600 dark:text-pink-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Vitals Tracked</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">By Type</p>
            </div>
          </div>
          {healthDataTypes.length > 0 ? (
            <div className="space-y-3">
              {healthDataTypes.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-[#94a3b8]">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 dark:bg-[#27335D] rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(item.value / Math.max(...healthDataTypes.map(h => h.value))) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC] w-8 text-right">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-[#64748b]">
              <p className="text-sm">No health data tracked yet</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default AnalyticsTab;

