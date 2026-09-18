import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Hospital,
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
  School,
  Building2,
  Trash2,
  Truck,
  Utensils,
  UploadCloud,
  UsersRound,
} from 'lucide-react';

export type CustomerType = 'Trường học' | 'Bệnh viện' | 'Công ty' | 'Khác';

export type CustomerRecord = {
  id: string;
  type: CustomerType;
  name: string;
  taxCode: string;
  contact: string;
  deliveryAddress: string;
  allowedMenu: string;
  unitPrice: number;
  contractStart: string;
  contractEnd: string;
  contractFile: string;
};

export type OrderSource = 'A' | 'B';
export type OrderStatus = 'Chờ xác nhận' | 'Đề xuất thay đổi' | 'Đã xác nhận' | 'Đã xuất hàng';

export type OrderItem = {
  id: string;
  dish: string;
  meal: string;
  requestedQuantity: number;
  supplierQuantity: number;
  sampleStatus?: 'Chưa lưu' | 'Đã lưu' | 'Không đạt';
  sampleSavedAt?: string;
  sampleNote?: string;
};

export type OrderRecord = {
  id: string;
  customerId: string;
  customer: string;
  source: OrderSource;
  menu: string;
  meal: string;
  deliveryDate: string;
  deliveryTime: string;
  status: OrderStatus;
  items: OrderItem[];
  unitPrice: number;
  linkedSlipId?: string;
  changeRequest?: string;
  dispatch?: DispatchDetails;
  createdAt: string;
};

export type TraceabilityItem = {
  id: string;
  dish: string;
  origin: string;
  lotCode: string;
};

export type DispatchDetails = {
  exporterName: string;
  deliveryAddress: string;
  receiver: string;
  signature: string;
  vehicleType: string;
  vehiclePlate: string;
  lotCode: string;
  qrMode: 'lot' | 'dish';
  traceability: TraceabilityItem[];
  exportedAt: string;
};

export type CreateDispatchSlipInput = {
  orderCode: string;
  customer: string;
  date: string;
  dispatchAt: string;
  meal: string;
  quantity: number;
  amount: number;
  status?: 'Nháp' | 'Đã xuất hàng';
  sender?: string;
  receiver?: string;
  vehicle?: string;
  lotCode?: string;
  ingredients?: Array<{ name: string; origin: string; lotCode: string }>;
};

const CUSTOMER_STORAGE = 'checkee-fnb-customers-v1';
const ORDER_STORAGE = 'checkee-fnb-orders-v1';
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const today = dateOnly(new Date());
const inDays = (days: number) => dateOnly(new Date(Date.now() + days * 86400000));
const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const displayDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const batchCodeFor = (date: string, sequence: number) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}${month}${year}-${String(sequence).padStart(2, '0')}`;
};
const sampleStatus = (item: OrderItem) => item.sampleStatus ?? 'Chưa lưu';

const seedCustomers: CustomerRecord[] = [
  {
    id: 'KH-001',
    type: 'Trường học',
    name: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    taxCode: '0302456812',
    contact: 'Phạm Thị Hạnh · 0908 215 642',
    deliveryAddress: '18 Nguyễn Bỉnh Khiêm, P. Đa Kao, Q. 1, TP. HCM',
    allowedMenu: 'Thực đơn trường học · Bữa trưa, bữa xế',
    unitPrice: 26000,
    contractStart: '2025-01-05',
    contractEnd: inDays(18),
    contractFile: 'HD-NB-KB-2025.pdf',
  },
  {
    id: 'KH-002',
    type: 'Bệnh viện',
    name: 'Bệnh viện An Bình',
    taxCode: '0301597741',
    contact: 'Lê Minh Quân · 0913 540 229',
    deliveryAddress: '146 An Bình, P. 7, Q. 5, TP. HCM',
    allowedMenu: 'Thực đơn bệnh viện · Suất thường, suất bệnh',
    unitPrice: 42000,
    contractStart: '2024-09-01',
    contractEnd: inDays(92),
    contractFile: 'Hop-dong-An-Binh-2024.pdf',
  },
  {
    id: 'KH-003',
    type: 'Công ty',
    name: 'Công ty Phần mềm Sao Mai',
    taxCode: '0318074529',
    contact: 'Nguyễn Hoàng Anh · 0987 321 408',
    deliveryAddress: 'Tòa nhà RiverGate, 151 Bến Vân Đồn, Q. 4, TP. HCM',
    allowedMenu: 'Thực đơn văn phòng · Bữa trưa',
    unitPrice: 38000,
    contractStart: '2025-02-01',
    contractEnd: inDays(220),
    contractFile: 'HD-Sao-Mai-2025.pdf',
  },
  {
    id: 'KH-004',
    type: 'Khác',
    name: 'Trung tâm đào tạo Á Châu',
    taxCode: '0311548830',
    contact: 'Vũ Ngọc Lan · 0932 118 770',
    deliveryAddress: '63 Lê Văn Sỹ, P. 13, Q. 3, TP. HCM',
    allowedMenu: 'Thực đơn sự kiện · Tea-break',
    unitPrice: 55000,
    contractStart: '2024-04-01',
    contractEnd: '2025-05-30',
    contractFile: 'HD-A-Chau.pdf',
  },
];

const seedOrders: OrderRecord[] = [
  {
    id: 'DH-250814-018',
    customerId: 'KH-001',
    customer: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    source: 'A',
    menu: 'Thực đơn tuần 33 · Thứ năm',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '10:30',
    status: 'Chờ xác nhận',
    unitPrice: 26000,
    createdAt: new Date().toISOString(),
    items: [
      { id: 'oi-1', dish: 'Cơm thịt heo kho trứng', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486, sampleStatus: 'Đã lưu', sampleSavedAt: '09:20' },
      { id: 'oi-2', dish: 'Canh bí đỏ nấu thịt', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 470, sampleStatus: 'Chưa lưu' },
      { id: 'oi-3', dish: 'Rau củ xào thập cẩm', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486, sampleStatus: 'Không đạt', sampleSavedAt: '09:35', sampleNote: 'Mẫu có dấu hiệu không đạt, cần đổi món trước khi xuất.' },
    ],
  },
  {
    id: 'DH-250814-016',
    customerId: 'KH-002',
    customer: 'Bệnh viện An Bình',
    source: 'A',
    menu: 'Thực đơn bệnh viện · Ngày 14/08',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '11:15',
    status: 'Đề xuất thay đổi',
    changeRequest: 'Xin đổi món canh bí đỏ sang canh rau củ do nguyên liệu về trễ.',
    unitPrice: 42000,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { id: 'oi-4', dish: 'Cháo thịt bằm', meal: 'Bữa trưa', requestedQuantity: 180, supplierQuantity: 180, sampleStatus: 'Đã lưu', sampleSavedAt: '10:05' },
      { id: 'oi-5', dish: 'Canh bí đỏ', meal: 'Bữa trưa', requestedQuantity: 180, supplierQuantity: 180, sampleStatus: 'Chưa lưu' },
    ],
  },
  {
    id: 'DH-250814-021',
    customerId: 'KH-003',
    customer: 'Công ty Phần mềm Sao Mai',
    source: 'B',
    menu: 'Suất văn phòng tiêu chuẩn',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '11:45',
    status: 'Đã xác nhận',
    unitPrice: 38000,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { id: 'oi-6', dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', requestedQuantity: 68, supplierQuantity: 68, sampleStatus: 'Đã lưu', sampleSavedAt: '10:40' },
    ],
  },
];

const dailyMenu = [
  { dish: 'Cơm thịt heo kho trứng', meal: 'Bữa trưa', available: 520 },
  { dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', available: 180 },
  { dish: 'Canh bí đỏ nấu thịt', meal: 'Bữa trưa', available: 500 },
  { dish: 'Rau củ xào thập cẩm', meal: 'Bữa trưa', available: 520 },
  { dish: 'Trái cây theo mùa', meal: 'Bữa xế', available: 300 },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value));

const contractState = (end: string) => {
  const remaining = Math.ceil((new Date(`${end}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (remaining < 0) return { label: 'Đã hết hạn', className: 'badge-fail', detail: 'Cần gia hạn hợp đồng' };
  if (remaining <= 45) return { label: 'Sắp hết hạn', className: 'badge-warn', detail: `Còn ${remaining} ngày` };
  return { label: 'Còn hiệu lực', className: 'badge-pass', detail: `Đến ${displayDate(end)}` };
};

