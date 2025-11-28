import { useState } from 'react';
import { Share2, Check, ClipboardList, Database, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { seedDemoData } from '../../utils/seedDemoData';

const SettingsTab = () => {
  const appContext = useApp();
  const { user, clearAllData } = appContext;
  const [copied, setCopied] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userId = user?.id || 'N/A';
  const displayId = userId.length > 12 
    ? `${userId.slice(0, 8).toUpperCase()}-${userId.slice(8, 12)}`
    : userId.toUpperCase();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Settings</h2>
      
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-emerald-100 dark:bg-[#34D399]/10 rounded-full flex items-center justify-center">
            <Share2 className="text-emerald-600 dark:text-[#34D399]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Share Family Dashboard</h3>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Allow family members to access this dashboard.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#111725] p-4 rounded-lg border border-slate-200 dark:border-[#27335D] flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Your Referral ID</p>
            <p className="font-mono text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{displayId}</p>
          </div>
          <Button variant="outline" onClick={() => copyToClipboard(userId)}>
            {copied ? <Check size={14} /> : <ClipboardList size={14} />}
            {copied ? 'Copied' : 'Copy ID'}
          </Button>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#27335D]">
          <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC]">Link Another Account</h4>
          <div className="flex gap-2">
            <Input placeholder="Enter Referral ID to Join" className="mb-0" />
            <Button>Join Family</Button>
          </div>
          <p className="text-xs text-slate-500">Note: Joining a family will sync your dashboard view with the shared family ID.</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">Demo & Data Tools</h3>
        <p className="text-sm text-slate-500 dark:text-[#94a3b8] mb-4">
          Quickly populate your dashboard with realistic sample data or clear everything for a fresh start.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setIsSeeding(true);
                await seedDemoData(appContext);
              } finally {
                setIsSeeding(false);
              }
            }}
            disabled={isSeeding || isClearing}
            className="border-dashed flex items-center justify-center gap-2"
          >
            <Database size={16} />
            {isSeeding ? 'Seeding Demo Data…' : 'Load Demo Data'}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setConfirmClearOpen(true)}
            disabled={isClearing || isSeeding}
            className="flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            {isClearing ? 'Clearing Data…' : 'Clear All Data'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-[#94a3b8]">
          Clearing data will remove family members, medications, reports, health data, plans, devices, and appointments for this account.
          Your user login will remain intact.
        </p>
      </Card>

      <ConfirmModal
        isOpen={confirmClearOpen}
        onClose={() => !isClearing && setConfirmClearOpen(false)}
        onConfirm={async () => {
          try {
            setIsClearing(true);
            await clearAllData();
          } finally {
            setIsClearing(false);
            setConfirmClearOpen(false);
          }
        }}
        title="Clear All Data"
        message="This will permanently delete all appointments, medications, family members, reports, health data, plans, and devices for this account. Your login will remain. Are you sure?"
        confirmText="Yes, Clear Everything"
      />
    </div>
  );
};

export default SettingsTab;

