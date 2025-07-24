import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useRealTimeValidation } from '../../hooks/useRealTimeValidation';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield,
  X,
  Settings,
  Eye
} from 'lucide-react';

interface NotificationSettings {
  enableValidationAlerts: boolean;
  enableCriticalFailures: boolean;
  enableJitAlerts: boolean;
  enableSuccessNotifications: boolean;
  alertSounds: boolean;
  emailNotifications: boolean;
  minimumSeverity: 'low' | 'medium' | 'high' | 'critical';
}

interface ValidationNotification {
  id: string;
  type: 'validation_success' | 'validation_failure' | 'critical_failure' | 'jit_alert' | 'system_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  metadata: {
    account_id?: string;
    account_name?: string;
    session_id?: string;
    error_category?: string;
    system_type?: string;
  };
}

interface NotificationSystemProps {
  onNotificationAction?: (notification: ValidationNotification) => void;
  maxNotifications?: number;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onNotificationAction,
  maxNotifications = 50
}) => {
  const [notifications, setNotifications] = useState<ValidationNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableValidationAlerts: true,
    enableCriticalFailures: true,
    enableJitAlerts: true,
    enableSuccessNotifications: false,
    alertSounds: true,
    emailNotifications: false,
    minimumSeverity: 'medium'
  });
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Use real-time validation hook for live updates
  const { isConnected } = useRealTimeValidation({
    onValidationEvent: (event) => {
      handleValidationEvent(event);
    },
    onCriticalFailure: (event) => {
      handleCriticalFailure(event);
    },
    enableNotifications: false, // We handle notifications here
    enableCriticalAlerts: false
  });

  // Handle validation events and create notifications
  const handleValidationEvent = (event: any) => {
    if (!shouldCreateNotification(event)) return;

    const notification: ValidationNotification = {
      id: `${event.id}-${Date.now()}`,
      type: getNotificationType(event.type),
      title: getNotificationTitle(event),
      message: getNotificationMessage(event),
      severity: event.data.severity || getSeverityFromEvent(event),
      timestamp: event.timestamp,
      read: false,
      actionRequired: event.type === 'validation_failed' || event.type === 'critical_failure',
      metadata: {
        account_id: event.data.account_id,
        account_name: event.data.account_name,
        session_id: event.data.session_id,
        error_category: event.data.error_category,
        system_type: event.data.system_type
      }
    };

    addNotification(notification);
  };

  const handleCriticalFailure = (event: any) => {
    const notification: ValidationNotification = {
      id: `critical-${event.id}-${Date.now()}`,
      type: 'critical_failure',
      title: 'CRITICAL VALIDATION FAILURE',
      message: `Critical failure for ${event.data.account_name}: ${event.data.error_message}`,
      severity: 'critical',
      timestamp: event.timestamp,
      read: false,
      actionRequired: true,
      metadata: {
        account_id: event.data.account_id,
        account_name: event.data.account_name,
        session_id: event.data.session_id,
        error_category: event.data.error_category
      }
    };

    addNotification(notification);
    
    // Play alert sound for critical failures
    if (settings.alertSounds) {
      playAlertSound('critical');
    }
  };

  const shouldCreateNotification = (event: any): boolean => {
    switch (event.type) {
      case 'validation_completed':
        return settings.enableValidationAlerts && (
          event.data.status === 'failure' || 
          (event.data.status === 'success' && settings.enableSuccessNotifications)
        );
      case 'validation_failed':
        return settings.enableValidationAlerts;
      case 'critical_failure':
        return settings.enableCriticalFailures;
      case 'jit_verification_status':
        return settings.enableJitAlerts;
      default:
        return false;
    }
  };

  const getNotificationType = (eventType: string): ValidationNotification['type'] => {
    switch (eventType) {
      case 'validation_completed':
        return 'validation_success';
      case 'validation_failed':
        return 'validation_failure';
      case 'critical_failure':
        return 'critical_failure';
      case 'jit_verification_status':
        return 'jit_alert';
      default:
        return 'system_alert';
    }
  };

  const getNotificationTitle = (event: any): string => {
    switch (event.type) {
      case 'validation_completed':
        return event.data.status === 'success' ? 'Validation Successful' : 'Validation Failed';
      case 'validation_failed':
        return 'Account Validation Failed';
      case 'critical_failure':
        return 'CRITICAL VALIDATION FAILURE';
      case 'jit_verification_status':
        return 'JIT Verification Update';
      default:
        return 'System Notification';
    }
  };

  const getNotificationMessage = (event: any): string => {
    const accountName = event.data.account_name || 'Unknown Account';
    
    switch (event.type) {
      case 'validation_completed':
        return event.data.status === 'success' 
          ? `Account ${accountName} has been successfully validated`
          : `Account ${accountName} validation failed: ${event.data.error_message || 'Unknown error'}`;
      case 'validation_failed':
        return `Failed to validate ${accountName}: ${event.data.error_message || 'Connection error'}`;
      case 'critical_failure':
        return `Critical validation failure for ${accountName}. Immediate attention required.`;
      case 'jit_verification_status':
        return `JIT session verification update for ${accountName}`;
      default:
        return event.data.message || 'System notification';
    }
  };

  const getSeverityFromEvent = (event: any): ValidationNotification['severity'] => {
    if (event.type === 'critical_failure') return 'critical';
    if (event.type === 'validation_failed') return 'high';
    if (event.type === 'jit_verification_status' && event.data.status === 'failure') return 'medium';
    return 'low';
  };

  const addNotification = (notification: ValidationNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });
    setUnreadCount(prev => prev + 1);

    // Auto-show notifications panel for critical alerts
    if (notification.severity === 'critical') {
      setIsVisible(true);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const filtered = prev.filter(n => n.id !== notificationId);
      
      if (notification && !notification.read) {
        setUnreadCount(current => Math.max(0, current - 1));
      }
      
      return filtered;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: ValidationNotification) => {
    markAsRead(notification.id);
    onNotificationAction?.(notification);
  };

  const playAlertSound = (type: 'critical' | 'warning' | 'success') => {
    // Implementation would play different sounds based on type
    // For now, just using browser's built-in sound
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        type === 'critical' ? 'Critical alert' : 'Notification'
      );
      utterance.volume = 0.3;
      utterance.rate = 1.5;
      speechSynthesis.speak(utterance);
    }
  };

  const getNotificationIcon = (type: ValidationNotification['type']) => {
    switch (type) {
      case 'validation_success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'validation_failure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'critical_failure':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'jit_alert':
        return <Shield className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  // Filter notifications based on settings
  const filteredNotifications = notifications.filter(notification => {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[notification.severity] >= severityLevels[settings.minimumSeverity];
  });

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="danger" 
            className="absolute -top-1 -right-1 text-xs min-w-[20px] h-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </Button>

      {/* Notifications Panel */}
      {isVisible && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {!isConnected && (
                <Badge variant="warning" className="text-xs">Offline</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Settings</h4>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableValidationAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableValidationAlerts: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Validation alerts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableCriticalFailures}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableCriticalFailures: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Critical failures</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableSuccessNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableSuccessNotifications: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Success notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.alertSounds}
                    onChange={(e) => setSettings(prev => ({ ...prev, alertSounds: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Alert sounds</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-b border-gray-200 flex gap-2">
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                <Eye className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
              <Button variant="secondary" size="sm" onClick={clearAllNotifications}>
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={notification.severity === 'critical' ? 'danger' : 'default'}
                              className="text-xs"
                            >
                              {notification.severity}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;
