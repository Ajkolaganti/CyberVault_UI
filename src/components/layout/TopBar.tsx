import React from 'react';
import { Menu, Bell, User, LogOut, Search, Settings, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExpandableTabs } from '../ui/ExpandableTabs';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Format user display name and role
  const displayName = user?.name || user?.email || 'User';
  const displayRole = user?.role ? 
    user.role.charAt(0).toUpperCase() + user.role.slice(1) : 
    'User';

  // Define tabs for the expandable menu with special handling for notifications
  const userMenuTabs = [
    { title: "Profile", icon: User },
    { title: "Notifications", icon: Bell },
    { type: "separator" as const },
    { title: "Settings", icon: Settings },
    { title: "Help", icon: HelpCircle },
    { title: "Sign Out", icon: LogOut },
  ];

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    
    // Handle different tab actions
    switch (index) {
      case 0: // Profile
        toast('Profile coming soon!', { icon: '👤' });
        break;
      case 1: // Notifications
        toast('Notifications coming soon!', { icon: '🔔' });
        break;
      case 3: // Settings
        toast('Settings coming soon!', { icon: '⚙️' });
        break;
      case 4: // Help
        toast('Help center coming soon!', { icon: '❓' });
        break;
      case 5: // Sign Out
        handleSignOut();
        break;
    }
  };

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

      <div className="flex items-center space-x-4">
        {/* User info section */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 font-medium">{displayRole}</p>
          </div>
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Expandable tabs for user menu */}
        <ExpandableTabs
          tabs={userMenuTabs}
          onChange={handleTabChange}
          activeColor="text-blue-600"
          className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg"
        />
      </div>
    </header>
  );
};