import React, { useMemo, useState } from 'react';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';

type WarehouseTab =
  | 'warehouses'
  | 'new-voucher'
  | 'voucher-list'
  | 'inventory-by-warehouse'
  | 'all-warehouses-inventory'
  | 'stocktaking';

type QueryInfo = {
  sortBy: string;
  sortDesc: boolean;
  take: number;
  skip: number;
  search: string;
  searchFields: string[];
  filters: Array<{ field: string; op: string; value: string }>;
};

type WarehouseRecord = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  description: string;
};

type VoucherItem = {
  id: string;
  itemCode: string;
  title: string;
  requestedQty: number;
  availableQty: number;
  quantity: number;
  unit: string;
};

type WarehouseVoucher = {
  id: string;
  number: string;
  date: string;
  status: string;
  description: string;
  type: 'issue' | 'transfer';
  warehouseReceiptStatus: 'pending' | 'posted';
  sourceInvoiceNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: VoucherItem[];
};

type StocktakingRow = {
  id: string;
  itemCode: string;
  title: string;
  systemQty: number;
  countedQty: number;
};

const tabs: Array<{ id: WarehouseTab; label: string }> = [
  { id: 'warehouses', label: 'انبارها' },
  { id: 'new-voucher', label: 'حواله جدید' },
  { id: 'voucher-list', label: 'حواله انبار' },
  { id: 'inventory-by-warehouse', label: 'موجودی کالا در انبار' },
  { id: 'all-warehouses-inventory', label: 'موجودی تمام انبارها' },
  { id: 'stocktaking', label: 'انبارگردانی' },
];

const seedWarehouses: WarehouseRecord[] = [
  { id: 'w1', code: 'WH-CENTRAL', name: 'انبار مرکزی', isActive: true, description: 'اصلی' },
  { id: 'w2', code: 'WH-RAW', name: 'انبار مواد اولیه', isActive: true, description: 'مواد' },
];

