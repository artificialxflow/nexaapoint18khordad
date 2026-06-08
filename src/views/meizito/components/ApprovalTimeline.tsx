'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, MessageSquare, Send, XCircle } from 'lucide-react';
import type { MeizitoApprovalStep } from '@/src/types/meizito';
import { MEIZITO_APPROVAL_STATE_LABELS } from '@/src/types/meizito';
import type { MeizitoApprovalState } from '@/src/types/meizito';

const ACTION_ICON: Record<string, React.ReactNode> = {
  submit: <Send size={12} className="text-blue-600" />,
  approve: <CheckCircle2 size={12} className="text-emerald-600" />,
  reject: <XCircle size={12} className="text-rose-600" />,
  forward: <ArrowRight size={12} className="text-amber-600" />,
  comment: <MessageSquare size={12} className="text-gray-500" />,
  cancel: <XCircle size={12} className="text-gray-400" />,
};

const ACTION_LABEL: Record<string, string> = {
  submit: 'ارسال',
  approve: 'تایید',
  reject: 'رد',
  forward: 'ارجاع',
  comment: 'نظر',
  cancel: 'لغو',
};

type Props = {
  steps: MeizitoApprovalStep[];
  approvalState?: MeizitoApprovalState;
};

export default function ApprovalTimeline({ steps, approvalState }: Props) {
  if (!steps.length && !approvalState) return null;

  return (
    <div className="space-y-2" dir="rtl">
      {approvalState && (
        <p className="text-[10px] font-bold text-gray-500">
          وضعیت: {MEIZITO_APPROVAL_STATE_LABELS[approvalState]}
        </p>
      )}
      <ul className="space-y-2 border-r-2 border-gray-100 pr-3">
        {steps.map((s) => (
          <li key={s.id} className="text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {ACTION_ICON[s.action] ?? null}
              <span className="font-bold text-gray-800">{s.actorName}</span>
              <span className="text-gray-400">{ACTION_LABEL[s.action] ?? s.action}</span>
              {s.forwardedToNames && s.forwardedToNames.length > 0 ? (
                <span className="text-amber-700 text-[10px]">→ {s.forwardedToNames.join('، ')}</span>
              ) : s.forwardedToName ? (
                <span className="text-amber-700 text-[10px]">→ {s.forwardedToName}</span>
              ) : null}
              <span className="text-[9px] text-gray-400 font-fa-num mr-auto">
                {new Date(s.at).toLocaleString('fa-IR')}
              </span>
            </div>
            {s.comment && <p className="text-[10px] text-gray-600 mt-0.5 mr-5">{s.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
