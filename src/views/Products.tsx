'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Barcode,
  BookOpen,
  Box,
  ChevronLeft,
  Copy,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Grid,
  Image as ImageIcon,
  Package,
  Percent,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wrench,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useCatalog, newId } from '@/src/context/CatalogContext';
import { formatToman } from '@/src/lib/pricing';
import type { Product, ProductCategory } from '@/src/types/product';
import type { PriceList } from '@/src/types/person';
import CategoryTreeManager from '@/src/components/CategoryTreeManager';

// ── Constants ───────────────────────────────────────────────────────────────

const TAX_TYPES = [
  '۱۲- سایر کالاها',
  '۱۱- محصولات کشاورزی',
  '۱- ماشین آلات',
  '۱۰- صنعتی',
  '۰۱- خدمات',
];
const TAX_UNITS = ['کیلوگرم', 'متر', 'عدد', 'لیتر', 'بسته'];
const PAPER_TYPES = ['عمومی', 'A4', 'A5', 'رول ۸۰mm'];
const BARCODE_TYPES = ['Code 128', 'EAN-13', 'Code 39', 'QR Code'];

type ProductViewMode =
  | 'list'
  | 'form'
  | 'card'
  | 'price-update'
  | 'barcode'
  | 'barcode-bulk'
  | 'price-page'
  | 'catalog';

const FORM_TABS = [
  { id: 'sales', label: 'فروش' },
  { id: 'general', label: 'عمومی' },
  { id: 'inventory', label: 'موجودی کالا' },
  { id: 'tax', label: 'مالیات' },
] as const;

const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_PRODUCT_GALLERY = 8;

