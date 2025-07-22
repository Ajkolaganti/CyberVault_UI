import React, { useState, useEffect } from 'react';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  remainingTime: number; // in milliseconds
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onExtendSession,
  onLogout,
  remainingTime,
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(remainingTime / 1000));

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const newCountdown = Math.ceil(remainingTime / 1000);
      setCountdown(newCountdown);

      if (newCountdown <= 0) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingTime, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Session Timeout Warning">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
        </div>

        <div>
          <p className="text-slate-600">
            Your session will expire due to inactivity. You will be automatically 
            logged out for security reasons.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-red-700">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono font-bold">
              {formatTime(countdown)}
            </span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            Time remaining before automatic logout
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onLogout}
            variant="secondary"
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
          >
            Logout Now
          </Button>
          <Button
            onClick={onExtendSession}
            variant="primary"
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            Stay Logged In
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          <Shield className="w-3 h-3 inline mr-1" />
          CyberVault automatically logs out inactive users for security
        </div>
      </div>
    </Modal>
  );
};

export const SessionManager: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { updateLastActivity, getRemainingTime } = useInactivityLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // Show modal 5 minutes before timeout
    checkInterval: 1000, // Check every second for smooth countdown
  });

  const remainingTime = getRemainingTime();
  const shouldShowModal = user && remainingTime <= 5 * 60 * 1000 && remainingTime > 0;

  useEffect(() => {
    setShowTimeoutModal(!!shouldShowModal);
  }, [shouldShowModal]);

  const handleExtendSession = () => {
    updateLastActivity();
    setShowTimeoutModal(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error during manual logout:', error);
    } finally {
      setIsLoggingOut(false);
      setShowTimeoutModal(false);
    }
  };

  if (isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-sm mx-4">
          <LoadingSpinner variant="dotlock" size="lg" text="Securing session..." />
        </div>
      </div>
    );
  }

  return (
    <SessionTimeoutModal
      isOpen={showTimeoutModal}
      onExtendSession={handleExtendSession}
      onLogout={handleLogout}
      remainingTime={remainingTime}
    />
  );
};
