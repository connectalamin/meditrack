import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../utils/api';

// 24 hours in milliseconds
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const useAIAnalytics = () => {
  return useQuery({
    queryKey: ['aiAnalytics'],
    queryFn: async () => {
      const data = await analyticsAPI.getAIAnalytics();
      return data.aiInsights;
    },
    staleTime: TWENTY_FOUR_HOURS, // Data is fresh for 24 hours
    gcTime: TWENTY_FOUR_HOURS * 2, // Keep in cache for 48 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
};

