'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PersonCombobox from '@/src/components/PersonCombobox';
import { useCatalog } from '@/src/context/CatalogContext';
import { useMeizito } from '@/src/context/MeizitoContext';
import { useSettings } from '@/src/context/SettingsContext';
import {
  buildCustomerName,
  formatVisitWeekday,
  showEstimatedSaleRange,
} from '@/src/lib/meizito/visitHelpers';
import type {
  MeizitoFieldVisit,
  MeizitoPurchaseProbability,
  MeizitoSupplementaryVoice,
  MeizitoVisitGender,
  MeizitoVisitKind,
  MeizitoVisitResult,
} from '@/src/types/meizito';
import {
  MEIZITO_PURCHASE_PROBABILITY_LABELS,
  MEIZITO_VISIT_GENDER_LABELS,
  MEIZITO_VISIT_KIND_LABELS,
  MEIZITO_VISIT_RESULT_LABELS,
  MEIZITO_VISIT_TITLE_OPTIONS,
} from '@/src/types/meizito';

type Props = {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  editVisit?: MeizitoFieldVisit | null;
};

const RESULTS: MeizitoVisitResult[] = ['positive', 'neutral', 'negative'];
const PROBS: MeizitoPurchaseProbability[] = ['unknown', 'low', 'medium', 'high'];
const GENDERS: MeizitoVisitGender[] = ['male', 'female', 'unknown'];

function durationFromTimes(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  if (Number.isNaN(fh) || Number.isNaN(th)) return 30;
  const mins = th * 60 + (tm || 0) - (fh * 60 + (fm || 0));
  return Math.max(1, mins > 0 ? mins : 30);
}

function inferGenderFromTitle(title: string): MeizitoVisitGender {
  if (title.includes('خانم')) return 'female';
  if (title.includes('آقا')) return 'male';
  return 'unknown';
}

