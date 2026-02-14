import { useEffect, useState } from 'react';
import { Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getPublishHistory, clearPublishHistory, getPublishStats, type PublishRecord } from '../../utils/publishHistory';

interface PublishHistoryPanelProps {
  refreshTrigger?: number;
}

export default function PublishHistoryPanel({ refreshTrigger }: PublishHistoryPanelProps) {
  const [history, setHistory] = useState<PublishRecord[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = () => {
    const records = getPublishHistory();
    setHistory(records);
    setStats(getPublishStats());
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear the publish history?')) {
      clearPublishHistory();
      loadHistory();
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-semibold">No publish history yet</p>
        <p className="text-sm text-gray-500">Your publish history will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Publish History
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.successRate}% success rate ({stats?.successfulPublishes}/{stats?.totalAttempts} successful)
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {history.map((record) => (
          <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              {record.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        record.status === 'success' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {record.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {record.dataStats && (
                  <div className="flex gap-4 text-xs text-gray-600 mt-2">
                    <span>Products: {record.dataStats.productCount}</span>
                    <span>Categories: {record.dataStats.categoryCount}</span>
                    <span>Size: {(record.dataStats.totalSize / 1024).toFixed(2)} KB</span>
                  </div>
                )}

                {record.uploadTime && (
                  <div className="flex gap-4 text-xs text-gray-600 mt-1">
                    <span>Upload: {record.uploadTime}ms</span>
                    {record.verifyTime && <span>Verify: {record.verifyTime}ms</span>}
                  </div>
                )}

                {record.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700">{record.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
