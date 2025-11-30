import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import * as api from '../utils/api';
import { enqueueMutation } from '../utils/offlineQueue';

// Default cache settings (5 minutes)
const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000; // Garbage collection time

// Appointments
export const useAppointments = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointmentsAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment) => api.appointmentsAPI.create(appointment),
    // Optimistic update - update cache immediately
    onMutate: async (newAppointment) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments']);
      
      // Optimistically add the new appointment
      queryClient.setQueryData(['appointments'], (old = []) => {
        const tempId = `temp-${Date.now()}`;
        return [...old, { ...newAppointment, id: tempId }];
      });
      
      return { previousAppointments };
    },
    onError: (err, newAppointment, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
    },
    onSuccess: (data) => {
      // Replace temp ID with real data from server
      queryClient.setQueryData(['appointments'], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => api.appointmentsAPI.update(id, updates),
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments']);
      
      queryClient.setQueryData(['appointments'], (old = []) =>
        old.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
      );
      
      return { previousAppointments };
    },
    onError: (err, variables, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['appointments'], (old = []) =>
        old.map(apt => apt.id === data.id ? data : apt)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.appointmentsAPI.delete(id),
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previousAppointments = queryClient.getQueryData(['appointments']);
      
      queryClient.setQueryData(['appointments'], (old = []) =>
        old.filter(apt => apt.id !== id)
      );
      
      return { previousAppointments };
    },
    onError: (err, id, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

// Family Members
export const useFamilyMembers = () => {
  return useQuery({
    queryKey: ['family'],
    queryFn: () => api.familyAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (member) => api.familyAPI.create(member),
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: ['family'] });
      const previousFamily = queryClient.getQueryData(['family']);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['family'], (old = []) => [...old, { ...newMember, id: tempId }]);
      
      // Initialize empty health data and plans for new member
      queryClient.setQueryData(['healthData', tempId], []);
      queryClient.setQueryData(['plans', tempId], []);
      
      return { previousFamily };
    },
    onError: (err, newMember, context) => {
      if (context?.previousFamily) {
        queryClient.setQueryData(['family'], context.previousFamily);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['family'], (old = []) => {
        const withoutTemp = old.filter(m => !m.id?.startsWith('temp-'));
        // Find temp ID before filtering
        const tempMember = old.find(m => m.id?.startsWith('temp-'));
        const tempId = tempMember?.id;
        
        // Update health data and plans keys with real ID
        if (tempId) {
          const healthData = queryClient.getQueryData(['healthData', tempId]) || [];
          const plans = queryClient.getQueryData(['plans', tempId]) || [];
          queryClient.setQueryData(['healthData', data.id], healthData);
          queryClient.setQueryData(['plans', data.id], plans);
          queryClient.removeQueries({ queryKey: ['healthData', tempId] });
          queryClient.removeQueries({ queryKey: ['plans', tempId] });
        }
        
        return [...withoutTemp, data];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['healthData'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => api.familyAPI.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['family'] });
      const previousFamily = queryClient.getQueryData(['family']);
      
      queryClient.setQueryData(['family'], (old = []) =>
        old.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      
      return { previousFamily };
    },
    onError: (err, variables, context) => {
      if (context?.previousFamily) {
        queryClient.setQueryData(['family'], context.previousFamily);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['family'], (old = []) =>
        old.map(m => m.id === data.id ? data : m)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
};

export const useDeleteFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.familyAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['family'] });
      const previousFamily = queryClient.getQueryData(['family']);
      
      queryClient.setQueryData(['family'], (old = []) =>
        old.filter(m => m.id !== id)
      );
      
      // Remove related health data and plans
      queryClient.removeQueries({ queryKey: ['healthData', id] });
      queryClient.removeQueries({ queryKey: ['plans', id] });
      
      return { previousFamily };
    },
    onError: (err, id, context) => {
      if (context?.previousFamily) {
        queryClient.setQueryData(['family'], context.previousFamily);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['healthData'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

// Medications
export const useMedications = () => {
  return useQuery({
    queryKey: ['medications'],
    queryFn: () => api.medicationsAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreateMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (medication) => api.medicationsAPI.create(medication),
    onMutate: async (newMedication) => {
      await queryClient.cancelQueries({ queryKey: ['medications'] });
      const previousMedications = queryClient.getQueryData(['medications']);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['medications'], (old = []) => [...old, { ...newMedication, id: tempId }]);
      
      return { previousMedications };
    },
    onError: (err, newMedication, context) => {
      if (context?.previousMedications) {
        queryClient.setQueryData(['medications'], context.previousMedications);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['medications'], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
};

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => api.medicationsAPI.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['medications'] });
      const previousMedications = queryClient.getQueryData(['medications']);
      
      queryClient.setQueryData(['medications'], (old = []) =>
        old.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      
      return { previousMedications };
    },
    onError: (err, variables, context) => {
      if (context?.previousMedications) {
        queryClient.setQueryData(['medications'], context.previousMedications);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['medications'], (old = []) =>
        old.map(m => m.id === data.id ? data : m)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
};

export const useDeleteMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.medicationsAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['medications'] });
      const previousMedications = queryClient.getQueryData(['medications']);
      
      queryClient.setQueryData(['medications'], (old = []) =>
        old.filter(m => m.id !== id)
      );
      
      return { previousMedications };
    },
    onError: (err, id, context) => {
      // Only restore if we have previous data and it's an array
      if (context?.previousMedications && Array.isArray(context.previousMedications)) {
        queryClient.setQueryData(['medications'], context.previousMedications);
      } else {
        // If no previous data, just invalidate to refetch
        queryClient.invalidateQueries({ queryKey: ['medications'] });
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
};

// Reports
export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => api.reportsAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ report, file }) => api.reportsAPI.create(report, file),
    onMutate: async ({ report }) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previousReports = queryClient.getQueryData(['reports']);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['reports'], (old = []) => [...old, { ...report, id: tempId }]);
      
      return { previousReports };
    },
    onError: (err, variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(['reports'], context.previousReports);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['reports'], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, file }) => api.reportsAPI.update(id, updates, file),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previousReports = queryClient.getQueryData(['reports']);
      
      queryClient.setQueryData(['reports'], (old = []) =>
        old.map(r => r.id === id ? { ...r, ...updates } : r)
      );
      
      return { previousReports };
    },
    onError: (err, variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(['reports'], context.previousReports);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['reports'], (old = []) =>
        old.map(r => r.id === data.id ? data : r)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.reportsAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['reports'] });
      const previousReports = queryClient.getQueryData(['reports']);
      
      queryClient.setQueryData(['reports'], (old = []) =>
        old.filter(r => r.id !== id)
      );
      
      return { previousReports };
    },
    onError: (err, id, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(['reports'], context.previousReports);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// Purchase List
export const usePurchaseListItems = () => {
  return useQuery({
    queryKey: ['purchaseList'],
    queryFn: () => api.purchaseListAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreatePurchaseListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item) => api.purchaseListAPI.create(item),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['purchaseList'] });
      const previousItems = queryClient.getQueryData(['purchaseList']);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['purchaseList'], (old = []) => [...old, { ...newItem, id: tempId }]);
      
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['purchaseList'], context.previousItems);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['purchaseList'], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseList'] });
    },
  });
};

