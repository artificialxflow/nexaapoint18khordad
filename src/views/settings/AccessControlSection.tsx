'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  Eye,
  MoreVertical,
  UserCheck,
  UserX,
  X,
  Check,
  Settings,
  ShieldAlert,
  Landmark,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/src/context/SettingsContext';
import type { AccessLevelPreset } from '@/src/types/settings';

type UserStatus = 'active' | 'inactive';

interface SysUser {
  id: string;
  name: string;
  role: string;
  email: string;
  lastLogin: string;
  status: UserStatus;
}

interface Permission {
  id: string;
  label: string;
  module: string;
}

interface RoleRow {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

const initialUsers: SysUser[] = [
  { id: '1', name: 'امیرحسین نکسایی', role: 'مدیر کل سیستم', email: 'admin@nexa.ir', lastLogin: 'امروز، ۱۰:۳۰', status: 'active' },
  { id: '2', name: 'سارا احمدی', role: 'کارشناس فروش', email: 'sara@nexa.ir', lastLogin: 'دیروز، ۱۸:۱۵', status: 'active' },
  { id: '3', name: 'رضا علوی', role: 'مدیر تولید', email: 'alavi@nexa.ir', lastLogin: '۳ روز پیش', status: 'active' },
  { id: '4', name: 'مریم سعیدی', role: 'طراح داخلی', email: 'maryam@nexa.ir', lastLogin: '۱ هفته پیش', status: 'inactive' },
];

const initialRoles: RoleRow[] = [
  { id: 'r1', name: 'مدیر کل سیستم', permissions: ['all'], userCount: 1 },
  { id: 'r2', name: 'کارشناس فروش', permissions: ['sales_view', 'sales_edit', 'crm_view'], userCount: 5 },
  { id: 'r3', name: 'مدیر مالی', permissions: ['finance_all', 'reports_view'], userCount: 2 },
];

const availablePermissions: Permission[] = [
  { id: 'sales_view', label: 'مشاهده فروش', module: 'فروش' },
  { id: 'sales_edit', label: 'ثبت و ویرایش فاکتور', module: 'فروش' },
  { id: 'finance_view', label: 'مشاهده مالی', module: 'مالی' },
  { id: 'finance_edit', label: 'مدیریت تراکنش‌ها', module: 'مالی' },
  { id: 'inventory_view', label: 'مشاهده انبار', module: 'انبار' },
  { id: 'inventory_edit', label: 'مدیریت موجودی', module: 'انبار' },
  { id: 'users_view', label: 'مشاهده کاربران', module: 'سیستم' },
  { id: 'users_edit', label: 'مدیریت دسترسی‌ها', module: 'سیستم' },
  { id: 'reports_view', label: 'مشاهده گزارشات', module: 'گزارشات' },
];

type AccessSub = 'management' | 'level' | 'restrictions' | 'banks';

const LEVEL_OPTIONS: { id: AccessLevelPreset; label: string; desc: string }[] = [
  { id: 'full', label: 'دسترسی کامل', desc: 'مشابه مدیر سیستم (۰۹)' },
  { id: 'sales-only', label: 'تمرکز فروش', desc: 'فروش و CRM' },
  { id: 'finance-only', label: 'تمرکز مالی', desc: 'مالی و گزارش' },
  { id: 'custom', label: 'سفارشی', desc: 'ترکیب نقش و محدودیت (۰۷–۱۱)' },
];

export default function AccessControlSection() {
  const { accessLevelPreset, setAccessLevelPreset, bankAccessExamples, setBankAccessAllowed } = useSettings();
  const [accessSub, setAccessSub] = useState<AccessSub>('management');
  const [innerTab, setInnerTab] = useState<'users' | 'roles'>('users');
  const [usersList, setUsersList] = useState<SysUser[]>(initialUsers);
  const [rolesList, setRolesList] = useState<RoleRow[]>(initialRoles);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'کارشناس فروش', type: 'password' as 'password' | 'link' });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });
  const [restrictionToggles, setRestrictionToggles] = useState({
    ownSalesOnly: false,
    ownPurchaseOnly: false,
    timeWindow: false,
  });

  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      const matchesSearch = user.name.includes(searchQuery) || user.email.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, searchQuery, statusFilter]);

  const handleAddUser = () => {
    const user: SysUser = {
      id: Math.random().toString(36).slice(2, 11),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      lastLogin: 'هرگز',
      status: 'active',
    };
    setUsersList([user, ...usersList]);
    setIsUserModalOpen(false);
    setNewUser({ name: '', email: '', role: 'کارشناس فروش', type: 'password' });
  };

  const handleAddRole = () => {
    const role: RoleRow = {
      id: 'r' + (rolesList.length + 1),
      name: newRole.name,
      permissions: newRole.permissions,
      userCount: 0,
    };
    setRolesList([...rolesList, role]);
    setIsRoleModalOpen(false);
    setNewRole({ name: '', permissions: [] });
  };

  const togglePermission = (permId: string) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((id) => id !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const deleteUser = (id: string) => {
    setUsersList(usersList.filter((u) => u.id !== id));
    setIsActionMenuOpen(null);
  };

  const toggleUserStatus = (id: string) => {
    setUsersList(
      usersList.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
    setIsActionMenuOpen(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        مدیریت کاربران، تعیین دسترسی، سطح، محدودیت و نمونه محدودیت بانک — تصاویر ۰۷ تا ۱۱
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
        <>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setInnerTab('users')}
                className={`px-6 py-2 rounded-xl text-xs font-bold ${
                  innerTab === 'users' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'
                }`}
              >
                لیست کاربران
              </button>
              <button
                type="button"
                onClick={() => setInnerTab('roles')}
                className={`px-6 py-2 rounded-xl text-xs font-bold ${
                  innerTab === 'roles' ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'
                }`}
              >
                تعریف نقش‌ها
              </button>
            </div>
            <button type="button" onClick={() => setIsUserModalOpen(true)} className="nexa-btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} />
              افزودن کاربر
            </button>
          </div>

          <AnimatePresence mode="wait">
            {innerTab === 'users' ? (
              <motion.div key="u" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="nexa-card p-4 flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو..."
                      className="w-full bg-gray-50 rounded-2xl py-2.5 pr-10 pl-4 text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold ${
                          statusFilter === s ? 'bg-nexa-primary text-white' : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {s === 'all' ? 'همه' : s === 'active' ? 'فعال' : 'غیرفعال'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="nexa-card overflow-hidden">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-nexa-border text-xs text-gray-400">
                        <th className="px-4 py-3">کاربر</th>
                        <th className="px-4 py-3">نقش</th>
                        <th className="px-4 py-3">آخرین ورود</th>
                        <th className="px-4 py-3">وضعیت</th>
                        <th className="px-4 py-3">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexa-border">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-xl bg-nexa-accent/10 text-nexa-accent flex items-center justify-center font-black text-xs">
                                {user.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-[10px] text-gray-400 font-fa-num">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{user.role}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-fa-num">{user.lastLogin}</td>
                          <td className="px-4 py-3">
                            {user.status === 'active' ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                                <UserCheck size={12} /> فعال
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                                <UserX size={12} /> غیرفعال
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 relative">
                            <button
                              type="button"
                              onClick={() => setIsActionMenuOpen(isActionMenuOpen === user.id ? null : user.id)}
                              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                            >
                              <MoreVertical size={18} />
                            </button>
                            <AnimatePresence>
                              {isActionMenuOpen === user.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setIsActionMenuOpen(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute left-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-nexa-border z-20 p-2 space-y-1"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleUserStatus(user.id)}
                                      className="w-full text-right text-xs font-bold px-2 py-2 rounded-xl hover:bg-gray-50"
                                    >
                                      تغییر وضعیت
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteUser(user.id)}
                                      className="w-full text-right text-xs font-bold text-rose-600 px-2 py-2 rounded-xl hover:bg-rose-50"
                                    >
                                      حذف
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900">نقش‌ها</h3>
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-nexa-accent/10 text-nexa-accent rounded-xl text-xs font-bold"
                  >
                    <Plus size={16} />
                    نقش جدید
                  </button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rolesList.map((role) => (
                    <div key={role.id} className="nexa-card p-5">
                      <div className="flex justify-between mb-3">
                        <Shield className="text-gray-400" size={22} />
                        <Settings size={16} className="text-gray-300" />
                      </div>
                      <h4 className="text-sm font-black text-gray-900">{role.name}</h4>
                      <p className="text-[10px] text-gray-400 mb-3 font-fa-num">{role.userCount} کاربر</p>
                      <button
                        type="button"
                        className="w-full py-2 border border-nexa-border rounded-xl text-[10px] font-bold text-gray-600 flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        مشاهده دسترسی‌ها
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {accessSub === 'level' && (
        <div className="nexa-card p-6 space-y-4">
          <h3 className="text-sm font-black text-gray-900">تنظیم سطح دسترسی (۰۹)</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccessLevelPreset(opt.id)}
                className={`p-4 rounded-2xl border-2 text-right transition-all ${
                  accessLevelPreset === opt.id
                    ? 'border-nexa-accent bg-nexa-accent/5'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <p className="text-sm font-black text-gray-900">{opt.label}</p>
                <p className="text-[10px] text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {accessSub === 'restrictions' && (
        <div className="nexa-card p-6 space-y-4">
          <h3 className="text-sm font-black text-gray-900">محدودیت‌های دسترسی (۱۰)</h3>
          {(
            [
              { key: 'ownSalesOnly' as const, label: 'فقط فاکتور فروش ثبت‌شده توسط خود کاربر' },
              { key: 'ownPurchaseOnly' as const, label: 'فقط فاکتور خرید ثبت‌شده توسط خود کاربر' },
              { key: 'timeWindow' as const, label: 'محدودیت بازه زمانی ورود به سیستم' },
            ] as const
          ).map((row) => (
            <label key={row.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <span className="text-xs font-bold text-gray-800">{row.label}</span>
              <input
                type="checkbox"
                checked={restrictionToggles[row.key]}
                onChange={(e) =>
                  setRestrictionToggles((t) => ({ ...t, [row.key]: e.target.checked }))
                }
                className="w-4 h-4 accent-nexa-accent"
              />
            </label>
          ))}
        </div>
      )}

      {accessSub === 'banks' && (
        <div className="nexa-card overflow-hidden">
          <div className="p-4 border-b border-nexa-border text-sm font-black text-gray-900">مثال دسترسی به بانک‌ها (۱۱)</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2 text-right">بانک / صندوق</th>
                <th className="px-4 py-2 text-right">اجازه گردش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {bankAccessExamples.map((b) => (
                <tr key={b.bankId}>
                  <td className="px-4 py-3 font-bold">{b.bankName}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setBankAccessAllowed(b.bankId, !b.allowed)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        b.allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {b.allowed ? 'مجاز' : 'ممنوع'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsUserModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-nexa-border"
            >
              <div className="p-4 border-b border-nexa-border flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2">
                  <UserCog className="text-nexa-accent" size={20} />
                  افزودن کاربر
                </h3>
                <button type="button" onClick={() => setIsUserModalOpen(false)}>
                  <X size={22} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="نام"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="ایمیل"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="bg-gray-50 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddUser} className="flex-1 nexa-btn-primary py-2.5 text-sm font-bold">
                    ثبت
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 bg-gray-100 rounded-xl py-2.5 text-sm font-bold"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsRoleModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-nexa-border flex justify-between">
                <h3 className="font-black flex items-center gap-2">
                  <ShieldAlert className="text-nexa-accent" size={20} />
                  نقش جدید
                </h3>
                <button type="button" onClick={() => setIsRoleModalOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <input
                  placeholder="نام نقش"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm"
                />
                <div className="grid md:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                  {availablePermissions.map((perm) => (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => togglePermission(perm.id)}
                      className={`flex justify-between p-3 rounded-xl border-2 text-right ${
                        newRole.permissions.includes(perm.id)
                          ? 'border-nexa-accent bg-nexa-accent/5'
                          : 'border-transparent bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{perm.label}</span>
                      {newRole.permissions.includes(perm.id) ? <Check size={14} /> : null}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!newRole.name}
                    onClick={handleAddRole}
                    className="flex-1 nexa-btn-primary py-2.5 text-sm disabled:opacity-50"
                  >
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="flex-1 bg-gray-100 rounded-xl py-2.5 text-sm font-bold"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
