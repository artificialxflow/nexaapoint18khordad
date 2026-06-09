'use client';

import React, { useState } from 'react';
import {
  Landmark,
  ShieldAlert,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import UsersTab from '@/src/views/settings/access/UsersTab';
import RolesTab from '@/src/views/settings/access/RolesTab';
import AccessLevelTab from '@/src/views/settings/access/AccessLevelTab';
import RestrictionsTab from '@/src/views/settings/access/RestrictionsTab';
import BankAccessTab from '@/src/views/settings/access/BankAccessTab';
import { useAuth } from '@/src/context/AuthContext';

type AccessSub = 'management' | 'level' | 'restrictions' | 'banks';

export default function AccessControlSection() {
  const { user } = useAuth();
  const canRead = Boolean(user?.systemRole.permissions['users:read'] || user?.systemRole.slug === 'super_admin');
  const [accessSub, setAccessSub] = useState<AccessSub>('management');
  const [innerTab, setInnerTab] = useState<'users' | 'roles'>('users');

  if (!canRead) {
    return <p className="text-sm text-gray-500">دسترسی به مدیریت کاربران ندارید.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        مدیریت کاربران، تعیین دسترسی، سطح، محدودیت و دسترسی بانک — داده از پایگاه PostgreSQL
      </p>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'management' as const, label: 'کاربران و نقش‌ها', icon: UserCog },
            { id: 'level' as const, label: 'سطح دسترسی', icon: SlidersHorizontal },
            { id: 'restrictions' as const, label: 'محدودیت‌ها', icon: ShieldAlert },
            { id: 'banks' as const, label: 'دسترسی بانک', icon: Landmark },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAccessSub(item.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              accessSub === item.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {accessSub === 'management' && (
        <UsersTab innerTab={innerTab} onInnerTabChange={setInnerTab} rolesSlot={<RolesTab />} />
      )}
      {accessSub === 'level' && <AccessLevelTab />}
      {accessSub === 'restrictions' && <RestrictionsTab />}
      {accessSub === 'banks' && <BankAccessTab />}
    </div>
  );
}
