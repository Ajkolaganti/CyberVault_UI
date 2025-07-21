import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Key, AlignCenterVertical as Certificate, Search, Clock, Monitor, Users, Puzzle, FileText, Settings, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Shield },
  { name: 'Credential Vault', href: '/credentials', icon: Key },
  { name: 'Certificates', href: '/certificates', icon: Certificate },
  { name: 'Discovery', href: '/discovery', icon: Search },
  { name: 'JIT Access', href: '/jit-access', icon: Clock },
  { name: 'Session Monitoring', href: '/sessions', icon: Monitor },
  { name: 'Access Control', href: '/access-control', icon: Users },
  { name: 'Integrations', href: '/integrations', icon: Puzzle },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  { name: 'Admin Console', href: '/admin', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-r border-slate-700/50 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">CyberVault</span>
              <div className="text-xs text-slate-400 font-medium">Security Platform</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-[1.01]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom section */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">System Status</div>
                <div className="text-xs text-green-400">All systems operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};