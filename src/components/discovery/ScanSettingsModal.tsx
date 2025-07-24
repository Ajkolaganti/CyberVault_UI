import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { DiscoveryTarget } from '../../pages/Discovery';
import {
  Settings,
  Clock,
  Users,
  Shield,
  Info,
  Play
} from 'lucide-react';

interface ScanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DiscoveryTarget | null;
  onExecute: (targetId: string, scanSettings: any) => void;
}

export const ScanSettingsModal: React.FC<ScanSettingsModalProps> = ({
  isOpen,
  onClose,
  target,
  onExecute,
}) => {
  const [loading, setLoading] = useState(false);
  const [scanSettings, setScanSettings] = useState({
    includeSystemAccounts: false,
    timeout: 30000,
    maxAccounts: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!target) return;

    setLoading(true);
    try {
      await onExecute(target.id, scanSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setScanSettings({
      includeSystemAccounts: false,
      timeout: 30000,
      maxAccounts: 1000,
    });
    onClose();
  };

  if (!target) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configure Discovery Scan"
      size="md"
    >
      <div className="space-y-6">
        {/* Target Information */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Target: {target.name}</h3>
              <p className="text-sm text-blue-700">
                {target.hostname} ({target.target_type.toUpperCase()})
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scan Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-900">Scan Configuration</h3>
            </div>

            <div className="space-y-4 pl-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeSystemAccounts"
                  checked={scanSettings.includeSystemAccounts}
                  onChange={(e) =>
                    setScanSettings({
                      ...scanSettings,
                      includeSystemAccounts: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <Label htmlFor="includeSystemAccounts" className="text-sm font-medium">
                    Include System Accounts
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Include built-in system accounts in the discovery results
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeout" className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Timeout (ms)</span>
                  </Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={scanSettings.timeout}
                    onChange={(e) =>
                      setScanSettings({
                        ...scanSettings,
                        timeout: parseInt(e.target.value) || 30000,
                      })
                    }
                    min="5000"
                    max="300000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum time to wait for scan completion
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxAccounts" className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>Max Accounts</span>
                  </Label>
                  <Input
                    id="maxAccounts"
                    type="number"
                    value={scanSettings.maxAccounts}
                    onChange={(e) =>
                      setScanSettings({
                        ...scanSettings,
                        maxAccounts: parseInt(e.target.value) || 1000,
                      })
                    }
                    min="1"
                    max="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of accounts to discover
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Security Notice</p>
                <p className="mt-1">
                  This scan will connect to the target system using the configured credentials.
                  Ensure you have proper authorization to perform discovery scans on this target.
                </p>
              </div>
            </div>
          </Card>

          {/* Estimated Information */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-start space-x-3">
              <Info className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium">Estimated Scan Time</p>
                <p className="mt-1">
                  Based on your settings, this scan is expected to take approximately{' '}
                  <span className="font-medium">
                    {Math.ceil(scanSettings.timeout / 60000)} - {Math.ceil(scanSettings.timeout / 30000)} minutes
                  </span>{' '}
                  to complete, depending on the number of accounts discovered.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Discovery Scan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
