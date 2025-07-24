import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { accountValidationApi, dashboardAnalyticsApi } from '../../utils/api';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeFields: string[];
  dateRange: { start: string; end: string };
  filters: {
    validationStatus?: string[];
    systemTypes?: string[];
    errorCategories?: string[];
    includeMetadata?: boolean;
    includeSensitiveData?: boolean;
  };
}

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  options: ExportOptions;
  lastUsed?: string;
}

const DEFAULT_PRESETS: ExportPreset[] = [
  {
    id: 'validation-summary',
    name: 'Validation Summary Report',
    description: 'Overview of all account validation statuses',
    options: {
      format: 'xlsx',
      includeFields: ['account_name', 'hostname', 'system_type', 'validation_status', 'last_validation_date', 'success_rate'],
      dateRange: { 
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      },
      filters: {
        includeMetadata: true,
        includeSensitiveData: false
      }
    }
  },
  {
    id: 'critical-failures',
    name: 'Critical Failures Report',
    description: 'Detailed report of critical validation failures',
    options: {
      format: 'xlsx',
      includeFields: ['account_name', 'hostname', 'system_type', 'error_category', 'error_message', 'failed_at', 'retry_count'],
      dateRange: { 
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      },
      filters: {
        validationStatus: ['failed'],
        errorCategories: ['critical'],
        includeMetadata: true,
        includeSensitiveData: false
      }
    }
  },
  {
    id: 'jit-session-audit',
    name: 'JIT Session Audit Report',
    description: 'Audit trail for JIT session account validations',
    options: {
      format: 'csv',
      includeFields: ['session_id', 'account_name', 'validation_status', 'validation_time', 'user_email', 'business_justification'],
      dateRange: { 
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      },
      filters: {
        includeMetadata: true,
        includeSensitiveData: false
      }
    }
  },
  {
    id: 'compliance-report',
    name: 'Compliance Report',
    description: 'Comprehensive report for compliance auditing',
    options: {
      format: 'pdf',
      includeFields: ['account_name', 'hostname', 'system_type', 'validation_status', 'last_validation_date', 'compliance_status', 'risk_level'],
      dateRange: { 
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
      },
      filters: {
        includeMetadata: true,
        includeSensitiveData: false
      }
    }
  }
];

const AVAILABLE_FIELDS = [
  { id: 'account_name', label: 'Account Name', category: 'basic' },
  { id: 'hostname', label: 'Hostname', category: 'basic' },
  { id: 'username', label: 'Username', category: 'basic' },
  { id: 'system_type', label: 'System Type', category: 'basic' },
  { id: 'connection_method', label: 'Connection Method', category: 'basic' },
  { id: 'validation_status', label: 'Validation Status', category: 'validation' },
  { id: 'last_validation_date', label: 'Last Validation Date', category: 'validation' },
  { id: 'validation_duration', label: 'Validation Duration', category: 'validation' },
  { id: 'success_rate', label: 'Success Rate', category: 'validation' },
  { id: 'error_category', label: 'Error Category', category: 'errors' },
  { id: 'error_message', label: 'Error Message', category: 'errors' },
  { id: 'retry_count', label: 'Retry Count', category: 'errors' },
  { id: 'session_id', label: 'JIT Session ID', category: 'jit' },
  { id: 'user_email', label: 'User Email', category: 'jit' },
  { id: 'business_justification', label: 'Business Justification', category: 'jit' },
  { id: 'created_at', label: 'Created Date', category: 'metadata' },
  { id: 'updated_at', label: 'Updated Date', category: 'metadata' },
  { id: 'compliance_status', label: 'Compliance Status', category: 'compliance' },
  { id: 'risk_level', label: 'Risk Level', category: 'compliance' }
];

interface ReportExportProps {
  onExportComplete?: (result: { success: boolean; fileName?: string; error?: string }) => void;
}

