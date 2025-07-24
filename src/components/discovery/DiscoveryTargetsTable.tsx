import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { DiscoveryTarget } from '../../pages/Discovery';
import { discoveryApi } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Play,
  Edit,
  Trash2,
  Server,
  Database,
  Cloud,
  Shield,
  Monitor,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface DiscoveryTargetsTableProps {
  targets: DiscoveryTarget[];
  onRefresh: () => void;
  onStartScan: (target: DiscoveryTarget) => void;
  onTargetCreated: () => void;
}

export const DiscoveryTargetsTable: React.FC<DiscoveryTargetsTableProps> = ({
  targets,
  onRefresh,
  onStartScan,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<DiscoveryTarget | null>(null);

  const getTargetTypeIcon = (type: DiscoveryTarget['target_type']) => {
    switch (type) {
      case 'linux':
        return <Server className="h-4 w-4" />;
      case 'windows':
        return <Monitor className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'aws':
        return <Cloud className="h-4 w-4" />;
      case 'active_directory':
        return <Shield className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DiscoveryTarget['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleEdit = (target: DiscoveryTarget) => {
    setEditingTarget(target);
    setShowEditModal(true);
  };

  const handleDelete = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this discovery target?')) {
      return;
    }

    try {
      setLoading(targetId);
      await discoveryApi.targets.delete(targetId);
      toast.success('Discovery target deleted successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting target:', error);
      toast.error(error.message || 'Failed to delete discovery target');
    } finally {
      setLoading(null);
    }
  };

  const handleStartScan = async (target: DiscoveryTarget) => {
    if (target.status !== 'active') {
      toast.error('Target must be active to start a scan');
      return;
    }
    onStartScan(target);
  };

  if (targets.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Discovery Targets</h3>
          <p className="text-gray-500 mb-4">
            Create your first discovery target to start scanning for privileged accounts.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map((target) => (
                <tr key={target.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          {getTargetTypeIcon(target.target_type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {target.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {target.hostname}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default" className="capitalize">
                      {target.target_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 uppercase">
                      {target.connection_method}
                    </div>
                    {target.settings?.port && (
                      <div className="text-sm text-gray-500">
                        Port: {target.settings.port}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(target.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(target.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleStartScan(target)}
                        disabled={target.status !== 'active' || loading === target.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading === target.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Scan
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(target)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(target.id)}
                        disabled={loading === target.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Target Modal */}
      {editingTarget && (
        <EditTargetModal
          target={editingTarget}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTarget(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingTarget(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

// Edit Target Modal Component
interface EditTargetModalProps {
  target: DiscoveryTarget;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTargetModal: React.FC<EditTargetModalProps> = ({
  target,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: target.name,
    description: target.description || '',
    hostname: target.hostname,
    target_type: target.target_type,
    connection_method: target.connection_method,
    settings: target.settings || {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await discoveryApi.targets.update(target.id, formData);
      toast.success('Discovery target updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating target:', error);
      toast.error(error.message || 'Failed to update discovery target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Discovery Target">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Target Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="hostname">Hostname/IP</Label>
          <Input
            id="hostname"
            value={formData.hostname}
            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="target_type">Target Type</Label>
            <Select
              value={formData.target_type}
              onValueChange={(value: DiscoveryTarget['target_type']) =>
                setFormData({ ...formData, target_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linux">Linux</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="aws">AWS</SelectItem>
                <SelectItem value="active_directory">Active Directory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="connection_method">Connection Method</Label>
            <Select
              value={formData.connection_method}
              onValueChange={(value: DiscoveryTarget['connection_method']) =>
                setFormData({ ...formData, connection_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ssh">SSH</SelectItem>
                <SelectItem value="winrm">WinRM</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
                <SelectItem value="aws_api">AWS API</SelectItem>
                <SelectItem value="database">Database</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Update Target'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
