import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '../../store/authStore';

interface Credential {
  id: string;
  name: string;
  type: 'password' | 'ssh' | 'api_token' | 'certificate' | 'database' | 'mysql' | 'postgresql' | 'mssql' | 'oracle' | 'mongodb';
  username?: string;
  host?: string;
  port?: number;
  status: 'pending' | 'active' | 'expired' | 'failed' | 'verified';
  environment: 'production' | 'staging' | 'development';
}

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void; // Changed to simple callback without parameters
}

export const AddCredentialModal: React.FC<AddCredentialModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'password' as Credential['type'],
    username: '',
    password: '',
    host: '',
    port: '',
    environment: 'development' as Credential['environment'],
    // New database-specific fields
    database_name: '',
    schema_name: '',
    connection_string: '',
    ssl_enabled: false,
    additional_params: '{}'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDatabaseType = (type: string) => {
    return ['database', 'mysql', 'postgresql', 'mssql', 'oracle', 'mongodb'].includes(type);
  };

  const requiresSchema = (type: string) => {
    return ['postgresql', 'oracle'].includes(type);
  };

  const getDefaultPort = (type: string) => {
    const portMap: { [key: string]: string } = {
      'mysql': '3306',
      'postgresql': '5432',
      'mssql': '1433',
      'oracle': '1521',
      'mongodb': '27017',
    };
    return portMap[type] || '';
  };

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
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          value: formData.password, // Backend expects 'value' field for the password
          username: formData.username || null,
          host: formData.host || null,
          port: formData.port ? parseInt(formData.port) : null,
          // New database-specific fields
          database_name: formData.database_name || null,
          schema_name: formData.schema_name || null,
          connection_string: formData.connection_string || null,
          ssl_enabled: formData.ssl_enabled,
          additional_params: formData.additional_params ? JSON.parse(formData.additional_params) : {},
          // environment is not part of the new schema, remove if not needed
        }),
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
        username: formData.username || undefined,
        host: formData.host || undefined,
        port: formData.port ? parseInt(formData.port) : undefined,
        environment: formData.environment,
        status: 'pending'
      };
      
      console.log('Created credential:', { 
        ...newCredential, 
        // Don't log sensitive data
        id: '[REDACTED]', 
        username: '[REDACTED]' 
      });
      
      onAdd(); // Call the callback to refresh the parent list
      setFormData({
        name: '',
        type: 'password',
        username: '',
        password: '',
        host: '',
        port: '',
        environment: 'development',
        // Reset database-specific fields
        database_name: '',
        schema_name: '',
        connection_string: '',
        ssl_enabled: false,
        additional_params: '{}'
      });
      onClose();
    } catch (err: any) {
      console.error('Error creating credential:', err);
      setError(err.message || 'Failed to create credential');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-set port when database type changes
    if (name === 'type' && isDatabaseType(value)) {
      const defaultPort = getDefaultPort(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as Credential['type'],
        port: defaultPort 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
            <option value="password">Password</option>
            <option value="ssh">SSH Key</option>
            <option value="api_token">API Token</option>
            <option value="certificate">Certificate</option>
            <option value="database">Database (Generic)</option>
            <option value="mysql">MySQL/MariaDB</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mssql">SQL Server</option>
            <option value="oracle">Oracle DB</option>
            <option value="mongodb">MongoDB</option>
          </select>
        </div>

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          minLength={2}
          maxLength={50}
          placeholder="Enter username (optional)"
        />

        <Input
          label="Host"
          name="host"
          value={formData.host}
          onChange={handleChange}
          placeholder="Enter hostname or IP address (optional)"
        />

        <Input
          label="Port"
          name="port"
          type="number"
          value={formData.port}
          onChange={handleChange}
          min="1"
          max="65535"
          placeholder="Enter port number (optional)"
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

        {/* Database-specific fields */}
        {(['database', 'mysql', 'postgresql', 'mssql', 'oracle', 'mongodb'].includes(formData.type)) && (
          <>
            <Input
              label="Database Name *"
              name="database_name"
              value={formData.database_name}
              onChange={handleChange}
              required
              placeholder="e.g., production_db, hr_system"
            />

            {requiresSchema(formData.type) && (
              <Input
                label="Schema Name *"
                name="schema_name"
                value={formData.schema_name}
                onChange={handleChange}
                required
                placeholder="e.g., public, hr_schema"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection String (Optional)
              </label>
              <textarea
                name="connection_string"
                value={formData.connection_string}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm"
                placeholder="postgresql://user:pass@host:5432/dbname?sslmode=require"
              />
              <p className="mt-1 text-xs text-gray-500">
                Full connection string (will override individual host/port/database settings)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ssl_enabled"
                name="ssl_enabled"
                checked={formData.ssl_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, ssl_enabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ssl_enabled" className="text-sm font-medium text-gray-700">
                Enable SSL/TLS
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Parameters (JSON)
              </label>
              <textarea
                name="additional_params"
                value={formData.additional_params}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none font-mono text-sm"
                placeholder='{"timeout": 30, "pool_size": 10}'
              />
              <p className="mt-1 text-xs text-gray-500">
                Extra connection parameters as valid JSON (optional)
              </p>
            </div>
          </>
        )}

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
