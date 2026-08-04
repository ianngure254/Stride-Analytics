import { useEffect, useState } from 'react';
import { syncService } from '../lib/sync';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update queue count every 5 seconds
    const interval = setInterval(async () => {
      try {
        const count = await syncService.getQueueCount();
        const syncTime = await syncService.getLastSyncTime();
        setQueueCount(count);
        setLastSync(syncTime);
        setSyncError(false);
      } catch (error) {
        console.error('Failed to get sync status:', error);
        setSyncError(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {syncError && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Sync error</span>
        </div>
      )}

      {queueCount > 0 && !syncError && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{queueCount} pending sync</span>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Last sync: {formatLastSync(lastSync)}
      </div>

      {isOnline && queueCount > 0 && !syncError && (
        <button
          onClick={() => syncService.sync()}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
