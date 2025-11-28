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

  const handleRefresh = () => {
    // Force refetch and clear cache to get fresh data
    queryClient.invalidateQueries({ queryKey: ['aiAnalytics'] });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Analytics</h2>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
          {loading ? 'Analyzing...' : 'Refresh AI Insights'}
        </Button>
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

        {/* Total Monthly Cost */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Total Monthly Cost</h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">All Medications</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-[200px]">
            <div className="text-4xl font-bold text-emerald-500 mb-2">
              ৳{monthlyCostsByMember.reduce((sum, m) => sum + m.cost, 0).toFixed(0)}
            </div>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mb-4">
              Across {monthlyCostsByMember.length} {monthlyCostsByMember.length === 1 ? 'member' : 'members'}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="p-2 bg-slate-50 dark:bg-[#111725] rounded-lg text-center">
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Medications</p>
                <p className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{medications.length}</p>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-[#111725] rounded-lg text-center">
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Documents</p>
                <p className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{reports.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Card - Full Width */}
      <Card className="w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">AI Health Insights</h3>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Powered by Gemini AI</p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                <Sparkles className="absolute -top-1 -right-1 text-pink-500 animate-pulse" size={16} />
              </div>
              <p className="text-slate-500 dark:text-[#94a3b8] font-medium">Analyzing your health data...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {aiInsights && !loading && (
            <div className="space-y-6">
              {/* Assessment - Visual Card */}
              {aiInsights.assessment && (
                <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl border-2 border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-400 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-500 dark:bg-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Activity className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        Health Assessment
                        <Shield className="text-blue-600 dark:text-blue-400" size={18} />
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium">{aiInsights.assessment}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recommendations - Card Grid */}
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">Recommendations</h4>
                      <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-full">
                        {aiInsights.recommendations.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.recommendations.slice(0, expandedCards.recommendations ? aiInsights.recommendations.length : 3).map((rec, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/20 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-400 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed flex-1">{rec.trim()}</p>
                          </div>
                        </div>
                      ))}
                      {aiInsights.recommendations.length > 3 && (
                        <button
                          onClick={() => setExpandedCards(prev => ({ ...prev, recommendations: !prev.recommendations }))}
                          className="w-full py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          {expandedCards.recommendations ? 'Show Less' : `Show All ${aiInsights.recommendations.length} Recommendations`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Concerns - Card Grid */}
                {aiInsights.concerns && aiInsights.concerns.length > 0 && (
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">Concerns</h4>
                      <span className="ml-auto text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-full">
                        {aiInsights.concerns.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.concerns.slice(0, expandedCards.concerns ? aiInsights.concerns.length : 3).map((concern, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/20 rounded-lg hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" size={18} />
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed flex-1">{concern.trim()}</p>
                          </div>
                        </div>
                      ))}
                      {aiInsights.concerns.length > 3 && (
                        <button
                          onClick={() => setExpandedCards(prev => ({ ...prev, concerns: !prev.concerns }))}
                          className="w-full py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors"
                        >
                          {expandedCards.concerns ? 'Show Less' : `Show All ${aiInsights.concerns.length} Concerns`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Trends - Card Grid */}
                {aiInsights.trends && aiInsights.trends.length > 0 && (
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                      </div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">Positive Trends</h4>
                      <span className="ml-auto text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-full">
                        {aiInsights.trends.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.trends.slice(0, expandedCards.trends ? aiInsights.trends.length : 3).map((trend, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/20 rounded-lg hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <TrendingUp className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" size={18} />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed flex-1">{trend.trim()}</p>
                          </div>
                        </div>
                      ))}
                      {aiInsights.trends.length > 3 && (
                        <button
                          onClick={() => setExpandedCards(prev => ({ ...prev, trends: !prev.trends }))}
                          className="w-full py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          {expandedCards.trends ? 'Show Less' : `Show All ${aiInsights.trends.length} Trends`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
    </div>
  );
};

export default AnalyticsTab;

