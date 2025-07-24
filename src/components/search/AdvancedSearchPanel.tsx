import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  XCircle
} from 'lucide-react';

export interface AdvancedSearchFilters {
  // Text search
  hostname?: string;
  username?: string;
  errorContent?: string;
  jitJustification?: string;
  
  // Status filters
  validationStatus?: ('pending' | 'verified' | 'failed' | 'never_validated')[];
  connectionStatus?: ('connected' | 'disconnected' | 'error')[];
  
  // System filters
  systemTypes?: string[];
  connectionMethods?: string[];
  platforms?: string[];
  
  // Temporal filters
  lastValidatedRange?: { start: string; end: string };
  createdRange?: { start: string; end: string };
  
  // JIT filters
  associatedJitSessions?: 'active' | 'expired' | 'none' | 'any';
  jitSessionStatus?: ('active' | 'expired' | 'revoked')[];
  
  // Verification filters
  verificationMethods?: ('SSH' | 'WinRM' | 'SMB' | 'RDP' | 'SQL' | 'HTTP')[];
  errorCategories?: ('connection' | 'authentication' | 'authorization' | 'timeout' | 'configuration')[];
  
  // Security filters
  criticalFailuresOnly?: boolean;
  recentFailuresOnly?: boolean;
  
  // Metadata filters
  tags?: string[];
  customFields?: Record<string, string>;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  initialFilters?: AdvancedSearchFilters;
  availableOptions?: {
    systemTypes?: string[];
    connectionMethods?: string[];
    platforms?: string[];
    verificationMethods?: string[];
    errorCategories?: string[];
    tags?: string[];
  };
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchProps> = ({
  onFiltersChange,
  onSearch,
  initialFilters = {},
  availableOptions = {}
}) => {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update filters and notify parent
  const updateFilters = useCallback((newFilters: Partial<AdvancedSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
    
    // Count active filters
    const count = Object.entries(updatedFilters).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== undefined && value !== '' && value !== null;
    }).length;
    setActiveFilterCount(count);
  }, [filters, onFiltersChange]);

  const clearFilters = () => {
    setFilters({});
    setActiveFilterCount(0);
    onFiltersChange({});
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleQuickFilter = (filterType: keyof AdvancedSearchFilters, value: any) => {
    updateFilters({ [filterType]: value });
  };

  return (
    <Card className="p-6 mb-6">
      {/* Quick Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search accounts by hostname, username, or error message..."
            className="pl-10"
            value={filters.hostname || ''}
            onChange={(e) => updateFilters({ hostname: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced
          {activeFilterCount > 0 && (
            <Badge variant="info" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleQuickFilter('validationStatus', ['failed'])}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Failed Validation
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleQuickFilter('validationStatus', ['pending'])}
          className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending Validation
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleQuickFilter('associatedJitSessions', 'active')}
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Shield className="w-3 h-3 mr-1" />
          Active JIT Sessions
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleQuickFilter('criticalFailuresOnly', true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Critical Failures
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="border-t pt-4 space-y-6">
          {/* Text Search Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Text Search</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hostname</label>
                <Input
                  placeholder="e.g., server-01, *.prod.com"
                  value={filters.hostname || ''}
                  onChange={(e) => updateFilters({ hostname: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Username</label>
                <Input
                  placeholder="e.g., admin, service*"
                  value={filters.username || ''}
                  onChange={(e) => updateFilters({ username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Error Content</label>
                <Input
                  placeholder="Search in error messages"
                  value={filters.errorContent || ''}
                  onChange={(e) => updateFilters({ errorContent: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">JIT Justification</label>
                <Input
                  placeholder="Business justification keywords"
                  value={filters.jitJustification || ''}
                  onChange={(e) => updateFilters({ jitJustification: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Validation Status</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'verified', 'failed', 'never_validated'].map((status) => (
                    <Button
                      key={status}
                      variant={filters.validationStatus?.includes(status as any) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        const current = filters.validationStatus || [];
                        const updated = current.includes(status as any)
                          ? current.filter(s => s !== status)
                          : [...current, status as any];
                        updateFilters({ validationStatus: updated });
                      }}
                    >
                      {status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                      {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {status === 'never_validated' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">JIT Association</label>
                <div className="flex flex-wrap gap-2">
                  {['active', 'expired', 'none', 'any'].map((status) => (
                    <Button
                      key={status}
                      variant={filters.associatedJitSessions === status ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => updateFilters({ associatedJitSessions: status as any })}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">System Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">System Types</label>
                <div className="flex flex-wrap gap-1">
                  {(availableOptions.systemTypes || ['Windows', 'Linux', 'Database', 'Network Device']).map((type) => (
                    <Button
                      key={type}
                      variant={filters.systemTypes?.includes(type) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        const current = filters.systemTypes || [];
                        const updated = current.includes(type)
                          ? current.filter(t => t !== type)
                          : [...current, type];
                        updateFilters({ systemTypes: updated });
                      }}
                    >
                      <Server className="w-3 h-3 mr-1" />
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-2">Connection Methods</label>
                <div className="flex flex-wrap gap-1">
                  {(availableOptions.connectionMethods || ['SSH', 'RDP', 'WinRM', 'SQL']).map((method) => (
                    <Button
                      key={method}
                      variant={filters.connectionMethods?.includes(method) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        const current = filters.connectionMethods || [];
                        const updated = current.includes(method)
                          ? current.filter(m => m !== method)
                          : [...current, method];
                        updateFilters({ connectionMethods: updated });
                      }}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Verification Methods</label>
                <div className="flex flex-wrap gap-1">
                  {(availableOptions.verificationMethods || ['SSH', 'WinRM', 'SMB', 'RDP']).map((method) => (
                    <Button
                      key={method}
                      variant={filters.verificationMethods?.includes(method as any) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        const current = filters.verificationMethods || [];
                        const updated = current.includes(method as any)
                          ? current.filter(m => m !== method)
                          : [...current, method as any];
                        updateFilters({ verificationMethods: updated });
                      }}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Date Ranges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Last Validated</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.lastValidatedRange?.start || ''}
                    onChange={(e) => updateFilters({
                      lastValidatedRange: {
                        ...filters.lastValidatedRange,
                        start: e.target.value,
                        end: filters.lastValidatedRange?.end || ''
                      }
                    })}
                  />
                  <Input
                    type="date"
                    value={filters.lastValidatedRange?.end || ''}
                    onChange={(e) => updateFilters({
                      lastValidatedRange: {
                        start: filters.lastValidatedRange?.start || '',
                        end: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Account Created</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.createdRange?.start || ''}
                    onChange={(e) => updateFilters({
                      createdRange: {
                        ...filters.createdRange,
                        start: e.target.value,
                        end: filters.createdRange?.end || ''
                      }
                    })}
                  />
                  <Input
                    type="date"
                    value={filters.createdRange?.end || ''}
                    onChange={(e) => updateFilters({
                      createdRange: {
                        start: filters.createdRange?.start || '',
                        end: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Security Options</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.criticalFailuresOnly || false}
                  onChange={(e) => updateFilters({ criticalFailuresOnly: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Critical failures only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.recentFailuresOnly || false}
                  onChange={(e) => updateFilters({ recentFailuresOnly: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Recent failures (24h)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="flex items-center gap-2 text-gray-600"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsExpanded(false)}>
                Collapse
              </Button>
              <Button onClick={handleSearch}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdvancedSearchPanel;