function CustomerTypeIcon({ type }: { type: CustomerType }) {
  if (type === 'Trường học') return <School size={15} />;
  if (type === 'Bệnh viện') return <Hospital size={15} />;
  if (type === 'Công ty') return <Building2 size={15} />;
  return <UsersRound size={15} />;
}

function CustomerForm({ initial, onSave, onCancel }: { initial?: CustomerRecord; onSave: (customer: CustomerRecord) => void; onCancel: () => void }) {
  const [form, setForm] = useState<CustomerRecord>(initial ?? {
    id: `KH-${String(Date.now()).slice(-4)}`,
    type: 'Trường học',
    name: '',
    taxCode: '',
    contact: '',
    deliveryAddress: '',
    allowedMenu: '',
    unitPrice: 0,
    contractStart: today,
    contractEnd: inDays(365),
    contractFile: '',
  });
  const set = (key: keyof CustomerRecord, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.deliveryAddress.trim()) return;
    onSave({ ...form, name: form.name.trim(), contact: form.contact.trim(), deliveryAddress: form.deliveryAddress.trim(), unitPrice: Number(form.unitPrice) || 0 });
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) set('contractFile', file.name);
  };
  return (
    <main className="content-wrap">
      <div className="page-heading detail-heading">
        <div>
          <Link href="/quan-ly-khach-hang" className="back-link" data-testid="link-back-customers"><ArrowLeft size={14} /> Danh sách khách hàng</Link>
          <h1>{initial ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}</h1>
          <p className="page-subtitle">Lưu hồ sơ đối tác và điều kiện cung cấp suất ăn.</p>
        </div>
      </div>
      <form className="workflow-form" onSubmit={submit}>
        <section className="panel">
          <div className="panel-header"><div><h2 className="panel-heading">Thông tin khách hàng</h2><p className="panel-kicker">Thông tin cơ bản để nhận diện điểm giao</p></div><CustomerTypeIcon type={form.type} /></div>
          <div className="form-grid-3">
            <div className="field"><label className="field-label" htmlFor="customer-type">Loại khách hàng</label><select id="customer-type" className="select" value={form.type} onChange={(event) => set('type', event.target.value)} data-testid="select-customer-type"><option>Trường học</option><option>Bệnh viện</option><option>Công ty</option><option>Khác</option></select></div>
            <div className="field form-span-2"><label className="field-label" htmlFor="customer-name">Tên khách hàng</label><input id="customer-name" className="input" required value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Ví dụ: Trường Tiểu học Nguyễn Bỉnh Khiêm" data-testid="input-customer-name" /></div>
            <div className="field"><label className="field-label" htmlFor="customer-tax">Mã số thuế</label><input id="customer-tax" className="input" value={form.taxCode} onChange={(event) => set('taxCode', event.target.value)} placeholder="Mã số thuế" data-testid="input-customer-tax" /></div>
            <div className="field"><label className="field-label" htmlFor="customer-contact">Người liên hệ</label><input id="customer-contact" className="input" required value={form.contact} onChange={(event) => set('contact', event.target.value)} placeholder="Họ tên · Số điện thoại" data-testid="input-customer-contact" /></div>
            <div className="field form-span-2"><label className="field-label" htmlFor="customer-address">Địa chỉ điểm giao</label><input id="customer-address" className="input" required value={form.deliveryAddress} onChange={(event) => set('deliveryAddress', event.target.value)} placeholder="Địa chỉ nhận suất ăn" data-testid="input-customer-address" /></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header"><div><h2 className="panel-heading">Hồ sơ hợp đồng</h2><p className="panel-kicker">Thời hạn và chứng từ của khách hàng</p></div><FileText size={17} color="hsl(17 91% 52%)" /></div>
          <div className="form-grid-3">
            <div className="field"><label className="field-label" htmlFor="contract-start">Thời hạn hợp đồng · Từ ngày</label><input id="contract-start" type="date" className="input" value={form.contractStart} onChange={(event) => set('contractStart', event.target.value)} data-testid="input-contract-start" /></div>
            <div className="field"><label className="field-label" htmlFor="contract-end">Thời hạn hợp đồng · Đến ngày</label><input id="contract-end" type="date" className="input" value={form.contractEnd} onChange={(event) => set('contractEnd', event.target.value)} data-testid="input-contract-end" /></div>
          </div>
          <div className="upload-box contract-upload"><div className="upload-icon"><UploadCloud size={18} /></div><div style={{ minWidth: 0, flex: 1 }}><div className="document-name">{form.contractFile || 'Chưa có file hợp đồng'}</div><div className="document-meta">PDF, JPG hoặc PNG · file hợp đồng đính kèm</div><label className="button button-quiet" htmlFor="contract-file" style={{ marginTop: 9, minHeight: 30, fontSize: 10 }} data-testid="button-upload-contract"><UploadCloud size={12} /> {form.contractFile ? 'Đổi file hợp đồng' : 'Đính kèm hợp đồng'}</label><input id="contract-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload} hidden data-testid="input-contract-file" /></div></div>
        </section>
        <div className="detail-actions"><button type="button" className="button button-quiet" onClick={onCancel} data-testid="button-cancel-customer">Hủy</button><button type="submit" className="button button-primary" data-testid="button-save-customer"><Check size={14} /> Lưu khách hàng</button></div>
      </form>
    </main>
  );
}

