import { useEffect } from 'react';
import { processOfflineQueue } from '../../utils/offlineQueue';

const OfflineSyncManager = () => {
  useEffect(() => {
    // Try to process any queued mutations on mount
    processOfflineQueue();

    const handleOnline = () => {
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
};

export default OfflineSyncManager;


