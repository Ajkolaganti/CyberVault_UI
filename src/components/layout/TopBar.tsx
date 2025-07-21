import React from 'react';
import { Menu, Bell, User, LogOut, Search, Settings, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-20 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-slate-100 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search credentials, sessions, users..."
            className="pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 w-80 bg-slate-50/50 backdrop-blur-sm hover:bg-white focus:bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button className="relative p-3 text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-xl hover:bg-slate-100 group">
          <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </button>
        
        <button className="relative p-3 text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-xl hover:bg-slate-100 group">
          <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
        
        <button className="relative p-3 text-slate-400 hover:text-slate-600 transition-all duration-200 rounded-xl hover:bg-slate-100 group">
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full animate-ping opacity-20"></span>
        </button>

        <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-900">admin@cybervault.com</p>
            <p className="text-xs text-slate-500 font-medium">System Administrator</p>
          </div>
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white">
            <User className="h-5 w-5 text-white" />
          </div>
          <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};