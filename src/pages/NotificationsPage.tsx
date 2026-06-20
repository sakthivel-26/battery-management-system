import React from 'react';
import { useStore } from '@/store/useStore';
import { Bell, AlertTriangle, Package, Clock, Info, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'out_of_stock': return <Package size={16} className="text-rose-500" />;
      case 'expiry': return <Clock size={16} className="text-orange-500" />;
      case 'payment_due': return <Bell size={16} className="text-blue-500" />;
      default: return <Info size={16} className="text-gray-500" />;
    }
  };

  const getBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 dark:bg-gray-800';
    switch (type) {
      case 'low_stock': return 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-500';
      case 'out_of_stock': return 'bg-rose-50 dark:bg-rose-900/10 border-l-4 border-l-rose-500';
      case 'expiry': return 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-orange-500';
      default: return 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllNotificationsRead} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && markNotificationRead(notif.id)}
              className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 ${getBg(notif.type, notif.isRead)}`}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notif.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>{notif.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(notif.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
