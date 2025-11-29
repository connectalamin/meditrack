import * as api from './api';
import { saveToStorage, getFromStorage } from './storage';
import { queryClient } from '../lib/queryClient';

const QUEUE_KEY = 'meditrack_offline_queue';

const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

const readQueue = () => getFromStorage(QUEUE_KEY, []);

const writeQueue = (queue) => saveToStorage(QUEUE_KEY, queue);

export const enqueueMutation = (type, payload) => {
  const queue = readQueue();
  queue.push({
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload,
  });
  writeQueue(queue);
};

export const processOfflineQueue = async () => {
  if (!isOnline()) return;

  const queue = readQueue();
  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    try {
      switch (item.type) {
        case 'purchaseListLog:create': {
          await api.purchaseListLogsAPI.create(item.payload);
          await queryClient.invalidateQueries({ queryKey: ['purchaseListLogs'] });
          break;
        }
        default: {
          // Unknown type, keep it for later / possible future handling
          remaining.push(item);
        }
      }
    } catch (error) {
      // If a mutation fails (e.g., still offline or server error), keep it in the queue
      remaining.push(item);
    }
  }

  writeQueue(remaining);
};


