import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getAuthHeaders } from '../../store/authStore';
import { 
  Shield, 
  Database, 
  Globe, 
  Server, 
  Monitor, 
  Wifi, 
  HardDrive,
  Eye,
  EyeOff
} from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const systemTypes = [
  { value: 'Windows', label: 'Windows', icon: Shield },
  { value: 'Database', label: 'Database', icon: Database },
  { value: 'Cloud Service', label: 'Cloud Service', icon: Globe },
  { value: '*NIX', label: '*NIX', icon: Server },
  { value: 'Security Appliance', label: 'Security Appliance', icon: Shield },
  { value: 'Network Device', label: 'Network Device', icon: Wifi },
  { value: 'Application', label: 'Application', icon: Monitor },
  { value: 'Website', label: 'Website', icon: Globe },
  { value: 'Operating System', label: 'Operating System', icon: HardDrive },
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    system_type: 'Windows' as const,
    username: '',
    password: '',
    address: '',
    port: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password || !formData.address) {
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        system_type: formData.system_type,
        username: formData.username,
        password: formData.password,
        address: formData.address,
        port: formData.port ? parseInt(formData.port) : undefined,
        description: formData.description || undefined
      };

      const response = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account');
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        system_type: 'Windows',
        username: '',
        password: '',
        address: '',
        port: '',
        description: ''
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 16;
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setFormData(prev => ({ ...prev, password }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-blue-600 text-white' 
              : step === currentStep + 1 
              ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
              : 'bg-gray-200 text-gray-400'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">1. Select system type</h3>
        <p className="text-gray-600">Choose the type of system for this account</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {systemTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, system_type: type.value as any }))}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.system_type === type.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <type.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm font-medium text-gray-900">{type.label}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">2. Assign to platform</h3>
        <p className="text-gray-600">Configure platform-specific settings</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Production Database Server"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="192.168.1.100 or server.domain.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port (optional)
          </label>
          <Input
            type="number"
            value={formData.port}
            onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
            placeholder="3389"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">3. Store in Safe</h3>
        <p className="text-gray-600">Configure credentials and security settings</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="administrator"
            required
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
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter secure password"
              required
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                title="Generate secure password"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">4. Define properties</h3>
        <p className="text-gray-600">Add additional details and configuration</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Additional notes about this account..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Account Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
            <p><strong>Type:</strong> {formData.system_type}</p>
            <p><strong>Address:</strong> {formData.address || 'Not specified'}</p>
            <p><strong>Username:</strong> {formData.username || 'Not specified'}</p>
            <p><strong>Password:</strong> {formData.password ? '••••••••' : 'Not specified'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Account">
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={currentStep === 1 ? onClose : prevStep}
            disabled={loading}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !formData.system_type) ||
                (currentStep === 2 && (!formData.name || !formData.address)) ||
                (currentStep === 3 && (!formData.username || !formData.password))
              }
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {loading ? (
                <>
                  <LoadingSpinner variant="spinner" size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
