import React from 'react';
import { CardCommentDemo } from '../components/ui/demo';
import { AccountCard } from '../components/accounts/AccountCardEnhanced';
import { Badge } from '../components/ui/Badge';
import { Shield, Database, Server, Globe } from 'lucide-react';

// Sample account data for demo
const sampleAccount = {
  id: '1',
  name: 'Production Database Server',
  system_type: 'Database',
  hostname: 'prod-db.company.com',
  port: 5432,
  username: 'db_admin',
  platform_id: 'POSTGRES_PROD',
  safe_name: 'Production-Safe',
  rotation_status: 'success',
  validation_status: 'valid',
  account_type: 'Service Account',
  connection_method: 'SSH',
  last_rotated: '2024-01-15T10:30:00Z',
  last_validation_date: '2024-01-20T14:22:00Z',
  description: 'Main production database server for the e-commerce platform',
  notes: 'Critical system - handle with care',
  created_at: '2023-12-01T09:00:00Z',
  updated_at: '2024-01-20T14:22:00Z'
};

const getSystemTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'database':
      return <Database className="w-5 h-5 text-blue-500" />;
    case 'server':
      return <Server className="w-5 h-5 text-gray-600" />;
    case 'web':
      return <Globe className="w-5 h-5 text-green-500" />;
    default:
      return <Shield className="w-5 h-5 text-indigo-500" />;
  }
};

const getRotationStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const ComponentDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced UI Components Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Showcase of modern, interactive components with hover effects, animations, and responsive design
          </p>
        </div>

        {/* Card Comment Demo Section */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Comment Component</h2>
            <p className="text-gray-600">
              Interactive comment cards with like functionality, hover effects, and social features
            </p>
          </div>
          <CardCommentDemo />
        </section>

        {/* Enhanced Account Card Demo Section */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Account Card</h2>
            <p className="text-gray-600">
              Advanced account cards with expandable details, hover effects, and dropdown actions
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccountCard
              account={sampleAccount}
              index={0}
              getSystemTypeIcon={getSystemTypeIcon}
              getRotationStatusBadge={getRotationStatusBadge}
              validationLoading={null}
              actionLoading={null}
              onCopyPassword={(id) => console.log('Copy password for:', id)}
              onValidateAccount={(id) => console.log('Validate account:', id)}
              onShowHistory={(account) => console.log('Show history for:', account)}
              onRotatePassword={(id) => console.log('Rotate password for:', id)}
              onDeleteAccount={(id) => console.log('Delete account:', id)}
            />
            
            <AccountCard
              account={{
                ...sampleAccount,
                id: '2',
                name: 'Development Web Server',
                system_type: 'Server',
                hostname: 'dev-web.company.com',
                port: 80,
                username: 'web_admin',
                validation_status: 'pending',
                rotation_status: 'pending'
              }}
              index={1}
              getSystemTypeIcon={getSystemTypeIcon}
              getRotationStatusBadge={getRotationStatusBadge}
              validationLoading={null}
              actionLoading={null}
              onCopyPassword={(id) => console.log('Copy password for:', id)}
              onValidateAccount={(id) => console.log('Validate account:', id)}
              onShowHistory={(account) => console.log('Show history for:', account)}
              onRotatePassword={(id) => console.log('Rotate password for:', id)}
              onDeleteAccount={(id) => console.log('Delete account:', id)}
            />
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <ul className="space-y-2">
                <li>• Smooth hover animations with Framer Motion</li>
                <li>• Expandable details section with click toggle</li>
                <li>• Gradient accent bars and overlays</li>
                <li>• Icon animations and transitions</li>
              </ul>
              <ul className="space-y-2">
                <li>• Responsive grid layouts</li>
                <li>• Dropdown action menus</li>
                <li>• Status indicators and badges</li>
                <li>• Loading states for async actions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Integration Notes */}
        <section className="bg-blue-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Integration Guide</h2>
          <div className="prose text-gray-700">
            <p className="mb-4">
              These components are built with modern web technologies and can be easily integrated into your existing project:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Framework:</strong> React with TypeScript for type safety</li>
              <li><strong>Styling:</strong> Tailwind CSS for responsive design</li>
              <li><strong>Animations:</strong> Framer Motion for smooth interactions</li>
              <li><strong>Icons:</strong> Lucide React for consistent iconography</li>
              <li><strong>Components:</strong> Shadcn/ui pattern for reusability</li>
            </ul>
            <p>
              To use these components in your project, simply import them and pass the required props. 
              All components are designed to be highly customizable and accessible.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentDemoPage;
