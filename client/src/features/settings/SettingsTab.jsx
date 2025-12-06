import { useState, useEffect } from 'react';
import { Share2, Check, ClipboardList, Database, Trash2, Loader2, Users, Link2, X, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI, medicationsAPI } from '../../utils/api';
import { 
  useCreateMedication,
  useCreateFamilyMember,
  useCreatePlan,
  useCreateReport,
  useCreateHealthData,
  useCreateAppointment,
  useMedications
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { seedDemoData } from '../../utils/seedDemoData';

const SettingsTab = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Get mutation hooks for seedDemoData
  const createMedication = useCreateMedication();
  const createFamilyMember = useCreateFamilyMember();
  const createPlan = useCreatePlan();
  const createReport = useCreateReport();
  const createHealthData = useCreateHealthData();
  const createAppointment = useCreateAppointment();
  
  // Create appContext-like object for seedDemoData
  const appContext = {
    user,
    addMedication: (med) => createMedication.mutateAsync(med),
    addFamilyMember: (member) => createFamilyMember.mutateAsync(member),
    addPlan: (memberId, plan) => createPlan.mutateAsync({ familyMemberId: memberId, plan }),
    addReport: (report, file) => createReport.mutateAsync({ report, file }),
    addHealthData: (memberId, data) => createHealthData.mutateAsync({ familyMemberId: memberId, data }),
    addAppointment: (apt) => createAppointment.mutateAsync(apt),
  };
  const [copied, setCopied] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [referralId, setReferralId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState({ type: null, text: '' });
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loadingLinkedAccounts, setLoadingLinkedAccounts] = useState(true);
  const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, accountId: null, accountName: '' });
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(false);
  const [medicineLoadMessage, setMedicineLoadMessage] = useState({ type: null, text: '' });
  
  const { data: medications = [] } = useMedications();

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

  // Load linked accounts
  useEffect(() => {
    const loadLinkedAccounts = async () => {
      if (!user) return;
      try {
        setLoadingLinkedAccounts(true);
        const response = await authAPI.getLinkedAccounts();
        setLinkedAccounts(response.linkedAccounts || []);
      } catch (error) {
        console.error('Failed to load linked accounts:', error);
      } finally {
        setLoadingLinkedAccounts(false);
      }
    };
    loadLinkedAccounts();
  }, [user]);

  const handleJoinFamily = async () => {
    if (!referralId.trim()) {
      setJoinMessage({ type: 'error', text: 'Please enter a referral ID' });
      return;
    }

    setIsJoining(true);
    setJoinMessage({ type: null, text: '' });

    try {
      const response = await authAPI.joinFamily(referralId.trim());
      if (response.success) {
        const linkedUserName = response.linkedUser?.displayName || response.linkedUser?.email || 'the linked account';
        setJoinMessage({ 
          type: 'success', 
          text: `Successfully joined ${linkedUserName}'s family! All data is now synced.` 
        });
        setReferralId('');
        
        // Refresh linked accounts list
        try {
          const linkedResponse = await authAPI.getLinkedAccounts();
          setLinkedAccounts(linkedResponse.linkedAccounts || []);
        } catch (err) {
          console.error('Failed to refresh linked accounts:', err);
        }
        
        // Refresh user data to get linked account info
        try {
          const userResponse = await authAPI.getMe();
          if (userResponse.user) {
            // Update user in context if possible, or reload
            window.location.reload();
          }
        } catch (err) {
          // If getMe fails, just reload
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (error) {
      setJoinMessage({ 
        type: 'error', 
        text: error.message || 'Failed to join family. Please check the referral ID and try again.' 
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveClick = (account) => {
    setRemoveConfirm({
      isOpen: true,
      accountId: account.id,
      accountName: account.displayName || account.email
    });
  };

  const handleRemoveConfirm = async () => {
    if (!removeConfirm.accountId) return;

    try {
      setIsRemoving(true);
      await authAPI.removeLinkedAccount(removeConfirm.accountId);
      
      // Refresh linked accounts list
      const linkedResponse = await authAPI.getLinkedAccounts();
      setLinkedAccounts(linkedResponse.linkedAccounts || []);
      
      // Refresh user data
      const userResponse = await authAPI.getMe();
      if (userResponse.user) {
        // Reload to update user context
        window.location.reload();
      }
      
      setRemoveConfirm({ isOpen: false, accountId: null, accountName: '' });
    } catch (error) {
      console.error('Failed to remove linked account:', error);
      alert(`Failed to remove linked account: ${error.message || 'Please try again.'}`);
    } finally {
      setIsRemoving(false);
    }
  };

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
            <Input 
              placeholder="Enter Referral ID to Join" 
              className="mb-0" 
              value={referralId}
              onChange={(e) => {
                setReferralId(e.target.value);
                setJoinMessage({ type: null, text: '' });
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isJoining) {
                  handleJoinFamily();
                }
              }}
            />
            <Button onClick={handleJoinFamily} disabled={isJoining || !referralId.trim()}>
              {isJoining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Family'
              )}
            </Button>
          </div>
          {joinMessage.type && (
            <div className={`p-3 rounded-lg text-sm ${
              joinMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300'
            }`}>
              {joinMessage.text}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Note: Joining a family will sync your dashboard view with the shared family ID.</p>
          
          {/* Linked Accounts List */}
          {linkedAccounts.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <Users size={16} />
                Linked Accounts ({linkedAccounts.length})
              </h4>
              <div className="space-y-2">
                {linkedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Link2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC] truncate">
                          {account.displayName || account.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">
                          {account.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={account.type === 'linked_to' ? 'success' : 'info'}
                        className="text-xs"
                      >
                        {account.type === 'linked_to' ? 'You linked to' : 'Linked to you'}
                      </Badge>
                      <button
                        onClick={() => handleRemoveClick(account)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-[#94a3b8] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Remove linked account"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-2">
                All linked accounts share medications, appointments, reports, and family members.
              </p>
            </div>
          )}
          
          {!loadingLinkedAccounts && linkedAccounts.length === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] text-center">
              <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
                No linked accounts yet. Share your referral ID or join another account's family.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
            <Pill className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Medicine Database</h3>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Load comprehensive medicine database</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={async () => {
              if (!user) {
                setMedicineLoadMessage({ type: 'error', text: 'Please log in to load medicines.' });
                return;
              }
              if (user.medicinesLoaded) {
                setMedicineLoadMessage({ type: 'error', text: 'Medicines have already been loaded.' });
                return;
              }
              try {
                setIsLoadingMedicines(true);
                setMedicineLoadMessage({ type: null, text: '' });
                const response = await medicationsAPI.loadMedicines();
                setMedicineLoadMessage({ 
                  type: 'success', 
                  text: `Successfully loaded ${response.count || 'all'} medicines!` 
                });
                // Refresh medications list
                queryClient.invalidateQueries(['medications']);
                // Refresh user data to update medicinesLoaded flag
                const userResponse = await authAPI.getMe();
                if (userResponse.user) {
                  setUser(userResponse.user);
                }
              } catch (error) {
                console.error('Error loading medicines:', error);
                setMedicineLoadMessage({ 
                  type: 'error', 
                  text: error.message || 'Failed to load medicines. Please try again.' 
                });
              } finally {
                setIsLoadingMedicines(false);
              }
            }}
            disabled={isLoadingMedicines || !user || user.medicinesLoaded}
            className={`flex items-center justify-center gap-2 ${
              user?.medicinesLoaded ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoadingMedicines ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading Medicines...
              </>
            ) : (
              <>
                <Database size={16} />
                {user?.medicinesLoaded ? 'Medicines Already Loaded' : 'Load Medicines'}
              </>
            )}
          </Button>
          
          {medicineLoadMessage.type && (
            <div className={`p-3 rounded-lg text-sm ${
              medicineLoadMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300'
            }`}>
              {medicineLoadMessage.text}
            </div>
          )}
          
          {user?.medicinesLoaded && (
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              Medicines have been loaded. You currently have {medications.length} medicines in your database.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">Data Management</h3>
        <p className="text-sm text-slate-500 dark:text-[#94a3b8] mb-4">
          Clear all data for a fresh start. This action cannot be undone.
        </p>
        <div className="flex justify-start">
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
            await authAPI.clearData();
            // Clear all React Query cache
            queryClient.clear();
          } finally {
            setIsClearing(false);
            setConfirmClearOpen(false);
          }
        }}
        title="Clear All Data"
        message="This will permanently delete all appointments, medications, family members, reports, health data, plans, and devices for this account. Your login will remain. Are you sure?"
        confirmText="Yes, Clear Everything"
      />

      <ConfirmModal
        isOpen={removeConfirm.isOpen}
        onClose={() => !isRemoving && setRemoveConfirm({ isOpen: false, accountId: null, accountName: '' })}
        onConfirm={handleRemoveConfirm}
        title="Remove Linked Account"
        message={`Are you sure you want to remove the link with "${removeConfirm.accountName}"? This will stop sharing data between accounts.`}
        confirmText={isRemoving ? "Removing..." : "Yes, Remove"}
        cancelText="Cancel"
      />
    </div>
  );
};

export default SettingsTab;

