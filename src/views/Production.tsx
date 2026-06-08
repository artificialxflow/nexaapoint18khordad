import React, { useMemo, useState } from 'react';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useCatalog } from '@/src/context/CatalogContext';

type ProdTab =
  | 'formula'
  | 'formula-list'
  | 'material-needs'
  | 'production-order-list'
  | 'work-order'
  | 'work-order-list';

type FormulaRow = { id: string; title: string; unit: string; qty: number; amount: number };
type Formula = {
  id: string;
  number: string;
  date: string;
  project: string;
  status: 'draft' | 'confirmed';
  isActive: boolean;
  productItemCode: string;
  outputWarehouse: string;
  description: string;
  materials: FormulaRow[];
  directLabor: FormulaRow[];
  overhead: FormulaRow[];
};

type ProductionOrder = {
  id: string;
  number: string;
  invoiceRef: string;
  customer: string;
  date: string;
  priority: number;
  status: string;
  deliveryDate: string;
  qtyPlanned: number;
  qtyDone: number;
};

type WorkOrder = {
  id: string;
  number: string;
  date: string;
  status: string;
  formulaId: string;
  productTitle: string;
  outputWarehouse: string;
  customer: string;
  description: string;
};

const tabs: Array<{ id: ProdTab; label: string }> = [
  { id: 'formula', label: 'فرمول تولید' },
  { id: 'formula-list', label: 'لیست فرمول تولید' },
  { id: 'material-needs', label: 'نیازسنجی مواد' },
  { id: 'production-order-list', label: 'لیست سفارش های تولید' },
  { id: 'work-order', label: 'دستور تولید' },
  { id: 'work-order-list', label: 'لیست دستور تولید' },
];

function newFormulaRow(): FormulaRow {
  return { id: `${Date.now()}-${Math.random()}`, title: '', unit: '', qty: 0, amount: 0 };
}

