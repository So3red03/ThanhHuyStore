'use client';

import { useState } from 'react';
import Container from '@/app/components/Container';

interface DuplicateGroup {
  userId: string;
  entityId: string;
  eventType: string;
  count: number;
  records: Array<{
    id: string;
    timestamp: string;
    path: string;
  }>;
}

interface CleanupStats {
  totalEvents: number;
  duplicateGroups: number;
  hasDuplicates: boolean;
}

const AnalyticsCleanupPage = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [cleanupResult, setCleanupResult] = useState<string>('');

  const checkDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_duplicates' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDuplicates(data.details || []);
        setCleanupResult(`Found ${data.duplicateGroups} groups with ${data.totalDuplicateRecords} duplicate records`);
      } else {
        setCleanupResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setCleanupResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clean_duplicates' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCleanupResult(`Successfully cleaned ${data.recordsDeleted} duplicate records from ${data.duplicateGroups} groups`);
        // Refresh duplicates check
        await checkDuplicates();
      } else {
        setCleanupResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setCleanupResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/cleanup', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        setCleanupResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setCleanupResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Analytics Cleanup Tool</h1>
        
        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Analytics Statistics</h2>
          <button
            onClick={getStats}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Stats'}
          </button>
          
          {stats && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-gray-600">Total Events</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold">{stats.duplicateGroups}</div>
                <div className="text-gray-600">Duplicate Groups</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className={`text-2xl font-bold ${stats.hasDuplicates ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.hasDuplicates ? 'YES' : 'NO'}
                </div>
                <div className="text-gray-600">Has Duplicates</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cleanup Actions</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={checkDuplicates}
              disabled={loading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Duplicates'}
            </button>
            
            <button
              onClick={cleanDuplicates}
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Cleaning...' : 'Clean Duplicates'}
            </button>
          </div>
          
          {cleanupResult && (
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm">{cleanupResult}</pre>
            </div>
          )}
        </div>

        {/* Duplicates Details */}
        {duplicates.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Duplicate Details</h2>
            <div className="space-y-4">
              {duplicates.map((group, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="font-semibold mb-2">
                    Group {index + 1}: {group.eventType} - Entity: {group.entityId?.slice(-8)}... - Count: {group.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    User: {group.userId?.slice(-8)}...
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium">Records:</div>
                    {group.records.map((record, recordIndex) => (
                      <div key={recordIndex} className="text-xs text-gray-500 ml-4">
                        {record.timestamp} - {record.path} - ID: {record.id.slice(-8)}...
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default AnalyticsCleanupPage;
