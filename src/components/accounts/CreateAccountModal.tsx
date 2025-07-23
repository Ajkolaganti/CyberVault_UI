import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { accountsApi, safesApi } from '../../utils/api';
import { getCurrentUserId } from '../../store/authStore';
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
  Terminal,
  Lock,
  Network,
  Share,
  FileText,
  Settings
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

const connectionMethods = [
  { value: 'RDP', label: 'RDP (Remote Desktop)', icon: Monitor, color: 'bg-blue-500' },
  { value: 'SSH', label: 'SSH (Secure Shell)', icon: Terminal, color: 'bg-green-600' },
  { value: 'SQL', label: 'SQL (Database)', icon: Database, color: 'bg-purple-600' },
  { value: 'HTTPS', label: 'HTTPS (Secure Web)', icon: Lock, color: 'bg-green-500' },
  { value: 'HTTP', label: 'HTTP (Web)', icon: Globe, color: 'bg-orange-500' },
  { value: 'SFTP', label: 'SFTP (Secure FTP)', icon: Share, color: 'bg-teal-600' },
  { value: 'Telnet', label: 'Telnet', icon: Network, color: 'bg-red-500' },
  { value: 'VNC', label: 'VNC (Remote View)', icon: Monitor, color: 'bg-indigo-500' },
  { value: 'PowerShell', label: 'PowerShell', icon: Terminal, color: 'bg-blue-600' },
  { value: 'WinRM', label: 'WinRM (Windows Remote)', icon: Settings, color: 'bg-cyan-600' },
  { value: 'Custom', label: 'Custom Protocol', icon: FileText, color: 'bg-gray-600' },
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
    notes: '',
    platform_id: '',
    safe_id: '', // Changed from safe_name to safe_id for backend
    connection_method: 'RDP', // Default connection method
    // account_type: 'Local'  // Commented out - column not found in schema
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [safes, setSafes] = useState<Array<{ id: string; name: string; safe_type?: string; }>>([]);
  const [safesLoading, setSafesLoading] = useState(false);

  // Fetch available safes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserSafes();
    }
  }, [isOpen]);

  // Reset error state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  const fetchUserSafes = async () => {
    try {
      setSafesLoading(true);
      const userId = getCurrentUserId();
      console.log('Current user ID:', userId);
      
      if (userId) {
        const response = await safesApi.list();
        console.log('Safes API response:', response);
        
        // Handle both response.safes and direct array response
        const allSafes = response.safes || response || [];
        console.log('All safes from API:', allSafes);
        
        // Filter safes for current user (owner or member)
        const userSafes = allSafes.filter((safe: any) => 
          safe.owner_id === userId || safe.members?.some((member: any) => member.user_id === userId)
        );
        console.log('Filtered user safes:', userSafes);
        
        const mappedSafes = userSafes.map((safe: any) => ({ 
          id: safe.id, 
          name: safe.name,
          safe_type: safe.safe_type || 'standard'
        }));
        console.log('Mapped safes for dropdown:', mappedSafes);
        setSafes(mappedSafes);
      }
    } catch (err) {
      console.error('Error fetching user safes:', err);
      // Don't show error for safes fetch, just continue with empty list
    } finally {
      setSafesLoading(false);
    }
  };

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
    if (!formData.platform_id.trim()) {
      setError('Platform ID is required');
      return false;
    }
    if (!formData.safe_id || formData.safe_id.trim() === '') {
      setError('Please select a safe for this account');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    // Ensure all required fields are present
    const dataToSend = {
      ...formData,
      // Explicitly ensure name is included and not empty
      name: formData.name.trim()
    };

    try {
      console.log('Creating account with data:', dataToSend);
      console.log('Account name being sent:', dataToSend.name);
      console.log('Full form data being sent to API:', JSON.stringify(dataToSend, null, 2));
      
      const response = await accountsApi.create(dataToSend);
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
        notes: '',
        platform_id: '',
        safe_id: '', // Changed from safe_name to safe_id for backend
        connection_method: 'RDP', // Default connection method
        // account_type: 'Local'  // Commented out - column not found in schema
      });
      
      // Close the modal after successful creation
      onClose();
      
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

  const getConnectionMethodIcon = (connectionMethod: string) => {
    const method = connectionMethods.find(m => m.value === connectionMethod);
    return method ? method.icon : Network;
  };

  const getConnectionMethodColor = (connectionMethod: string) => {
    const method = connectionMethods.find(m => m.value === connectionMethod);
    return method ? method.color : 'bg-gray-500';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Account" size="xl">
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Account Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Account Information</h3>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  Account Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Production Server 1"
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="port" className="text-slate-700 font-medium">
                  Port
                </Label>
                <Input
                  id="port"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', e.target.value)}
                  placeholder="e.g., 22, 3389, 80"
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="connection_method" className="text-slate-700 font-medium">
                  Connection Method *
                </Label>
                <Select 
                  value={formData.connection_method} 
                  onValueChange={(value) => handleInputChange('connection_method', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2">
                    <div className="flex items-center gap-2">
                      {React.createElement(getConnectionMethodIcon(formData.connection_method), {
                        className: `h-4 w-4 text-white p-0.5 rounded ${getConnectionMethodColor(formData.connection_method)}`
                      })}
                      <SelectValue placeholder="Select connection method" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {connectionMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          {React.createElement(method.icon, {
                            className: `h-4 w-4 text-white p-0.5 rounded ${method.color}`
                          })}
                          {method.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="hostname" className="text-slate-700 font-medium">
                  Hostname/IP Address *
                </Label>
                <Input
                  id="hostname"
                  value={formData.hostname}
                  onChange={(e) => handleInputChange('hostname', e.target.value)}
                  placeholder="e.g., server.company.com or 192.168.1.100"
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="system_type" className="text-slate-700 font-medium">
                  System Type *
                </Label>
                <Select 
                  value={formData.system_type} 
                  onValueChange={(value) => handleInputChange('system_type', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2">
                    <div className="flex items-center gap-2">
                      {React.createElement(getSystemIcon(formData.system_type), {
                        className: `h-4 w-4 text-white p-0.5 rounded ${getSystemColor(formData.system_type)}`
                      })}
                      <SelectValue placeholder="Select system type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {systemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {React.createElement(type.icon, {
                            className: `h-4 w-4 text-white p-0.5 rounded ${type.color}`
                          })}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Credentials</h3>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="username" className="text-slate-700 font-medium">
                  Username *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="e.g., admin, root, user@domain.com"
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password *
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Organization</h3>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="platform_id" className="text-slate-700 font-medium">
                  Platform ID *
                </Label>
                <Input
                  id="platform_id"
                  value={formData.platform_id}
                  onChange={(e) => handleInputChange('platform_id', e.target.value)}
                  placeholder="e.g., windows-server-local"
                  required
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="safe" className="text-slate-700 font-medium">
                  Safe *
                </Label>
                {safesLoading ? (
                  <div className="mt-2 w-full p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-slate-500">Loading safes...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.safe_id} 
                    onValueChange={(value) => handleInputChange('safe_id', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a safe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {safes.map((safe) => (
                        <SelectItem key={safe.id} value={safe.id}>
                          <div className="flex items-center gap-2">
                            <span>{safe.name}</span>
                            {safe.safe_type && (
                              <Badge variant="default" className="text-xs">
                                {safe.safe_type}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {safes.length === 0 && (
                        <div className="p-2 text-sm text-slate-500 text-center">
                          No safes available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {safes.length === 0 && !safesLoading && (
                  <p className="mt-2 text-sm text-slate-500">
                    No safes found.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.href = '/safes';
                      }}
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      Create a safe first
                    </button>
                  </p>
                )}
              </div>

              {/* Account Type - Commented out: column not found in schema
              <div>
                <Label htmlFor="account_type" className="text-slate-700 font-medium">
                  Account Type
                </Label>
                <Select 
                  value={formData.account_type} 
                  onValueChange={(value) => handleInputChange('account_type', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Domain">Domain</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Application">Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              */}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <Label htmlFor="notes" className="text-slate-700 font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this account..."
              rows={4}
              disabled={loading}
              className="resize-none"
            />
          </div>

          <Separator />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1 lg:flex-none lg:px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 lg:flex-none lg:px-8 bg-slate-900 hover:bg-slate-800"
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
      </Card>
    </Modal>
  );
};
export default CreateAccountModal;