export function CustomerManagement() {
  const [, setLocation] = useLocation();
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => readStorage(CUSTOMER_STORAGE, seedCustomers));
  const [search, setSearch] = useState('');
  const [type, setType] = useState('Tất cả loại');
  const [contract, setContract] = useState('Tất cả trạng thái');
  const filtered = useMemo(() => customers.filter((customer) => {
    const query = `${customer.name} ${customer.taxCode} ${customer.contact}`.toLowerCase();
    const state = contractState(customer.contractEnd).label;
    return (!search || query.includes(search.toLowerCase())) && (type === 'Tất cả loại' || customer.type === type) && (contract === 'Tất cả trạng thái' || state === contract);
  }), [customers, search, type, contract]);
  const save = (customer: CustomerRecord) => {
    setCustomers((current) => {
      const next = current.some((item) => item.id === customer.id) ? current.map((item) => item.id === customer.id ? customer : item) : [customer, ...current];
      saveStorage(CUSTOMER_STORAGE, next);
      return next;
    });
    setLocation('/quan-ly-khach-hang');
  };
  const remove = (customer: CustomerRecord) => {
    if (!window.confirm(`Xóa hồ sơ ${customer.name}?`)) return;
    setCustomers((current) => {
      const next = current.filter((item) => item.id !== customer.id);
      saveStorage(CUSTOMER_STORAGE, next);
      return next;
    });
  };
  const params = useParams();
  if (params.id) {
    const editing = customers.find((item) => item.id === params.id);
    return <CustomerForm initial={editing} onSave={save} onCancel={() => setLocation('/quan-ly-khach-hang')} />;
  }
  return (
    <main className="content-wrap">
      <div className="page-heading">
        <div><p className="eyebrow">Hồ sơ đối tác</p><h1>Quản lý khách hàng</h1><p className="page-subtitle">Quản lý khách hàng, điều kiện hợp đồng và điểm giao của nhà cung cấp.</p></div>
        <button className="button button-primary" onClick={() => setLocation('/quan-ly-khach-hang/moi')} data-testid="button-add-customer"><Plus size={14} /> Thêm khách hàng</button>
      </div>
      <section className="stats-grid customer-stats">
        <div className="stat-card primary"><div className="stat-label">Tổng khách hàng</div><div className="stat-value" data-testid="stat-customers">{customers.length}</div><div className="stat-meta">Hồ sơ đang quản lý</div></div>
        <div className="stat-card"><div className="stat-label">Còn hiệu lực</div><div className="stat-value">{customers.filter((item) => contractState(item.contractEnd).label === 'Còn hiệu lực').length}</div><div className="stat-meta">Đủ điều kiện nhận đơn</div></div>
        <div className="stat-card"><div className="stat-label">Sắp hết hạn</div><div className="stat-value">{customers.filter((item) => contractState(item.contractEnd).label === 'Sắp hết hạn').length}</div><div className="stat-meta">Trong vòng 45 ngày</div></div>
        <div className="stat-card"><div className="stat-label">Đã hết hạn</div><div className="stat-value">{customers.filter((item) => contractState(item.contractEnd).label === 'Đã hết hạn').length}</div><div className="stat-meta">Cần xử lý ngay</div></div>
      </section>
      <section className="filters-panel">
        <div className="filter-grid customer-filters">
          <div className="field customer-search"><label className="field-label" htmlFor="customer-search">Tìm kiếm</label><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="customer-search" className="input" style={{ paddingLeft: 30 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, mã số thuế, người liên hệ..." data-testid="input-search-customers" /></div></div>
          <div className="field"><label className="field-label" htmlFor="customer-type-filter">Loại khách hàng</label><select id="customer-type-filter" className="select" value={type} onChange={(event) => setType(event.target.value)} data-testid="select-filter-customer-type"><option>Tất cả loại</option><option>Trường học</option><option>Bệnh viện</option><option>Công ty</option><option>Khác</option></select></div>
          <div className="field"><label className="field-label" htmlFor="contract-filter">Trạng thái hợp đồng</label><select id="contract-filter" className="select" value={contract} onChange={(event) => setContract(event.target.value)} data-testid="select-filter-contract"><option>Tất cả trạng thái</option><option>Còn hiệu lực</option><option>Sắp hết hạn</option><option>Đã hết hạn</option></select></div>
        </div>
      </section>
      <section className="table-card">
        <div className="table-toolbar"><div><h2 className="table-title">Danh sách khách hàng</h2><span className="table-note">{filtered.length} hồ sơ hiển thị</span></div><span className="table-note"><FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Hợp đồng được lưu cùng hồ sơ</span></div>
        <div className="table-scroll"><table className="data-table customer-table"><thead><tr><th>Khách hàng</th><th>Loại</th><th>Người liên hệ</th><th>Địa chỉ điểm giao</th><th>Thời hạn hợp đồng</th><th /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><UsersRound size={25} style={{ marginBottom: 8 }} /><div>Không có khách hàng phù hợp</div></div></td></tr> : filtered.map((customer) => { const state = contractState(customer.contractEnd); return <tr key={customer.id} data-testid={`row-customer-${customer.id}`} className={state.label === 'Đã hết hạn' ? 'fail-row' : state.label === 'Sắp hết hạn' ? 'warn-row' : ''}><td><Link href={`/quan-ly-khach-hang/${customer.id}`} className="slip-link" data-testid={`link-customer-${customer.id}`}>{customer.name}</Link><span className="subtext mono">{customer.taxCode || 'Chưa cập nhật MST'}</span></td><td><span className="type-cell"><CustomerTypeIcon type={customer.type} />{customer.type}</span></td><td>{customer.contact}</td><td><span className="address-cell">{customer.deliveryAddress}</span></td><td><span className={`badge ${state.className}`}>{state.label === 'Còn hiệu lực' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{state.label}</span><span className="subtext">{state.detail}</span>{customer.contractFile && <span className="subtext"><FileText size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{customer.contractFile}</span>}</td><td><div className="row-actions"><Link href={`/quan-ly-khach-hang/${customer.id}`} className="icon-button" aria-label={`Sửa ${customer.name}`} data-testid={`button-edit-customer-${customer.id}`}><Pencil size={14} /></Link><button className="icon-button" aria-label={`Xóa ${customer.name}`} onClick={() => remove(customer)} data-testid={`button-delete-customer-${customer.id}`}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div>
      </section>
    </main>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const className = status === 'Đã xác nhận' ? 'badge-pass' : status === 'Đã xuất hàng' ? 'badge-exported' : status === 'Đề xuất thay đổi' ? 'badge-warn' : 'badge-draft';
  return <span className={`badge ${className}`}>{status === 'Đã xác nhận' ? <CheckCircle2 size={12} /> : status === 'Đã xuất hàng' ? <Truck size={12} /> : <Clock3 size={12} />}{status}</span>;
}

function SourceBadge({ source }: { source: OrderSource }) {
  return <span className={`badge ${source === 'A' ? 'badge-source-a' : 'badge-source-b'}`}>{source === 'A' ? <ClipboardList size={12} /> : <Pencil size={12} />}{source === 'A' ? 'Từ hệ thống khách hàng' : 'NCC tạo thủ công'}</span>;
}

function OrderForm({ customers, onSave, onCancel }: { customers: CustomerRecord[]; onSave: (order: OrderRecord) => void; onCancel: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const selected = customers.find((item) => item.id === customerId) ?? customers[0];
  const [menu, setMenu] = useState('');
  const [meal, setMeal] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [quantity, setQuantity] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!customerId || !selected || !menu.trim() || !meal || !deliveryDate || !deliveryTime || !quantity) return;
    const amount = Math.max(1, Number(quantity) || 1);
    const order: OrderRecord = {
      id: `DH-${today.replaceAll('-', '').slice(2)}-${String(Date.now()).slice(-3)}`,
      customerId: selected.id,
      customer: selected.name,
      source: 'B',
      menu: menu.trim(),
      meal,
      deliveryDate,
      deliveryTime,
      status: 'Đã xác nhận',
      unitPrice: selected.unitPrice,
      createdAt: new Date().toISOString(),
      items: [{ id: `oi-${Date.now()}`, dish: menu.trim(), meal, requestedQuantity: amount, supplierQuantity: amount, sampleStatus: 'Chưa lưu' }],
    };
    onSave(order);
  };
  return (
    <main className="content-wrap">
      <div className="page-heading detail-heading">
        <div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-orders"><ArrowLeft size={14} /> Danh sách đơn hàng</Link><h1>Tạo đơn hàng / phiếu xuất</h1><p className="page-subtitle">Dùng khi khách không đặt trước. Đơn này sẽ là phiếu xuất luôn.</p></div>
      </div>
       <form className="workflow-form" onSubmit={submit}>
        <section className="panel">
          <div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">Sau khi tạo, mở đơn để bổ sung thông tin xuất hàng và QR.</p></div><span className="badge badge-source-b"><Pencil size={12} /> NCC tạo thủ công</span></div>
          <div className="form-grid-3">
            <div className="field form-span-2"><label className="field-label" htmlFor="manual-customer">Khách hàng</label><select id="manual-customer" className="select" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required data-testid="select-manual-customer"><option value="">Chọn khách hàng</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></div>
            <div className="field form-span-2"><label className="field-label" htmlFor="manual-menu">Món ăn / thực đơn</label><input id="manual-menu" className="input" value={menu} onChange={(event) => setMenu(event.target.value)} placeholder="Ví dụ: Cơm gà nướng mật ong" required data-testid="input-manual-menu" /></div>
            <div className="field"><label className="field-label" htmlFor="manual-meal">Buổi ăn</label><select id="manual-meal" className="select" value={meal} onChange={(event) => setMeal(event.target.value)} required data-testid="select-manual-meal"><option value="">Chọn buổi ăn</option><option>Bữa sáng</option><option>Bữa trưa</option><option>Bữa xế</option><option>Bữa tối</option></select></div>
            <div className="field"><label className="field-label" htmlFor="manual-date">Ngày giao</label><input id="manual-date" type="date" className="input" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required data-testid="input-manual-date" /></div>
            <div className="field"><label className="field-label" htmlFor="manual-time">Giờ giao</label><input id="manual-time" type="time" className="input" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} required data-testid="input-manual-time" /></div>
            <div className="field"><label className="field-label" htmlFor="manual-quantity">Số lượng suất</label><input id="manual-quantity" type="number" min="1" className="input" value={quantity} onChange={(event) => setQuantity(event.target.value)} required data-testid="input-manual-quantity" /></div>
          </div>
        </section>
        <div className="detail-actions"><button type="button" className="button button-quiet" onClick={onCancel} data-testid="button-cancel-manual-order">Hủy</button><button type="submit" className="button button-primary" data-testid="button-save-manual-order"><Check size={14} /> Tạo đơn hàng</button></div>
      </form>
    </main>
  );
}

export function OrderManagement({ createSlip }: { createSlip: (input: CreateDispatchSlipInput) => string }) {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<OrderRecord[]>(() => readStorage(ORDER_STORAGE, seedOrders));
  const [customers] = useState<CustomerRecord[]>(() => readStorage(CUSTOMER_STORAGE, seedCustomers));
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('Tất cả nguồn');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const params = useParams();
  const saveOrders = (next: OrderRecord[]) => { setOrders(next); saveStorage(ORDER_STORAGE, next); };
  const filtered = useMemo(() => orders.filter((order) => {
    const query = `${order.id} ${order.customer} ${order.menu}`.toLowerCase();
    return (!search || query.includes(search.toLowerCase())) && (source === 'Tất cả nguồn' || order.source === source) && (status === 'Tất cả trạng thái' || order.status === status);
  }), [orders, search, source, status]);
  if (params.id === 'moi') return <OrderForm customers={customers} onSave={(order) => { saveOrders([order, ...orders]); setLocation(`/quan-ly-don-hang/${order.id}`); }} onCancel={() => setLocation('/quan-ly-don-hang')} />;
  if (params.id) {
    const selectedOrder = orders.find((item) => item.id === params.id);
    const usedBatches = orders.filter((item) => item.deliveryDate === selectedOrder?.deliveryDate && item.dispatch).length;
    return <OrderDetail order={selectedOrder} customer={customers.find((item) => item.id === selectedOrder?.customerId)} batchCode={batchCodeFor(selectedOrder?.deliveryDate ?? '', usedBatches + 1)} onUpdate={(updated) => saveOrders(orders.map((item) => item.id === updated.id ? updated : item))} createSlip={createSlip} />;
  }
  return (
    <main className="content-wrap">
      <div className="page-heading"><div><p className="eyebrow">Điều phối suất ăn</p><h1>Quản lý đơn hàng</h1><p className="page-subtitle">Duyệt đơn đặt trước, tạo đơn trực tiếp và xem lại các đơn đã xuất.</p></div><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang/moi')} data-testid="button-create-manual-order"><Plus size={14} /> Tạo đơn hàng / phiếu xuất</button></div>
      <section className="stats-grid order-stats"><div className="stat-card primary"><div className="stat-label">Tổng đơn hàng</div><div className="stat-value" data-testid="stat-orders">{orders.length}</div><div className="stat-meta">Đơn đặt trước và đơn tạo trực tiếp</div></div><div className="stat-card"><div className="stat-label">Chờ xử lý</div><div className="stat-value">{orders.filter((item) => item.status === 'Chờ xác nhận' || item.status === 'Đề xuất thay đổi').length}</div><div className="stat-meta">Cần xem lại món trong ngày</div></div><div className="stat-card"><div className="stat-label">Đã xác nhận</div><div className="stat-value">{orders.filter((item) => item.status === 'Đã xác nhận').length}</div><div className="stat-meta">Sẵn sàng lập phiếu xuất</div></div><div className="stat-card"><div className="stat-label">Đã xuất hàng</div><div className="stat-value">{orders.filter((item) => item.status === 'Đã xuất hàng').length}</div><div className="stat-meta">Có thể xem lại phiếu</div></div></section>
      <section className="filters-panel"><div className="filter-grid order-filters"><div className="field order-search"><label className="field-label" htmlFor="order-search">Tìm kiếm</label><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="order-search" className="input" style={{ paddingLeft: 30 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, khách hàng, thực đơn..." data-testid="input-search-orders" /></div></div><div className="field"><label className="field-label" htmlFor="order-source-filter">Nguồn đơn hàng</label><select id="order-source-filter" className="select" value={source} onChange={(event) => setSource(event.target.value)} data-testid="select-filter-order-source"><option>Tất cả nguồn</option><option value="A">Từ hệ thống khách hàng</option><option value="B">NCC tạo thủ công</option></select></div><div className="field"><label className="field-label" htmlFor="order-status-filter">Trạng thái</label><select id="order-status-filter" className="select" value={status} onChange={(event) => setStatus(event.target.value)} data-testid="select-filter-order-status"><option>Tất cả trạng thái</option><option>Chờ xác nhận</option><option>Đề xuất thay đổi</option><option>Đã xác nhận</option><option>Đã xuất hàng</option></select></div></div></section>
       <section className="table-card"><div className="table-toolbar"><div><h2 className="table-title">Danh sách đơn hàng</h2><span className="table-note">{filtered.length} đơn hàng hiển thị</span></div><span className="table-note">Đơn đã xuất vẫn nằm ở đây để xem đầy đủ phiếu</span></div><div className="table-scroll"><table className="data-table order-table"><thead><tr><th>Mã đơn hàng</th><th>Khách hàng</th><th>Nguồn đơn</th><th>Món / bữa ăn</th><th>Ngày & giờ giao</th><th>Số lượng</th><th>Lưu mẫu</th><th>Trạng thái</th><th /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><ClipboardList size={25} style={{ marginBottom: 8 }} /><div>Không có đơn hàng phù hợp</div></div></td></tr> : filtered.map((order) => { const quantity = order.items.reduce((sum, item) => sum + item.supplierQuantity, 0); const savedSamples = order.items.filter((item) => sampleStatus(item) === 'Đã lưu').length; const samplesComplete = savedSamples === order.items.length; return <tr key={order.id} data-testid={`row-order-${order.id}`}><td><Link href={`/quan-ly-don-hang/${order.id}`} className="slip-link mono" data-testid={`link-order-${order.id}`}>{order.id}</Link><span className="subtext">{order.items.length} món ăn</span></td><td><span className="customer-name">{order.customer}</span></td><td><SourceBadge source={order.source} /></td><td><strong>{order.menu}</strong><span className="subtext">{order.meal}</span></td><td><span className="mono">{displayDate(order.deliveryDate)}</span><span className="subtext"><Clock3 size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{order.deliveryTime}</span></td><td><strong>{quantity}</strong><span className="subtext">suất</span></td><td><span className={`badge ${samplesComplete ? 'badge-pass' : 'badge-warn'}`}><Utensils size={11} />{savedSamples}/{order.items.length} món</span>{!samplesComplete && <span className="warning-note"><AlertCircle size={11} />Chưa đủ</span>}</td><td><OrderStatusBadge status={order.status} />{order.dispatch && <span className="subtext"><CheckCircle2 size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />Có phiếu xuất</span>}</td><td><Link href={`/quan-ly-don-hang/${order.id}`} className="icon-button" aria-label={`Xem ${order.id}`} data-testid={`button-view-order-${order.id}`}><ChevronRight size={15} /></Link></td></tr>; })}</tbody></table></div></section>
    </main>
  );
}

const createDispatchDraft = (order?: OrderRecord, customer?: CustomerRecord, batchCode = ''): DispatchDetails => order?.dispatch ?? {
  exporterName: '',
  deliveryAddress: customer?.deliveryAddress ?? '',
  receiver: '',
  signature: '',
  vehicleType: '',
  vehiclePlate: '',
  lotCode: batchCode,
  qrMode: 'lot',
  traceability: order?.items.map((item) => ({ id: item.id, dish: item.dish, origin: '', lotCode: '' })) ?? [],
  exportedAt: '',
};

function SampleStatusBadge({ status }: { status: OrderItem['sampleStatus'] }) {
  const normalized = status ?? 'Chưa lưu';
  const className = normalized === 'Đã lưu' ? 'badge-pass' : normalized === 'Không đạt' ? 'badge-fail' : 'badge-warn';
  return <span className={`badge ${className}`}>{normalized === 'Đã lưu' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{normalized}</span>;
}

function SampleEditor({ item, deliveryDate, onSave, onCancel }: { item: OrderItem; deliveryDate: string; onSave: (changes: Pick<OrderItem, 'sampleStatus' | 'sampleSavedAt' | 'sampleNote'>) => void; onCancel: () => void }) {
  const [status, setStatus] = useState<OrderItem['sampleStatus']>(sampleStatus(item));
  const [savedAt, setSavedAt] = useState(item.sampleSavedAt ?? '');
  const [note, setNote] = useState(item.sampleNote ?? '');
  return <div className="sample-editor">
    <div className="sample-editor-heading"><div><strong>Giao diện lưu mẫu món ăn</strong><span className="subtext">Lưu theo đúng ngày giao {deliveryDate ? displayDate(deliveryDate) : 'chưa chọn ngày'} · món: {item.dish}</span></div><Utensils size={17} color="hsl(17 91% 52%)" /></div>
    <div className="sample-editor-grid">
      <div className="field"><label className="field-label" htmlFor={`sample-status-${item.id}`}>Kết quả lưu mẫu</label><select id={`sample-status-${item.id}`} className="select" value={status} onChange={(event) => setStatus(event.target.value as OrderItem['sampleStatus'])} data-testid={`select-sample-status-${item.id}`}><option>Chưa lưu</option><option>Đã lưu</option><option>Không đạt</option></select></div>
      <div className="field"><label className="field-label" htmlFor={`sample-time-${item.id}`}>Giờ lưu mẫu</label><input id={`sample-time-${item.id}`} type="time" className="input" value={savedAt} onChange={(event) => setSavedAt(event.target.value)} data-testid={`input-sample-time-${item.id}`} /></div>
      <div className="field sample-note-field"><label className="field-label" htmlFor={`sample-note-${item.id}`}>Ghi chú kiểm mẫu</label><input id={`sample-note-${item.id}`} className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ví dụ: Mẫu lưu tại tủ lạnh số 02" data-testid={`input-sample-note-${item.id}`} /></div>
    </div>
    <div className="sample-editor-actions"><span className="table-note">Chỉ trạng thái “Đã lưu” mới đủ điều kiện xuất.</span><div className="action-row"><button className="button button-quiet" onClick={onCancel} data-testid={`button-cancel-sample-${item.id}`}>Hủy</button><button className="button button-primary" onClick={() => onSave({ sampleStatus: status, sampleSavedAt: status === 'Chưa lưu' ? '' : savedAt, sampleNote: note.trim() })} data-testid={`button-save-sample-${item.id}`}><Check size={13} /> Lưu mẫu</button></div></div>
  </div>;
}

function DispatchEditor({ dispatch, onChange, onTraceabilityChange, onSubmit, onCancel, canSubmit }: {
  dispatch: DispatchDetails;
  onChange: (changes: Partial<DispatchDetails>) => void;
  onTraceabilityChange: (id: string, changes: Partial<TraceabilityItem>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  canSubmit: boolean;
}) {
  return <section className="panel">
    <div className="panel-header"><div><h2 className="panel-heading">Phiếu xuất suất ăn</h2><p className="panel-kicker">Bổ sung thông tin giao hàng và kiểm tra truy xuất trước khi xuất.</p></div><Truck size={17} color="hsl(17 91% 52%)" /></div>
    <div className="form-grid-3">
      <div className="field"><label className="field-label" htmlFor="dispatch-exporter">Tên người xuất</label><input id="dispatch-exporter" className="input" value={dispatch.exporterName} onChange={(event) => onChange({ exporterName: event.target.value })} placeholder="Họ và tên" data-testid="input-dispatch-exporter" /></div>
      <div className="field form-span-2"><label className="field-label" htmlFor="dispatch-address">Địa chỉ cần xuất</label><input id="dispatch-address" className="input" value={dispatch.deliveryAddress} onChange={(event) => onChange({ deliveryAddress: event.target.value })} placeholder="Địa chỉ giao suất ăn" data-testid="input-dispatch-address" /></div>
      <div className="field"><label className="field-label" htmlFor="dispatch-vehicle-type">Loại xe</label><input id="dispatch-vehicle-type" className="input" value={dispatch.vehicleType} onChange={(event) => onChange({ vehicleType: event.target.value })} placeholder="Ví dụ: Xe tải lạnh" data-testid="input-dispatch-vehicle-type" /></div>
      <div className="field"><label className="field-label" htmlFor="dispatch-vehicle-plate">Biển số xe</label><input id="dispatch-vehicle-plate" className="input" value={dispatch.vehiclePlate} onChange={(event) => onChange({ vehiclePlate: event.target.value })} placeholder="51D-000.00" data-testid="input-dispatch-vehicle-plate" /></div>
      <div className="field"><label className="field-label" htmlFor="dispatch-receiver">Người nhận</label><input id="dispatch-receiver" className="input" value={dispatch.receiver} onChange={(event) => onChange({ receiver: event.target.value })} placeholder="Có thể bổ sung khi giao" data-testid="input-dispatch-receiver" /></div>
      <div className="field"><label className="field-label" htmlFor="dispatch-signature">Chữ ký / người ký</label><input id="dispatch-signature" className="input" value={dispatch.signature} onChange={(event) => onChange({ signature: event.target.value })} placeholder="Tên người ký xác nhận" data-testid="input-dispatch-signature" /></div>
       <div className="field"><label className="field-label" htmlFor="dispatch-lot">Mã lô xuất · tự sinh</label><div id="dispatch-lot" className="lot-code-field mono" data-testid="input-dispatch-lot">{dispatch.lotCode || 'Chọn ngày giao để sinh mã'}</div></div>
    </div>
    <div className="panel-header" style={{ marginTop: 18 }}><div><h3 className="panel-heading" style={{ fontSize: 14 }}>Kiểm tra thông tin truy xuất món ăn</h3><p className="panel-kicker">Mỗi món cần có nguồn nguyên liệu và mã lô trước khi xuất.</p></div><ClipboardList size={16} color="hsl(17 91% 52%)" /></div>
    <div className="order-items">{dispatch.traceability.map((item) => <div className="order-item-row" key={item.id}><div><strong>{item.dish}</strong><span className="subtext">Thông tin truy xuất</span></div><div className="field"><label className="field-label">Nguồn nguyên liệu</label><input className="input" value={item.origin} onChange={(event) => onTraceabilityChange(item.id, { origin: event.target.value })} placeholder="Tên nhà cung cấp" data-testid={`input-trace-origin-${item.id}`} /></div><div className="field"><label className="field-label">Mã lô món</label><input className="input" value={item.lotCode} onChange={(event) => onTraceabilityChange(item.id, { lotCode: event.target.value })} placeholder="Mã lô" data-testid={`input-trace-lot-${item.id}`} /></div></div>)}</div>
     <div className="detail-actions"><button type="button" className="button button-quiet" onClick={onCancel} data-testid="button-cancel-dispatch">Để sau</button><button type="button" className="button button-primary" disabled={!canSubmit} onClick={onSubmit} data-testid="button-complete-dispatch"><Truck size={14} /> Hoàn tất &amp; xuất hàng</button></div>
  </section>;
}

function DispatchQr({ order, dispatch, onQrModeChange }: { order: OrderRecord; dispatch: DispatchDetails; onQrModeChange: (mode: 'lot' | 'dish') => void }) {
  const downloadQr = (label: string) => {
    const payload = `CHECKEE F&B | Đơn ${order.id} | ${label} | Lô ${dispatch.lotCode}`;
    const url = URL.createObjectURL(new Blob([payload], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${order.id}-${label.replaceAll(' ', '-')}-qr.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const labels = dispatch.qrMode === 'lot' ? [{ id: 'lot', label: `Lô ${dispatch.lotCode}` }] : dispatch.traceability.map((item) => ({ id: item.id, label: item.dish }));
  return <section className="success-box"><strong><CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Đã xuất hàng</strong><span>In mã QR để dán lên lô suất ăn hoặc từng món khi giao.</span><div className="qr-panel"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><strong style={{ margin: 0 }}><QrCode size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Mã QR truy xuất</strong><span className="badge badge-confirmed">Đã kích hoạt</span></div><div className="action-row" style={{ marginTop: 12 }}><label className="field-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><input type="radio" name={`qr-mode-${order.id}`} checked={dispatch.qrMode === 'lot'} onChange={() => onQrModeChange('lot')} /> Theo lô</label><label className="field-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><input type="radio" name={`qr-mode-${order.id}`} checked={dispatch.qrMode === 'dish'} onChange={() => onQrModeChange('dish')} /> Từng món</label></div><div className="qr-wrap" style={{ flexWrap: 'wrap' }}>{labels.map((item) => <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="qr-code" aria-label={`Mã QR ${item.label}`} data-testid={`qr-code-${item.id}`} /><div className="qr-copy"><strong>{item.label}</strong><span>Đơn {order.id}</span><div className="action-row" style={{ marginTop: 8 }}><button className="button button-quiet" onClick={() => window.print()} data-testid={`button-print-qr-${item.id}`}><QrCode size={12} /> In</button><button className="button button-quiet" onClick={() => downloadQr(item.label)} data-testid={`button-download-qr-${item.id}`}><FileText size={12} /> Tải mã</button></div></div></div>)}</div></div></section>;
}

function OrderDetail({ order, customer, batchCode, onUpdate, createSlip }: { order?: OrderRecord; customer?: CustomerRecord; batchCode: string; onUpdate: (order: OrderRecord) => void; createSlip: (input: CreateDispatchSlipInput) => string }) {
  const [, setLocation] = useLocation();
  const [draft, setDraft] = useState<OrderRecord | undefined>(order);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposal] = useState(order?.changeRequest ?? '');
  const [dispatchOpen, setDispatchOpen] = useState(order?.source === 'B' || order?.status === 'Đã xuất hàng');
  const [sampleOpenId, setSampleOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [dispatch, setDispatch] = useState<DispatchDetails>(() => createDispatchDraft(order, customer, batchCode));
  if (!draft) return <main className="content-wrap not-found"><div><ClipboardList size={30} color="hsl(17 91% 52%)" /><h1>Không tìm thấy đơn hàng</h1><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang')} data-testid="button-back-orders">Về danh sách đơn hàng</button></div></main>;
  const isExported = draft.status === 'Đã xuất hàng';
  const totalQuantity = draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0);
  const samplesReady = draft.items.length > 0 && draft.items.every((item) => sampleStatus(item) === 'Đã lưu');
  const setQuantity = (id: string, value: string) => setDraft({ ...draft, items: draft.items.map((item) => item.id === id ? { ...item, supplierQuantity: Math.max(0, Number(value) || 0) } : item) });
  const saveQuantities = () => onUpdate(draft);
  const saveSample = (id: string, changes: Pick<OrderItem, 'sampleStatus' | 'sampleSavedAt' | 'sampleNote'>) => {
    const updated = { ...draft, items: draft.items.map((item) => item.id === id ? { ...item, ...changes } : item) };
    setDraft(updated);
    onUpdate(updated);
    setSampleOpenId(null);
    setNotice(changes.sampleStatus === 'Đã lưu' ? 'Đã lưu mẫu món ăn trong ngày' : 'Đã cập nhật kết quả lưu mẫu');
    window.setTimeout(() => setNotice(''), 2600);
  };
  const replaceDish = (id: string, dish: string) => {
    const current = draft.items.find((item) => item.id === id);
    if (!current || !dish || dish === current.dish) return;
    const updated: OrderRecord = { ...draft, items: draft.items.map((item) => item.id === id ? { ...item, dish, sampleStatus: 'Chưa lưu' as const, sampleSavedAt: '', sampleNote: '' } : item) };
    setDraft(updated);
    setDispatch((currentDispatch) => ({ ...currentDispatch, traceability: currentDispatch.traceability.map((item) => item.id === id ? { ...item, dish, origin: '', lotCode: '' } : item) }));
    onUpdate(updated);
    setNotice(`Đã chọn món thay thế: ${dish}. Cần lưu mẫu món mới.`);
    window.setTimeout(() => setNotice(''), 3000);
  };
  const sendProposal = () => { if (!proposal.trim() || isExported) return; const updated = { ...draft, status: 'Đề xuất thay đổi' as OrderStatus, changeRequest: proposal.trim() }; setDraft(updated); onUpdate(updated); setProposalOpen(false); };
  const confirm = () => { if (isExported) return; const updated = { ...draft, status: 'Đã xác nhận' as OrderStatus }; setDraft(updated); onUpdate(updated); };
  const updateDispatch = (changes: Partial<DispatchDetails>) => setDispatch((current) => ({ ...current, ...changes }));
  const updateTraceability = (id: string, changes: Partial<TraceabilityItem>) => setDispatch((current) => ({ ...current, traceability: current.traceability.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  const completeDispatch = () => {
    const missing: string[] = [];
    if (!dispatch.exporterName.trim()) missing.push('Tên người xuất');
    if (!dispatch.deliveryAddress.trim()) missing.push('Địa chỉ cần xuất');
    if (!dispatch.vehicleType.trim()) missing.push('Loại xe');
    if (!dispatch.vehiclePlate.trim()) missing.push('Biển số xe');
     if (!dispatch.receiver.trim()) missing.push('Người nhận');
     if (!dispatch.signature.trim()) missing.push('Chữ ký / người ký');
     if (!dispatch.lotCode.trim()) missing.push('Mã lô xuất');
     const unsavedSamples = draft.items.filter((item) => sampleStatus(item) !== 'Đã lưu');
     if (unsavedSamples.length) missing.push(`Lưu mẫu món: ${unsavedSamples.map((item) => item.dish).join(', ')}`);
     if (!dispatch.traceability.length || dispatch.traceability.some((item) => !item.origin.trim() || !item.lotCode.trim())) missing.push('Thông tin truy xuất của từng món');
    if (missing.length) { window.alert(`Cần bổ sung: ${missing.join(', ')}`); return; }
    const exportedDispatch = { ...dispatch, exportedAt: new Date().toISOString() };
    const linkedSlipId = createSlip({ orderCode: draft.id, customer: draft.customer, date: draft.deliveryDate, dispatchAt: `${draft.deliveryDate}T${draft.deliveryTime}:00`, meal: draft.meal, quantity: totalQuantity, amount: totalQuantity * draft.unitPrice, status: 'Đã xuất hàng', sender: exportedDispatch.exporterName, receiver: exportedDispatch.receiver, vehicle: `${exportedDispatch.vehicleType} · ${exportedDispatch.vehiclePlate}`, lotCode: exportedDispatch.lotCode, ingredients: exportedDispatch.traceability.map((item) => ({ name: item.dish, origin: item.origin, lotCode: item.lotCode })) });
    const updated = { ...draft, status: 'Đã xuất hàng' as OrderStatus, linkedSlipId, dispatch: exportedDispatch };
    setDispatch(exportedDispatch);
    setDraft(updated);
    onUpdate(updated);
  };
  const changeQrMode = (mode: 'lot' | 'dish') => {
    const updatedDispatch = { ...dispatch, qrMode: mode };
    setDispatch(updatedDispatch);
    if (isExported) onUpdate({ ...draft, dispatch: updatedDispatch });
  };
  return <main className="content-wrap">
     <div className="page-heading detail-heading"><div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-order-list"><ArrowLeft size={14} /> Danh sách đơn hàng</Link><div className="detail-title-line"><h1>{draft.id}</h1><OrderStatusBadge status={draft.status} /></div><p className="page-subtitle">{isExported ? 'Phiếu xuất đã hoàn tất' : 'Chi tiết đơn hàng'} · {draft.customer}</p></div><div className="action-row">{notice && <span className="save-status" data-testid="status-order-notice">{notice}</span>}{!isExported && draft.source === 'A' && draft.status !== 'Đã xác nhận' && <button className="button button-primary" onClick={confirm} data-testid="button-confirm-order"><CheckCircle2 size={14} /> Xác nhận đơn</button>}{!isExported && draft.status === 'Đã xác nhận' && !dispatchOpen && <button className="button button-primary" onClick={() => setDispatchOpen(true)} data-testid="button-continue-dispatch"><FileText size={14} /> Tiếp tục lập phiếu xuất</button>}</div></div>
    <div className="order-detail-grid"><div className="detail-stack">
      <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Khách hàng đặt trước · kiểm tra lại theo món có trong ngày.' : 'Đơn tạo trực tiếp, đồng thời là phiếu xuất.'}</p></div><SourceBadge source={draft.source} /></div><div className="readonly-grid"><div className="readonly-field"><span className="field-label">Khách hàng</span><div className="readonly-value">{draft.customer}</div></div><div className="readonly-field"><span className="field-label">Địa chỉ khách hàng</span><div className="readonly-value">{customer?.deliveryAddress || 'Chưa cập nhật'}</div></div><div className="readonly-field"><span className="field-label">Món / thực đơn</span><div className="readonly-value">{draft.menu}</div></div><div className="readonly-field"><span className="field-label">Bữa ăn</span><div className="readonly-value">{draft.meal}</div></div><div className="readonly-field"><span className="field-label">Ngày giao</span><div className="readonly-value">{displayDate(draft.deliveryDate)}</div></div><div className="readonly-field"><span className="field-label">Giờ giao</span><div className="readonly-value"><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{draft.deliveryTime}</div></div></div></section>
       {!isExported && draft.source === 'A' && <section className="panel daily-menu-panel"><div className="panel-header"><div><h2 className="panel-heading">Danh sách món ăn trong ngày</h2><p className="panel-kicker">Đối chiếu đơn khách đặt với các món NCC đang có trước khi xác nhận.</p></div><ClipboardList size={17} color="hsl(17 91% 52%)" /></div><div className="daily-menu-list">{dailyMenu.filter((item) => item.meal === draft.meal).map((item) => { const requested = draft.items.some((orderItem) => orderItem.dish === item.dish); return <div className={`daily-menu-item${requested ? ' is-requested' : ''}`} key={item.dish}><span className="daily-menu-check">{requested ? <Check size={12} /> : null}</span><div><strong>{item.dish}</strong><span className="subtext">{item.meal} · đang có {item.available} suất</span></div><span className={`badge ${requested ? 'badge-pass' : 'badge-draft'}`}>{requested ? 'Có trong đơn' : 'Sẵn có'}</span></div>; })}</div></section>}
       <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Món ăn & lưu mẫu trong ngày</h2><p className="panel-kicker">Mỗi món phải có mẫu được lưu và đạt trước khi được phép xuất đi.</p></div><div className="sample-count">{draft.items.filter((item) => sampleStatus(item) === 'Đã lưu').length}/{draft.items.length} món đạt</div></div>{draft.items.some((item) => sampleStatus(item) !== 'Đã lưu') && !isExported && <div className="sample-warning"><AlertCircle size={16} /><div><strong>Chưa đủ điều kiện xuất hàng</strong><span>{draft.items.filter((item) => sampleStatus(item) !== 'Đã lưu').length} món chưa có mẫu đạt. Hãy mở “Xem lưu mẫu” để cập nhật hoặc chọn món khác trong thực đơn hôm nay.</span></div></div>}<div className="order-items"><div className="order-item-head"><span>Món ăn / mẫu trong ngày</span><span>Khách đặt</span><span>NCC cung ứng</span></div>{draft.items.map((item) => { const needsSample = sampleStatus(item) !== 'Đã lưu'; const alternatives = dailyMenu.filter((menuItem) => menuItem.meal === item.meal && menuItem.dish !== item.dish); return <div className="sample-order-block" key={item.id}><div className="order-item-row"><div><strong>{item.dish}</strong><span className="subtext">{item.meal} · {item.sampleSavedAt ? `lưu lúc ${item.sampleSavedAt}` : 'chưa có thời gian lưu mẫu'}</span><div className="sample-row-actions"><SampleStatusBadge status={sampleStatus(item)} /><button className="text-button" onClick={() => setSampleOpenId(sampleOpenId === item.id ? null : item.id)} data-testid={`button-open-sample-${item.id}`}>{sampleOpenId === item.id ? 'Đóng lưu mẫu' : 'Xem lưu mẫu'}</button></div>{item.sampleNote && <span className="sample-note">{item.sampleNote}</span>}</div><div className="readonly-value">{item.requestedQuantity} suất</div><div>{draft.source === 'A' && draft.status !== 'Đã xác nhận' && !isExported ? <div className="quantity-input"><input className="input" type="number" min="0" max={item.requestedQuantity} value={item.supplierQuantity} onChange={(event) => setQuantity(item.id, event.target.value)} data-testid={`input-supplier-quantity-${item.id}`} /><span>suất</span></div> : <div className="readonly-value">{item.supplierQuantity} suất</div>}</div></div>{needsSample && !isExported && <div className="replace-dish-row"><span><AlertCircle size={13} /> {sampleStatus(item) === 'Không đạt' ? 'Món không đạt, ' : 'Món chưa đủ hồ sơ, '}cần xử lý trước khi xuất</span>{alternatives.length > 0 && <select className="select" value="" onChange={(event) => replaceDish(item.id, event.target.value)} data-testid={`select-replace-dish-${item.id}`}><option value="">Chọn món khác để xuất...</option>{alternatives.map((alternative) => <option value={alternative.dish} key={alternative.dish}>{alternative.dish} · còn {alternative.available} suất</option>)}</select>}</div>}{sampleOpenId === item.id && !isExported && <SampleEditor item={item} deliveryDate={draft.deliveryDate} onSave={(changes) => saveSample(item.id, changes)} onCancel={() => setSampleOpenId(null)} />}</div>; })}</div>{draft.source === 'A' && draft.status !== 'Đã xác nhận' && !isExported && <button className="button button-quiet" style={{ marginTop: 12 }} onClick={saveQuantities} data-testid="button-save-order-quantities"><Check size={13} /> Lưu số lượng</button>}</section>
      {!isExported && draft.source === 'A' && <section className="panel proposal-panel"><div className="panel-header"><div><h2 className="panel-heading">Đổi món / trao đổi với khách</h2><p className="panel-kicker">Có thể gửi đề xuất hoặc tự gọi cho khách để thống nhất, không cần ràng buộc trong hệ thống.</p></div><Send size={17} color="hsl(17 91% 52%)" /></div>{draft.changeRequest && <div className="notice-box"><strong>Đề xuất đã ghi nhận</strong><span>{draft.changeRequest}</span></div>}{proposalOpen ? <div className="proposal-form"><textarea className="input textarea" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Ghi chú món cần đổi hoặc nội dung đã trao đổi..." data-testid="input-change-proposal" /><div className="action-row"><button className="button button-quiet" onClick={() => setProposalOpen(false)} data-testid="button-cancel-proposal">Hủy</button><button className="button button-primary" onClick={sendProposal} data-testid="button-send-proposal"><Send size={13} /> Lưu trao đổi</button></div></div> : <button className="button button-quiet" onClick={() => setProposalOpen(true)} data-testid="button-open-proposal"><Send size={13} /> Ghi chú đổi món</button>}</section>}
       {!isExported && dispatchOpen && <DispatchEditor dispatch={dispatch} onChange={updateDispatch} onTraceabilityChange={updateTraceability} onSubmit={completeDispatch} onCancel={() => setDispatchOpen(false)} canSubmit={samplesReady} />}
      {isExported && <DispatchQr order={draft} dispatch={dispatch} onQrModeChange={changeQrMode} />}
    </div><aside className="detail-stack"><section className="panel order-summary-panel"><div className="panel-header"><div><h2 className="panel-heading">Tóm tắt đơn hàng</h2><p className="panel-kicker">Một nơi để theo dõi từ lúc nhận đơn đến lúc giao.</p></div><CalendarDays size={17} color="hsl(17 91% 52%)" /></div><div className="summary-line"><span>Trạng thái</span><OrderStatusBadge status={draft.status} /></div><div className="summary-line"><span>Tổng số lượng</span><strong>{totalQuantity} suất</strong></div>{draft.dispatch && <><div className="summary-line"><span>Người xuất</span><strong>{draft.dispatch.exporterName}</strong></div><div className="summary-line"><span>Xe giao hàng</span><strong>{draft.dispatch.vehicleType} · {draft.dispatch.vehiclePlate}</strong></div><div className="summary-line"><span>Địa chỉ xuất</span><strong>{draft.dispatch.deliveryAddress}</strong></div></>}{!isExported && draft.status === 'Đã xác nhận' && !dispatchOpen && <div className="requirements" style={{ marginTop: 14 }}><strong><Clock3 size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Sẵn sàng lập phiếu</strong><span>Bấm “Tiếp tục lập phiếu xuất” để thêm người xuất, xe và thông tin truy xuất.</span></div>}{isExported && draft.linkedSlipId && <div className="success-box" style={{ marginTop: 14 }}><strong><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Đã lưu phiếu xuất</strong><span>{draft.linkedSlipId}</span></div>}</section></aside></div>
  </main>;
}

function LegacyOrderDetail({ order, onUpdate, createSlip }: { order?: OrderRecord; onUpdate: (order: OrderRecord) => void; createSlip: (input: CreateDispatchSlipInput) => string }) {
  const [, setLocation] = useLocation();
  const [draft, setDraft] = useState<OrderRecord | undefined>(order);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposal, setProposal] = useState(order?.changeRequest ?? '');
  if (!draft) return <main className="content-wrap not-found"><div><ClipboardList size={30} color="hsl(17 91% 52%)" /><h1>Không tìm thấy đơn hàng</h1><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang')} data-testid="button-back-orders">Về danh sách đơn hàng</button></div></main>;
  const setQuantity = (id: string, value: string) => setDraft({ ...draft, items: draft.items.map((item) => item.id === id ? { ...item, supplierQuantity: Math.max(0, Number(value) || 0) } : item) });
  const saveQuantities = () => { onUpdate(draft); };
  const sendProposal = () => { if (!proposal.trim()) return; const updated = { ...draft, status: 'Đề xuất thay đổi' as OrderStatus, changeRequest: proposal.trim() }; setDraft(updated); onUpdate(updated); setProposalOpen(false); };
  const confirm = () => {
    if (draft.status === 'Đã xác nhận' && draft.linkedSlipId) return;
    const updated = { ...draft, status: 'Đã xác nhận' as OrderStatus };
    const quantity = updated.items.reduce((sum, item) => sum + item.supplierQuantity, 0);
    const linkedSlipId = updated.linkedSlipId ?? createSlip({ orderCode: updated.id, customer: updated.customer, date: updated.deliveryDate, dispatchAt: `${updated.deliveryDate}T${updated.deliveryTime}:00`, meal: updated.meal, quantity, amount: quantity * updated.unitPrice });
    const withSlip = { ...updated, linkedSlipId };
    setDraft(withSlip);
    onUpdate(withSlip);
  };
  const createSlipForConfirmed = () => {
    if (draft.linkedSlipId) return;
    const quantity = draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0);
    const linkedSlipId = createSlip({ orderCode: draft.id, customer: draft.customer, date: draft.deliveryDate, dispatchAt: `${draft.deliveryDate}T${draft.deliveryTime}:00`, meal: draft.meal, quantity, amount: quantity * draft.unitPrice });
    const updated = { ...draft, linkedSlipId };
    setDraft(updated); onUpdate(updated); setLocation(`/phieu-xuat/${linkedSlipId}`);
  };
  return <main className="content-wrap"><div className="page-heading detail-heading"><div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-order-list"><ArrowLeft size={14} /> Đơn hàng cần xử lý</Link><div className="detail-title-line"><h1>{draft.id}</h1><OrderStatusBadge status={draft.status} /></div><p className="page-subtitle">Chi tiết đơn hàng · {draft.customer}</p></div><div className="action-row">{draft.source === 'A' && draft.status !== 'Đã xác nhận' && <button className="button button-primary" onClick={confirm} data-testid="button-confirm-order"><CheckCircle2 size={14} /> Xác nhận đơn</button>}{draft.status === 'Đã xác nhận' && !draft.linkedSlipId && <button className="button button-primary" onClick={createSlipForConfirmed} data-testid="button-create-slip-from-order"><FileText size={14} /> Tạo phiếu xuất</button>}</div></div><div className="order-detail-grid"><div className="detail-stack"><section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Dữ liệu do khách hàng gửi từ hệ thống · chỉ đọc' : 'Dữ liệu đơn do nhà cung cấp tạo'}</p></div><SourceBadge source={draft.source} /></div><div className="readonly-grid"><div className="readonly-field"><span className="field-label">Khách hàng</span><div className="readonly-value">{draft.customer}</div></div><div className="readonly-field"><span className="field-label">Thực đơn</span><div className="readonly-value">{draft.menu}</div></div><div className="readonly-field"><span className="field-label">Bữa ăn</span><div className="readonly-value">{draft.meal}</div></div><div className="readonly-field"><span className="field-label">Ngày giao</span><div className="readonly-value">{displayDate(draft.deliveryDate)}</div></div><div className="readonly-field"><span className="field-label">Giờ giao khách yêu cầu</span><div className="readonly-value"><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{draft.deliveryTime}</div></div><div className="readonly-field"><span className="field-label">Đơn giá hợp đồng</span><div className="readonly-value">{currency(draft.unitPrice)} VNĐ/suất</div></div></div></section><section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Món ăn & số lượng cung ứng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Chỉ được sửa số lượng nhà cung cấp có thể cung ứng; món ăn và giờ giao là dữ liệu chỉ đọc.' : 'Số lượng đã xác nhận trong đơn thủ công.'}</p></div>{draft.source === 'A' && <button className="button button-quiet" onClick={saveQuantities} data-testid="button-save-order-quantities"><Check size={13} /> Lưu số lượng</button>}</div><div className="order-items"><div className="order-item-head"><span>Món ăn</span><span>Khách yêu cầu</span><span>NCC có thể cung ứng</span></div>{draft.items.map((item) => <div className="order-item-row" key={item.id}><div><strong>{item.dish}</strong><span className="subtext">{item.meal}</span></div><div className="readonly-value">{item.requestedQuantity} suất</div><div>{draft.source === 'A' ? <div className="quantity-input"><input className="input" type="number" min="0" max={item.requestedQuantity} value={item.supplierQuantity} onChange={(event) => setQuantity(item.id, event.target.value)} data-testid={`input-supplier-quantity-${item.id}`} /><span>suất</span></div> : <div className="readonly-value">{item.supplierQuantity} suất</div>}</div></div>)}</div></section>{draft.source === 'A' && <section className="panel proposal-panel"><div className="panel-header"><div><h2 className="panel-heading">Đề xuất thay đổi</h2><p className="panel-kicker">Không tự ý thay đổi món ăn hoặc giờ giao; gửi đề xuất để khách hàng duyệt.</p></div><Send size={17} color="hsl(17 91% 52%)" /></div>{draft.changeRequest && <div className="notice-box"><strong>Đề xuất đã gửi</strong><span>{draft.changeRequest}</span></div>}{proposalOpen ? <div className="proposal-form"><textarea className="input textarea" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Mô tả món ăn hoặc giờ giao cần thay đổi..." data-testid="input-change-proposal" /><div className="action-row"><button className="button button-quiet" onClick={() => setProposalOpen(false)} data-testid="button-cancel-proposal">Hủy</button><button className="button button-primary" onClick={sendProposal} data-testid="button-send-proposal"><Send size={13} /> Gửi đề xuất thay đổi</button></div></div> : <button className="button button-quiet" onClick={() => setProposalOpen(true)} data-testid="button-open-proposal"><Send size={13} /> Đề xuất thay đổi</button>}</section>}</div><aside className="detail-stack"><section className="panel order-summary-panel"><div className="panel-header"><div><h2 className="panel-heading">Tóm tắt xử lý</h2><p className="panel-kicker">Theo dõi trạng thái và liên kết dữ liệu</p></div><CalendarDays size={17} color="hsl(17 91% 52%)" /></div><div className="summary-line"><span>Trạng thái</span><OrderStatusBadge status={draft.status} /></div><div className="summary-line"><span>Tổng số lượng cung ứng</span><strong>{draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0)} suất</strong></div><div className="summary-line"><span>Giá trị dự kiến</span><strong>{currency(draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0) * draft.unitPrice)} VNĐ</strong></div>{draft.linkedSlipId ? <div className="success-box" style={{ marginTop: 14 }}><strong><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Đã lưu phiếu xuất trong đơn hàng</strong><span>{draft.linkedSlipId}</span></div> : <div className="requirements" style={{ marginTop: 14 }}><strong><Clock3 size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Chưa có phiếu xuất</strong><span>Phiếu xuất sẽ được tạo sau khi đơn được xác nhận.</span></div>}</section></aside></div></main>;
}