export default function WarehouseView() {
  const { products } = useCatalog();
  const [tab, setTab] = useState<WarehouseTab>('warehouses');
  const [queryInfo, setQueryInfo] = useState<QueryInfo>({
    sortBy: 'date',
    sortDesc: true,
    take: 20,
    skip: 0,
    search: '',
    searchFields: ['name', 'code', 'barcode'],
    filters: [],
  });

  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>(seedWarehouses);
  const [warehouseDraft, setWarehouseDraft] = useState<WarehouseRecord>({
    id: '',
    code: '',
    name: '',
    isActive: true,
    description: '',
  });
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [activeWarehouseId, setActiveWarehouseId] = useState(seedWarehouses[0]?.id || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [voucherDraft, setVoucherDraft] = useState<WarehouseVoucher>({
    id: '',
    number: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'draft',
    description: '',
    type: 'issue',
    warehouseReceiptStatus: 'pending',
    sourceInvoiceNumber: '',
    sourceWarehouseId: seedWarehouses[0]?.id || '',
    destinationWarehouseId: seedWarehouses[1]?.id || '',
    items: [],
  });
  const [voucherList, setVoucherList] = useState<WarehouseVoucher[]>([]);

  const [stocktakingNumber, setStocktakingNumber] = useState('');
  const [stocktakingWarehouseId, setStocktakingWarehouseId] = useState(seedWarehouses[0]?.id || '');
  const [stocktakingRows, setStocktakingRows] = useState<StocktakingRow[]>([]);

  const productsMapped = useMemo(
    () =>
      products.map((p, idx) => ({
        id: p.id,
        itemCode: p.code || p.accountingCode || `ITEM-${idx + 1}`,
        name: p.name,
        unit: p.units?.main || 'عدد',
        barcode: p.barcode || '',
      })),
    [products]
  );

  const filteredVoucherList = voucherList.filter(
    (x) =>
      !queryInfo.search ||
      x.number.includes(queryInfo.search) ||
      x.sourceInvoiceNumber.includes(queryInfo.search) ||
      x.status.includes(queryInfo.search)
  );

  const stockByWarehouse = useMemo(() => {
    return productsMapped
      .filter(
        (p) =>
          !queryInfo.search ||
          p.name.includes(queryInfo.search) ||
          p.itemCode.includes(queryInfo.search) ||
          p.barcode.includes(queryInfo.search)
      )
      .map((p, i) => ({
        itemCode: p.itemCode,
        name: p.name,
        barcode: p.barcode,
        unit: p.unit,
        qty: Math.max(0, 50 - i * 2),
      }));
  }, [productsMapped, queryInfo.search]);

  const allWarehousesInventory = useMemo(() => {
    return stockByWarehouse.map((row, i) => ({
      ...row,
      inCentral: Math.max(0, row.qty - i),
      inRaw: Math.max(0, i + 2),
      total: Math.max(0, row.qty - i) + Math.max(0, i + 2),
    }));
  }, [stockByWarehouse]);

  const saveWarehouse = () => {
    const next: WarehouseRecord = {
      ...warehouseDraft,
      id: warehouseDraft.id || `wh-${Date.now()}`,
      code: warehouseDraft.code || `WH-${warehouses.length + 1}`,
    };
    setWarehouses((prev) => [next, ...prev.filter((x) => x.id !== next.id)]);
    setWarehouseDraft({ id: '', code: '', name: '', isActive: true, description: '' });
  };

  const addVoucherItem = () => {
    const picked = productsMapped[0];
    if (!picked) return;
    const newItem: VoucherItem = {
      id: `vi-${Date.now()}`,
      itemCode: picked.itemCode,
      title: picked.name,
      requestedQty: 1,
      availableQty: 5,
      quantity: 1,
      unit: picked.unit,
    };
    setVoucherDraft((s) => ({ ...s, items: [...s.items, newItem] }));
  };

  const patchVoucherItem = (id: string, patch: Partial<VoucherItem>) => {
    setVoucherDraft((s) => ({
      ...s,
      items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const removeVoucherItem = (id: string) => {
    setVoucherDraft((s) => ({ ...s, items: s.items.filter((x) => x.id !== id) }));
  };

  const saveVoucher = () => {
    const next: WarehouseVoucher = {
      ...voucherDraft,
      id: voucherDraft.id || `wv-${Date.now()}`,
      number: voucherDraft.number || String(5000 + voucherList.length + 1),
    };
    setVoucherList((prev) => [next, ...prev.filter((x) => x.id !== next.id)]);
    setVoucherDraft((s) => ({
      ...s,
      id: '',
      number: '',
      description: '',
      sourceInvoiceNumber: '',
      items: [],
      warehouseReceiptStatus: 'pending',
      status: 'draft',
    }));
  };

  const initStocktaking = () => {
    setStocktakingRows(
      productsMapped.slice(0, 8).map((p, idx) => ({
        id: `st-${idx}-${Date.now()}`,
        itemCode: p.itemCode,
        title: p.name,
        systemQty: Math.max(1, 20 - idx),
        countedQty: Math.max(1, 20 - idx),
      }))
    );
  };

  const patchStocktakingRow = (id: string, countedQty: number) => {
    setStocktakingRows((prev) => prev.map((x) => (x.id === id ? { ...x, countedQty } : x)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">مدیریت انبار</h1>
          <p className="text-xs text-gray-500">ریست کامل با تب‌بندی داخلی و هم‌راستایی API-ready</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
          <input
            className="nexa-input pr-9"
            value={queryInfo.search}
            onChange={(e) => setQueryInfo((s) => ({ ...s, search: e.target.value }))}
            placeholder="جستجو با نام/کد/بارکد"
          />
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={`px-4 py-2 text-xs rounded-xl font-bold whitespace-nowrap ${
              tab === x.id ? 'bg-white text-nexa-accent' : 'text-gray-500'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'warehouses' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black">لیست انبارها</h3>
            <div className="flex gap-2">
              <button className="nexa-btn-ghost text-xs" onClick={() => setShowWarehouseModal(true)}>
                <Eye size={14} /> انبار موجود
              </button>
              <button className="nexa-btn-primary text-xs" onClick={saveWarehouse}>
                <Plus size={14} /> تعریف انبار جدید
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-2">
            <input className="nexa-input" placeholder="کد" value={warehouseDraft.code} onChange={(e) => setWarehouseDraft((s) => ({ ...s, code: e.target.value }))} />
            <input className="nexa-input" placeholder="نام انبار" value={warehouseDraft.name} onChange={(e) => setWarehouseDraft((s) => ({ ...s, name: e.target.value }))} />
            <label className="nexa-input flex items-center gap-2 text-xs">
              <input type="checkbox" checked={warehouseDraft.isActive} onChange={(e) => setWarehouseDraft((s) => ({ ...s, isActive: e.target.checked }))} />
              فعال
            </label>
            <input className="nexa-input" placeholder="توضیحات" value={warehouseDraft.description} onChange={(e) => setWarehouseDraft((s) => ({ ...s, description: e.target.value }))} />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">کد</th>
                <th className="text-right">نام</th>
                <th className="text-right">وضعیت</th>
                <th className="text-right">توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2">{x.code}</td>
                  <td>{x.name}</td>
                  <td>{x.isActive ? 'فعال' : 'غیرفعال'}</td>
                  <td>{x.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'new-voucher' && (
        <div className="nexa-card p-4 space-y-3">
          <h3 className="text-sm font-black">حواله جدید</h3>
          <div className="grid md:grid-cols-4 gap-2">
            <input className="nexa-input" placeholder="شماره" value={voucherDraft.number} onChange={(e) => setVoucherDraft((s) => ({ ...s, number: e.target.value }))} />
            <input className="nexa-input" type="date" value={voucherDraft.date} onChange={(e) => setVoucherDraft((s) => ({ ...s, date: e.target.value }))} />
            <select className="nexa-input" value={voucherDraft.type} onChange={(e) => setVoucherDraft((s) => ({ ...s, type: e.target.value as 'issue' | 'transfer' }))}>
              <option value="issue">حواله خروج</option>
              <option value="transfer">انتقال بین انبار</option>
            </select>
            <select className="nexa-input" value={voucherDraft.warehouseReceiptStatus} onChange={(e) => setVoucherDraft((s) => ({ ...s, warehouseReceiptStatus: e.target.value as 'pending' | 'posted' }))}>
              <option value="pending">pending</option>
              <option value="posted">posted</option>
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            <input className="nexa-input" placeholder="شماره فاکتور فروش مرجع" value={voucherDraft.sourceInvoiceNumber} onChange={(e) => setVoucherDraft((s) => ({ ...s, sourceInvoiceNumber: e.target.value }))} />
            <select className="nexa-input" value={voucherDraft.sourceWarehouseId} onChange={(e) => setVoucherDraft((s) => ({ ...s, sourceWarehouseId: e.target.value }))}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  مبدا: {w.name}
                </option>
              ))}
            </select>
            <select className="nexa-input" value={voucherDraft.destinationWarehouseId} onChange={(e) => setVoucherDraft((s) => ({ ...s, destinationWarehouseId: e.target.value }))}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  مقصد: {w.name}
                </option>
              ))}
            </select>
          </div>
          <textarea className="nexa-input min-h-20" placeholder="توضیحات" value={voucherDraft.description} onChange={(e) => setVoucherDraft((s) => ({ ...s, description: e.target.value }))} />

          <div className="rounded-xl border p-2 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black">آیتم‌های حواله</h4>
              <button className="nexa-btn-ghost text-xs" onClick={addVoucherItem}>
                <Plus size={14} /> افزودن ردیف
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 text-right">کالا</th>
                  <th className="text-right">درخواستی</th>
                  <th className="text-right">موجود</th>
                  <th className="text-right">حواله</th>
                  <th className="text-right">واحد</th>
                  <th className="text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {voucherDraft.items.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="py-2">
                      <select
                        className="nexa-input"
                        value={x.itemCode}
                        onChange={(e) => {
                          const picked = productsMapped.find((p) => p.itemCode === e.target.value);
                          patchVoucherItem(x.id, {
                            itemCode: e.target.value,
                            title: picked?.name || x.title,
                            unit: picked?.unit || x.unit,
                          });
                        }}
                      >
                        {productsMapped.map((p) => (
                          <option key={p.id} value={p.itemCode}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{x.requestedQty}</td>
                    <td>{x.availableQty}</td>
                    <td>
                      <input
                        type="number"
                        className="nexa-input"
                        value={x.quantity}
                        onChange={(e) => patchVoucherItem(x.id, { quantity: Number(e.target.value || 0) })}
                      />
                      {x.quantity > x.availableQty && <p className="text-[10px] text-rose-500 mt-1">کمبود موجودی</p>}
                    </td>
                    <td>{x.unit}</td>
                    <td>
                      <button className="nexa-btn-ghost text-xs" onClick={() => removeVoucherItem(x.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="nexa-btn-primary" onClick={saveVoucher}>
            ثبت حواله
          </button>
        </div>
      )}

      {tab === 'voucher-list' && (
        <div className="nexa-card p-4 space-y-3">
          <h3 className="text-sm font-black">لیست حواله انبار</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">شماره</th>
                <th className="text-right">تاریخ</th>
                <th className="text-right">نوع</th>
                <th className="text-right">فاکتور مرجع</th>
                <th className="text-right">وضعیت</th>
                <th className="text-right">WarehouseReceiptStatus</th>
                <th className="text-right">آیتم‌ها</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoucherList.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2">{x.number}</td>
                  <td>{x.date}</td>
                  <td>{x.type === 'issue' ? 'حواله خروج' : 'انتقال'}</td>
                  <td>{x.sourceInvoiceNumber || '-'}</td>
                  <td>{x.status}</td>
                  <td>{x.warehouseReceiptStatus}</td>
                  <td>{x.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'inventory-by-warehouse' && (
        <div className="nexa-card p-4 space-y-3">
          <h3 className="text-sm font-black">موجودی کالا در انبار خاص</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <select className="nexa-input" value={activeWarehouseId} onChange={(e) => setActiveWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <input className="nexa-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input className="nexa-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">کد</th>
                <th className="text-right">نام کالا</th>
                <th className="text-right">بارکد</th>
                <th className="text-right">واحد</th>
                <th className="text-right">موجودی</th>
              </tr>
            </thead>
            <tbody>
              {stockByWarehouse.map((x) => (
                <tr key={x.itemCode} className="border-b">
                  <td className="py-2">{x.itemCode}</td>
                  <td>{x.name}</td>
                  <td>{x.barcode || '-'}</td>
                  <td>{x.unit}</td>
                  <td>{x.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'all-warehouses-inventory' && (
        <div className="nexa-card p-4 space-y-3 overflow-x-auto">
          <h3 className="text-sm font-black">موجودی تمام انبارها</h3>
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">کد</th>
                <th className="text-right">نام کالا</th>
                <th className="text-right">بارکد</th>
                <th className="text-right">انبار مرکزی</th>
                <th className="text-right">انبار مواد اولیه</th>
                <th className="text-right">جمع</th>
              </tr>
            </thead>
            <tbody>
              {allWarehousesInventory.map((x) => (
                <tr key={x.itemCode} className="border-b">
                  <td className="py-2">{x.itemCode}</td>
                  <td>{x.name}</td>
                  <td>{x.barcode || '-'}</td>
                  <td>{x.inCentral}</td>
                  <td>{x.inRaw}</td>
                  <td>{x.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'stocktaking' && (
        <div className="nexa-card p-4 space-y-3">
          <h3 className="text-sm font-black">انبارگردانی</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <input className="nexa-input" placeholder="شماره انبارگردانی" value={stocktakingNumber} onChange={(e) => setStocktakingNumber(e.target.value)} />
            <select className="nexa-input" value={stocktakingWarehouseId} onChange={(e) => setStocktakingWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button className="nexa-btn-primary" onClick={initStocktaking}>
              شروع انبارگردانی جدید
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">کد</th>
                <th className="text-right">کالا</th>
                <th className="text-right">سیستمی</th>
                <th className="text-right">شمارش شده</th>
                <th className="text-right">اختلاف</th>
              </tr>
            </thead>
            <tbody>
              {stocktakingRows.map((x) => {
                const diff = x.countedQty - x.systemQty;
                return (
                  <tr key={x.id} className="border-b">
                    <td className="py-2">{x.itemCode}</td>
                    <td>{x.title}</td>
                    <td>{x.systemQty}</td>
                    <td>
                      <input
                        type="number"
                        className="nexa-input"
                        value={x.countedQty}
                        onChange={(e) => patchStocktakingRow(x.id, Number(e.target.value || 0))}
                      />
                    </td>
                    <td className={diff === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showWarehouseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black">انبار موجود</h3>
              <button className="nexa-btn-ghost text-xs" onClick={() => setShowWarehouseModal(false)}>
                بستن
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 text-right">کد</th>
                  <th className="text-right">نام</th>
                  <th className="text-right">انتخاب</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="py-2">{x.code}</td>
                    <td>{x.name}</td>
                    <td>
                      <button
                        className="nexa-btn-ghost text-xs"
                        onClick={() => {
                          setWarehouseDraft(x);
                          setShowWarehouseModal(false);
                        }}
                      >
                        انتخاب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