async function readImageDataUrl(file: File, maxBytes: number): Promise<string | null> {
  if (file.size > maxBytes) {
    window.alert(`حجم هر تصویر حداکثر ${Math.round(maxBytes / 1024 / 1024)} مگابایت باشد.`);
    return null;
  }
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptyProduct(accountingCode: string, priceLists: PriceList[]): Product {
  const prices: Record<string, number> = {};
  priceLists.forEach((pl) => {
    prices[pl.id] = 0;
  });
  return {
    id: '__new__',
    accountingCode,
    name: '',
    code: '',
    type: 'goods',
    categoryIds: [],
    barcode: '',
    images: { gallery: [] },
    salesDescription: '',
    purchaseDescription: '',
    prices,
    purchasePrice: 0,
    units: { main: 'عدد', hasSecondary: false },
    inventory: { trackStock: true, reorderPoint: 0, minOrder: 1, leadTimeDays: 0 },
    tax: {
      hasSalesTax: true,
      salesTaxRate: 10,
      hasPurchaseTax: true,
      purchaseTaxRate: 10,
      taxType: '۱۲- سایر کالاها',
    },
    status: 'active',
  };
}

function cloneDraft(p: Product): Product {
  return {
    ...p,
    categoryIds: [...p.categoryIds],
    prices: { ...p.prices },
    units: { ...p.units },
    inventory: { ...p.inventory },
    tax: { ...p.tax },
    images: { ...p.images, gallery: [...p.images.gallery] },
  };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Products() {
  const {
    products,
    addProduct,
    replaceProduct,
    removeProduct,
    productCategories,
    upsertProductCategory,
    removeProductCategory,
    reorderProductCategories,
    priceLists,
    upsertPriceList,
    removePriceList,
    generateProductAccountingCode,
  } = useCatalog();

  const [viewMode, setViewMode] = useState<ProductViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cardProductId, setCardProductId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Product>(() =>
    emptyProduct(generateProductAccountingCode(), priceLists)
  );
  const [error, setError] = useState('');
  const [catDraft, setCatDraft] = useState({ id: '', name: '', parentId: '' });

  const isNew = !selectedId || draft.id === '__new__';

  const catName = (id: string) => productCategories.find((x) => x.id === id)?.name ?? '—';

  const openNew = (type: 'goods' | 'services' = 'goods') => {
    const base = emptyProduct(generateProductAccountingCode(), priceLists);
    setSelectedId(null);
    setDraft({ ...base, type });
    setError('');
    setViewMode('form');
  };

  const openEdit = (id: string) => {
    const product = products.find((x) => x.id === id);
    if (!product) return;
    setSelectedId(id);
    setDraft(cloneDraft(product));
    setError('');
    setViewMode('form');
  };

  const openCard = (id: string) => {
    setCardProductId(id);
    setViewMode('card');
  };

  const resetToList = () => {
    setViewMode('list');
    setSelectedId(null);
    setCardProductId(null);
    setError('');
  };

  const saveDraft = () => {
    setError('');
    if (!draft.name.trim()) {
      setError('نام کالا اجباری است.');
      return;
    }
    if (!draft.code.trim()) {
      setError('کد کالا اجباری است.');
      return;
    }
    if (isNew) {
      addProduct({ ...draft, id: newId(), accountingCode: generateProductAccountingCode() });
    } else {
      replaceProduct(draft);
    }
    resetToList();
  };

  const handleSaveCategory = () => {
    if (!catDraft.name.trim()) return;
    upsertProductCategory({
      id: catDraft.id || undefined,
      name: catDraft.name,
      parentId: catDraft.parentId || undefined,
    });
    setCatDraft({ id: '', name: '', parentId: '' });
  };

  const navItems: { mode: ProductViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'list', label: 'کالاها و خدمات', icon: <Package size={14} /> },
    { mode: 'price-update', label: 'به روز رسانی قیمت', icon: <Percent size={14} /> },
    { mode: 'barcode', label: 'چاپ بارکد', icon: <Barcode size={14} /> },
    { mode: 'barcode-bulk', label: 'چاپ بارکد تعدادی', icon: <Grid size={14} /> },
    { mode: 'price-page', label: 'صفحه لیست قیمت', icon: <FileText size={14} /> },
    { mode: 'catalog', label: 'کاتالوگ آنلاین', icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">کالاها و خدمات</h1>
          <p className="text-sm text-gray-500 mt-1">
            کد حسابداری یکتا، دسته‌بندی پویا، قیمت‌گذاری چندگانه
          </p>
        </div>
        {viewMode === 'list' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openNew('goods')}
              className="nexa-btn-primary flex items-center gap-2 px-5 py-2"
            >
              <Plus size={16} />
              کالای جدید
            </button>
            <button
              type="button"
              onClick={() => openNew('services')}
              className="bg-white border border-nexa-border rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-50"
            >
              <Wrench size={16} />
              خدمات جدید
            </button>
          </div>
        )}
        {(viewMode === 'form' || viewMode === 'card') && (
          <button
            type="button"
            onClick={resetToList}
            className="bg-gray-100 text-gray-700 rounded-xl px-4 py-2 text-xs font-bold"
          >
            <ChevronLeft size={14} className="inline ml-1" />
            بازگشت به لیست
          </button>
        )}
      </div>

      {/* Sub-navigation */}
      {viewMode !== 'form' && viewMode !== 'card' && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                viewMode === item.mode
                  ? 'bg-white text-nexa-accent shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {viewMode === 'form' ? (
          <ProductFormView
            key="form"
            draft={draft}
            setDraft={setDraft}
            isNew={isNew}
            error={error}
            priceLists={priceLists}
            productCategories={productCategories}
            catDraft={catDraft}
            setCatDraft={setCatDraft}
            onSave={saveDraft}
            onBack={resetToList}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={removeProductCategory}
            onReorderCategory={reorderProductCategories}
            onMoveCategory={(id, parentId) => {
              const row = productCategories.find((x) => x.id === id);
              if (!row) return;
              upsertProductCategory({ id: row.id, name: row.name, parentId });
            }}
          />
        ) : viewMode === 'card' ? (
          <ProductLedgerCard
            key="card"
            product={products.find((x) => x.id === cardProductId) ?? null}
            productCategories={productCategories}
            priceLists={priceLists}
            catName={catName}
            onBack={resetToList}
            onEdit={openEdit}
          />
        ) : viewMode === 'price-update' ? (
          <PriceUpdateView
            key="price-update"
            products={products}
            priceLists={priceLists}
            productCategories={productCategories}
            catName={catName}
            onReplaceProduct={replaceProduct}
          />
        ) : viewMode === 'barcode' ? (
          <BarcodePrintView
            key="barcode"
            products={products}
            priceLists={priceLists}
            productCategories={productCategories}
            catName={catName}
          />
        ) : viewMode === 'barcode-bulk' ? (
          <BarcodeBulkView
            key="barcode-bulk"
            products={products}
            priceLists={priceLists}
            productCategories={productCategories}
            catName={catName}
          />
        ) : viewMode === 'price-page' ? (
          <PricePageEditor
            key="price-page"
            products={products}
            priceLists={priceLists}
            productCategories={productCategories}
            catName={catName}
          />
        ) : viewMode === 'catalog' ? (
          <CatalogEditor
            key="catalog"
            products={products}
            priceLists={priceLists}
            productCategories={productCategories}
            catName={catName}
          />
        ) : (
          <ProductListView
            key="list"
            products={products}
            productCategories={productCategories}
            priceLists={priceLists}
            upsertPriceList={upsertPriceList}
            removePriceList={removePriceList}
            catDraft={catDraft}
            setCatDraft={setCatDraft}
            catName={catName}
            onEdit={openEdit}
            onCard={openCard}
            onDelete={removeProduct}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={(id) => {
              const used = products.some((p) => p.categoryIds.includes(id));
              if (used && !window.confirm('این دسته در کالاها استفاده شده. حذف شود؟')) return;
              removeProductCategory(id);
            }}
            onReorderCategory={reorderProductCategories}
            onMoveCategory={(id, parentId) => {
              const row = productCategories.find((x) => x.id === id);
              if (!row) return;
              upsertProductCategory({ id: row.id, name: row.name, parentId });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ProductListView ─────────────────────────────────────────────────────────

function PriceListsPanel({
  priceLists,
  upsertPriceList,
  removePriceList,
}: {
  priceLists: PriceList[];
  upsertPriceList: (payload: {
    id?: string;
    name: string;
    tier?: PriceList['tier'];
  }) => void;
  removePriceList: (id: string) => void;
}) {
  return (
    <div className="nexa-card overflow-hidden p-4 space-y-3">
      <p className="text-xs font-black text-gray-800">مدیریت لیست‌های قیمت</p>
      <p className="text-[11px] text-gray-500">
        نام هر لیست اینجا تعریف می‌شود؛ در فرم کالا برای هر لیست قیمت وارد می‌کنید.
      </p>
      <div className="space-y-2">
        {priceLists.map((pl) => (
          <div
            key={pl.id}
            className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-50 rounded-xl p-3 border border-nexa-border"
          >
            <input
              value={pl.name}
              onChange={(e) =>
                upsertPriceList({ id: pl.id, name: e.target.value, tier: pl.tier })
              }
              className="flex-1 min-w-0 bg-white rounded-lg px-3 py-2 text-sm font-bold"
              placeholder="نام لیست"
            />
            <select
              value={pl.tier ?? ''}
              onChange={(e) =>
                upsertPriceList({
                  id: pl.id,
                  name: pl.name,
                  tier:
                    e.target.value === ''
                      ? undefined
                      : (e.target.value as NonNullable<PriceList['tier']>),
                })
              }
              className="bg-white rounded-lg px-3 py-2 text-xs md:w-40"
            >
              <option value="">نوع (اختیاری)</option>
              <option value="retail">خرده‌فروشی</option>
              <option value="wholesale">عمده‌فروشی</option>
              <option value="partner">همکار / طراح</option>
            </select>
            <button
              type="button"
              disabled={priceLists.length <= 1}
              onClick={() => {
                if (priceLists.length <= 1) return;
                if (!window.confirm(`حذف لیست «${pl.name}»؟ قیمت‌های این ستون از کالاها پاک می‌شود.`))
                  return;
                removePriceList(pl.id);
              }}
              className="text-xs font-bold text-rose-600 px-2 py-2 disabled:opacity-40"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => upsertPriceList({ name: 'لیست جدید' })}
        className="w-full border border-dashed border-nexa-border rounded-xl py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
      >
        + لیست قیمت جدید
      </button>
    </div>
  );
}

function ProductListView({
  products,
  productCategories,
  priceLists,
  upsertPriceList,
  removePriceList,
  catDraft,
  setCatDraft,
  catName,
  onEdit,
  onCard,
  onDelete,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategory,
  onMoveCategory,
}: {
  products: Product[];
  productCategories: ProductCategory[];
  priceLists: PriceList[];
  upsertPriceList: (payload: {
    id?: string;
    name: string;
    tier?: PriceList['tier'];
  }) => void;
  removePriceList: (id: string) => void;
  catDraft: { id: string; name: string; parentId: string };
  setCatDraft: (d: { id: string; name: string; parentId: string }) => void;
  catName: (id: string) => string;
  onEdit: (id: string) => void;
  onCard: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (orderedIds: string[]) => void;
  onMoveCategory: (id: string, parentId?: string) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'goods' | 'services'>('all');
  const [colFilters, setColFilters] = useState({ name: '', code: '', barcode: '', cat: '' });
  const defaultPl = priceLists[0]?.id ?? 'pl-retail';

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (colFilters.name && !p.name.includes(colFilters.name)) return false;
      if (colFilters.code && !p.code.includes(colFilters.code)) return false;
      if (colFilters.barcode && !(p.barcode ?? '').includes(colFilters.barcode)) return false;
      if (colFilters.cat) {
        const catMatch = p.categoryIds.some((id) => catName(id).includes(colFilters.cat));
        if (!catMatch) return false;
      }
      return true;
    });
  }, [products, typeFilter, colFilters, catName]);

  const cf = (k: keyof typeof colFilters, v: string) =>
    setColFilters((prev) => ({ ...prev, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="nexa-card overflow-hidden">
        {/* Type tabs */}
        <div className="p-4 border-b border-nexa-border flex flex-wrap gap-2">
          {([['all', 'همه'], ['goods', 'کالاها'], ['services', 'خدمات']] as const).map(
            ([v, l]) => (
              <button
                key={v}
                onClick={() => setTypeFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${typeFilter === v ? 'bg-nexa-accent text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {l}
              </button>
            )
          )}
          <span className="mr-auto text-xs text-gray-400 self-center">
            {filtered.length} مورد
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-right text-sm min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-nexa-border text-xs font-black text-gray-400">
                <th className="px-3 py-3 w-8">#</th>
                <th className="px-3 py-3">نام</th>
                <th className="px-3 py-3">کد</th>
                <th className="px-3 py-3">دسته بندی</th>
                <th className="px-3 py-3">بارکد</th>
                <th className="px-3 py-3">واحد</th>
                <th className="px-3 py-3">موجودی</th>
                <th className="px-3 py-3">قیمت خرید</th>
                <th className="px-3 py-3">قیمت فروش</th>
                <th className="px-3 py-3">نوع</th>
                <th className="px-3 py-3">عملیات</th>
              </tr>
              {/* Column search row */}
              <tr className="bg-gray-50/80 border-b border-nexa-border">
                <td className="px-3 py-1" />
                <td className="px-2 py-1">
                  <input
                    value={colFilters.name}
                    onChange={(e) => cf('name', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={colFilters.code}
                    onChange={(e) => cf('code', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={colFilters.cat}
                    onChange={(e) => cf('cat', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={colFilters.barcode}
                    onChange={(e) => cf('barcode', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td colSpan={6} />
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onCard(p.id)}
                >
                  <td className="px-3 py-3 text-xs text-gray-400 font-fa-num">{idx + 1}</td>
                  <td className="px-3 py-3 font-bold text-blue-700">{p.name}</td>
                  <td className="px-3 py-3 text-xs font-fa-num text-gray-600">{p.code}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {p.categoryIds.map((id) => catName(id)).join('، ') || '—'}
                  </td>
                  <td className="px-3 py-3 text-xs font-fa-num text-gray-500">
                    {p.barcode || '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{p.units.main}</td>
                  <td className="px-3 py-3 text-xs font-fa-num">
                    {p.type === 'goods' ? (
                      <span
                        className={
                          p.inventory.trackStock && p.inventory.reorderPoint > 0
                            ? 'text-emerald-600 font-bold'
                            : 'text-gray-400'
                        }
                      >
                        {p.inventory.trackStock ? `${p.inventory.reorderPoint} (نقطه سفارش)` : '—'}
                      </span>
                    ) : (
                      <span className="text-gray-400">خدمات</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs font-fa-num text-gray-700">
                    {formatToman(p.purchasePrice)}
                  </td>
                  <td className="px-3 py-3 text-xs font-fa-num font-bold text-gray-900">
                    {formatToman(p.prices[defaultPl] ?? 0)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.type === 'goods' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}
                    >
                      {p.type === 'goods' ? 'کالا' : 'خدمات'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(p.id)}
                        className="bg-white border border-nexa-border rounded-lg px-2 py-1 text-[11px] hover:bg-gray-50"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => onCard(p.id)}
                        className="bg-gray-900 text-white rounded-lg px-2 py-1 text-[11px]"
                      >
                        کارت حساب
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`حذف "${p.name}"؟`)) onDelete(p.id);
                        }}
                        className="text-rose-500 rounded-lg px-2 py-1 text-[11px] hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PriceListsPanel
        priceLists={priceLists}
        upsertPriceList={upsertPriceList}
        removePriceList={removePriceList}
      />

      {/* Category Manager */}
      <ProductCategoryManager
        categories={productCategories}
        usedCategoryIds={new Set(products.flatMap((p) => p.categoryIds))}
        draft={catDraft}
        setDraft={setCatDraft}
        onSave={onSaveCategory}
        onDelete={onDeleteCategory}
        onReorder={onReorderCategory}
        onMove={onMoveCategory}
      />
    </motion.div>
  );
}

// ── ProductFormView ──────────────────────────────────────────────────────────

function ProductFormView({
  draft,
  setDraft,
  isNew,
  error,
  priceLists,
  productCategories,
  catDraft,
  setCatDraft,
  onSave,
  onBack,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategory,
  onMoveCategory,
}: {
  draft: Product;
  setDraft: (p: Product) => void;
  isNew: boolean;
  error: string;
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catDraft: { id: string; name: string; parentId: string };
  setCatDraft: (d: { id: string; name: string; parentId: string }) => void;
  onSave: () => void;
  onBack: () => void;
  onSaveCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (orderedIds: string[]) => void;
  onMoveCategory: (id: string, parentId?: string) => void;
}) {
  const [formTab, setFormTab] = useState<'sales' | 'general' | 'inventory' | 'tax'>('sales');
  const [showCatManager, setShowCatManager] = useState(false);

  const toggleCategory = (id: string) => {
    const exists = draft.categoryIds.includes(id);
    setDraft({
      ...draft,
      categoryIds: exists ? draft.categoryIds.filter((c) => c !== id) : [...draft.categoryIds, id],
    });
  };

  const catName = (id: string) => productCategories.find((x) => x.id === id)?.name ?? '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="nexa-card overflow-hidden min-h-[620px] flex flex-col"
    >
      {/* Form Header */}
      <div className="p-5 border-b border-nexa-border bg-gray-50">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black text-gray-700">مشخصات عمومی کالا / خدمات</p>
          <p className="text-[11px] text-gray-400">چیدمان نزدیک به الگوی مرجع</p>
        </div>
        <div className="flex items-start gap-4">
          {/* Product image or icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexa-accent/20 to-nexa-accent/5 border border-nexa-accent/20 flex items-center justify-center text-nexa-accent shrink-0 overflow-hidden">
            {draft.images.main ? (
              <img src={draft.images.main} alt="" className="w-full h-full object-cover" />
            ) : draft.type === 'goods' ? (
              <Box size={28} />
            ) : (
              <Wrench size={28} />
            )}
          </div>

          <div className="flex-1 grid md:grid-cols-4 gap-3">
            {/* Accounting Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">کد حسابداری</label>
              <input
                value={draft.accountingCode}
                disabled
                className="w-full bg-gray-100 rounded-xl py-2 px-3 text-sm font-fa-num text-gray-500"
              />
            </div>
            {/* Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400">
                {draft.type === 'goods' ? 'نام کالا' : 'نام خدمت'} <span className="text-rose-500">*</span>
              </label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full bg-white border border-nexa-border rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-nexa-accent/20"
                placeholder={draft.type === 'goods' ? 'مثال: سرویس خواب مدل آوا' : 'مثال: خدمات نصب'}
              />
            </div>
            {/* Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">نوع</label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft({ ...draft, type: e.target.value as 'goods' | 'services' })
                }
                className="w-full bg-white border border-nexa-border rounded-xl py-2 px-3 text-sm"
              >
                <option value="goods">کالا</option>
                <option value="services">خدمات</option>
              </select>
            </div>
            {/* Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">
                کد/شناسه داخلی <span className="text-rose-500">*</span>
              </label>
              <input
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="w-full bg-white border border-nexa-border rounded-xl py-2 px-3 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20"
              />
            </div>
            {/* Barcode */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-400">بارکد</label>
              <input
                value={draft.barcode ?? ''}
                onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                placeholder="بارکدهای مختلف را با + از هم جدا کنید"
                className="w-full bg-white border border-nexa-border rounded-xl py-2 px-3 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20"
              />
            </div>
            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">وضعیت</label>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as 'active' | 'inactive' })
                }
                className="w-full bg-white border border-nexa-border rounded-xl py-2 px-3 text-sm"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">دسته بندی:</span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {productCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  draft.categoryIds.includes(cat.id)
                    ? 'border-nexa-accent bg-nexa-accent/10 text-nexa-accent'
                    : 'border-nexa-border text-gray-500 hover:bg-gray-50'
                }`}
              >
                {cat.parentId ? `${catName(cat.parentId)} / ${cat.name}` : cat.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCatManager(!showCatManager)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-dashed border-gray-300 text-gray-400 hover:border-nexa-accent hover:text-nexa-accent transition-colors"
            >
              <Settings size={11} className="inline ml-1" />
              مدیریت دسته‌ها
            </button>
          </div>
        </div>

        {showCatManager && (
          <div className="mt-3">
            <ProductCategoryManager
              categories={productCategories}
              usedCategoryIds={new Set(draft.categoryIds)}
              draft={catDraft}
              setDraft={setCatDraft}
              onSave={onSaveCategory}
              onDelete={onDeleteCategory}
              onReorder={onReorderCategory}
              onMove={onMoveCategory}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-nexa-border overflow-x-auto no-scrollbar">
        {FORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFormTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              formTab === tab.id
                ? 'bg-white text-nexa-accent shadow-sm'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {error && (
          <p className="text-xs text-rose-600 font-bold bg-rose-50 px-3 py-2 rounded-xl">
            {error}
          </p>
        )}

        {formTab === 'sales' && (
          <SalesTab draft={draft} setDraft={setDraft} priceLists={priceLists} />
        )}
        {formTab === 'general' && <GeneralTab draft={draft} setDraft={setDraft} />}
        {formTab === 'inventory' && <InventoryTab draft={draft} setDraft={setDraft} />}
        {formTab === 'tax' && <TaxTab draft={draft} setDraft={setDraft} />}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-nexa-border bg-gray-50 flex gap-3">
        <button type="button" onClick={onSave} className="nexa-btn-primary px-6 py-2 text-sm">
          {isNew ? 'ثبت کالا' : 'ذخیره تغییرات'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="bg-white border border-nexa-border rounded-xl px-6 py-2 text-sm font-bold"
        >
          انصراف
        </button>
      </div>
    </motion.div>
  );
}

// ── Form Tab Components ───────────────────────────────────────────────────────

function SalesTab({
  draft,
  setDraft,
  priceLists,
}: {
  draft: Product;
  setDraft: (p: Product) => void;
  priceLists: PriceList[];
}) {
  const updatePrice = (plId: string, val: string) => {
    const n = parseInt(val.replace(/,/g, ''), 10) || 0;
    setDraft({ ...draft, prices: { ...draft.prices, [plId]: n } });
  };

  return (
    <div className="space-y-5">
      {/* Price lists */}
      <div>
        <p className="text-xs font-black text-gray-700 mb-3">لیست‌های قیمت فروش</p>
        <div className="space-y-2">
          {priceLists.map((pl) => (
            <div key={pl.id} className="grid grid-cols-3 gap-3 items-center">
              <label className="text-xs font-bold text-gray-600 text-right">{pl.name}</label>
              <div className="col-span-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.prices[pl.id] ? formatToman(draft.prices[pl.id]) : ''}
                  onChange={(e) => updatePrice(pl.id, e.target.value)}
                  placeholder="مبلغ به تومان"
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-fa-num focus:ring-2 focus:ring-nexa-accent/20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase price */}
      <div>
        <label className="text-xs font-bold text-gray-600">قیمت خرید (تومان)</label>
        <input
          type="text"
          inputMode="numeric"
          value={draft.purchasePrice ? formatToman(draft.purchasePrice) : ''}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
            setDraft({ ...draft, purchasePrice: n });
          }}
          placeholder="مبلغ به تومان"
          className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-fa-num mt-2"
        />
      </div>

      {/* Descriptions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-600">توضیحات فروش</label>
          <textarea
            value={draft.salesDescription ?? ''}
            onChange={(e) => setDraft({ ...draft, salesDescription: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 min-h-[72px]"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">توضیحات خرید</label>
          <textarea
            value={draft.purchaseDescription ?? ''}
            onChange={(e) => setDraft({ ...draft, purchaseDescription: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 min-h-[72px]"
          />
        </div>
      </div>
    </div>
  );
}

function GeneralTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: (p: Product) => void;
}) {
  const pickMain = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const dataUrl = await readImageDataUrl(f, MAX_PRODUCT_IMAGE_BYTES);
    if (dataUrl) setDraft({ ...draft, images: { ...draft.images, main: dataUrl } });
  };

  const pickGallery = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files ? Array.from(ev.target.files) : [];
    ev.target.value = '';
    let gallery = [...draft.images.gallery];
    for (const file of files) {
      if (gallery.length >= MAX_PRODUCT_GALLERY) {
        window.alert(`حداکثر ${MAX_PRODUCT_GALLERY} تصویر در گالری.`);
        break;
      }
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await readImageDataUrl(file, MAX_PRODUCT_IMAGE_BYTES);
      if (dataUrl) gallery.push(dataUrl);
    }
    setDraft({ ...draft, images: { ...draft.images, gallery } });
  };

  const removeMain = () => {
    setDraft({ ...draft, images: { ...draft.images, main: undefined } });
  };

  const removeGalleryAt = (idx: number) => {
    setDraft({
      ...draft,
      images: {
        ...draft.images,
        gallery: draft.images.gallery.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-nexa-border p-4 space-y-4 bg-gray-50/50">
        <p className="text-xs font-black text-gray-700">تصاویر کالا</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600">تصویر اصلی</label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-nexa-accent cursor-pointer border border-nexa-border rounded-xl px-3 py-2 bg-white hover:bg-gray-50">
                انتخاب فایل
                <input type="file" accept="image/*" className="hidden" onChange={pickMain} />
              </label>
              {draft.images.main && (
                <button type="button" onClick={removeMain} className="text-xs text-rose-600 font-bold">
                  حذف تصویر اصلی
                </button>
              )}
            </div>
            {draft.images.main && (
              <img
                src={draft.images.main}
                alt=""
                className="max-h-40 rounded-xl border border-nexa-border object-contain bg-white"
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600">
              سایر تصاویر (حداکثر {MAX_PRODUCT_GALLERY})
            </label>
            <label className="inline-block text-xs font-bold text-nexa-accent cursor-pointer border border-nexa-border rounded-xl px-3 py-2 bg-white hover:bg-gray-50">
              افزودن به گالری
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={pickGallery}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {draft.images.gallery.map((src, idx) => (
                <div key={`${idx}-${src.slice(0, 32)}`} className="relative group">
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover border border-nexa-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryAt(idx)}
                    className="absolute -top-1 -left-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                    aria-label="حذف"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">
          تصاویر به‌صورت base64 در مرورگر ذخیره می‌شوند؛ از فایل‌های بزرگ پرهیز کنید.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-600">واحد اصلی</label>
          <input
            value={draft.units.main}
            onChange={(e) =>
              setDraft({ ...draft, units: { ...draft.units, main: e.target.value } })
            }
            placeholder="مثلاً: عدد"
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={draft.units.hasSecondary}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  units: { ...draft.units, hasSecondary: e.target.checked },
                })
              }
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">کالا بیش از یک واحد دارد؟</span>
          </label>
        </div>
      </div>

      {draft.units.hasSecondary && (
        <div className="grid md:grid-cols-3 gap-4 bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
          <div>
            <label className="text-xs font-bold text-gray-600">واحد فرعی</label>
            <input
              value={draft.units.secondary ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, units: { ...draft.units, secondary: e.target.value } })
              }
              placeholder="مثلاً: گرم"
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm mt-2"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">ضریب تبدیل</label>
            <input
              type="number"
              value={draft.units.conversionFactor ?? 1}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  units: { ...draft.units, conversionFactor: Number(e.target.value) },
                })
              }
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm mt-2 font-fa-num"
            />
          </div>
          <div className="flex items-end">
            <p className="text-[11px] text-gray-500 leading-relaxed pb-2">
              ۱ {draft.units.main} = {draft.units.conversionFactor ?? 1} {draft.units.secondary}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-gray-600">توضیحات</label>
        <textarea
          value={draft.salesDescription ?? ''}
          onChange={(e) => setDraft({ ...draft, salesDescription: e.target.value })}
          className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 min-h-[80px]"
        />
      </div>
    </div>
  );
}

function InventoryTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: (p: Product) => void;
}) {
  if (draft.type === 'services') {
    return (
      <div className="text-center py-16 text-gray-400">
        <Wrench size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">خدمات موجودی ندارد.</p>
      </div>
    );
  }

  const inv = draft.inventory;
  const upd = (patch: Partial<typeof inv>) =>
    setDraft({ ...draft, inventory: { ...inv, ...patch } });

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={inv.trackStock}
          onChange={(e) => upd({ trackStock: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm font-bold text-gray-700">کنترل موجودی</span>
      </label>

      {inv.trackStock && (
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600">نقطه سفارش</label>
            <input
              type="number"
              value={inv.reorderPoint}
              onChange={(e) => upd({ reorderPoint: Number(e.target.value) })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 font-fa-num"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">حداقل سفارش</label>
            <input
              type="number"
              value={inv.minOrder}
              onChange={(e) => upd({ minOrder: Number(e.target.value) })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 font-fa-num"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">زمان انتظار (روز)</label>
            <input
              type="number"
              value={inv.leadTimeDays}
              onChange={(e) => upd({ leadTimeDays: Number(e.target.value) })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 font-fa-num"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TaxTab({
  draft,
  setDraft,
}: {
  draft: Product;
  setDraft: (p: Product) => void;
}) {
  const tax = draft.tax;
  const upd = (patch: Partial<typeof tax>) =>
    setDraft({ ...draft, tax: { ...tax, ...patch } });

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={tax.hasSalesTax}
              onChange={(e) => upd({ hasSalesTax: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-bold text-gray-700">مشمول مالیات فروش</span>
          </label>
          {tax.hasSalesTax && (
            <div>
              <label className="text-xs font-bold text-gray-500">مالیات فروش %</label>
              <input
                type="number"
                value={tax.salesTaxRate}
                onChange={(e) => upd({ salesTaxRate: Number(e.target.value) })}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm mt-1 font-fa-num"
              />
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={tax.hasPurchaseTax}
              onChange={(e) => upd({ hasPurchaseTax: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-bold text-gray-700">مشمول مالیات خرید</span>
          </label>
          {tax.hasPurchaseTax && (
            <div>
              <label className="text-xs font-bold text-gray-500">مالیات خرید %</label>
              <input
                type="number"
                value={tax.purchaseTaxRate}
                onChange={(e) => upd({ purchaseTaxRate: Number(e.target.value) })}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm mt-1 font-fa-num"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-600">نوع مالیات</label>
          <select
            value={tax.taxType}
            onChange={(e) => upd({ taxType: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2"
          >
            {TAX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">کد مالیاتی</label>
          <input
            value={tax.taxCode ?? ''}
            onChange={(e) => upd({ taxCode: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2 font-fa-num"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">واحد مالیاتی</label>
          <select
            value={tax.taxUnit ?? ''}
            onChange={(e) => upd({ taxUnit: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-2"
          >
            <option value="">انتخاب کنید</option>
            {TAX_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── ProductLedgerCard ────────────────────────────────────────────────────────

const LEDGER_TABS = [
  { id: 'transactions', label: 'تراکنش‌ها' },
  { id: 'people', label: 'مشتریان و فروشندگان' },
  { id: 'drafts', label: 'پیش‌نویس' },
  { id: 'warehouse', label: 'رسید و حواله انبار' },
  { id: 'other', label: 'سایر' },
] as const;

const MOCK_TRANSACTIONS = [
  { id: 't1', person: 'امیرحسین نکسایی', date: '۱۴۰۵/۰۱/۱۵', number: 'INV-1001', note: 'فروش', income: 2, outcome: 0, amount: 90_000_000 },
  { id: 't2', person: 'شرکت پارچه علوی', date: '۱۴۰۵/۰۱/۱۰', number: 'PO-2002', note: 'خرید', income: 5, outcome: 0, amount: 135_000_000 },
  { id: 't3', person: 'سارا احمدی', date: '۱۴۰۵/۰۲/۰۵', number: 'INV-1015', note: 'فروش', income: 0, outcome: 1, amount: 45_000_000 },
];

const MOCK_CHART = [
  { name: 'فروردین', ورود: 5, خروج: 2 },
  { name: 'اردیبهشت', ورود: 8, خروج: 3 },
  { name: 'خرداد', ورود: 3, خروج: 6 },
  { name: 'تیر', ورود: 10, خروج: 4 },
];

function ProductLedgerCard({
  product,
  productCategories,
  priceLists,
  catName,
  onBack,
  onEdit,
}: {
  product: Product | null;
  productCategories: ProductCategory[];
  priceLists: PriceList[];
  catName: (id: string) => string;
  onBack: () => void;
  onEdit: (id: string) => void;
}) {
  const [ledgerTab, setLedgerTab] = useState<(typeof LEDGER_TABS)[number]['id']>('transactions');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  if (!product) {
    return (
      <div className="nexa-card min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">کالا یافت نشد.</p>
          <button onClick={onBack} className="bg-gray-900 text-white rounded-xl px-4 py-2 text-xs">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const defaultPl = priceLists[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="nexa-card overflow-hidden min-h-[620px] flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-nexa-border flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-nexa-accent/10 flex items-center justify-center text-nexa-accent">
          {product.type === 'goods' ? <Box size={22} /> : <Wrench size={22} />}
        </div>
        <div>
          <p className="font-black text-gray-900">{product.name}</p>
          <p className="text-xs text-gray-500">
            کد حسابداری: <span className="font-fa-num">{product.accountingCode}</span> ·{' '}
            {product.categoryIds.map((id) => catName(id)).join('، ') || '—'}
          </p>
        </div>
        <div className="mr-auto flex gap-2">
          <button
            onClick={() => onEdit(product.id)}
            className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1"
          >
            <Edit size={13} />
            ویرایش
          </button>
          <button
            onClick={onBack}
            className="bg-gray-100 text-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
          >
            بازگشت
          </button>
        </div>
      </div>

      {/* Date & project filters */}
      <div className="p-4 border-b border-nexa-border bg-gray-50/50 grid md:grid-cols-3 gap-3">
        <input
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="از تاریخ (۱۴۰۵/۰۱/۰۱)"
          className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs font-fa-num"
        />
        <input
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="تا تاریخ"
          className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs font-fa-num"
        />
        <select className="bg-white border border-nexa-border rounded-xl px-3 py-2 text-xs">
          <option value="">همه پروژه‌ها</option>
          <option>پروژه A</option>
          <option>پروژه B</option>
        </select>
      </div>

      {/* Chart + Info */}
      <div className="grid md:grid-cols-2 gap-0 border-b border-nexa-border">
        <div className="p-4 border-l border-nexa-border">
          <p className="text-xs font-black text-gray-600 mb-3">نمودار ورود و خروج</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MOCK_CHART} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ورود" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="خروج" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4">
          <p className="text-xs font-black text-gray-600 mb-3">اطلاعات کالا</p>
          <div className="space-y-1.5 text-xs">
            {[
              ['کد کالا', product.code],
              ['بارکد', product.barcode || '—'],
              ['واحد اصلی', product.units.main],
              ['واحد فرعی', product.units.secondary || '—'],
              ['نقطه سفارش', String(product.inventory.reorderPoint)],
              ['حداقل سفارش', String(product.inventory.minOrder)],
              ['زمان انتظار', `${product.inventory.leadTimeDays} روز`],
              [
                'قیمت فروش',
                `${formatToman(product.prices[defaultPl?.id ?? ''] ?? 0)} تومان`,
              ],
              ['قیمت خرید', `${formatToman(product.purchasePrice)} تومان`],
              [
                'مالیات فروش',
                product.tax.hasSalesTax ? `${product.tax.salesTaxRate}%` : 'ندارد',
              ],
              [
                'مالیات خرید',
                product.tax.hasPurchaseTax ? `${product.tax.purchaseTaxRate}%` : 'ندارد',
              ],
              ['نوع مالیات', product.tax.taxType],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-gray-400">{k}</span>
                <span className="font-bold text-gray-800 text-left font-fa-num">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger tabs */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-nexa-border overflow-x-auto no-scrollbar">
        {LEDGER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLedgerTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
              ledgerTab === tab.id ? 'bg-white text-nexa-accent shadow-sm' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {ledgerTab === 'transactions' && (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-nexa-border text-xs text-gray-400">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">شخص</th>
                <th className="px-3 py-2">تاریخ</th>
                <th className="px-3 py-2">شماره</th>
                <th className="px-3 py-2">شرح</th>
                <th className="px-3 py-2">ورود</th>
                <th className="px-3 py-2">خروج</th>
                <th className="px-3 py-2">مبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {MOCK_TRANSACTIONS.map((t, idx) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2 text-blue-700 font-bold">{t.person}</td>
                  <td className="px-3 py-2 text-xs font-fa-num">{t.date}</td>
                  <td className="px-3 py-2 text-xs font-fa-num">{t.number}</td>
                  <td className="px-3 py-2 text-xs">{t.note}</td>
                  <td className="px-3 py-2 text-xs font-fa-num text-emerald-700 font-bold">
                    {t.income || '—'}
                  </td>
                  <td className="px-3 py-2 text-xs font-fa-num text-rose-700 font-bold">
                    {t.outcome || '—'}
                  </td>
                  <td className="px-3 py-2 text-xs font-fa-num font-bold">
                    {formatToman(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {ledgerTab === 'people' && (
          <div className="p-4 grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={13} className="text-emerald-600" /> مشتریان (خریداران)
              </p>
              <div className="space-y-2">
                {['امیرحسین نکسایی', 'سارا احمدی'].map((n) => (
                  <div
                    key={n}
                    className="flex items-center justify-between text-xs bg-white rounded-lg p-2"
                  >
                    <span className="font-bold text-blue-700">{n}</span>
                    <span className="text-gray-400">۳ بار</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-2">
                <TrendingDown size={13} className="text-rose-600" /> تامین کنندگان (فروشندگان)
              </p>
              <div className="space-y-2">
                {['شرکت پارچه علوی'].map((n) => (
                  <div
                    key={n}
                    className="flex items-center justify-between text-xs bg-white rounded-lg p-2"
                  >
                    <span className="font-bold text-blue-700">{n}</span>
                    <span className="text-gray-400">۱ بار</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ledgerTab === 'drafts' && (
          <div className="p-4">
            <p className="text-xs font-black text-gray-700 mb-3">پیش‌نویس‌های مرتبط</p>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 border-b border-nexa-border">
                  <th className="px-3 py-2">شماره</th>
                  <th className="px-3 py-2">تاریخ</th>
                  <th className="px-3 py-2">مشتری</th>
                  <th className="px-3 py-2">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                <tr>
                  <td className="px-3 py-2 font-fa-num">DRAFT-001</td>
                  <td className="px-3 py-2 font-fa-num">۱۴۰۵/۰۲/۱۰</td>
                  <td className="px-3 py-2 text-blue-700">مهندس کریمی</td>
                  <td className="px-3 py-2 font-fa-num">{formatToman(45_000_000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {ledgerTab === 'warehouse' && (
          <div className="p-4">
            <p className="text-xs font-black text-gray-700 mb-3">رسیدها و حواله‌های انبار</p>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 border-b border-nexa-border">
                  <th className="px-3 py-2">نوع</th>
                  <th className="px-3 py-2">انبار</th>
                  <th className="px-3 py-2">تاریخ</th>
                  <th className="px-3 py-2">شماره</th>
                  <th className="px-3 py-2">ورود</th>
                  <th className="px-3 py-2">خروج</th>
                  <th className="px-3 py-2">مبلغ واحد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexa-border">
                {[
                  { t: 'رسید', wh: 'انبار مرکزی', d: '۱۴۰۵/۰۱/۱۰', n: 'RC-001', i: 5, o: 0 },
                  { t: 'حواله', wh: 'شوروم', d: '۱۴۰۵/۰۲/۰۱', n: 'IS-004', i: 0, o: 2 },
                ].map((r) => (
                  <tr key={r.n} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.t === 'رسید' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                      >
                        {r.t}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.wh}</td>
                    <td className="px-3 py-2 font-fa-num">{r.d}</td>
                    <td className="px-3 py-2 font-fa-num">{r.n}</td>
                    <td className="px-3 py-2 text-emerald-700 font-bold font-fa-num">
                      {r.i || '—'}
                    </td>
                    <td className="px-3 py-2 text-rose-700 font-bold font-fa-num">
                      {r.o || '—'}
                    </td>
                    <td className="px-3 py-2 font-fa-num">
                      {formatToman(product.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ledgerTab === 'other' && (
          <div className="p-4 grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-black text-gray-700 mb-3">موجودی اول دوره به تفکیک انبار</p>
              <div className="space-y-2">
                {['انبار مرکزی', 'شوروم'].map((w, i) => (
                  <div key={w} className="flex justify-between items-center text-xs bg-white rounded-lg p-2">
                    <span>{w}</span>
                    <span className="font-fa-num font-bold">{(i + 1) * 3} عدد</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-black text-gray-700 mb-3">حساب‌های مرتبط</p>
              <div className="space-y-2 text-xs">
                {[
                  ['دارایی انبار', formatToman(product.purchasePrice * 8)],
                  ['فروش کالا', formatToman(product.prices[priceLists[0]?.id ?? ''] ?? 0)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-white rounded-lg p-2">
                    <span className="text-gray-600">{k}</span>
                    <span className="font-fa-num font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── PriceUpdateView ──────────────────────────────────────────────────────────

function PriceUpdateView({
  products,
  priceLists,
  productCategories,
  catName,
  onReplaceProduct,
}: {
  products: Product[];
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
  onReplaceProduct: (p: Product) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [colFilters, setColFilters] = useState({ name: '', code: '', cat: '' });
  const [modal, setModal] = useState({
    operation: priceLists[0]?.id ?? 'pl-retail',
    basedOn: priceLists[0]?.id ?? 'pl-retail',
    percent: '10',
    direction: 'increase',
    round: 'none',
  });

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!colFilters.name || p.name.includes(colFilters.name)) &&
          (!colFilters.code || p.code.includes(colFilters.code)) &&
          (!colFilters.cat || p.categoryIds.some((id) => catName(id).includes(colFilters.cat)))
      ),
    [products, colFilters, catName]
  );

  const cf = (k: keyof typeof colFilters, v: string) =>
    setColFilters((prev) => ({ ...prev, [k]: v }));

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const applyPriceChange = () => {
    const pct = parseFloat(modal.percent) / 100;
    selected.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      const base = product.prices[modal.basedOn] ?? 0;
      let newPrice = modal.direction === 'increase' ? base * (1 + pct) : base * (1 - pct);
      if (modal.round === '1000') newPrice = Math.round(newPrice / 1000) * 1000;
      else if (modal.round === '10000') newPrice = Math.round(newPrice / 10000) * 10000;
      onReplaceProduct({
        ...product,
        prices: { ...product.prices, [modal.operation]: Math.round(newPrice) },
      });
    });
    setShowModal(false);
    setSelected(new Set());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="nexa-card overflow-hidden">
        <div className="p-4 border-b border-nexa-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">
              {selected.size} کالا انتخاب شده
            </span>
          </div>
          <button
            onClick={() => selected.size > 0 && setShowModal(true)}
            disabled={selected.size === 0}
            className="bg-nexa-accent text-white rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-40"
          >
            <Percent size={13} className="inline ml-1" />
            تغییر قیمت
          </button>
        </div>

        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-right text-sm min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-nexa-border text-xs font-black text-gray-400">
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="px-3 py-3">نام</th>
                <th className="px-3 py-3">کد</th>
                <th className="px-3 py-3">دسته</th>
                {priceLists.map((pl) => (
                  <th key={pl.id} className="px-3 py-3">
                    {pl.name}
                  </th>
                ))}
                <th className="px-3 py-3">قیمت خرید</th>
                <th className="px-3 py-3">نوع</th>
              </tr>
              <tr className="bg-gray-50/80 border-b border-nexa-border">
                <td className="px-3 py-1" />
                <td className="px-2 py-1">
                  <input
                    value={colFilters.name}
                    onChange={(e) => cf('name', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={colFilters.code}
                    onChange={(e) => cf('code', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    value={colFilters.cat}
                    onChange={(e) => cf('cat', e.target.value)}
                    className="w-full bg-white border border-nexa-border rounded-lg px-2 py-1 text-xs"
                    placeholder="جستجو…"
                  />
                </td>
                <td colSpan={priceLists.length + 2} />
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.has(p.id) ? 'bg-blue-50/50' : ''}`}
                  onClick={() => {
                    const next = new Set(selected);
                    next.has(p.id) ? next.delete(p.id) : next.add(p.id);
                    setSelected(next);
                  }}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => {}}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-3 py-3 font-bold">{p.name}</td>
                  <td className="px-3 py-3 text-xs font-fa-num text-gray-600">{p.code}</td>
                  <td className="px-3 py-3 text-xs">
                    {p.categoryIds.map((id) => catName(id)).join('، ') || '—'}
                  </td>
                  {priceLists.map((pl) => (
                    <td key={pl.id} className="px-3 py-3 text-xs font-fa-num font-bold">
                      {formatToman(p.prices[pl.id] ?? 0)}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-xs font-fa-num">{formatToman(p.purchasePrice)}</td>
                  <td className="px-3 py-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${p.type === 'goods' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}
                    >
                      {p.type === 'goods' ? 'کالا' : 'خدمات'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price change modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900">تغییر قیمت</h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              {[
                {
                  label: 'عملیات روی',
                  key: 'operation',
                  options: priceLists.map((pl) => ({ v: pl.id, l: pl.name })),
                },
                {
                  label: 'بر اساس',
                  key: 'basedOn',
                  options: priceLists.map((pl) => ({ v: pl.id, l: pl.name })),
                },
                {
                  label: 'نوع',
                  key: 'direction',
                  options: [
                    { v: 'increase', l: 'افزایش' },
                    { v: 'decrease', l: 'کاهش' },
                  ],
                },
                {
                  label: 'گرد کردن',
                  key: 'round',
                  options: [
                    { v: 'none', l: 'خیر' },
                    { v: '1000', l: 'گرد به هزار' },
                    { v: '10000', l: 'گرد به ده هزار' },
                  ],
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-500">{f.label}</label>
                  <select
                    value={modal[f.key as keyof typeof modal]}
                    onChange={(e) => setModal({ ...modal, [f.key]: e.target.value })}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1"
                  >
                    {f.options.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-500">درصد</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={modal.percent}
                    onChange={(e) => setModal({ ...modal, percent: e.target.value })}
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-fa-num"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <button
                onClick={applyPriceChange}
                className="w-full bg-nexa-accent text-white rounded-2xl py-3 font-bold text-sm"
              >
                تایید و اعمال
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── BarcodePrintView ─────────────────────────────────────────────────────────

function BarcodePrintView({
  products,
  priceLists,
  productCategories,
  catName,
}: {
  products: Product[];
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
}) {
  const [settings, setSettings] = useState({
    publisher: 'نکسا',
    paperType: 'عمومی',
    hGap: '10',
    vGap: '10',
    height: '30',
    width: '60',
    barcodeType: 'Code 128',
    showName: true,
    showBarcode: true,
    showCode: true,
    showLines: true,
    showPrice: true,
    priceListId: priceLists[0]?.id ?? 'pl-retail',
    quantity: '1',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = products.find((p) => p.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid md:grid-cols-2 gap-6"
    >
      {/* Settings */}
      <div className="nexa-card p-5 space-y-4">
        <h3 className="text-sm font-black text-gray-900">تنظیمات چاپ بارکد</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'نشر / عنوان', k: 'publisher' },
            { l: 'نوع بارکد', k: 'barcodeType', opts: BARCODE_TYPES },
            { l: 'نوع کاغذ', k: 'paperType', opts: PAPER_TYPES },
            { l: 'تعداد بارکد', k: 'quantity' },
            { l: 'عرض لیبل (mm)', k: 'width' },
            { l: 'ارتفاع لیبل (mm)', k: 'height' },
            { l: 'فاصله افقی (mm)', k: 'hGap' },
            { l: 'فاصله عمودی (mm)', k: 'vGap' },
          ].map((f) =>
            f.opts ? (
              <div key={f.k}>
                <label className="text-[10px] font-bold text-gray-400">{f.l}</label>
                <select
                  value={settings[f.k as keyof typeof settings] as string}
                  onChange={(e) => setSettings({ ...settings, [f.k]: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-1"
                >
                  {f.opts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div key={f.k}>
                <label className="text-[10px] font-bold text-gray-400">{f.l}</label>
                <input
                  value={settings[f.k as keyof typeof settings] as string}
                  onChange={(e) => setSettings({ ...settings, [f.k]: e.target.value })}
                  className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-1"
                />
              </div>
            )
          )}
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: 'درج نام', k: 'showName' },
            { l: 'درج بارکد', k: 'showBarcode' },
            { l: 'درج کد کالا', k: 'showCode' },
            { l: 'رسم خطوط', k: 'showLines' },
            { l: 'نمایش قیمت', k: 'showPrice' },
          ].map((f) => (
            <label key={f.k} className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={settings[f.k as keyof typeof settings] as boolean}
                onChange={(e) => setSettings({ ...settings, [f.k]: e.target.checked })}
                className="w-3.5 h-3.5 rounded"
              />
              {f.l}
            </label>
          ))}
        </div>

        {/* Price list selector */}
        {settings.showPrice && (
          <div>
            <label className="text-[10px] font-bold text-gray-400">لیست قیمت</label>
            <select
              value={settings.priceListId}
              onChange={(e) => setSettings({ ...settings, priceListId: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-1"
            >
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Product list + Preview */}
      <div className="space-y-4">
        <div className="nexa-card overflow-hidden">
          <div className="p-3 border-b border-nexa-border bg-gray-50 text-xs font-bold text-gray-600">
            انتخاب کالا
          </div>
          <div className="max-h-64 overflow-auto divide-y divide-nexa-border">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs hover:bg-gray-50 ${selectedId === p.id ? 'bg-blue-50' : ''}`}
              >
                <span className="font-bold">{p.name}</span>
                <span className="font-fa-num text-gray-400">{p.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barcode preview */}
        {selected && (
          <div className="nexa-card p-5">
            <p className="text-xs font-black text-gray-700 mb-4">پیش‌نمایش بارکد</p>
            <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2">
              {settings.showName && (
                <p className="text-[11px] font-bold text-gray-800">{selected.name}</p>
              )}
              {settings.showBarcode && (
                <div className="flex gap-0.5 h-12">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-900"
                      style={{ width: i % 3 === 0 ? 3 : 1.5, height: '100%' }}
                    />
                  ))}
                </div>
              )}
              {settings.showCode && (
                <p className="text-[10px] font-fa-num text-gray-600">{selected.barcode || selected.code}</p>
              )}
              {settings.showPrice && (
                <p className="text-[11px] font-bold text-nexa-accent font-fa-num">
                  {formatToman(selected.prices[settings.priceListId] ?? 0)} تومان
                </p>
              )}
              <p className="text-[9px] text-gray-400">{settings.publisher}</p>
            </div>
            <button className="mt-4 w-full bg-gray-900 text-white rounded-xl py-2.5 text-xs font-bold">
              <Download size={13} className="inline ml-1" />
              چاپ بارکد
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── BarcodeBulkView ──────────────────────────────────────────────────────────

function BarcodeBulkView({
  products,
  priceLists,
  productCategories,
  catName,
}: {
  products: Product[];
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [priceListId, setPriceListId] = useState(priceLists[0]?.id ?? 'pl-retail');

  const selectedItems = products.filter((p) => (quantities[p.id] ?? 0) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="nexa-card p-4 flex flex-wrap items-center gap-4">
        <p className="text-sm font-black text-gray-700">تنظیمات چاپ تعدادی</p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">لیست قیمت:</label>
          <select
            value={priceListId}
            onChange={(e) => setPriceListId(e.target.value)}
            className="bg-gray-50 rounded-xl px-3 py-2 text-xs"
          >
            {priceLists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
        </div>
        <span className="mr-auto text-xs text-gray-500">
          {selectedItems.length} کالا انتخاب — مجموع{' '}
          {Object.values(quantities).reduce((a, b) => a + b, 0)} بارکد
        </span>
        <button className="bg-gray-900 text-white rounded-xl px-4 py-2 text-xs font-bold">
          <Download size={13} className="inline ml-1" />
          چاپ همه
        </button>
      </div>

      <div className="nexa-card overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 border-b border-nexa-border text-xs font-black text-gray-400">
                <th className="px-4 py-3">نام کالا</th>
                <th className="px-4 py-3">کد</th>
                <th className="px-4 py-3">بارکد</th>
                <th className="px-4 py-3">قیمت</th>
                <th className="px-4 py-3 w-32">تعداد بارکد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{p.name}</td>
                  <td className="px-4 py-3 text-xs font-fa-num text-gray-600">{p.code}</td>
                  <td className="px-4 py-3 text-xs font-fa-num text-gray-500">
                    {p.barcode || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-fa-num font-bold">
                    {formatToman(p.prices[priceListId] ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={quantities[p.id] ?? 0}
                      onChange={(e) =>
                        setQuantities({ ...quantities, [p.id]: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 border border-nexa-border rounded-xl px-3 py-1.5 text-xs font-fa-num text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ── PricePageEditor ──────────────────────────────────────────────────────────

function PricePageEditor({
  products,
  priceLists,
  productCategories,
  catName,
}: {
  products: Product[];
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
}) {
  const [form, setForm] = useState({
    name: '',
    startDate: '۱۴۰۵/۰۱/۰۱',
    endDate: '۱۴۰۵/۱۲/۲۹',
    active: true,
    title: '',
    description: '',
    priceListId: priceLists[0]?.id ?? 'pl-retail',
    showImage: true,
    showPrice: true,
    showCode: false,
    showAccountingCode: false,
    showStock: false,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const link = `https://nexa.app/price-list/${Date.now()}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const upd = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid md:grid-cols-2 gap-6"
    >
      {/* Form */}
      <div className="nexa-card p-6 space-y-4">
        <h3 className="text-sm font-black text-gray-900">صفحه لیست قیمت کالا</h3>

        <div>
          <label className="text-xs font-bold text-gray-500">
            نام <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => upd({ name: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500">
              تاریخ شروع <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.startDate}
              onChange={(e) => upd({ startDate: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 font-fa-num"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">
              تاریخ پایان <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.endDate}
              onChange={(e) => upd({ endDate: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 font-fa-num"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => upd({ active: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">فعال</span>
        </label>

        <div>
          <label className="text-xs font-bold text-gray-500">
            عنوان صفحه <span className="text-rose-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => upd({ title: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500">توضیحات</label>
          <textarea
            value={form.description}
            onChange={(e) => upd({ description: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 min-h-[60px]"
          />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-bold text-gray-500">لینک صفحه لیست قیمت</label>
          <div className="flex gap-2 mt-1">
            <input
              value={link}
              readOnly
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-fa-num text-gray-500"
            />
            <button
              onClick={copyLink}
              className="bg-nexa-accent text-white rounded-xl px-3 text-xs font-bold"
            >
              {copied ? '✓' : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-nexa-border pt-4">
          <p className="text-xs font-black text-gray-700 mb-3">تنظیمات نمایش</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">لیست قیمت</label>
              <select
                value={form.priceListId}
                onChange={(e) => upd({ priceListId: e.target.value })}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-1"
              >
                {priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-1">
              {[
                { l: 'نمایش تصویر', k: 'showImage' },
                { l: 'نمایش قیمت', k: 'showPrice' },
                { l: 'نمایش کد حسابداری', k: 'showAccountingCode' },
                { l: 'نمایش موجودی', k: 'showStock' },
              ].map((f) => (
                <label key={f.k} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[f.k as keyof typeof form] as boolean}
                    onChange={(e) => upd({ [f.k]: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  {f.l}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Product picker button */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full border border-dashed border-nexa-accent text-nexa-accent rounded-2xl py-3 text-xs font-bold"
        >
          <Plus size={13} className="inline ml-1" />
          انتخاب کالاها ({selectedIds.length} کالا)
        </button>
      </div>

      {/* Preview */}
      <div className="nexa-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-gray-900">
            {form.title || 'عنوان صفحه لیست قیمت'}
          </p>
          <a
            href="#"
            className="text-nexa-accent text-xs font-bold flex items-center gap-1"
            onClick={(e) => e.preventDefault()}
          >
            <ExternalLink size={12} />
            مشاهده آنلاین
          </a>
        </div>
        {form.description && (
          <p className="text-xs text-gray-500 mb-4">{form.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {products
            .filter((p) => selectedIds.includes(p.id))
            .map((p) => (
              <div key={p.id} className="border border-nexa-border rounded-2xl p-3">
                {form.showImage && (
                  <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 mb-2">
                    <ImageIcon size={24} />
                  </div>
                )}
                <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                {form.showAccountingCode && (
                  <p className="text-[10px] text-gray-400 font-fa-num">{p.accountingCode}</p>
                )}
                {form.showPrice && (
                  <p className="text-xs font-black text-nexa-accent font-fa-num mt-1">
                    {formatToman(p.prices[form.priceListId] ?? 0)} تومان
                  </p>
                )}
              </div>
            ))}
          {selectedIds.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400 text-xs">
              کالایی انتخاب نشده است
            </div>
          )}
        </div>
      </div>

      {/* Product picker modal */}
      <AnimatePresence>
        {showPicker && (
          <ProductPickerModal
            products={products}
            productCategories={productCategories}
            catName={catName}
            selected={selectedIds}
            onConfirm={(ids) => {
              setSelectedIds(ids);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── CatalogEditor ────────────────────────────────────────────────────────────

function CatalogEditor({
  products,
  priceLists,
  productCategories,
  catName,
}: {
  products: Product[];
  priceLists: PriceList[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
}) {
  const [form, setForm] = useState({
    title: '',
    startDate: '۱۴۰۵/۰۱/۰۱',
    endDate: '۱۴۰۵/۱۲/۲۹',
    active: true,
    description: '',
    priceListId: priceLists[0]?.id ?? 'pl-retail',
    showName: true,
    showCode: false,
    showStock: false,
    showPrice: true,
    showImages: true,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const link = `https://nexa.app/catalog/${Date.now()}`;
  const [copied, setCopied] = useState(false);

  const upd = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid md:grid-cols-2 gap-6"
    >
      <div className="nexa-card p-6 space-y-4">
        <h3 className="text-sm font-black text-gray-900">کاتالوگ آنلاین</h3>

        <div>
          <label className="text-xs font-bold text-gray-500">عنوان کاتالوگ</label>
          <input
            value={form.title}
            onChange={(e) => upd({ title: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500">از تاریخ</label>
            <input
              value={form.startDate}
              onChange={(e) => upd({ startDate: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 font-fa-num"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">تا تاریخ</label>
            <input
              value={form.endDate}
              onChange={(e) => upd({ endDate: e.target.value })}
              className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 font-fa-num"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => upd({ active: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">فعال</span>
        </label>

        <div>
          <label className="text-xs font-bold text-gray-500">توضیحات</label>
          <textarea
            value={form.description}
            onChange={(e) => upd({ description: e.target.value })}
            className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm mt-1 min-h-[60px]"
          />
        </div>

        <div className="border-t border-nexa-border pt-4">
          <p className="text-xs font-black text-gray-700 mb-3">تنظیمات نمایش</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">لیست قیمت</label>
              <select
                value={form.priceListId}
                onChange={(e) => upd({ priceListId: e.target.value })}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-1"
              >
                {priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-1">
              {[
                { l: 'نمایش نام', k: 'showName' },
                { l: 'نمایش کد حسابداری', k: 'showCode' },
                { l: 'نمایش موجودی', k: 'showStock' },
                { l: 'نمایش قیمت', k: 'showPrice' },
                { l: 'نمایش تصاویر', k: 'showImages' },
              ].map((f) => (
                <label key={f.k} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[f.k as keyof typeof form] as boolean}
                    onChange={(e) => upd({ [f.k]: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  {f.l}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-bold text-gray-500">لینک کاتالوگ</label>
          <div className="flex gap-2 mt-1">
            <input
              value={link}
              readOnly
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-xs font-fa-num text-gray-500"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(link).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="bg-nexa-accent text-white rounded-xl px-3 text-xs font-bold"
            >
              {copied ? '✓' : <Copy size={14} />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="w-full border border-dashed border-nexa-accent text-nexa-accent rounded-2xl py-3 text-xs font-bold"
        >
          <Plus size={13} className="inline ml-1" />
          انتخاب کالاها ({selectedIds.length} کالا)
        </button>
      </div>

      {/* Preview grid */}
      <div className="nexa-card p-5">
        <p className="text-sm font-black text-gray-900 mb-4">
          {form.title || 'پیش‌نمایش کاتالوگ'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {products
            .filter((p) => selectedIds.includes(p.id))
            .map((p) => (
              <div key={p.id} className="border border-nexa-border rounded-2xl overflow-hidden">
                {form.showImages && (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-300">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="p-3">
                  {form.showName && (
                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                  )}
                  {form.showCode && (
                    <p className="text-[10px] text-gray-400 font-fa-num">{p.accountingCode}</p>
                  )}
                  {form.showStock && (
                    <p className="text-[10px] text-gray-500">
                      موجودی: {p.inventory.trackStock ? 'موجود' : '—'}
                    </p>
                  )}
                  {form.showPrice && (
                    <p className="text-xs font-black text-nexa-accent font-fa-num mt-1">
                      {formatToman(p.prices[form.priceListId] ?? 0)} تومان
                    </p>
                  )}
                </div>
              </div>
            ))}
          {selectedIds.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400 text-xs">
              کالایی انتخاب نشده است
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPicker && (
          <ProductPickerModal
            products={products}
            productCategories={productCategories}
            catName={catName}
            selected={selectedIds}
            onConfirm={(ids) => {
              setSelectedIds(ids);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── ProductPickerModal ────────────────────────────────────────────────────────

function ProductPickerModal({
  products,
  productCategories,
  catName,
  selected,
  onConfirm,
  onClose,
}: {
  products: Product[];
  productCategories: ProductCategory[];
  catName: (id: string) => string;
  selected: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selected));
  const [typeFilter, setTypeFilter] = useState<'all' | 'goods' | 'services'>('all');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (catFilter && !p.categoryIds.includes(catFilter)) return false;
    if (search && !p.name.includes(search) && !p.code.includes(search)) return false;
    return true;
  });

  const toggle = (id: string) => {
    const next = new Set(localSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setLocalSelected(next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-nexa-border flex items-center justify-between">
          <h3 className="font-black text-gray-900">انتخاب کالا</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-3 border-b border-nexa-border flex flex-wrap gap-2">
          {(['all', 'goods', 'services'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${typeFilter === t ? 'bg-nexa-accent text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'all' ? 'همه' : t === 'goods' ? 'کالا' : 'خدمات'}
            </button>
          ))}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-gray-50 rounded-lg px-2 py-1 text-xs"
          >
            <option value="">همه دسته‌ها</option>
            {productCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `${catName(c.parentId)} / ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-32">
            <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو…"
              className="w-full bg-gray-50 rounded-lg pr-7 pl-2 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-right text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b border-nexa-border">
              <tr className="text-gray-400 font-black">
                <th className="px-3 py-2 w-8" />
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">نام</th>
                <th className="px-3 py-2">دسته</th>
                <th className="px-3 py-2">کد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexa-border">
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`hover:bg-gray-50 cursor-pointer ${localSelected.has(p.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={localSelected.has(p.id)}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-400 font-fa-num">{idx + 1}</td>
                  <td className="px-3 py-2 font-bold text-blue-700">{p.name}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {p.categoryIds.map((id) => catName(id)).join('، ') || '—'}
                  </td>
                  <td className="px-3 py-2 font-fa-num text-gray-500">{p.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-nexa-border flex gap-3">
          <button
            onClick={() => onConfirm([...localSelected])}
            className="flex-1 bg-nexa-accent text-white rounded-2xl py-2.5 text-sm font-bold"
          >
            تایید ({localSelected.size} کالا)
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-2.5 text-sm font-bold"
          >
            انصراف
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── ProductCategoryManager ───────────────────────────────────────────────────

function ProductCategoryManager({
  categories,
  usedCategoryIds,
  draft,
  setDraft,
  onSave,
  onDelete,
  onReorder,
  onMove,
}: {
  categories: ProductCategory[];
  usedCategoryIds: Set<string>;
  draft: { id: string; name: string; parentId: string };
  setDraft: (d: { id: string; name: string; parentId: string }) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onMove: (id: string, parentId?: string) => void;
}) {
  return (
    <CategoryTreeManager
      title="مدیریت دسته بندی کالاها"
      categories={categories}
      usedCategoryIds={usedCategoryIds}
      draft={draft}
      setDraft={setDraft}
      onSave={onSave}
      onDelete={onDelete}
      onMove={onMove}
      onReorder={onReorder}
    />
  );
}
