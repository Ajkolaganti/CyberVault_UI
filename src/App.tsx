import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { CredentialVault } from './pages/CredentialVault';
import { SessionMonitoring } from './pages/SessionMonitoring';
import { JITAccess } from './pages/JITAccess';

// Placeholder components for remaining pages
const CertificateManager = () => <div className="p-6"><h1 className="text-2xl font-bold">Certificate Manager</h1><p className="text-gray-600">Manage SSL/TLS certificates and track expiration dates.</p></div>;
const Discovery = () => <div className="p-6"><h1 className="text-2xl font-bold">Discovery Module</h1><p className="text-gray-600">Discover and inventory privileged accounts across your infrastructure.</p></div>;
const AccessControl = () => <div className="p-6"><h1 className="text-2xl font-bold">Access Control</h1><p className="text-gray-600">Configure role-based access control policies and permissions.</p></div>;
const Integrations = () => <div className="p-6"><h1 className="text-2xl font-bold">Integrations</h1><p className="text-gray-600">Connect with external systems like Okta, Azure AD, ServiceNow, and Splunk.</p></div>;
const AuditLogs = () => <div className="p-6"><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-gray-600">Review detailed audit trails and compliance reports.</p></div>;
const AdminConsole = () => <div className="p-6"><h1 className="text-2xl font-bold">Admin Console</h1><p className="text-gray-600">Manage users, subscription plans, and system settings.</p></div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/credentials" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CredentialVault />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/certificates" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CertificateManager />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/discovery" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Discovery />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/jit-access" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JITAccess />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/sessions" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SessionMonitoring />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/access-control" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AccessControl />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/integrations" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Integrations />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/audit-logs" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AuditLogs />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AdminConsole />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;