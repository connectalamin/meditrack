import { AreaChart, Area, XAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Card from '../../components/ui/Card';

const AnalyticsTab = () => {
  // Mock Data for Analytics
  const adherenceData = [
    { name: 'Mon', completed: 4, skipped: 0 },
    { name: 'Tue', completed: 5, skipped: 0 },
    { name: 'Wed', completed: 3, skipped: 2 },
    { name: 'Thu', completed: 5, skipped: 0 },
    { name: 'Fri', completed: 5, skipped: 0 },
    { name: 'Sat', completed: 4, skipped: 1 },
    { name: 'Sun', completed: 5, skipped: 0 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Family Health Score</h3>
            <div className="text-2xl font-bold text-emerald-500">88/100</div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adherenceData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="completed" stroke="#34D399" fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-[#94a3b8] mt-4">Based on medication adherence and vitals stability.</p>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;

