import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { ViewType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CatalogProvider } from '@/src/context/CatalogContext';
import { SettingsProvider } from '@/src/context/SettingsContext';
import { MeizitoProvider } from '@/src/context/MeizitoContext';

// Views
import Dashboard from '../views/Dashboard';
import CRM from '../views/CRM';
import Production from '../views/Production';
import Banking from '../views/Banking';
import Chat from '../views/Chat';
import HR from '../views/HR';
import AfterSales from '../views/AfterSales';
import Settings from '../views/Settings';
import Sales from '../views/Sales';
import Reports from '../views/Reports';
import Marketing from '../views/Marketing';
import People from '../views/People';
import Products from '../views/Products';
import Orders from '../views/Orders';
import InternalComms from '../views/InternalComms';
import Tasks from '../views/Tasks';
import Purchasing from '../views/Purchasing';
import Accounting from '../views/Accounting';
import Warehouse from '../views/Warehouse';
import Requests from '../views/Requests';
import SalesNetwork from '../views/SalesNetwork';
import Automation from '../views/Automation';
import Inquiries from '../views/Inquiries';
import Workflows from '../views/Workflows';
import StoreAdmin from '../views/StoreAdmin';
import BlogAdmin from '../views/BlogAdmin';

export default function DashboardLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'people':
        return <People />;
      case 'products':
        return <Products />;
      case 'crm':
        return <CRM />;
      case 'production':
        return <Production />;
      case 'orders':
        return <Orders />;
      case 'sales':
        return <Sales />;
      case 'internal-comms':
        return <InternalComms />;
      case 'tasks':
        return <Tasks />;
      case 'requests':
        return <Requests />;
      case 'purchasing':
        return <Purchasing />;
      case 'banking':
        return <Banking />;
      case 'accounting':
        return <Accounting />;
      case 'warehouse':
        return <Warehouse />;
      case 'marketing':
        return <Marketing />;
      case 'reports':
        return <Reports />;
      case 'sales-network':
        return <SalesNetwork />;
      case 'hr':
        return <HR />;
      case 'chat':
        return <Chat />;
      case 'after-sales':
        return <AfterSales />;
      case 'automation':
        return <Automation />;
      case 'workflows':
        return <Workflows />;
      case 'inquiries':
        return <Inquiries />;
      case 'store-admin':
        return <StoreAdmin />;
      case 'blog-admin':
        return <BlogAdmin />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
              <div className="w-10 h-10 border-4 border-nexa-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">ماژول در حال توسعه</h2>
            <p className="text-sm font-medium opacity-60">بخش {currentView} به زودی در پنل NEXA فعال خواهد شد.</p>
          </div>
        );
    }
  };

  return (
    <CatalogProvider>
    <SettingsProvider>
    <MeizitoProvider>
    <div className="min-h-screen bg-nexa-bg flex">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }} 
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 transition-all duration-300 pr-0 md:pr-72 pb-20 md:pb-0 min-w-0">
        <Header onMenuOpen={() => setIsMobileMenuOpen(true)} />
        
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </MeizitoProvider>
    </SettingsProvider>
    </CatalogProvider>
  );
}
