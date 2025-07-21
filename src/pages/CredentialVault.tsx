import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { AddCredentialModal } from '../components/ui/AddCredentialModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { getAuthHeaders } from '../store/authStore';
import {
  Key,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Copy,
  Edit,
  Trash2,
  Shield,
  Database,
  Globe
} from 'lucide-react';

interface Credential {
  id: string;
  user_id: string;
  name: string;
  type: 'database' | 'api' | 'server' | 'application';
  value: string;
  username?: string; // Optional since backend might not always include this
  lastAccessed?: string; // Will be derived from updated_at
  status?: 'active' | 'expired' | 'inactive'; // Optional, will default to 'active'
  environment?: 'production' | 'staging' | 'development'; // Optional
  created_at: string;
  updated_at: string;
}

const getTypeIcon = (type: Credential['type']) => {
  switch (type) {
    case 'database':
      return Database;
    case 'api':
      return Key;
    case 'server':
      return Shield;
    case 'application':
      return Globe;
    default:
      return Key;
  }
};

export const CredentialVault: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCredential, setViewingCredential] = useState<Credential | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);

  // Transform backend credential data to frontend format
  const transformCredentialData = (backendItem: any): Credential => {
    // Helper function to format timestamps
    const formatTimestamp = (timestamp: string) => {
      try {
        return new Date(timestamp).toLocaleString();
      } catch {
        return 'Unknown';
      }
    };

    return {
      id: backendItem.id,
      user_id: backendItem.user_id,
      name: backendItem.name,
      type: backendItem.type || 'application',
      value: backendItem.value || '',
      username: backendItem.username || 'N/A',
      lastAccessed: formatTimestamp(backendItem.updated_at || backendItem.created_at),
      status: backendItem.status || 'active',
      environment: backendItem.environment || 'production',
      created_at: backendItem.created_at,
      updated_at: backendItem.updated_at
    };
  };

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching credentials with auth headers');
      const res = await fetch('/api/v1/credentials', {
        headers: getAuthHeaders(),
      });
      
      console.log('Credentials fetch response status:', res.status);
      
      if (res.ok) {
        const response = await res.json();
        console.log('Credentials response received:', response);
        
        // Handle the new backend response format: { data: [...], count: X, total: X }
        const credentialsData = response.data || response.credentials || response || [];
        const transformedCredentials = Array.isArray(credentialsData) 
          ? credentialsData.map(transformCredentialData)
          : [];
          
        console.log('Transformed credentials:', transformedCredentials);
        setCredentials(transformedCredentials);
      } else {
        if (res.status === 401) {
          setError('Authentication expired. Please log in again.');
          console.log('Authentication failed for credentials');
        } else {
          console.log('Credentials endpoint returned error:', res.status);
          setCredentials([]);
        }
      }
    } catch (err: any) {
      console.log('Credentials endpoint error, using mock data:', err);
      setError(null); // Don't show error for missing endpoint
      setCredentials([]); // Show empty state instead
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (credential.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || credential.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddCredential = async () => {
    // Refresh the credentials list after adding a new one
    await fetchCredentials();
  };

  // Handler functions for credential actions
  const handleViewCredential = (credential: Credential) => {
    setViewingCredential(credential);
  };

  const handleCopyCredential = async (credential: Credential) => {
    try {
      await navigator.clipboard.writeText(credential.value);
      toast.success('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy credential:', err);
      toast.error('Failed to copy credential to clipboard');
    }
  };

  const handleEditCredential = (credential: Credential) => {
    // You could open an edit modal here
    toast(`Edit functionality for "${credential.name}" coming soon!`, {
      icon: '🔧',
      duration: 2000,
    });
  };

  const handleDeleteCredential = (credential: Credential) => {
    setDeletingCredential(credential);
  };

  const confirmDeleteCredential = async () => {
    if (!deletingCredential) return;

    setActionLoading(deletingCredential.id);
    try {
      const res = await fetch(`/api/v1/credentials/${deletingCredential.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        // Remove from local state
        setCredentials(prev => prev.filter(c => c.id !== deletingCredential.id));
        toast.success(`"${deletingCredential.name}" deleted successfully`);
        setDeletingCredential(null);
      } else {
        throw new Error(`Failed to delete credential: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(`Failed to delete credential: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credential Vault</h1>
          <p className="mt-1 text-sm text-gray-500">
            Securely manage and access your privileged credentials
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Filters */}
      <Card hover={true}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50"
          >
            <option value="all">All Types</option>
            <option value="database">Database</option>
            <option value="api">API Key</option>
            <option value="server">Server</option>
            <option value="application">Application</option>
          </select>
        </div>
      </Card>

      {/* Credentials Grid */}
      {loading ? (
        <Card className="text-center py-16">
          <LoadingSpinner 
            variant="lock" 
            size="lg" 
            text="Unlocking your credentials..." 
            className="py-8"
          />
        </Card>
      ) : error ? (
        <Card className="text-center py-16">
          <div className="p-4 bg-red-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredCredentials.map((credential) => {
            const IconComponent = getTypeIcon(credential.type);
            return (
              <Card key={credential.id} hover={true} className="group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{credential.name}</h3>
                      <p className="text-sm text-slate-500">{credential.username}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all duration-200">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Status</span>
                    <Badge variant={
                      credential.status === 'active' ? 'success' :
                      credential.status === 'expired' ? 'danger' : 'default'
                    }>
                      {credential.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Environment</span>
                    <Badge variant={
                      credential.environment === 'production' ? 'danger' :
                      credential.environment === 'staging' ? 'warning' : 'default'
                    }>
                      {credential.environment}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Last accessed</span>
                    <span className="text-sm text-slate-900 font-medium">{credential.lastAccessed}</span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => handleViewCredential(credential)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => handleCopyCredential(credential)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => handleEditCredential(credential)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDeleteCredential(credential)}
                    loading={actionLoading === credential.id}
                    disabled={actionLoading === credential.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredCredentials.length === 0 && (
        <Card className="text-center py-16">
          <div className="p-4 bg-slate-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No credentials found</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first credential'}
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        </Card>
      )}

      <AddCredentialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCredential}
      />

      {/* View Credential Modal */}
      {viewingCredential && (
        <Modal
          isOpen={!!viewingCredential}
          onClose={() => setViewingCredential(null)}
          title="Credential Details"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{viewingCredential.type}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.username || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{viewingCredential.environment}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{viewingCredential.status}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Accessed</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.lastAccessed}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {new Date(viewingCredential.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => handleCopyCredential(viewingCredential)}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Password
              </Button>
              <Button
                variant="secondary"
                onClick={() => setViewingCredential(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCredential && (
        <Modal
          isOpen={!!deletingCredential}
          onClose={() => setDeletingCredential(null)}
          title="Delete Credential"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <p className="text-sm text-red-700">This action cannot be undone.</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete <strong>"{deletingCredential.name}"</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently remove the credential and all associated data.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="danger"
                onClick={confirmDeleteCredential}
                loading={actionLoading === deletingCredential.id}
                disabled={actionLoading === deletingCredential.id}
                className="flex-1"
              >
                Delete Credential
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeletingCredential(null)}
                disabled={actionLoading === deletingCredential.id}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};