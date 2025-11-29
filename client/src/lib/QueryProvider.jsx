import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { queryClient } from './queryClient';

// Persister for offline cache (localStorage)
const persister =
  typeof window !== 'undefined'
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: 'meditrack-react-query-cache',
      })
    : null;

const QueryProvider = ({ children }) => {
  if (!persister) {
    // SSR/Non-browser safety fallback
    return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: undefined }}>
        {children}
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export default QueryProvider;