export default function FieldVisitModal({ open, onClose, dateKey, editVisit }: Props) {
  const { people } = useCatalog();
  const {
    currentUserId,
    currentUserName,
    addFieldVisit,
    updateFieldVisit,
    fieldVisits,
    addCalendarEvent,
  } = useMeizito();
  const {
    getVisitPriorityOptions,
    getCustomerTypeOptions,
    getAcquaintanceOptions,
    getContactMethodOptions,
    getGroupMembershipOptions,
    getProductInterestOptions,
    getPurchaseProbabilityLevelOptions,
    getEstimatedSaleRangeOptions,
  } = useSettings();
  const priorityOptions = getVisitPriorityOptions();
  const customerTypeOptions = getCustomerTypeOptions();
  const acquaintanceOptions = getAcquaintanceOptions();
  const contactMethodOptions = getContactMethodOptions();
  const groupOptions = getGroupMembershipOptions();
  const productOptions = getProductInterestOptions();
  const probabilityLevelOptions = getPurchaseProbabilityLevelOptions();
  const saleRangeOptions = getEstimatedSaleRangeOptions();

  const [visitKind, setVisitKind] = useState<MeizitoVisitKind>('new');
  const [priorVisitId, setPriorVisitId] = useState<string>('');

  const [visitDate, setVisitDate] = useState(dateKey);
  const [visitorGender, setVisitorGender] = useState<MeizitoVisitGender>('unknown');
  const [visitorTitle, setVisitorTitle] = useState('');
  const [visitorFirstName, setVisitorFirstName] = useState('');
  const [visitorLastName, setVisitorLastName] = useState('');
  const [personId, setPersonId] = useState<string | undefined>();
  const [customerMobile, setCustomerMobile] = useState('');
  const [timeFrom, setTimeFrom] = useState('10:00');
  const [timeTo, setTimeTo] = useState('11:00');
  const [visitedBy, setVisitedBy] = useState(currentUserName);
  const [maleCompanionCount, setMaleCompanionCount] = useState('0');
  const [femaleCompanionCount, setFemaleCompanionCount] = useState('0');
  const [hasDesigner, setHasDesigner] = useState(false);
  const [designerName, setDesignerName] = useState('');
  const [designerMobile, setDesignerMobile] = useState('');
  const [likedItems, setLikedItems] = useState('');
  const [customerPriorities, setCustomerPriorities] = useState('');
  const [interests, setInterests] = useState('');
  const [priorityTags, setPriorityTags] = useState<string[]>([]);
  const [purchaseProbability, setPurchaseProbability] =
    useState<MeizitoPurchaseProbability>('unknown');
  const [result, setResult] = useState<MeizitoVisitResult>('neutral');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [customerTypeId, setCustomerTypeId] = useState('');
  const [acquaintanceSourceId, setAcquaintanceSourceId] = useState('');
  const [contactMethodId, setContactMethodId] = useState('showroom');
  const [salesConsultantName, setSalesConsultantName] = useState('');
  const [followUp1, setFollowUp1] = useState('');
  const [followUp2, setFollowUp2] = useState('');
  const [followUp3, setFollowUp3] = useState('');
  const [voice, setVoice] = useState<MeizitoSupplementaryVoice | null>(null);
  const [createCalendarTask, setCreateCalendarTask] = useState(true);
  const [groupMembershipId, setGroupMembershipId] = useState('');
  const [productInterestIds, setProductInterestIds] = useState<string[]>([]);
  const [birthDate, setBirthDate] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressFull, setAddressFull] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [purchaseProbabilityLevelId, setPurchaseProbabilityLevelId] = useState('');
  const [estimatedSaleRangeId, setEstimatedSaleRangeId] = useState('');
  const [designerClubMember, setDesignerClubMember] = useState<boolean | undefined>();
  const [designerPriorCollaboration, setDesignerPriorCollaboration] = useState<boolean | undefined>();
  const [returnInterestNotes, setReturnInterestNotes] = useState('');
  const [returnAgreements, setReturnAgreements] = useState('');
  const [returnFollowUpNeeds, setReturnFollowUpNeeds] = useState('');

  const recentVisits = fieldVisits.slice(0, 20);

  const loadFromVisit = (v: MeizitoFieldVisit) => {
    setVisitDate(v.date);
    setVisitKind(v.visitKind ?? 'new');
    setPriorVisitId(v.priorVisitId ?? '');
    setVisitorGender(v.visitorGender ?? 'unknown');
    setVisitorTitle(v.visitorTitle ?? '');
    setVisitorFirstName(v.visitorFirstName ?? '');
    setVisitorLastName(v.visitorLastName ?? '');
    setPersonId(v.personId);
    setCustomerMobile(v.customerMobile ?? '');
    setTimeFrom(v.timeFrom ?? v.time ?? '10:00');
    setTimeTo(v.timeTo ?? '11:00');
    setVisitedBy(v.visitedBy ?? currentUserName);
    setMaleCompanionCount(String(v.maleCompanionCount ?? 0));
    setFemaleCompanionCount(String(v.femaleCompanionCount ?? 0));
    setHasDesigner(v.hasDesigner ?? false);
    setDesignerName(v.designerName === '—' ? '' : v.designerName);
    setDesignerMobile(v.designerMobile ?? '');
    setLikedItems(v.likedItems ?? '');
    setCustomerPriorities(v.customerPriorities ?? '');
    setInterests(v.interests ?? '');
    setPriorityTags(v.priorityTags ?? []);
    setPurchaseProbability(v.purchaseProbability ?? 'unknown');
    setResult(v.result);
    setNotes(v.notes ?? '');
    setDescription(v.description ?? v.notes ?? '');
    setCustomerTypeId(v.customerTypeId ?? '');
    setAcquaintanceSourceId(v.acquaintanceSourceId ?? '');
    setContactMethodId(v.contactMethodId ?? 'showroom');
    setSalesConsultantName(v.salesConsultantName ?? v.authorName);
    const acts = v.followUpActions ?? [];
    setFollowUp1(acts[0] ?? '');
    setFollowUp2(acts[1] ?? '');
    setFollowUp3(acts[2] ?? '');
    setVoice(v.supplementaryVoice ?? null);
    setGroupMembershipId(v.groupMembershipId ?? '');
    setProductInterestIds(v.productInterestIds ?? []);
    setBirthDate(v.birthDate ?? '');
    setAddressCity(v.addressCity ?? '');
    setAddressDistrict(v.addressDistrict ?? '');
    setAddressFull(v.addressFull ?? '');
    setNationalId(v.nationalId ?? '');
    setPurchaseProbabilityLevelId(v.purchaseProbabilityLevelId ?? '');
    setEstimatedSaleRangeId(v.estimatedSaleRangeId ?? '');
    setDesignerClubMember(v.designerClubMember);
    setDesignerPriorCollaboration(v.designerPriorCollaboration);
    setReturnInterestNotes(v.returnInterestNotes ?? '');
    setReturnAgreements(v.returnAgreements ?? '');
    setReturnFollowUpNeeds(v.returnFollowUpNeeds ?? '');
  };

  useEffect(() => {
    if (!open) return;
    if (editVisit) loadFromVisit(editVisit);
    else {
      setVisitDate(dateKey);
      setSalesConsultantName(currentUserName);
    }
  }, [open, dateKey, editVisit, currentUserName]);

  const toggleTag = (tagId: string) => {
    setPriorityTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const onCustomerChange = (displayName: string, id?: string) => {
    if (!id) return;
    setPersonId(id);
    const p = people.find((x) => x.id === id);
    if (!p) return;
    if (p.kind === 'legal') {
      setVisitorFirstName(p.legalName || p.displayName);
      setVisitorLastName('');
      setVisitorTitle('');
      setVisitorGender('unknown');
    } else {
      setVisitorTitle(p.title ?? '');
      setVisitorFirstName(p.firstName ?? p.displayName.split(/\s+/)[0] ?? '');
      setVisitorLastName(p.lastName ?? '');
      setVisitorGender(inferGenderFromTitle(p.title ?? '') || inferGenderFromTitle(p.displayName));
    }
    if (p.phones[0]?.number) setCustomerMobile(p.phones[0].number);
  };

  const reset = () => {
    setVisitDate(dateKey);
    setVisitorGender('unknown');
    setVisitorTitle('');
    setVisitorFirstName('');
    setVisitorLastName('');
    setPersonId(undefined);
    setCustomerMobile('');
    setTimeFrom('10:00');
    setTimeTo('11:00');
    setVisitedBy(currentUserName);
    setMaleCompanionCount('0');
    setFemaleCompanionCount('0');
    setHasDesigner(false);
    setDesignerName('');
    setDesignerMobile('');
    setLikedItems('');
    setCustomerPriorities('');
    setInterests('');
    setPriorityTags([]);
    setPurchaseProbability('unknown');
    setResult('neutral');
    setNotes('');
    setDescription('');
    setCustomerTypeId('');
    setAcquaintanceSourceId('');
    setContactMethodId('showroom');
    setSalesConsultantName(currentUserName);
    setFollowUp1('');
    setFollowUp2('');
    setFollowUp3('');
    setVoice(null);
    setCreateCalendarTask(true);
    setVisitKind('new');
    setPriorVisitId('');
    setGroupMembershipId('');
    setProductInterestIds([]);
    setBirthDate('');
    setAddressCity('');
    setAddressDistrict('');
    setAddressFull('');
    setNationalId('');
    setPurchaseProbabilityLevelId('');
    setEstimatedSaleRangeId('');
    setDesignerClubMember(undefined);
    setDesignerPriorCollaboration(undefined);
    setReturnInterestNotes('');
    setReturnAgreements('');
    setReturnFollowUpNeeds('');
  };

  const toggleProduct = (id: string) => {
    setProductInterestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onVoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setVoice({ fileName: file.name, dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const buildPayload = (): Omit<MeizitoFieldVisit, 'id' | 'createdAt'> => {
    const male = Math.max(0, parseInt(maleCompanionCount, 10) || 0);
    const female = Math.max(0, parseInt(femaleCompanionCount, 10) || 0);
    const customerName = buildCustomerName({
      visitorTitle,
      visitorFirstName,
      visitorLastName,
      visitorGender,
    });
    const durationMinutes = durationFromTimes(timeFrom, timeTo);
    const followUpActions = [followUp1, followUp2, followUp3].map((s) => s.trim()).filter(Boolean);
    return {
      visitKind,
      priorVisitId: priorVisitId || undefined,
      date: visitDate,
      timeFrom,
      timeTo,
      time: timeFrom,
      customerName,
      personId,
      customerMobile: customerMobile.trim() || undefined,
      visitorGender,
      visitorTitle: visitorTitle.trim() || undefined,
      visitorFirstName: visitorFirstName.trim(),
      visitorLastName: visitorLastName.trim(),
      maleCompanionCount: male,
      femaleCompanionCount: female,
      designerName: hasDesigner ? designerName.trim() || '—' : '—',
      visitedBy: visitedBy.trim() || '—',
      hasDesigner,
      designerMobile: hasDesigner ? designerMobile.trim() || undefined : undefined,
      designerClubMember: hasDesigner ? designerClubMember : undefined,
      designerPriorCollaboration: hasDesigner ? designerPriorCollaboration : undefined,
      durationMinutes,
      visitorCount: 1 + male + female,
      likedItems: likedItems.trim() || undefined,
      customerPriorities: customerPriorities.trim() || undefined,
      interests: interests.trim() || undefined,
      priorityTags: priorityTags.length ? priorityTags : undefined,
      purchaseProbability,
      purchaseProbabilityLevelId: purchaseProbabilityLevelId || undefined,
      estimatedSaleRangeId:
        showEstimatedSaleRange(purchaseProbabilityLevelId) && estimatedSaleRangeId
          ? estimatedSaleRangeId
          : undefined,
      result,
      notes: notes.trim() || description.trim() || undefined,
      description: description.trim() || undefined,
      customerTypeId: customerTypeId || undefined,
      acquaintanceSourceId: acquaintanceSourceId || undefined,
      contactMethodId: contactMethodId || undefined,
      salesConsultantName: salesConsultantName.trim() || currentUserName,
      followUpActions: followUpActions.length ? followUpActions : undefined,
      supplementaryVoice: voice ?? undefined,
      groupMembershipId: groupMembershipId || undefined,
      productInterestIds: productInterestIds.length ? productInterestIds : undefined,
      birthDate: birthDate || undefined,
      addressCity: addressCity.trim() || undefined,
      addressDistrict: addressDistrict.trim() || undefined,
      addressFull: addressFull.trim() || undefined,
      nationalId: nationalId.trim() || undefined,
      returnInterestNotes: returnInterestNotes.trim() || undefined,
      returnAgreements: returnAgreements.trim() || undefined,
      returnFollowUpNeeds: returnFollowUpNeeds.trim() || undefined,
      authorId: currentUserId,
      authorName: currentUserName,
    };
  };

  const submit = () => {
    if (visitKind === 'new' && !visitorFirstName.trim() && !visitorLastName.trim()) return;
    const payload = buildPayload();
    let calendarEventId: string | undefined;
    if (createCalendarTask && payload.followUpActions?.length) {
      calendarEventId = addCalendarEvent({
        calendarId: 'cal-customer',
        title: `پیگیری بازدید: ${payload.customerName}`,
        date: visitDate,
        time: timeFrom,
        notes: payload.followUpActions.join(' · '),
      });
    }
    const full = { ...payload, calendarEventId };
    if (editVisit) updateFieldVisit(editVisit.id, full);
    else addFieldVisit(full);
    reset();
    onClose();
  };

  const inputClass = 'w-full bg-gray-50 rounded-xl px-3 py-2 text-sm';
  const labelClass = 'text-xs font-bold text-gray-600 block mb-1';
  const comboboxLabel =
    buildCustomerName({
      visitorTitle,
      visitorFirstName,
      visitorLastName,
      visitorGender,
    }) !== '—'
      ? buildCustomerName({
          visitorTitle,
          visitorFirstName,
          visitorLastName,
          visitorGender,
        })
      : '';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              reset();
              onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative bg-white rounded-t-2xl md:rounded-2xl p-5 md:p-6 w-full max-w-lg border border-nexa-border shadow-xl max-h-[92vh] overflow-y-auto space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2 z-10">
              <h3 className="text-lg font-black text-gray-900">ثبت بازدید حضوری (شوروم)</h3>
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <section className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">نوع مراجعه</p>
              <div className="flex gap-2">
                {(['new', 'return'] as MeizitoVisitKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setVisitKind(k)}
                    className={`flex-1 text-[10px] font-bold py-2 rounded-xl border ${
                      visitKind === k
                        ? 'bg-nexa-accent text-white border-nexa-accent'
                        : 'bg-gray-50 border-nexa-border'
                    }`}
                  >
                    {MEIZITO_VISIT_KIND_LABELS[k]}
                  </button>
                ))}
              </div>
              {visitKind === 'return' && (
                <select
                  value={priorVisitId}
                  onChange={(e) => {
                    setPriorVisitId(e.target.value);
                    const v = fieldVisits.find((x) => x.id === e.target.value);
                    if (v) loadFromVisit({ ...v, visitKind: 'return', priorVisitId: v.id });
                  }}
                  className={inputClass}
                >
                  <option value="">انتخاب بازدید قبلی…</option>
                  {recentVisits.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.date} — {v.customerName}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">تاریخ بازدید</p>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={`${inputClass} font-fa-num`}
              />
              {visitDate && (
                <p className="text-[10px] text-gray-500 font-bold">{formatVisitWeekday(visitDate)}</p>
              )}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>نوع مشتری</label>
                <select
                  value={customerTypeId}
                  onChange={(e) => setCustomerTypeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {customerTypeOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>نحوه آشنایی</label>
                <select
                  value={acquaintanceSourceId}
                  onChange={(e) => setAcquaintanceSourceId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {acquaintanceOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>روش ارتباط</label>
                <select
                  value={contactMethodId}
                  onChange={(e) => setContactMethodId(e.target.value)}
                  className={inputClass}
                >
                  {contactMethodOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {visitKind === 'new' && (
              <section className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">مراجع اصلی</p>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setVisitorGender(g)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
                      visitorGender === g
                        ? 'bg-nexa-accent text-white border-nexa-accent'
                        : 'bg-gray-50 border-nexa-border text-gray-600'
                    }`}
                  >
                    {MEIZITO_VISIT_GENDER_LABELS[g]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>عنوان</label>
                  <select
                    value={visitorTitle}
                    onChange={(e) => {
                      setVisitorTitle(e.target.value);
                      if (e.target.value) setVisitorGender(inferGenderFromTitle(e.target.value));
                    }}
                    className={inputClass}
                  >
                    {MEIZITO_VISIT_TITLE_OPTIONS.map((t) => (
                      <option key={t || 'none'} value={t}>
                        {t || '—'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>نام</label>
                  <input
                    value={visitorFirstName}
                    onChange={(e) => setVisitorFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>نام‌خانوادگی</label>
                  <input
                    value={visitorLastName}
                    onChange={(e) => setVisitorLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <PersonCombobox
                value={comboboxLabel}
                personId={personId}
                onChange={onCustomerChange}
                placeholder="انتخاب از اشخاص (کاتالوگ)"
              />
              <div>
                <label className={labelClass}>شماره موبایل</label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className={`${inputClass} font-fa-num`}
                />
              </div>
              </section>
            )}

            {visitKind === 'return' && (
              <section className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">بازدید مجدد</p>
                <textarea
                  value={returnInterestNotes}
                  onChange={(e) => setReturnInterestNotes(e.target.value)}
                  rows={2}
                  placeholder="موارد مورد نظر"
                  className={inputClass}
                />
                <textarea
                  value={returnAgreements}
                  onChange={(e) => setReturnAgreements(e.target.value)}
                  rows={2}
                  placeholder="توافقات انجام‌شده"
                  className={inputClass}
                />
                <textarea
                  value={returnFollowUpNeeds}
                  onChange={(e) => setReturnFollowUpNeeds(e.target.value)}
                  rows={2}
                  placeholder="نیازهای پیگیری"
                  className={inputClass}
                />
              </section>
            )}

            <section className="space-y-2">
              <label className={labelClass}>توضیحات گزارش (مثل واتساپ)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="چه اتفاقی افتاد؟ چه محصولاتی پسندیدند؟"
                className={inputClass}
              />
            </section>

            <section>
              <label className={labelClass}>مشاور فروش</label>
              <input
                value={salesConsultantName}
                onChange={(e) => setSalesConsultantName(e.target.value)}
                className={inputClass}
              />
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">زمان</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>ورود</label>
                  <input
                    type="time"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>خروج</label>
                  <input
                    type="time"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">افراد</p>
              <input
                value={visitedBy}
                onChange={(e) => setVisitedBy(e.target.value)}
                placeholder="بازدیدکننده از تیم"
                className={inputClass}
              />
              <p className="text-[10px] text-gray-400">همراهان (بدون مراجع اصلی) — بازه سنی را در یادداشت بنویسید</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>تعداد آقا</label>
                  <input
                    type="number"
                    min={0}
                    value={maleCompanionCount}
                    onChange={(e) => setMaleCompanionCount(e.target.value)}
                    className={`${inputClass} font-fa-num`}
                  />
                </div>
                <div>
                  <label className={labelClass}>تعداد خانم</label>
                  <input
                    type="number"
                    min={0}
                    value={femaleCompanionCount}
                    onChange={(e) => setFemaleCompanionCount(e.target.value)}
                    className={`${inputClass} font-fa-num`}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-fa-num">
                جمع نفرات:{' '}
                {1 +
                  Math.max(0, parseInt(maleCompanionCount, 10) || 0) +
                  Math.max(0, parseInt(femaleCompanionCount, 10) || 0)}
              </p>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDesigner}
                  onChange={(e) => setHasDesigner(e.target.checked)}
                />
                دیزاینر همراه دارد
              </label>
              {hasDesigner && (
                <div className="grid gap-2 pl-1 border-r-2 border-nexa-accent/30 pr-3">
                  <input
                    value={designerName}
                    onChange={(e) => setDesignerName(e.target.value)}
                    placeholder="نام دیزاینر"
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    value={designerMobile}
                    onChange={(e) => setDesignerMobile(e.target.value)}
                    placeholder="شماره تماس دیزاینر"
                    className={`${inputClass} font-fa-num`}
                  />
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={designerClubMember === true}
                        onChange={(e) =>
                          setDesignerClubMember(e.target.checked ? true : undefined)
                        }
                      />
                      عضو باشگاه طراحان
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={designerPriorCollaboration === true}
                        onChange={(e) =>
                          setDesignerPriorCollaboration(e.target.checked ? true : undefined)
                        }
                      />
                      همکاری قبلی
                    </label>
                  </div>
                </div>
              )}
            </section>

            {visitKind === 'new' && (
              <section className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">پروفایل تکمیلی</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                    title="تاریخ تولد"
                  />
                  <input
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="کد ملی"
                    className={`${inputClass} font-fa-num`}
                  />
                </div>
                <input
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  placeholder="شهر"
                  className={inputClass}
                />
                <input
                  value={addressDistrict}
                  onChange={(e) => setAddressDistrict(e.target.value)}
                  placeholder="منطقه"
                  className={inputClass}
                />
                <input
                  value={addressFull}
                  onChange={(e) => setAddressFull(e.target.value)}
                  placeholder="آدرس کامل"
                  className={inputClass}
                />
                <select
                  value={groupMembershipId}
                  onChange={(e) => setGroupMembershipId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">عضویت در گروه…</option>
                  {groupOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className={labelClass}>گروه کالاهای مورد نیاز</p>
                <div className="flex flex-wrap gap-1">
                  {productOptions.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleProduct(o.id)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${
                        productInterestIds.includes(o.id)
                          ? 'bg-nexa-accent text-white'
                          : 'bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <p className={labelClass}>موضوعات مهم برای مشتری</p>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleTag(opt.id)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                      priorityTags.includes(opt.id)
                        ? 'bg-nexa-accent text-white border-nexa-accent'
                        : 'bg-gray-50 text-gray-600 border-nexa-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {priorityOptions.length === 0 && (
                  <p className="text-[10px] text-gray-400">
                    در تنظیمات → فهرست‌های انتخابی، موضوعات را تعریف کنید.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase">علاقه و نیاز</p>
              <textarea
                value={likedItems}
                onChange={(e) => setLikedItems(e.target.value)}
                rows={2}
                placeholder="چه چیزهایی خوششان آمده؟"
                className={inputClass}
              />
              <textarea
                value={customerPriorities}
                onChange={(e) => setCustomerPriorities(e.target.value)}
                rows={2}
                placeholder="توضیح تکمیلی اولویت‌ها"
                className={inputClass}
              />
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="علاقه‌ها (سبک، رنگ، …)"
                className={inputClass}
              />
            </section>

            <section className="space-y-2">
              <select
                value={purchaseProbabilityLevelId}
                onChange={(e) => setPurchaseProbabilityLevelId(e.target.value)}
                className={inputClass}
              >
                <option value="">احتمال خرید (درصد)…</option>
                {probabilityLevelOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              {showEstimatedSaleRange(purchaseProbabilityLevelId) && (
                <select
                  value={estimatedSaleRangeId}
                  onChange={(e) => setEstimatedSaleRangeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">مبلغ فروش احتمالی…</option>
                  {saleRangeOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={purchaseProbability}
                onChange={(e) =>
                  setPurchaseProbability(e.target.value as MeizitoPurchaseProbability)
                }
                className={inputClass}
              >
                {PROBS.map((p) => (
                  <option key={p} value={p}>
                    احتمال خرید (قدیمی): {MEIZITO_PURCHASE_PROBABILITY_LABELS[p]}
                  </option>
                ))}
              </select>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as MeizitoVisitResult)}
                className={inputClass}
              >
                {RESULTS.map((r) => (
                  <option key={r} value={r}>
                    نتیجه: {MEIZITO_VISIT_RESULT_LABELS[r]}
                  </option>
                ))}
              </select>
            </section>

            <section>
              <label className={labelClass}>یادداشت داخلی</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </section>

            <section className="space-y-2">
              <p className={labelClass}>اقدامات لازم</p>
              <input
                value={followUp1}
                onChange={(e) => setFollowUp1(e.target.value)}
                placeholder="۱"
                className={inputClass}
              />
              <input
                value={followUp2}
                onChange={(e) => setFollowUp2(e.target.value)}
                placeholder="۲"
                className={inputClass}
              />
              <input
                value={followUp3}
                onChange={(e) => setFollowUp3(e.target.value)}
                placeholder="۳"
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createCalendarTask}
                  onChange={(e) => setCreateCalendarTask(e.target.checked)}
                />
                ایجاد وظیفه در تقویم پیگیری
              </label>
            </section>

            <section className="space-y-2">
              <label className={labelClass}>ویس تکمیلی (mock)</label>
              <input type="file" accept="audio/*" onChange={onVoiceFile} className="text-xs" />
              {voice && (
                <p className="text-[10px] text-emerald-600 font-bold">
                  ✓ {voice.fileName}
                  {voice.dataUrl && (
                    <audio controls src={voice.dataUrl} className="w-full mt-1 h-8" />
                  )}
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={submit}
              disabled={
                visitKind === 'new' && !visitorFirstName.trim() && !visitorLastName.trim()
              }
              className="w-full nexa-btn-primary py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {editVisit ? 'ذخیره تغییرات' : 'ثبت بازدید'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
