export type ViewType = 
  | 'dashboard' 
  | 'people'
  | 'products'
  | 'crm' 
  | 'production' 
  | 'orders'
  | 'sales'
  | 'internal-comms'
  | 'tasks'
  | 'chats'
  | 'work-requests'
  | 'requests'
  | 'purchasing'
  | 'banking' 
  | 'accounting'
  | 'warehouse'
  | 'marketing'
  | 'sales-network'
  | 'hr' 
  | 'chat' 
  | 'after-sales'
  | 'automation'
  | 'inquiries'
  | 'reports'
  | 'workflows'
  | 'store-admin'
  | 'blog-admin'
  | 'settings';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'production';
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  level: 'brilliant' | 'gold' | 'silver' | 'bronze';
  lastVisit: string;
  loyaltyScore: number;
}
