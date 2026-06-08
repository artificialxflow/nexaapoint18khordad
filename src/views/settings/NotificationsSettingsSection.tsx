'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';

export default function NotificationsSettingsSection() {
  const { notificationRules, setNotificationRule } = useSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="text-nexa-accent" size={22} />
        <h2 className="text-lg font-black text-gray-900">اعلانات و یادآوری</h2>
        <span className="text-xs text-gray-500">۱۶ — چک، اقساط، اعتبار</span>
      </div>
      <div className="space-y-3">
        {notificationRules.map((rule) => (
          <div
            key={rule.id}
            className="nexa-card p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{rule.title}</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{rule.description}</p>
                <p className="text-[9px] text-nexa-accent font-bold mt-2">
                  کانال:{' '}
                  {rule.channel === 'in-app' ? 'داخل برنامه' : rule.channel === 'sms' ? 'پیامک' : 'ایمیل'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <select
                value={rule.channel}
                onChange={(e) =>
                  setNotificationRule(rule.id, {
                    channel: e.target.value as 'in-app' | 'sms' | 'email',
                  })
                }
                className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="in-app">داخل برنامه</option>
                <option value="sms">پیامک</option>
                <option value="email">ایمیل</option>
              </select>
              <button
                type="button"
                onClick={() => setNotificationRule(rule.id, { enabled: !rule.enabled })}
                className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${
                  rule.enabled ? 'bg-nexa-accent' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${
                    rule.enabled ? 'right-1' : 'right-6'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
