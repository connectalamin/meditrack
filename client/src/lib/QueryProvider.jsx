import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

// IMPORTANT: Using QueryClientProvider (NOT PersistQueryClientProvider)
// This avoids React hook errors and doesn't require @tanstack/react-query-persist-client
const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;


