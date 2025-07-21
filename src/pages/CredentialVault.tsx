import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AddCredentialModal } from '../components/ui/AddCredentialModal';
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
  name: string;
  type: 'database' | 'api' | 'server' | 'application';
  username: string;
  lastAccessed: string;
  status: 'active' | 'expired' | 'inactive';
  environment: 'production' | 'staging' | 'development';
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

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching credentials with auth headers');
      const res = await fetch('/api/v1/credentials', {
        headers: getAuthHeaders(),
      });
      
      console.log('Credentials fetch response status:', res.status);
      
      if (!res.ok) throw new Error('Failed to fetch credentials');
      const data = await res.json();
      
      console.log('Credentials data received:', { count: data.credentials?.length || 0 });
      setCredentials(data.credentials || []);
    } catch (err: any) {
      console.error('Error fetching credentials:', err);
      setError(err.message || 'Error fetching credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credential.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || credential.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddCredential = (newCredential: Credential) => {
    setCredentials(prev => [...prev, newCredential]);
    // Could also refresh the list from server if needed:
    // fetchCredentials();
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
          <div className="p-4 bg-slate-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading credentials...</h3>
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
                  <Button size="sm" variant="ghost" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600">
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
          <Button>
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
    </div>
  );
};