export const useUpdatePurchaseListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => api.purchaseListAPI.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['purchaseList'] });
      const previousItems = queryClient.getQueryData(['purchaseList']);
      
      queryClient.setQueryData(['purchaseList'], (old = []) =>
        old.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      
      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['purchaseList'], context.previousItems);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['purchaseList'], (old = []) =>
        old.map(item => item.id === data.id ? data : item)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseList'] });
    },
  });
};

export const useDeletePurchaseListItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.purchaseListAPI.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['purchaseList'] });
      const previousItems = queryClient.getQueryData(['purchaseList']);
      
      queryClient.setQueryData(['purchaseList'], (old = []) =>
        old.filter(item => item.id !== id)
      );
      
      return { previousItems };
    },
    onError: (err, id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['purchaseList'], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseList'] });
    },
  });
};

// Purchase List Logs
export const usePurchaseListLogs = () => {
  return useQuery({
    queryKey: ['purchaseListLogs'],
    queryFn: () => api.purchaseListLogsAPI.getAll(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreatePurchaseListLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Queue log for background sync when back online
        enqueueMutation('purchaseListLog:create', log);
        return null;
      }
      return api.purchaseListLogsAPI.create(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseListLogs'] });
    },
  });
};

// Health Data
export const useHealthData = (familyMemberId) => {
  return useQuery({
    queryKey: ['healthData', familyMemberId],
    queryFn: () => api.healthDataAPI.getByMember(familyMemberId),
    enabled: !!familyMemberId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

export const useCreateHealthData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, data }) => 
      api.healthDataAPI.create(familyMemberId, data),
    onMutate: async ({ familyMemberId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['healthData', familyMemberId] });
      const previousData = queryClient.getQueryData(['healthData', familyMemberId]);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['healthData', familyMemberId], (old = []) => 
        [...old, { ...data, id: tempId }]
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['healthData', variables.familyMemberId], context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['healthData', variables.familyMemberId], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['healthData', variables.familyMemberId] });
    },
  });
};

