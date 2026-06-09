'use client';

import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import AdminModal from '@/src/components/admin/AdminModal';
import type { PermissionDef } from '@/src/lib/auth/permissions-catalog';

type RolePermissionsModalProps = {
  open: boolean;
  onClose: () => void;
  roleName: string;
  permissions: Record<string, boolean>;
  catalog: PermissionDef[];
  onSubmit: (permissions: Record<string, boolean>) => Promise<void>;
  readOnly?: boolean;
};

export default function RolePermissionsModal({
  open,
  onClose,
  roleName,
  permissions,
  catalog,
  onSubmit,
  readOnly = false,
}: RolePermissionsModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelected({ ...permissions });
  }, [permissions, open]);

  const modules = [...new Set(catalog.map((p) => p.module))];

  const toggle = (key: string) => {
    if (readOnly) return;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSubmit(selected);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Shield size={20} className="text-nexa-accent" />
          دسترسی‌های {roleName}
        </span>
      }
      maxWidth="lg"
      footer={
        readOnly ? (
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border">
            بستن
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border">
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-nexa-accent text-white disabled:opacity-50"
            >
              {loading ? 'در حال ذخیره…' : 'ذخیره'}
            </button>
          </>
        )
      }
    >
      <div className="space-y-6">
        {modules.map((mod) => (
          <div key={mod}>
            <h4 className="text-xs font-black text-gray-500 mb-2">{mod}</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {catalog
                .filter((p) => p.module === mod)
                .map((perm) => (
                  <button
                    key={perm.key}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggle(perm.key)}
                    className={`text-right px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selected[perm.key]
                        ? 'bg-nexa-accent/10 border-nexa-accent text-nexa-accent'
                        : 'bg-gray-50 border-transparent text-gray-600'
                    }`}
                  >
                    {perm.labelFa}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </AdminModal>
  );
}
