import { QueryClient } from '@tanstack/react-query';

// Create a query client with default options (no JSX here to keep this file pure JS)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache time: 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time - was cacheTime in v4)
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

