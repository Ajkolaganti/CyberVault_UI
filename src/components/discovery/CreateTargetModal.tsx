import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { discoveryApi } from '../../utils/api';
import { getAuthHeaders } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Server,
  Database,
  Cloud,
  Shield,
  Monitor,
  Settings,
  Key,
  Info
} from 'lucide-react';

interface CreateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Credential {
  id: string;
  name: string;
  type: string;
  username?: string;
}

export const CreateTargetModal: React.FC<CreateTargetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [step, setStep] = useState<'basic' | 'connection' | 'settings'>('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_type: 'linux' as const,
    hostname: '',
    connection_method: 'ssh' as const,
    credential_id: '',
    settings: {
      port: 22,
      timeout: 30000,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Target type options with icons and descriptions
  const targetTypes = [
    {
      value: 'linux',
      label: 'Linux',
      icon: Server,
      description: 'Linux/Unix systems',
      defaultPort: 22,
      defaultMethod: 'ssh',
    },
    {
      value: 'windows',
      label: 'Windows',
      icon: Monitor,
      description: 'Windows servers and workstations',
      defaultPort: 3389,
      defaultMethod: 'winrm',
    },
    {
      value: 'database',
      label: 'Database',
      icon: Database,
      description: 'Database servers (MySQL, PostgreSQL, etc.)',
      defaultPort: 3306,
      defaultMethod: 'database',
    },
    {
      value: 'aws',
      label: 'AWS',
      icon: Cloud,
      description: 'Amazon Web Services',
      defaultPort: 443,
      defaultMethod: 'aws_api',
    },
    {
      value: 'active_directory',
      label: 'Active Directory',
      icon: Shield,
      description: 'Microsoft Active Directory',
      defaultPort: 389,
      defaultMethod: 'https',
    },
  ];

  const connectionMethods = [
    { value: 'ssh', label: 'SSH', description: 'Secure Shell protocol' },
    { value: 'winrm', label: 'WinRM', description: 'Windows Remote Management' },
    { value: 'https', label: 'HTTPS', description: 'Secure HTTP protocol' },
    { value: 'aws_api', label: 'AWS API', description: 'Amazon Web Services API' },
    { value: 'database', label: 'Database', description: 'Direct database connection' },
  ];

  // Fetch available credentials
  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
    }
  }, [isOpen]);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/v1/credentials', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const credentialsList = data.data || data.credentials || [];
        setCredentials(credentialsList);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast.error('Failed to load credentials');
    }
  };

  // Handle target type change
  const handleTargetTypeChange = (targetType: typeof formData.target_type) => {
    const targetConfig = targetTypes.find(t => t.value === targetType);
    if (targetConfig) {
      setFormData(prev => ({
        ...prev,
        target_type: targetType,
        connection_method: targetConfig.defaultMethod as typeof prev.connection_method,
        settings: {
          ...prev.settings,
          port: targetConfig.defaultPort,
        },
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Target name is required';
    }

    if (!formData.hostname.trim()) {
      newErrors.hostname = 'Hostname or IP address is required';
    }

    if (!formData.credential_id) {
      newErrors.credential_id = 'Please select a credential';
    }

    if (formData.settings.port && (formData.settings.port < 1 || formData.settings.port > 65535)) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    if (formData.settings.timeout && formData.settings.timeout < 1000) {
      newErrors.timeout = 'Timeout must be at least 1000ms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await discoveryApi.targets.create({
        name: formData.name,
        targetType: formData.target_type,
        hostname: formData.hostname,
        connectionMethod: formData.connection_method,
        credentialId: formData.credential_id,
        description: formData.description,
        settings: formData.settings,
      });

      toast.success('Discovery target created successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating target:', error);
      toast.error(error.message || 'Failed to create discovery target');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      target_type: 'linux',
      hostname: '',
      connection_method: 'ssh',
      credential_id: '',
      settings: {
        port: 22,
        timeout: 30000,
      },
    });
    setErrors({});
    setStep('basic');
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Target Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production Linux Servers"
                error={errors.name}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of this target"
                rows={3}
              />
            </div>

            <div>
              <Label>Target Type *</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {targetTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`cursor-pointer transition-all`}
                      onClick={() => handleTargetTypeChange(type.value as typeof formData.target_type)}
                    >
                      <Card
                        className={`p-3 ${
                          formData.target_type === type.value
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{type.label}</h4>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                formData.target_type === type.value
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}
                            />
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'connection':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hostname">Hostname or IP Address *</Label>
              <Input
                id="hostname"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                placeholder="e.g., 192.168.1.100 or server.domain.com"
                error={errors.hostname}
              />
            </div>

            <div>
              <Label htmlFor="connection_method">Connection Method *</Label>
              <Select
                value={formData.connection_method}
                onValueChange={(value: typeof formData.connection_method) =>
                  setFormData({ ...formData, connection_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {connectionMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex flex-col">
                        <span>{method.label}</span>
                        <span className="text-xs text-gray-500">{method.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="credential_id">Authentication Credential *</Label>
              <Select
                value={formData.credential_id}
                onValueChange={(value) => setFormData({ ...formData, credential_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a credential" />
                </SelectTrigger>
                <SelectContent>
                  {credentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      <div className="flex items-center space-x-2">
                        <Key className="h-3 w-3" />
                        <span>{credential.name}</span>
                        {credential.username && (
                          <span className="text-xs text-gray-500">({credential.username})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.credential_id && (
                <p className="text-sm text-red-600 mt-1">{errors.credential_id}</p>
              )}
              {credentials.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No credentials available. Create a credential first in the Credential Vault.
                </p>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-4">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Advanced Settings</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.settings.port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, port: parseInt(e.target.value) || 22 },
                    })
                  }
                  min="1"
                  max="65535"
                  error={errors.port}
                />
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.settings.timeout}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, timeout: parseInt(e.target.value) || 30000 },
                    })
                  }
                  min="1000"
                  error={errors.timeout}
                />
              </div>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Connection Settings</p>
                  <p className="mt-1">
                    These settings will be used when establishing connections to the target system
                    for discovery scans. Adjust timeout based on network latency and system response times.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'basic':
        return formData.name.trim() && formData.target_type;
      case 'connection':
        return formData.hostname.trim() && formData.connection_method && formData.credential_id;
      case 'settings':
        return true;
      default:
        return false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Discovery Target"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {(['basic', 'connection', 'settings'] as const).map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName
                    ? 'bg-blue-600 text-white'
                    : index < (['basic', 'connection', 'settings'] as const).indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < (['basic', 'connection', 'settings'] as const).indexOf(step)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {step !== 'basic' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const steps = ['basic', 'connection', 'settings'] as const;
                  const currentIndex = steps.indexOf(step);
                  if (currentIndex > 0) {
                    setStep(steps[currentIndex - 1]);
                  }
                }}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>

            {step === 'settings' ? (
              <Button
                type="submit"
                disabled={loading || !canProceed()}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Target'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  const steps = ['basic', 'connection', 'settings'] as const;
                  const currentIndex = steps.indexOf(step);
                  if (currentIndex < steps.length - 1) {
                    setStep(steps[currentIndex + 1]);
                  }
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
