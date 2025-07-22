import React, { useState, useEffect } from 'react';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { SessionSettingsCard } from '../components/settings/SessionSettingsCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, Activity, AlertTriangle } from 'lucide-react';

export const InactivityTestPage: React.FC = () => {
  const [testMode, setTestMode] = useState(false);
  const [activityCount, setActivityCount] = useState(0);

  // Use a shorter timeout for testing (2 minutes instead of 30)
  const { updateLastActivity, getTimeSinceLastActivity, getRemainingTime } = useInactivityLogout({
    timeout: testMode ? 2 * 60 * 1000 : 30 * 60 * 1000, // 2 minutes in test mode
    warningTime: testMode ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds warning in test mode
    checkInterval: 1000,
  });

  const [timeSinceActivity, setTimeSinceActivity] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceActivity(getTimeSinceLastActivity());
      setRemainingTime(getRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeSinceLastActivity, getRemainingTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleManualActivity = () => {
    updateLastActivity();
    setActivityCount(prev => prev + 1);
  };

  const getStatusColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const totalTimeout = testMode ? 2 * 60 * 1000 : 30 * 60 * 1000;
  const statusColor = getStatusColor(remainingTime, totalTimeout);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Inactivity Logout Test
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Test the automatic logout functionality. In test mode, the timeout is reduced to 2 minutes 
            with a 30-second warning for easier testing.
          </p>
        </div>

        {/* Test Mode Toggle */}
        <Card className="p-6" glow={true}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Test Mode</h3>
                <p className="text-sm text-slate-600">Use shorter timeouts for testing</p>
              </div>
            </div>
            <Button
              onClick={() => setTestMode(!testMode)}
              variant={testMode ? 'primary' : 'secondary'}
            >
              {testMode ? 'Exit Test Mode' : 'Enable Test Mode'}
            </Button>
          </div>
        </Card>

        {/* Session Status */}
        <Card className={`p-6 border-2 ${statusColor}`} glow={true}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-current/10 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Session Status</h3>
                <p className="text-sm opacity-80">
                  {testMode ? 'Test Mode: 2 min timeout' : 'Normal Mode: 30 min timeout'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(timeSinceActivity)}
                </div>
                <div className="text-sm opacity-80">Time Since Activity</div>
              </div>

              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(remainingTime)}
                </div>
                <div className="text-sm opacity-80">Time Remaining</div>
              </div>

              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-2xl font-mono font-bold">
                  {activityCount}
                </div>
                <div className="text-sm opacity-80">Manual Activities</div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleManualActivity}
                variant="primary"
                className="px-6"
              >
                <Activity className="w-4 h-4 mr-2" />
                Reset Activity Timer
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6" glow={true}>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg mt-1">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">How to Test</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Enable test mode to reduce timeout to 2 minutes</li>
                <li>• Stop interacting with the page (no mouse movement, clicks, or keyboard input)</li>
                <li>• A warning dialog will appear 30 seconds before logout in test mode</li>
                <li>• You can extend the session or let it timeout automatically</li>
                <li>• Use "Reset Activity Timer" to manually reset the inactivity timer</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Session Settings */}
        <SessionSettingsCard />

        {/* Current Activity Indicator */}
        <div className="fixed bottom-4 right-4">
          <div className="bg-white shadow-lg rounded-full p-3 border border-slate-200">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${remainingTime > 60000 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-xs font-mono text-slate-600">
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
