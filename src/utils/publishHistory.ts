// Publish history tracking utility

export interface PublishRecord {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  message: string;
  dataStats?: {
    productCount: number;
    categoryCount: number;
    totalSize: number;
  };
  uploadTime?: number;
  verifyTime?: number;
  errorMessage?: string;
}

const STORAGE_KEY = 'publish_history';
const MAX_RECORDS = 50; // Keep last 50 publish attempts

export function addPublishRecord(record: Omit<PublishRecord, 'id'>): PublishRecord {
  try {
    const history = getPublishHistory();
    
    const newRecord: PublishRecord = {
      id: Date.now().toString(),
      ...record,
    };
    
    // Add to beginning (newest first)
    history.unshift(newRecord);
    
    // Keep only last MAX_RECORDS
    const trimmed = history.slice(0, MAX_RECORDS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    console.log('[PUBLISH-HISTORY] Added record:', newRecord);
    return newRecord;
  } catch (error) {
    console.error('[PUBLISH-HISTORY] Error adding record:', error);
    throw error;
  }
}

export function getPublishHistory(): PublishRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('[PUBLISH-HISTORY] Error reading history:', error);
    return [];
  }
}

export function getLastPublish(): PublishRecord | null {
  const history = getPublishHistory();
  return history.length > 0 ? history[0] : null;
}

export function getSuccessfulPublishes(): PublishRecord[] {
  return getPublishHistory().filter(r => r.status === 'success');
}

export function getFailedPublishes(): PublishRecord[] {
  return getPublishHistory().filter(r => r.status === 'failed');
}

export function clearPublishHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[PUBLISH-HISTORY] Cleared history');
  } catch (error) {
    console.error('[PUBLISH-HISTORY] Error clearing history:', error);
  }
}

export function getPublishStats() {
  const history = getPublishHistory();
  const successful = getSuccessfulPublishes();
  
  return {
    totalAttempts: history.length,
    successfulPublishes: successful.length,
    failedPublishes: history.length - successful.length,
    lastPublishTime: successful.length > 0 ? new Date(successful[0].timestamp) : null,
    successRate: history.length > 0 ? (successful.length / history.length * 100).toFixed(1) : 0,
  };
}

export function formatPublishRecord(record: PublishRecord): string {
  const time = new Date(record.timestamp).toLocaleString();
  const statusEmoji = record.status === 'success' ? '✓' : '✗';
  
  let info = `${statusEmoji} ${time} - ${record.message}`;
  
  if (record.dataStats) {
    info += ` (${record.dataStats.productCount} products, ${record.dataStats.categoryCount} categories)`;
  }
  
  if (record.uploadTime) {
    info += ` [${record.uploadTime}ms]`;
  }
  
  if (record.errorMessage) {
    info += ` - Error: ${record.errorMessage}`;
  }
  
  return info;
}
