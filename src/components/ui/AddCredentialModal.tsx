import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '../../store/authStore';

interface Credential {
  id: string;
  name: string;
  type: 'database' | 'api' | 'server' | 'application';
  username: string;
  lastAccessed: string;
  status: 'active' | 'expired' | 'inactive';
  environment: 'production' | 'staging' | 'development';
}

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (credential: Credential) => void;
}

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'database' as Credential['type'],
    username: '',
    password: '',
    environment: 'development' as Credential['environment']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting credential:', { 
        ...formData, 
        password: '[REDACTED]' 
      });

      const res = await fetch('/api/v1/credentials', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = 'Failed to create credential';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } else {
          const textError = await res.text();
          console.error('Non-JSON error response:', textError);
          errorMessage = `Server error: ${res.status} - ${textError.slice(0, 100)}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('Success response:', data);

      // Mock the response for development
      const newCredential: Credential = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        name: formData.name,
        type: formData.type,
        username: formData.username,
        environment: formData.environment,
        status: 'active',
        lastAccessed: new Date().toISOString()
      };
      
      console.log('Created credential:', { 
        ...newCredential, 
        // Don't log sensitive data
        id: '[REDACTED]', 
        username: '[REDACTED]' 
      });
      
      onAdd(newCredential);
      setFormData({
        name: '',
        type: 'database',
        username: '',
        password: '',
        environment: 'development'
      });
      onClose();
    } catch (err: any) {
      console.error('Error creating credential:', err);
      setError(err.message || 'Failed to create credential');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user makes changes
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Credential">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Input
          label="Credential Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          minLength={3}
          maxLength={100}
          placeholder="e.g., Production Database"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="database">Database</option>
            <option value="api">API Key</option>
            <option value="server">Server</option>
            <option value="application">Application</option>
          </select>
        </div>

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          minLength={2}
          maxLength={50}
          placeholder="Enter username"
        />

        <Input
          label="Password/Secret"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
          secure
          placeholder="Enter password or secret"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Environment
          </label>
          <select
            name="environment"
            value={formData.environment}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            Add Credential
          </Button>
        </div>
      </form>
    </Modal>
  );
};
