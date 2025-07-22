import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { safesApi } from '../utils/api';
import {
  Vault,
  Plus,
  Search,
  Trash2,
  Edit,
  Users,
  Activity,
  Shield,
  Globe,
  Building,
  Laptop,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Safe {
  id: string;
  name: string;
  description?: string;
  safe_type: 'standard' | 'shared' | 'department' | 'application';
  access_level: 'private' | 'team' | 'department' | 'public';
  status: 'active' | 'inactive' | 'archived';
  owner_email: string;
  account_count: number;
  permission_count: number;
  created_at: string;
  updated_at: string;
}

interface SafeStatistics {
  total: number;
  active: number;
  shared: number;
  last_updated: string;
}

const getSafeTypeIcon = (type: Safe['safe_type']) => {
  switch (type) {
    case 'standard':
      return <Vault className="w-4 h-4 text-blue-500" />;
    case 'shared':
      return <Globe className="w-4 h-4 text-green-500" />;
    case 'department':
      return <Building className="w-4 h-4 text-purple-500" />;
    case 'application':
      return <Laptop className="w-4 h-4 text-orange-500" />;
    default:
      return <Vault className="w-4 h-4" />;
  }
};

const getAccessLevelBadge = (level: Safe['access_level']) => {
  switch (level) {
    case 'private':
      return <Badge variant="default">Private</Badge>;
    case 'team':
      return <Badge variant="info">Team</Badge>;
    case 'department':
      return <Badge variant="warning">Department</Badge>;
    case 'public':
      return <Badge variant="success">Public</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getStatusBadge = (status: Safe['status']) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'inactive':
      return <Badge variant="warning">Inactive</Badge>;
    case 'archived':
      return <Badge variant="danger">Archived</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

export const Safes: React.FC = () => {
  const [safes, setSafes] = useState<Safe[]>([]);
  const [statistics, setStatistics] = useState<SafeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSafe, setSelectedSafe] = useState<Safe | null>(null);
  const [newSafe, setNewSafe] = useState({
    name: '',
    description: '',
    safe_type: 'standard' as Safe['safe_type'],
    access_level: 'private' as Safe['access_level'],
  });

  const fetchSafes = async () => {
    try {
      setLoading(true);
      const [safesData, statsData] = await Promise.all([
        safesApi.list(),
        safesApi.getStatistics(),
      ]);
      setSafes(safesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching safes:', error);
      toast.error('Failed to load safes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafes();
  }, []);

  const handleCreateSafe = async () => {
    try {
      if (!newSafe.name.trim()) {
        toast.error('Safe name is required');
        return;
      }

      await safesApi.create({
        name: newSafe.name,
        description: newSafe.description || undefined,
        safe_type: newSafe.safe_type,
        access_level: newSafe.access_level,
      });

      toast.success('Safe created successfully');
      setShowCreateModal(false);
      setNewSafe({
        name: '',
        description: '',
        safe_type: 'standard',
        access_level: 'private',
      });
      fetchSafes();
    } catch (error) {
      console.error('Error creating safe:', error);
      toast.error('Failed to create safe');
    }
  };

  const handleDeleteSafe = async (safe: Safe) => {
    if (!confirm(`Are you sure you want to delete the safe "${safe.name}"?`)) {
      return;
    }

    try {
      await safesApi.delete(safe.id);
      toast.success('Safe deleted successfully');
      fetchSafes();
    } catch (error) {
      console.error('Error deleting safe:', error);
      toast.error('Failed to delete safe');
    }
  };

  const filteredSafes = safes.filter(safe =>
    safe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    safe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    safe.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Vault className="w-8 h-8 text-blue-600" />
            Safes Management
          </h1>
          <p className="text-gray-600 mt-1">
            Organize and manage your privileged accounts in secure containers
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Safe
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Safes</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <Vault className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Safes</p>
                <p className="text-3xl font-bold text-green-600">{statistics.active}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shared Safes</p>
                <p className="text-3xl font-bold text-purple-600">{statistics.shared}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search safes by name, description, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary" onClick={fetchSafes} className="inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Safes List */}
      <Card className="p-6">
        {filteredSafes.length === 0 ? (
          <div className="text-center py-12">
            <Vault className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No safes found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No safes match your search criteria.' : 'Get started by creating your first safe.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Safe
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSafes.map((safe) => (
              <Card key={safe.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getSafeTypeIcon(safe.safe_type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{safe.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{safe.safe_type} Safe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(safe.status)}
                  </div>
                </div>

                {safe.description && (
                  <p className="text-sm text-gray-600 mb-4">{safe.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Access Level:</span>
                    {getAccessLevelBadge(safe.access_level)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Accounts:</span>
                    <span className="font-medium">{safe.account_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">{safe.permission_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium text-blue-600">{safe.owner_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSafe(safe);
                      setShowEditModal(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                  >
                    <Activity className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSafe(safe)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Create Safe Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Safe"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safe Name *
            </label>
            <input
              type="text"
              value={newSafe.name}
              onChange={(e) => setNewSafe({ ...newSafe, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter safe name (3-100 characters)"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newSafe.description}
              onChange={(e) => setNewSafe({ ...newSafe, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter safe description (optional, max 500 characters)"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safe Type
            </label>
            <select
              value={newSafe.safe_type}
              onChange={(e) => setNewSafe({ ...newSafe, safe_type: e.target.value as Safe['safe_type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standard">Standard</option>
              <option value="shared">Shared</option>
              <option value="department">Department</option>
              <option value="application">Application</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Level
            </label>
            <select
              value={newSafe.access_level}
              onChange={(e) => setNewSafe({ ...newSafe, access_level: e.target.value as Safe['access_level'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="private">Private</option>
              <option value="team">Team</option>
              <option value="department">Department</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSafe}>Create Safe</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Safe Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Safe"
      >
        {selectedSafe && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safe Name *
              </label>
              <input
                type="text"
                value={selectedSafe.name}
                onChange={(e) => setSelectedSafe({ ...selectedSafe, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter safe name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={selectedSafe.description || ''}
                onChange={(e) => setSelectedSafe({ ...selectedSafe, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter safe description"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (selectedSafe) {
                  try {
                    await safesApi.update(selectedSafe.id, {
                      name: selectedSafe.name,
                      description: selectedSafe.description,
                    });
                    toast.success('Safe updated successfully');
                    setShowEditModal(false);
                    setSelectedSafe(null);
                    fetchSafes();
                  } catch (error) {
                    console.error('Error updating safe:', error);
                    toast.error('Failed to update safe');
                  }
                }
              }}>
                Update Safe
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
