import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Notification } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Bell, CheckCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
      await refreshNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleClickItem = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(notifications.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n)));
        await refreshNotifications();
      } catch {}
    }

    if (notif.link) {
      if (notif.link.includes('request')) onNavigate('requests');
      else if (notif.link.includes('application')) onNavigate('applications');
      else if (notif.link.includes('admin')) onNavigate('admin');
      else if (notif.link.includes('verification')) onNavigate('verification');
      else onNavigate('dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Activity Notifications</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stay updated with tuition requests, job status changes, and interview alerts.
          </p>
        </div>

        <button
          onClick={handleMarkAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <Clock className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-xs text-slate-400">
          No notifications at this time. You're all caught up!
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-xs flex items-start justify-between gap-3 ${
                n.is_read
                  ? 'bg-white border-slate-200 opacity-80'
                  : 'bg-blue-50/50 border-blue-200 shadow-2xs font-medium'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                </div>
                <p className="text-slate-600 pl-4">{n.message}</p>
                <div className="text-[10px] text-slate-400 pl-4 font-mono">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
