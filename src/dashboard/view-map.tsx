'use client';

import type { ComponentType } from 'react';
import type { ViewType } from '../types';
import Dashboard from '../views/Dashboard';
import People from '../views/People';
import Products from '../views/Products';
import CRM from '../views/CRM';
import Production from '../views/Production';
import Orders from '../views/Orders';
import Sales from '../views/Sales';
import InternalComms from '../views/InternalComms';
import Tasks from '../views/Tasks';
import Requests from '../views/Requests';
import Purchasing from '../views/Purchasing';
import Banking from '../views/Banking';
import Accounting from '../views/Accounting';
import Warehouse from '../views/Warehouse';
import Marketing from '../views/Marketing';
import Reports from '../views/Reports';
import SalesNetwork from '../views/SalesNetwork';
import HR from '../views/HR';
import Chat from '../views/Chat';
import ChatsPage from '../views/ChatsPage';
import WorkRequests from '../views/WorkRequests';
import Automation from '../views/Automation';
import Workflows from '../views/Workflows';
import Inquiries from '../views/Inquiries';
import StoreAdmin from '../views/StoreAdmin';
import BlogAdmin from '../views/BlogAdmin';
import Settings from '../views/Settings';
import AfterSales from '../views/AfterSales';

export const dashboardViews: Record<string, ComponentType> = {
  dashboard: Dashboard,
  people: People,
  products: Products,
  crm: CRM,
  production: Production,
  orders: Orders,
  sales: Sales,
  'internal-comms': InternalComms,
  tasks: Tasks,
  chats: ChatsPage,
  'work-requests': WorkRequests,
  requests: Requests,
  purchasing: Purchasing,
  banking: Banking,
  accounting: Accounting,
  warehouse: Warehouse,
  marketing: Marketing,
  reports: Reports,
  'sales-network': SalesNetwork,
  hr: HR,
  chat: Chat,
  automation: Automation,
  workflows: Workflows,
  inquiries: Inquiries,
  'store-admin': StoreAdmin,
  'blog-admin': BlogAdmin,
  settings: Settings,
  'after-sales': AfterSales,
};

export function isValidView(view: string): view is ViewType {
  return view in dashboardViews;
}
