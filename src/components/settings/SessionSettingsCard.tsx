import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Shield, Clock, Settings } from 'lucide-react';

interface SessionSettings {
  timeout: number; // in minutes
  warningTime: number; // in minutes
}

const defaultSettings: SessionSettings = {
  timeout: 30, // 30 minutes
  warningTime: 5, // 5 minutes warning
};

export const SessionSettingsCard: React.FC = () => {
  const [settings, setSettings] = useState<SessionSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const timeoutOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
  ];

  const warningOptions = [
    { value: 2, label: '2 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
  ];

  const handleTimeoutChange = (timeout: number) => {
    setSettings(prev => ({ ...prev, timeout }));
    setHasChanges(true);
  };

  const handleWarningChange = (warningTime: number) => {
    setSettings(prev => ({ ...prev, warningTime }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, you would save these settings to the backend
    // For now, we'll just store them in localStorage
    localStorage.setItem('sessionSettings', JSON.stringify(settings));
    setHasChanges(false);
    
    // Show success message
    console.log('Session settings saved:', settings);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <Card className="p-6 space-y-6" glow={true}>
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Session Security</h3>
          <p className="text-sm text-slate-600">Configure automatic logout settings</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Session Timeout
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Automatically log out after this period of inactivity
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {timeoutOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeoutChange(option.value)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  settings.timeout === option.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Settings className="w-4 h-4 inline mr-1" />
            Warning Time
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Show warning dialog before automatic logout
          </p>
          <div className="grid grid-cols-3 gap-2">
            {warningOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleWarningChange(option.value)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  settings.warningTime === option.value
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-slate-500 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium">Security Note:</p>
            <p>
              Shorter timeout periods provide better security but may be less convenient. 
              CyberVault recommends 30 minutes or less for high-security environments.
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={handleReset}
          variant="secondary"
          className="flex-1"
        >
          Reset to Default
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          disabled={!hasChanges}
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="text-xs text-slate-500 text-center">
        Current settings: {settings.timeout} min timeout, {settings.warningTime} min warning
      </div>
    </Card>
  );
};
