import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Key,
  AlertTriangle,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { getAuthHeaders } from '../store/authStore';

interface DashboardStats {
  totalCredentials: number;
  activeSessions: number;
  privilegedUsers: number;
  complianceScore: number;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  status: 'success' | 'pending' | 'warning';
}

interface Alert {
  id: string;
  message: string;
  severity: 'warning' | 'danger';
  timestamp: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stats
        const statsRes = await fetch('/api/v1/dashboard/stats', {
          headers: getAuthHeaders(),
        });
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
        const statsData: DashboardStats = await statsRes.json();
        
        // Transform stats data
        setStats([
          {
            name: 'Total Credentials',
            value: statsData.totalCredentials || 0,
            change: '+0%',
            changeType: 'increase',
            icon: Key,
            color: 'text-blue-600'
          },
          // Add more transformed stats here
        ]);

        // Fetch activity
        const activityRes = await fetch('/api/v1/audit');
        if (!activityRes.ok) throw new Error('Failed to fetch activity');
        const activityData = await activityRes.json();
        setRecentActivity(activityData.items || []);

        // Fetch alerts
        const alertsRes = await fetch('/api/v1/dashboard/alerts', {
          headers: getAuthHeaders(),
        });
        if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
        const alertsData = await alertsRes.json();
        setCriticalAlerts(alertsData.items || []);

      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Card className="text-center py-16">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading dashboard...</h3>
        </Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Card className="text-center py-16">
          <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your security posture.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat: any) => (
          <Card key={stat.name} hover={true} className="group">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${
                  stat.color.includes('blue') ? 'from-blue-500/10 to-cyan-500/10' :
                  stat.color.includes('green') ? 'from-green-500/10 to-emerald-500/10' :
                  stat.color.includes('purple') ? 'from-purple-500/10 to-pink-500/10' :
                  'from-cyan-500/10 to-blue-500/10'
                } group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className={`flex items-baseline text-sm font-semibold ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="self-center flex-shrink-0 h-4 w-4 mr-1" />
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <div className="w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate mb-1">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card hover={true}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Badge variant="info">{recentActivity.length} new</Badge>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity: any, idx: number) => (
              <div key={activity.id || idx} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {activity.user || activity.actor || 'User'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {activity.action || activity.event || 'Activity'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-slate-400 font-medium">
                  {activity.timestamp || ''}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Critical Alerts */}
        <Card hover={true}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Critical Alerts</h3>
            <Badge variant="danger">{criticalAlerts.length}</Badge>
          </div>
          <div className="space-y-4">
            {criticalAlerts.map((alert: any, idx: number) => (
              <div key={alert.id || idx} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-xl bg-amber-100`}>
                    <AlertTriangle className={`h-4 w-4 text-amber-600`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.message || alert.name || 'Alert'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {alert.timestamp || ''}
                  </p>
                </div>
                <Badge variant={'warning'}>
                  {alert.severity || 'warning'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};