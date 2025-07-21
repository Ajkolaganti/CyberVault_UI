import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getAuthHeaders } from '../store/authStore';
import {
  Monitor,
  Play,
  Square,
  Users,
  Clock,
  Activity,
  Eye,
  Download,
  AlertTriangle
} from 'lucide-react';

interface Session {
  id: string;
  user: string;
  resource: string;
  startTime: string;
  duration: string;
  status: 'active' | 'completed' | 'terminated';
  riskLevel: 'low' | 'medium' | 'high';
  actions: number;
  lastActivity: string;
}

export const SessionMonitoring: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch from sessions endpoints with fallback to mock data
        let sessionsData: any = { sessions: [] };
        let logsData: any = { activities: [] };

        try {
          const [sessionsRes, logsRes] = await Promise.all([
            fetch('/api/v1/sessions', {
              headers: getAuthHeaders(),
            }),
            fetch('/api/v1/sessions/activity', {
              headers: getAuthHeaders(),
            })
          ]);

          if (sessionsRes.ok) {
            sessionsData = await sessionsRes.json();
          } else {
            console.log('Sessions endpoint not available, using mock data');
          }

          if (logsRes.ok) {
            logsData = await logsRes.json();
          } else {
            console.log('Sessions activity endpoint not available, using mock data');
          }
        } catch (err) {
          console.log('Sessions endpoints error, using mock data:', err);
        }

        // Use real data if available, otherwise use mock data
        const mockSessions: Session[] = [
          {
            id: 'session_1',
            user: 'john.doe@company.com',
            resource: 'Production Server',
            startTime: new Date(Date.now() - 7200000).toISOString(),
            duration: '2.1',
            status: 'active',
            riskLevel: 'high',
            actions: 45,
            lastActivity: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: 'session_2',
            user: 'jane.smith@company.com',
            resource: 'AWS Console',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            duration: '1.0',
            status: 'completed',
            riskLevel: 'medium',
            actions: 23,
            lastActivity: new Date(Date.now() - 1800000).toISOString()
          }
        ];

        setSessions(sessionsData.sessions || mockSessions);
        setActivities(logsData.activities || []);
      } catch (err: any) {
        console.error('Error in fetchSessions:', err);
        setError(null); // Don't show error for missing endpoints
        setSessions([]); // Show empty state
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Stats (replace with real stats from backend if available)
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const recordedToday = sessions.length;
  const highRisk = sessions.filter(s => s.riskLevel === 'high').length;
  const avgDuration = sessions.length ?
    (sessions.reduce((acc, s) => acc + parseFloat(s.duration), 0) / sessions.length).toFixed(1) + 'h' : '0h';

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Monitoring</h1>
        <Card className="text-center py-16">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading sessions...</h3>
        </Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Monitoring</h1>
        <Card className="text-center py-16">
          <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and record privileged sessions in real-time
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recorded Today</p>
              <p className="text-2xl font-semibold text-gray-900">{recordedToday}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{highRisk}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900">{avgDuration}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Sessions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{session.user}</h4>
                      <p className="text-sm text-gray-500">{session.resource}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        session.riskLevel === 'high' ? 'danger' :
                        session.riskLevel === 'medium' ? 'warning' : 'success'
                      }>
                        {session.riskLevel} risk
                      </Badge>
                      <Badge variant={session.status === 'active' ? 'success' : 'default'}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-2 text-gray-900">{session.startTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2 text-gray-900">{session.duration}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Actions:</span>
                      <span className="ml-2 text-gray-900">{session.actions}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last activity:</span>
                      <span className="ml-2 text-gray-900">{session.lastActivity}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4 mr-1" />
                      Watch Live
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4 mr-1" />
                      Playback
                    </Button>
                    {session.status === 'active' && (
                      <Button size="sm" variant="danger">
                        <Square className="h-4 w-4 mr-1" />
                        Terminate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        {/* Live Activity Feed */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Live Activity</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Real-time</span>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 transition-all duration-500 ${
                    index === 0 
                      ? 'bg-blue-50 border-blue-500 animate-pulse' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 font-mono">{activity}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {index === 0 ? 'just now' : `${index * 30}s ago`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};