export const useUpdateHealthData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, dataId, updates }) => 
      api.healthDataAPI.update(familyMemberId, dataId, updates),
    onMutate: async ({ familyMemberId, dataId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['healthData', familyMemberId] });
      const previousData = queryClient.getQueryData(['healthData', familyMemberId]);
      
      queryClient.setQueryData(['healthData', familyMemberId], (old = []) =>
        old.map(d => d.id === dataId ? { ...d, ...updates } : d)
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['healthData', variables.familyMemberId], context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['healthData', variables.familyMemberId], (old = []) =>
        old.map(d => d.id === data.id ? data : d)
      );
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['healthData', variables.familyMemberId] });
    },
  });
};

export const useDeleteHealthData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, dataId }) => 
      api.healthDataAPI.delete(familyMemberId, dataId),
    onMutate: async ({ familyMemberId, dataId }) => {
      await queryClient.cancelQueries({ queryKey: ['healthData', familyMemberId] });
      const previousData = queryClient.getQueryData(['healthData', familyMemberId]);
      
      queryClient.setQueryData(['healthData', familyMemberId], (old = []) =>
        old.filter(d => d.id !== dataId)
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['healthData', variables.familyMemberId], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['healthData', variables.familyMemberId] });
    },
  });
};

// Plans
export const usePlans = (familyMemberId) => {
  return useQuery({
    queryKey: ['plans', familyMemberId],
    queryFn: () => api.plansAPI.getByMember(familyMemberId),
    enabled: !!familyMemberId,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
};

// Helper hook to get all plans for all family members
export const useAllPlans = () => {
  const { data: family = [] } = useFamilyMembers();
  
  const planQueries = useQueries({
    queries: family.map(member => ({
      queryKey: ['plans', member.id],
      queryFn: () => api.plansAPI.getByMember(member.id),
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
    })),
  });
  
  // Convert to map format for easy access
  const plansMap = {};
  planQueries.forEach((query, index) => {
    if (family[index]) {
      plansMap[family[index].id] = query.data || [];
    }
  });
  
  const isLoading = planQueries.some(query => query.isLoading);
  
  return { data: plansMap, isLoading };
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, plan }) => 
      api.plansAPI.create(familyMemberId, plan),
    onMutate: async ({ familyMemberId, plan }) => {
      await queryClient.cancelQueries({ queryKey: ['plans', familyMemberId] });
      const previousPlans = queryClient.getQueryData(['plans', familyMemberId]);
      
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(['plans', familyMemberId], (old = []) => 
        [...old, { ...plan, id: tempId }]
      );
      
      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(['plans', variables.familyMemberId], context.previousPlans);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['plans', variables.familyMemberId], (old = []) => {
        const withoutTemp = old.filter(item => !item.id?.startsWith('temp-'));
        return [...withoutTemp, data];
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans', variables.familyMemberId] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, planId, updates }) => 
      api.plansAPI.update(familyMemberId, planId, updates),
    onMutate: async ({ familyMemberId, planId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['plans', familyMemberId] });
      const previousPlans = queryClient.getQueryData(['plans', familyMemberId]);
      
      queryClient.setQueryData(['plans', familyMemberId], (old = []) =>
        old.map(p => p.id === planId ? { ...p, ...updates } : p)
      );
      
      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(['plans', variables.familyMemberId], context.previousPlans);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['plans', variables.familyMemberId], (old = []) =>
        old.map(p => p.id === data.id ? data : p)
      );
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans', variables.familyMemberId] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyMemberId, planId }) => 
      api.plansAPI.delete(familyMemberId, planId),
    onMutate: async ({ familyMemberId, planId }) => {
      await queryClient.cancelQueries({ queryKey: ['plans', familyMemberId] });
      const previousPlans = queryClient.getQueryData(['plans', familyMemberId]);
      
      queryClient.setQueryData(['plans', familyMemberId], (old = []) =>
        old.filter(p => p.id !== planId)
      );
      
      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(['plans', variables.familyMemberId], context.previousPlans);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans', variables.familyMemberId] });
    },
  });
};