function SectionTable({
  title,
  rows,
  onAdd,
  onPatch,
  onRemove,
}: {
  title: string;
  rows: FormulaRow[];
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<FormulaRow>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border p-2 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black">{title}</h4>
        <button className="nexa-btn-ghost text-xs" onClick={onAdd}>
          <Plus size={14} /> افزودن
        </button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 text-right">شرح</th>
            <th className="text-right">واحد</th>
            <th className="text-right">تعداد</th>
            <th className="text-right">مبلغ</th>
            <th className="text-right">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">
                <input
                  className="nexa-input"
                  value={row.title}
                  onChange={(e) => onPatch(row.id, { title: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="nexa-input"
                  value={row.unit}
                  onChange={(e) => onPatch(row.id, { unit: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="nexa-input"
                  type="number"
                  value={row.qty}
                  onChange={(e) => onPatch(row.id, { qty: Number(e.target.value || 0) })}
                />
              </td>
              <td>
                <input
                  className="nexa-input"
                  type="number"
                  value={row.amount}
                  onChange={(e) => onPatch(row.id, { amount: Number(e.target.value || 0) })}
                />
              </td>
              <td>
                <button className="nexa-btn-ghost text-xs" onClick={() => onRemove(row.id)}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Production() {
  const { products, people } = useCatalog();
  const customers = useMemo(() => people.filter((x) => x.roles.includes('customer')), [people]);
  const [tab, setTab] = useState<ProdTab>('formula');
  const [search, setSearch] = useState('');
  const [showFormulaPicker, setShowFormulaPicker] = useState(false);
  const [selectedFormulaForNeeds, setSelectedFormulaForNeeds] = useState('');

  const [formula, setFormula] = useState<Formula>({
    id: '',
    number: '',
    date: new Date().toISOString().slice(0, 10),
    project: '',
    status: 'draft',
    isActive: true,
    productItemCode: '',
    outputWarehouse: 'انبار داخلی',
    description: '',
    materials: [newFormulaRow(), newFormulaRow()],
    directLabor: [newFormulaRow()],
    overhead: [newFormulaRow()],
  });
  const [formulaList, setFormulaList] = useState<Formula[]>([]);
  const [materialNeedRows, setMaterialNeedRows] = useState<Array<{ name: string; unit: string; qty: number }>>([]);
  const [productionOrders] = useState<ProductionOrder[]>([
    {
      id: 'po-1',
      number: '1001',
      invoiceRef: 'فاکتور فروش 1003',
      customer: customers[0]?.displayName || 'بدون مشتری',
      date: '1405/02/20',
      priority: 1,
      status: 'در حال تولید',
      deliveryDate: '1405/02/31',
      qtyPlanned: 5,
      qtyDone: 2,
    },
  ]);
  const [workOrder, setWorkOrder] = useState<WorkOrder>({
    id: '',
    number: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'در انتظار',
    formulaId: '',
    productTitle: '',
    outputWarehouse: 'انبار داخلی',
    customer: '',
    description: '',
  });
  const [workOrderList, setWorkOrderList] = useState<WorkOrder[]>([]);

  const updateFormulaRows = (
    bucket: 'materials' | 'directLabor' | 'overhead',
    rowId: string,
    patch: Partial<FormulaRow>
  ) => {
    setFormula((prev) => ({
      ...prev,
      [bucket]: prev[bucket].map((x) => (x.id === rowId ? { ...x, ...patch } : x)),
    }));
  };

  const addFormulaRow = (bucket: 'materials' | 'directLabor' | 'overhead') => {
    setFormula((prev) => ({ ...prev, [bucket]: [...prev[bucket], newFormulaRow()] }));
  };

  const removeFormulaRow = (bucket: 'materials' | 'directLabor' | 'overhead', rowId: string) => {
    setFormula((prev) => ({ ...prev, [bucket]: prev[bucket].filter((x) => x.id !== rowId) }));
  };

  const saveFormula = () => {
    const saved: Formula = {
      ...formula,
      id: formula.id || `f-${Date.now()}`,
      number: formula.number || String(2000 + formulaList.length + 1),
    };
    setFormulaList((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
  };

  const computeMaterialNeed = () => {
    const selected = formulaList.find((x) => x.id === selectedFormulaForNeeds);
    if (!selected) {
      setMaterialNeedRows([]);
      return;
    }
    setMaterialNeedRows(
      selected.materials
        .filter((x) => x.title.trim())
        .map((x) => ({ name: x.title, unit: x.unit || '-', qty: x.qty }))
    );
  };

  const saveWorkOrder = () => {
    const saved: WorkOrder = {
      ...workOrder,
      id: workOrder.id || `wo-${Date.now()}`,
      number: workOrder.number || String(3000 + workOrderList.length + 1),
    };
    setWorkOrderList((prev) => [saved, ...prev.filter((x) => x.id !== saved.id)]);
  };

  const filteredFormulaList = formulaList.filter(
    (x) => !search || x.number.includes(search) || x.project.includes(search)
  );
  const filteredProductionOrders = productionOrders.filter(
    (x) =>
      !search ||
      x.number.includes(search) ||
      x.invoiceRef.includes(search) ||
      x.customer.includes(search) ||
      x.status.includes(search)
  );
  const filteredWorkOrders = workOrderList.filter(
    (x) =>
      !search ||
      x.number.includes(search) ||
      x.productTitle.includes(search) ||
      x.customer.includes(search) ||
      x.status.includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">تولید</h1>
        <p className="text-xs text-gray-500">فرمول تولید، نیازسنجی مواد و مدیریت دستور تولید</p>
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

      {tab === 'formula' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="grid md:grid-cols-4 gap-2">
            <input className="nexa-input" placeholder="شماره" value={formula.number} onChange={(e) => setFormula((s) => ({ ...s, number: e.target.value }))} />
            <input className="nexa-input" type="date" value={formula.date} onChange={(e) => setFormula((s) => ({ ...s, date: e.target.value }))} />
            <input className="nexa-input" placeholder="پروژه" value={formula.project} onChange={(e) => setFormula((s) => ({ ...s, project: e.target.value }))} />
            <select className="nexa-input" value={formula.status} onChange={(e) => setFormula((s) => ({ ...s, status: e.target.value as 'draft' | 'confirmed' }))}>
              <option value="draft">draft</option>
              <option value="confirmed">confirmed</option>
            </select>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            <select className="nexa-input" value={formula.productItemCode} onChange={(e) => setFormula((s) => ({ ...s, productItemCode: e.target.value }))}>
              <option value="">کالای تولید شده</option>
              {products.map((p) => (
                <option key={p.id} value={p.code || p.accountingCode || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input className="nexa-input" placeholder="انبار محصول" value={formula.outputWarehouse} onChange={(e) => setFormula((s) => ({ ...s, outputWarehouse: e.target.value }))} />
            <label className="nexa-input flex items-center gap-2 text-xs">
              <input type="checkbox" checked={formula.isActive} onChange={(e) => setFormula((s) => ({ ...s, isActive: e.target.checked }))} />
              فعال
            </label>
          </div>
          <textarea className="nexa-input min-h-20" placeholder="توضیحات" value={formula.description} onChange={(e) => setFormula((s) => ({ ...s, description: e.target.value }))} />

          <SectionTable
            title="مواد اولیه"
            rows={formula.materials}
            onAdd={() => addFormulaRow('materials')}
            onPatch={(id, patch) => updateFormulaRows('materials', id, patch)}
            onRemove={(id) => removeFormulaRow('materials', id)}
          />
          <SectionTable
            title="دستمزد مستقیم"
            rows={formula.directLabor}
            onAdd={() => addFormulaRow('directLabor')}
            onPatch={(id, patch) => updateFormulaRows('directLabor', id, patch)}
            onRemove={(id) => removeFormulaRow('directLabor', id)}
          />
          <SectionTable
            title="سربار"
            rows={formula.overhead}
            onAdd={() => addFormulaRow('overhead')}
            onPatch={(id, patch) => updateFormulaRows('overhead', id, patch)}
            onRemove={(id) => removeFormulaRow('overhead', id)}
          />

          <button className="nexa-btn-primary" onClick={saveFormula}>
            ثبت فرمول تولید
          </button>
        </div>
      )}

      {tab === 'formula-list' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="relative w-80">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input className="nexa-input pr-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو فرمول" />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">#</th>
                <th className="text-right">شماره</th>
                <th className="text-right">تاریخ</th>
                <th className="text-right">کالای تولید شده</th>
                <th className="text-right">انبار محصول</th>
                <th className="text-right">مواد اولیه</th>
                <th className="text-right">دستمزد مستقیم</th>
                <th className="text-right">سربار</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormulaList.map((x, i) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2">{i + 1}</td>
                  <td>{x.number}</td>
                  <td>{x.date}</td>
                  <td>{products.find((p) => (p.code || p.accountingCode || p.id) === x.productItemCode)?.name || '-'}</td>
                  <td>{x.outputWarehouse}</td>
                  <td>{x.materials.length}</td>
                  <td>{x.directLabor.reduce((a, b) => a + b.amount, 0).toLocaleString('fa-IR')} ریال</td>
                  <td>{x.overhead.reduce((a, b) => a + b.amount, 0).toLocaleString('fa-IR')} ریال</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'material-needs' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <select className="nexa-input" value={selectedFormulaForNeeds} onChange={(e) => setSelectedFormulaForNeeds(e.target.value)}>
              <option value="">فرمول تولید</option>
              {formulaList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.number} - {x.project || 'بدون پروژه'}
                </option>
              ))}
            </select>
            <button className="nexa-btn-primary" onClick={computeMaterialNeed}>
              محاسبه نیازسنجی
            </button>
          </div>
          <div className="rounded-xl border p-2">
            <h4 className="text-xs font-black mb-2">مواد اولیه</h4>
            {materialNeedRows.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">اطلاعاتی برای نمایش وجود ندارد.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="py-2 text-right">#</th>
                    <th className="text-right">کالا</th>
                    <th className="text-right">واحد</th>
                    <th className="text-right">تعداد</th>
                  </tr>
                </thead>
                <tbody>
                  {materialNeedRows.map((x, i) => (
                    <tr key={`${x.name}-${i}`} className="border-b">
                      <td className="py-2">{i + 1}</td>
                      <td>{x.name}</td>
                      <td>{x.unit}</td>
                      <td>{x.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'production-order-list' && (
        <div className="nexa-card p-4 space-y-3 overflow-x-auto">
          <div className="relative w-80">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input className="nexa-input pr-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو سفارش" />
          </div>
          <table className="w-full text-xs min-w-[980px]">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">شماره</th>
                <th className="text-right">فاکتور</th>
                <th className="text-right">مشتری</th>
                <th className="text-right">تاریخ</th>
                <th className="text-right">اولویت</th>
                <th className="text-right">وضعیت</th>
                <th className="text-right">تاریخ تحویل</th>
                <th className="text-right">تولید/تکمیل</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductionOrders.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2">{x.number}</td>
                  <td>{x.invoiceRef}</td>
                  <td>{x.customer}</td>
                  <td>{x.date}</td>
                  <td>{x.priority}</td>
                  <td>{x.status}</td>
                  <td>{x.deliveryDate}</td>
                  <td>{x.qtyDone}/{x.qtyPlanned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'work-order' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="grid md:grid-cols-4 gap-2">
            <input className="nexa-input" placeholder="شماره" value={workOrder.number} onChange={(e) => setWorkOrder((s) => ({ ...s, number: e.target.value }))} />
            <input className="nexa-input" type="date" value={workOrder.date} onChange={(e) => setWorkOrder((s) => ({ ...s, date: e.target.value }))} />
            <select className="nexa-input" value={workOrder.status} onChange={(e) => setWorkOrder((s) => ({ ...s, status: e.target.value }))}>
              <option>در انتظار</option>
              <option>پیش نویس</option>
              <option>کامل شده</option>
            </select>
            <button className="nexa-btn-ghost text-xs" onClick={() => setShowFormulaPicker(true)}>
              <Eye size={14} />
              فرمول تولید را انتخاب کنید
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            <input className="nexa-input" placeholder="کالای تولید شده" value={workOrder.productTitle} onChange={(e) => setWorkOrder((s) => ({ ...s, productTitle: e.target.value }))} />
            <input className="nexa-input" placeholder="انبار محصول" value={workOrder.outputWarehouse} onChange={(e) => setWorkOrder((s) => ({ ...s, outputWarehouse: e.target.value }))} />
            <select className="nexa-input" value={workOrder.customer} onChange={(e) => setWorkOrder((s) => ({ ...s, customer: e.target.value }))}>
              <option value="">مشتری</option>
              {customers.map((c) => (
                <option key={c.id} value={c.displayName}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>
          <textarea className="nexa-input min-h-20" placeholder="توضیحات" value={workOrder.description} onChange={(e) => setWorkOrder((s) => ({ ...s, description: e.target.value }))} />
          <button className="nexa-btn-primary" onClick={saveWorkOrder}>
            ثبت دستور تولید
          </button>
        </div>
      )}

      {tab === 'work-order-list' && (
        <div className="nexa-card p-4 space-y-3">
          <div className="relative w-80">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={14} />
            <input className="nexa-input pr-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو دستور تولید" />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 text-right">شماره</th>
                <th className="text-right">تاریخ</th>
                <th className="text-right">فرمول تولید</th>
                <th className="text-right">کالای تولید شده</th>
                <th className="text-right">مشتری</th>
                <th className="text-right">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkOrders.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="py-2">{x.number}</td>
                  <td>{x.date}</td>
                  <td>{formulaList.find((f) => f.id === x.formulaId)?.number || '-'}</td>
                  <td>{x.productTitle || '-'}</td>
                  <td>{x.customer || '-'}</td>
                  <td>{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFormulaPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black">فرمول تولید را انتخاب کنید</h3>
              <button className="nexa-btn-ghost text-xs" onClick={() => setShowFormulaPicker(false)}>
                بستن
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 text-right">شماره</th>
                  <th className="text-right">تاریخ</th>
                  <th className="text-right">پروژه</th>
                  <th className="text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {formulaList.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="py-2">{x.number}</td>
                    <td>{x.date}</td>
                    <td>{x.project || '-'}</td>
                    <td>
                      <button
                        className="nexa-btn-ghost text-xs"
                        onClick={() => {
                          setWorkOrder((s) => ({
                            ...s,
                            formulaId: x.id,
                            productTitle:
                              products.find((p) => (p.code || p.accountingCode || p.id) === x.productItemCode)?.name || s.productTitle,
                            outputWarehouse: x.outputWarehouse,
                          }));
                          setShowFormulaPicker(false);
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
