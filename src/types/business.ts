export type NexaBusinessRole = 'owner' | 'member' | 'admin';

export type NexaBusinessPlan = 'trial' | 'active';

export const NEXA_BUSINESS_ROLE_LABELS: Record<NexaBusinessRole, string> = {
  owner: 'مالک',
  member: 'عضو',
  admin: 'مدیر',
};

export const NEXA_BUSINESS_PLAN_LABELS: Record<NexaBusinessPlan, string> = {
  trial: 'آزمایشی',
  active: 'فعال',
};

export type NexaBusiness = {
  id: string;
  name: string;
  role: NexaBusinessRole;
  plan: NexaBusinessPlan;
  expiresAt?: string;
  creditLabel?: string;
  createdAt: string;
  isArchived?: boolean;
};

export const NEXA_ACTIVE_BUSINESS_ID_KEY = 'nexa-active-business-id';
export const NEXA_BUSINESSES_STORAGE_KEY = 'nexa-businesses-v1';