export const ReportExport: React.FC<ReportExportProps> = ({ onExportComplete }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeFields: ['account_name', 'hostname', 'validation_status', 'last_validation_date'],
    dateRange: { 
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      end: new Date().toISOString().split('T')[0] 
    },
    filters: {
      includeMetadata: true,
      includeSensitiveData: false
    }
  });
  
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    name: string;
    format: string;
    exportedAt: string;
    fileSize: string;
    recordCount: number;
  }>>([]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'csv':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'json':
        return <Database className="w-4 h-4 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setExportOptions(preset.options);
      setSelectedPreset(presetId);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setExportOptions(prev => ({
      ...prev,
      includeFields: prev.includeFields.includes(fieldId)
        ? prev.includeFields.filter(f => f !== fieldId)
        : [...prev.includeFields, fieldId]
    }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportData = await accountValidationApi.exportReport(exportOptions);
      
      // Create and trigger download
      const blob = new Blob([exportData.content], { 
        type: getContentType(exportOptions.format) 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileName = generateFileName(exportOptions.format);
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Add to export history
      const newExport = {
        id: Date.now().toString(),
        name: selectedPreset ? DEFAULT_PRESETS.find(p => p.id === selectedPreset)?.name || 'Custom Export' : 'Custom Export',
        format: exportOptions.format.toUpperCase(),
        exportedAt: new Date().toISOString(),
        fileSize: formatFileSize(blob.size),
        recordCount: exportData.recordCount || 0
      };
      
      setExportHistory(prev => [newExport, ...prev.slice(0, 9)]); // Keep last 10 exports
      
      onExportComplete?.({ success: true, fileName });
      
    } catch (error) {
      console.error('Export failed:', error);
      onExportComplete?.({ success: false, error: error instanceof Error ? error.message : 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const getContentType = (format: string): string => {
    switch (format) {
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  };

  const generateFileName = (format: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const presetName = selectedPreset ? DEFAULT_PRESETS.find(p => p.id === selectedPreset)?.name.toLowerCase().replace(/\s+/g, '-') : 'validation-export';
    return `${presetName}-${timestamp}.${format}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupedFields = AVAILABLE_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_FIELDS>);

  return (
    <div className="space-y-6">
      {/* Export Presets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPreset === preset.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getFormatIcon(preset.options.format)}
                    <h4 className="font-medium text-gray-900">{preset.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="default">{preset.options.format.toUpperCase()}</Badge>
                    <Badge variant="info">{preset.options.includeFields.length} fields</Badge>
                  </div>
                </div>
                {selectedPreset === preset.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => setShowCustomOptions(!showCustomOptions)}
            variant="secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            Custom Export Options
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.includeFields.length === 0}
            className="ml-auto"
          >
            {isExporting ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Custom Export Options */}
      {showCustomOptions && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Export Options</h3>
          
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="flex gap-2">
              {(['xlsx', 'csv', 'json', 'pdf'] as const).map((format) => (
                <Button
                  key={format}
                  variant={exportOptions.format === format ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                  className="flex items-center gap-2"
                >
                  {getFormatIcon(format)}
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Fields ({exportOptions.includeFields.length} selected)
            </label>
            <div className="space-y-4">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fields.map((field) => (
                      <label key={field.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeFields.includes(field.id)}
                          onChange={() => handleFieldToggle(field.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.filters.includeMetadata || false}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, includeMetadata: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include metadata (created/updated dates)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.filters.includeSensitiveData || false}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, includeSensitiveData: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include sensitive data (requires additional permissions)</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
          <div className="space-y-2">
            {exportHistory.map((export_) => (
              <div key={export_.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFormatIcon(export_.format.toLowerCase())}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{export_.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(export_.exportedAt).toLocaleString()} • {export_.fileSize} • {export_.recordCount.toLocaleString()} records
                    </p>
                  </div>
                </div>
                <Badge variant="default">{export_.format}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportExport;
