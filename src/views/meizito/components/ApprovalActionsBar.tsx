'use client';

import React, { useState } from 'react';
import { CheckCircle2, Forward, XCircle } from 'lucide-react';
import type { MeizitoApprovalState, MeizitoMockUser } from '@/src/types/meizito';
import type { RecordApprovalPayload } from '@/src/lib/meizito/approval';
import { MAX_REFERRAL_TARGETS } from '@/src/lib/meizito/teamHierarchy';

type Props = {
  approvalState?: MeizitoApprovalState;
  currentAssigneeId?: string;
  currentUserId: string;
  authorId: string;
  mockUsers: MeizitoMockUser[];
  onAction: (payload: Omit<RecordApprovalPayload, 'actorId' | 'actorName'>) => void;
};

export default function ApprovalActionsBar({
  approvalState,
  currentAssigneeId,
  currentUserId,
  authorId,
  mockUsers,
  onAction,
}: Props) {
  const [rejectComment, setRejectComment] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [forwardToIds, setForwardToIds] = useState<string[]>([]);
  const [showForward, setShowForward] = useState(false);

  const canAct = approvalState === 'pending' && currentAssigneeId === currentUserId;
  const canCancel = approvalState === 'pending' && authorId === currentUserId;

  if (!canAct && !canCancel) return null;

  const toggleForwardTarget = (userId: string) => {
    setForwardToIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= MAX_REFERRAL_TARGETS) return prev;
      return [...prev, userId];
    });
  };

  const submitForward = () => {
    if (forwardToIds.length === 0) return;
    const names = forwardToIds.map((id) => mockUsers.find((u) => u.id === id)?.name ?? id);
    onAction({
      action: 'forward',
      forwardToUserIds: forwardToIds,
      forwardToUserNames: names,
      forwardToUserId: forwardToIds[0],
      forwardToUserName: names[0],
    });
    setShowForward(false);
    setForwardToIds([]);
  };

  return (
    <div className="space-y-2 pt-3 border-t border-nexa-border" dir="rtl">
      <p className="text-xs font-bold text-gray-700">اقدام تایید</p>
      {canAct && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="تایید"
            onClick={() => onAction({ action: 'approve' })}
            className="nexa-btn-primary text-[10px] font-bold px-3 py-1.5 flex items-center gap-1"
          >
            <CheckCircle2 size={12} />
            تایید
          </button>
          <button
            type="button"
            aria-label="رد"
            onClick={() => setShowReject((v) => !v)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
          >
            <XCircle size={12} />
            رد
          </button>
          <button
            type="button"
            aria-label="ارجاع"
            onClick={() => setShowForward((v) => !v)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
          >
            <Forward size={12} />
            ارجاع
          </button>
        </div>
      )}
      {canAct && showReject && (
        <div className="space-y-2">
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={2}
            placeholder="دلیل رد (الزامی)"
            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={!rejectComment.trim()}
            onClick={() => {
              onAction({ action: 'reject', comment: rejectComment.trim() });
              setShowReject(false);
              setRejectComment('');
            }}
            className="text-[10px] font-bold text-rose-600 hover:underline disabled:opacity-40"
          >
            ثبت رد
          </button>
        </div>
      )}
      {canAct && showForward && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500">ارجاع به (حداکثر {MAX_REFERRAL_TARGETS} نفر)</p>
          <ul className="space-y-1 max-h-36 overflow-y-auto">
            {mockUsers
              .filter((u) => u.id !== currentUserId)
              .map((u) => (
                <li key={u.id}>
                  <label className="flex items-center gap-2 text-xs cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={forwardToIds.includes(u.id)}
                      onChange={() => toggleForwardTarget(u.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="font-bold">{u.name}</span>
                    {u.department && <span className="text-gray-400 text-[10px]">· {u.department}</span>}
                  </label>
                </li>
              ))}
          </ul>
          <button
            type="button"
            disabled={forwardToIds.length === 0}
            onClick={submitForward}
            className="nexa-btn-primary text-[10px] font-bold px-3 py-1.5"
          >
            ارجاع
          </button>
        </div>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={() => onAction({ action: 'cancel', comment: 'لغو توسط نویسنده' })}
          className="text-[10px] font-bold text-gray-500 hover:underline"
        >
          لغو درخواست تایید
        </button>
      )}
    </div>
  );
}
