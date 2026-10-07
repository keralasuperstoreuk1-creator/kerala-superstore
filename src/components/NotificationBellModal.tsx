'use client';

import React from 'react';
import { useSpecialsNotification } from '@/context/SpecialsNotificationContext';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Plane, 
  Flame, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Volume2
} from 'lucide-react';

export const NotificationBellModal: React.FC = () => {
  const {
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    notifications,
    markAsRead,
    markAllAsRead,
    requestPushPermission,
    pushPermission,
  } = useSpecialsNotification();

  if (!isNotificationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight flex items-center gap-1.5">
                <span>Store Alerts &amp; Kitchen Specials</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-[11px] text-slate-300">
                Fresh Biriyani drops, air cargo arrivals &amp; discounts
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Opt-in Prompt */}
        {pushPermission !== 'granted' && (
          <div className="bg-amber-50 border-b border-amber-200/80 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔔</span>
              <div className="text-left">
                <div className="text-xs font-bold text-amber-950">Never Miss a Fresh Biriyani Drop!</div>
                <div className="text-[10px] text-amber-800">Get instant alerts when daily kitchen specials are hot &amp; ready</div>
              </div>
            </div>
            <button
              onClick={requestPushPermission}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
            >
              Enable Alerts
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">
            {notifications.length} Total Announcements
          </span>
          <button
            onClick={markAllAsRead}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
              <div className="text-sm font-bold">No announcements yet</div>
              <div className="text-xs">Daily kitchen specials and air cargo alerts will appear here.</div>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.isRead;
              const icon = 
                item.type === 'special_item' ? '🍲' :
                item.type === 'cargo_arrival' ? '✈️' :
                item.type === 'deal' ? '🔥' : '📢';

              return (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex gap-3 relative group cursor-pointer ${
                    isUnread
                      ? 'bg-amber-50/60 border-amber-200/90 shadow-xs'
                      : 'bg-white border-slate-100 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    {icon}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.message}
                    </p>

                    {item.type === 'special_item' && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotificationModalOpen(false);
                            const el = document.getElementById('daily-specials-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <span>View Kitchen Specials</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-3 right-3" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Store Hub: Unit 2, 73 Old Market Street, M9 8DX</span>
          </span>
          <button
            onClick={() => setIsNotificationModalOpen(false)}
            className="px-3.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
