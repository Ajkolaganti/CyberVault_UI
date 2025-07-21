import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from '../utils/auth';

const Dashboard = () => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setError(null);
      console.log('[Dashboard] Auth headers being sent:', getAuthHeaders());

      try {
        // Fetch recent activity (audit logs)
        const activityUrl = `${API_BASE_URL}/api/v1/audit`;
        const activityRes = await fetch(activityUrl, {
          headers: getAuthHeaders(),
        });
        console.log('[Dashboard] Activity response status:', activityRes.status, activityRes.statusText, 'for', activityUrl);

        // Read raw text so we can safely debug malformed JSON without throwing
        const activityRaw = await activityRes.text();
        console.log('[Dashboard] Activity raw response:', activityRaw);

        if (!activityRes.ok) {
          // Surface backend status code in the error so we can see 404 vs 500, etc.
          throw new Error(`Failed to fetch activity (status ${activityRes.status})`);
        }

        let activityData: any = [];
        if (activityRaw) {
          try {
            activityData = JSON.parse(activityRaw);
          } catch (parseErr) {
            console.error('[Dashboard] Failed to parse activity JSON:', parseErr);
            // leave as empty array; continue rendering instead of hard error
            activityData = [];
          }
        }

        console.log('Dashboard activity received parsed:', activityData);

        // Normalize shape: accept {logs:[]}, {items:[]}, or array root
        const activityList =
          (activityData && (activityData.logs || activityData.items)) ||
          (Array.isArray(activityData) ? activityData : []);

        setRecentActivity(activityList);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    };

    fetchDashboard();
  }, []);

  if (error) {
    return <div>Error loading dashboard: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Recent Activity</h2>
      <ul>
        {recentActivity.map((item: any, index: number) => (
          <li key={index}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
