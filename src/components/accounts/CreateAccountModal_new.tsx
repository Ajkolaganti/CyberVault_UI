import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { accountsApi, testApiConnectivity } from '../../utils/api';
import { 
  Shield, 
  Database, 
  Globe, 
  Server, 
  Monitor, 
  Wifi,
  Eye,
  EyeOff,
  Cloud,
  Terminal
} from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const systemTypes = [
  { value: 'Windows', label: 'Windows', icon: Shield, color: 'bg-blue-500' },
  { value: 'Linux', label: 'Linux', icon: Terminal, color: 'bg-orange-500' },
  { value: 'Oracle DB', label: 'Oracle DB', icon: Database, color: 'bg-red-500' },
  { value: 'SQL Server', label: 'SQL Server', icon: Database, color: 'bg-blue-600' },
  { value: 'MySQL', label: 'MySQL', icon: Database, color: 'bg-orange-600' },
  { value: 'AWS', label: 'AWS', icon: Cloud, color: 'bg-yellow-500' },
  { value: 'Azure', label: 'Azure', icon: Cloud, color: 'bg-blue-400' },
  { value: 'Unix/AIX', label: 'Unix/AIX', icon: Server, color: 'bg-gray-600' },
  { value: 'Network Device', label: 'Network Device', icon: Wifi, color: 'bg-green-500' },
  { value: 'Security Appliance', label: 'Security Appliance', icon: Shield, color: 'bg-purple-500' },
  { value: 'Application', label: 'Application', icon: Monitor, color: 'bg-teal-500' },
  { value: 'Website', label: 'Website', icon: Globe, color: 'bg-indigo-500' },
];

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    system_type: 'Windows',
    hostname: '',
    port: '',
    username: '',
    password: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Account name is required');
      return false;
    }
    if (!formData.hostname.trim()) {
      setError('Hostname/IP is required');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Creating account with data:', formData);
      
      const response = await accountsApi.create(formData);
      console.log('Account created successfully:', response);
      
      onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        system_type: 'Windows',
        hostname: '',
        port: '',
        username: '',
        password: '',
        notes: ''
      });
      
    } catch (err) {
      console.error('Error creating account:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
          setError('Network error: Unable to connect to the server. Please check your connection and try again.');
        } else if (err.message.includes('CORS')) {
          setError('CORS error: Cross-origin request blocked. Please check server configuration.');
        } else if (err.message.includes('HTTP 401')) {
          setError('Authentication error: Please log in again.');
        } else if (err.message.includes('HTTP 403')) {
          setError('Permission denied: You don\'t have permission to create accounts.');
        } else {
          setError(err.message || 'An error occurred while creating the account');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSystemIcon = (systemType: string) => {
    const system = systemTypes.find(s => s.value === systemType);
    return system ? system.icon : Shield;
  };

  const getSystemColor = (systemType: string) => {
    const system = systemTypes.find(s => s.value === systemType);
    return system ? system.color : 'bg-gray-500';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Account">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Account Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Production Server 1"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Type
            </label>
            <div className="relative">
              <select
                value={formData.system_type}
                onChange={(e) => handleInputChange('system_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                disabled={loading}
              >
                {systemTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {React.createElement(getSystemIcon(formData.system_type), {
                  className: `h-5 w-5 text-white p-1 rounded ${getSystemColor(formData.system_type)}`
                })}
              </div>
            </div>
          </div>

          <div>
            <Input
              label="Port (Optional)"
              value={formData.port}
              onChange={(e) => handleInputChange('port', e.target.value)}
              placeholder="e.g., 22, 3389, 80"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Hostname/IP Address"
              value={formData.hostname}
              onChange={(e) => handleInputChange('hostname', e.target.value)}
              placeholder="e.g., server.company.com or 192.168.1.100"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="e.g., admin, root, user@domain.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this account..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
