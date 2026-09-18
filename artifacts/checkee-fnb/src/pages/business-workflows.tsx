import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
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
  Search,
  Send,
  School,
  Building2,
  Trash2,
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
export type OrderStatus = 'Chờ xác nhận' | 'Đề xuất thay đổi' | 'Đã xác nhận';

export type OrderItem = {
  id: string;
  dish: string;
  meal: string;
  requestedQuantity: number;
  supplierQuantity: number;
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
  createdAt: string;
};

export type CreateDispatchSlipInput = {
  orderCode: string;
  customer: string;
  date: string;
  dispatchAt: string;
  meal: string;
  quantity: number;
  amount: number;
};

const CUSTOMER_STORAGE = 'checkee-fnb-customers-v1';
const ORDER_STORAGE = 'checkee-fnb-orders-v1';
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const today = dateOnly(new Date());
const inDays = (days: number) => dateOnly(new Date(Date.now() + days * 86400000));
const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const displayDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

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
      { id: 'oi-1', dish: 'Cơm thịt heo kho trứng', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486 },
      { id: 'oi-2', dish: 'Canh bí đỏ nấu thịt', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 470 },
      { id: 'oi-3', dish: 'Rau củ xào thập cẩm', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486 },
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
      { id: 'oi-4', dish: 'Cháo thịt bằm', meal: 'Bữa trưa', requestedQuantity: 180, supplierQuantity: 180 },
      { id: 'oi-5', dish: 'Canh bí đỏ', meal: 'Bữa trưa', requestedQuantity: 180, supplierQuantity: 180 },
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
      { id: 'oi-6', dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', requestedQuantity: 68, supplierQuantity: 68 },
    ],
  },
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
          <div className="panel-header"><div><h2 className="panel-heading">Điều kiện hợp đồng</h2><p className="panel-kicker">Dùng làm cơ sở tạo đơn và tính giá trị phiếu xuất</p></div><FileText size={17} color="hsl(17 91% 52%)" /></div>
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
        <div className="table-scroll"><table className="data-table customer-table"><thead><tr><th>Khách hàng</th><th>Loại</th><th>Người liên hệ</th><th>Địa chỉ điểm giao</th><th>Đơn giá hợp đồng</th><th>Thời hạn hợp đồng</th><th /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><UsersRound size={25} style={{ marginBottom: 8 }} /><div>Không có khách hàng phù hợp</div></div></td></tr> : filtered.map((customer) => { const state = contractState(customer.contractEnd); return <tr key={customer.id} data-testid={`row-customer-${customer.id}`} className={state.label === 'Đã hết hạn' ? 'fail-row' : state.label === 'Sắp hết hạn' ? 'warn-row' : ''}><td><Link href={`/quan-ly-khach-hang/${customer.id}`} className="slip-link" data-testid={`link-customer-${customer.id}`}>{customer.name}</Link><span className="subtext mono">{customer.taxCode || 'Chưa cập nhật MST'}</span></td><td><span className="type-cell"><CustomerTypeIcon type={customer.type} />{customer.type}</span></td><td>{customer.contact}</td><td><span className="address-cell">{customer.deliveryAddress}</span></td><td><strong>{currency(customer.unitPrice)}</strong><span className="subtext">VNĐ / suất</span></td><td><span className={`badge ${state.className}`}>{state.label === 'Còn hiệu lực' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{state.label}</span><span className="subtext">{state.detail}</span>{customer.contractFile && <span className="subtext"><FileText size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{customer.contractFile}</span>}</td><td><div className="row-actions"><Link href={`/quan-ly-khach-hang/${customer.id}`} className="icon-button" aria-label={`Sửa ${customer.name}`} data-testid={`button-edit-customer-${customer.id}`}><Pencil size={14} /></Link><button className="icon-button" aria-label={`Xóa ${customer.name}`} onClick={() => remove(customer)} data-testid={`button-delete-customer-${customer.id}`}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div>
      </section>
    </main>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const className = status === 'Đã xác nhận' ? 'badge-pass' : status === 'Đề xuất thay đổi' ? 'badge-warn' : 'badge-draft';
  return <span className={`badge ${className}`}>{status === 'Đã xác nhận' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{status}</span>;
}

function SourceBadge({ source }: { source: OrderSource }) {
  return <span className={`badge ${source === 'A' ? 'badge-source-a' : 'badge-source-b'}`}>{source === 'A' ? <ClipboardList size={12} /> : <Pencil size={12} />}{source === 'A' ? 'Từ hệ thống khách hàng' : 'NCC tạo thủ công'}</span>;
}

function OrderForm({ customers, onSave, onCancel }: { customers: CustomerRecord[]; onSave: (order: OrderRecord) => void; onCancel: () => void }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const selected = customers.find((item) => item.id === customerId) ?? customers[0];
  const [menu, setMenu] = useState('Suất tiêu chuẩn theo hợp đồng');
  const [meal, setMeal] = useState('Bữa trưa');
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [deliveryTime, setDeliveryTime] = useState('11:30');
  const [quantity, setQuantity] = useState('100');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const amount = Math.max(1, Number(quantity) || 1);
    const order: OrderRecord = {
      id: `DH-${today.replaceAll('-', '').slice(2)}-${String(Date.now()).slice(-3)}`,
      customerId: selected.id,
      customer: selected.name,
      source: 'B',
      menu,
      meal,
      deliveryDate,
      deliveryTime,
      status: 'Đã xác nhận',
      unitPrice: selected.unitPrice,
      createdAt: new Date().toISOString(),
      items: [{ id: `oi-${Date.now()}`, dish: menu, meal, requestedQuantity: amount, supplierQuantity: amount }],
    };
    onSave(order);
  };
  return <main className="content-wrap"><div className="page-heading detail-heading"><div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-orders"><ArrowLeft size={14} /> Đơn hàng cần xử lý</Link><h1>Tạo đơn hàng thủ công</h1><p className="page-subtitle">Dùng cho đơn đặt qua điện thoại, email hoặc khách hàng không dùng hệ thống.</p></div></div><form className="workflow-form" onSubmit={submit}><section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">Đơn thủ công mặc định có trạng thái Đã xác nhận</p></div><span className="badge badge-source-b"><Pencil size={12} /> NCC tạo thủ công</span></div><div className="form-grid-3"><div className="field form-span-2"><label className="field-label" htmlFor="manual-customer">Khách hàng</label><select id="manual-customer" className="select" value={customerId} onChange={(event) => setCustomerId(event.target.value)} data-testid="select-manual-customer">{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></div><div className="field"><label className="field-label">Đơn giá theo hợp đồng</label><div className="readonly-value price-readonly">{currency(selected?.unitPrice ?? 0)} VNĐ/suất</div></div><div className="field form-span-2"><label className="field-label" htmlFor="manual-menu">Thực đơn</label><input id="manual-menu" className="input" value={menu} onChange={(event) => setMenu(event.target.value)} required data-testid="input-manual-menu" /></div><div className="field"><label className="field-label" htmlFor="manual-meal">Buổi ăn</label><select id="manual-meal" className="select" value={meal} onChange={(event) => setMeal(event.target.value)} data-testid="select-manual-meal"><option>Bữa sáng</option><option>Bữa trưa</option><option>Bữa xế</option><option>Bữa tối</option></select></div><div className="field"><label className="field-label" htmlFor="manual-date">Ngày giao</label><input id="manual-date" type="date" className="input" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required data-testid="input-manual-date" /></div><div className="field"><label className="field-label" htmlFor="manual-time">Giờ giao</label><input id="manual-time" type="time" className="input" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} required data-testid="input-manual-time" /></div><div className="field"><label className="field-label" htmlFor="manual-quantity">Số lượng suất</label><input id="manual-quantity" type="number" min="1" className="input" value={quantity} onChange={(event) => setQuantity(event.target.value)} required data-testid="input-manual-quantity" /></div></div></section><div className="detail-actions"><button type="button" className="button button-quiet" onClick={onCancel} data-testid="button-cancel-manual-order">Hủy</button><button type="submit" className="button button-primary" data-testid="button-save-manual-order"><Check size={14} /> Tạo đơn đã xác nhận</button></div></form></main>;
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
  if (params.id) return <OrderDetail order={orders.find((item) => item.id === params.id)} onUpdate={(updated) => saveOrders(orders.map((item) => item.id === updated.id ? updated : item))} createSlip={createSlip} />;
  return <main className="content-wrap"><div className="page-heading"><div><p className="eyebrow">Điều phối suất ăn</p><h1>Quản lý đơn hàng</h1><p className="page-subtitle">Tiếp nhận đơn từ hệ thống khách hàng và đơn do nhà cung cấp tạo thủ công.</p></div><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang/moi')} data-testid="button-create-manual-order"><Plus size={14} /> Tạo đơn thủ công</button></div><section className="stats-grid order-stats"><div className="stat-card primary"><div className="stat-label">Đơn hàng cần xử lý</div><div className="stat-value" data-testid="stat-orders">{orders.filter((item) => item.status !== 'Đã xác nhận').length}</div><div className="stat-meta">Đơn từ hệ thống khách hàng</div></div><div className="stat-card"><div className="stat-label">Chờ xác nhận</div><div className="stat-value">{orders.filter((item) => item.status === 'Chờ xác nhận').length}</div><div className="stat-meta">Cần phản hồi khách hàng</div></div><div className="stat-card"><div className="stat-label">Đề xuất thay đổi</div><div className="stat-value">{orders.filter((item) => item.status === 'Đề xuất thay đổi').length}</div><div className="stat-meta">Đang chờ khách duyệt</div></div><div className="stat-card"><div className="stat-label">Đã xác nhận</div><div className="stat-value">{orders.filter((item) => item.status === 'Đã xác nhận').length}</div><div className="stat-meta">Sẵn sàng tạo phiếu xuất</div></div></section><section className="filters-panel"><div className="filter-grid order-filters"><div className="field order-search"><label className="field-label" htmlFor="order-search">Tìm kiếm</label><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="order-search" className="input" style={{ paddingLeft: 30 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, khách hàng, thực đơn..." data-testid="input-search-orders" /></div></div><div className="field"><label className="field-label" htmlFor="order-source-filter">Nguồn đơn hàng</label><select id="order-source-filter" className="select" value={source} onChange={(event) => setSource(event.target.value)} data-testid="select-filter-order-source"><option>Tất cả nguồn</option><option value="A">Từ hệ thống khách hàng</option><option value="B">NCC tạo thủ công</option></select></div><div className="field"><label className="field-label" htmlFor="order-status-filter">Trạng thái</label><select id="order-status-filter" className="select" value={status} onChange={(event) => setStatus(event.target.value)} data-testid="select-filter-order-status"><option>Tất cả trạng thái</option><option>Chờ xác nhận</option><option>Đề xuất thay đổi</option><option>Đã xác nhận</option></select></div></div></section><section className="table-card"><div className="table-toolbar"><div><h2 className="table-title">Đơn hàng cần xử lý</h2><span className="table-note">{filtered.length} đơn hàng hiển thị</span></div><span className="table-note">Nguồn A chỉ sửa số lượng có thể cung ứng</span></div><div className="table-scroll"><table className="data-table order-table"><thead><tr><th>Mã đơn hàng</th><th>Khách hàng</th><th>Nguồn đơn</th><th>Thực đơn / bữa ăn</th><th>Ngày & giờ giao</th><th>Số lượng</th><th>Trạng thái</th><th /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><ClipboardList size={25} style={{ marginBottom: 8 }} /><div>Không có đơn hàng phù hợp</div></div></td></tr> : filtered.map((order) => { const quantity = order.items.reduce((sum, item) => sum + item.requestedQuantity, 0); return <tr key={order.id} data-testid={`row-order-${order.id}`}><td><Link href={`/quan-ly-don-hang/${order.id}`} className="slip-link mono" data-testid={`link-order-${order.id}`}>{order.id}</Link><span className="subtext">{order.items.length} món ăn</span></td><td><span className="customer-name">{order.customer}</span></td><td><SourceBadge source={order.source} /></td><td><strong>{order.menu}</strong><span className="subtext">{order.meal}</span></td><td><span className="mono">{displayDate(order.deliveryDate)}</span><span className="subtext"><Clock3 size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{order.deliveryTime}</span></td><td><strong>{quantity}</strong><span className="subtext">suất yêu cầu</span></td><td><OrderStatusBadge status={order.status} />{order.linkedSlipId && <span className="subtext"><CheckCircle2 size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />Đã liên kết phiếu xuất</span>}</td><td><Link href={`/quan-ly-don-hang/${order.id}`} className="icon-button" aria-label={`Xem ${order.id}`} data-testid={`button-view-order-${order.id}`}><ChevronRight size={15} /></Link></td></tr>; })}</tbody></table></div></section></main>;
}

function OrderDetail({ order, onUpdate, createSlip }: { order?: OrderRecord; onUpdate: (order: OrderRecord) => void; createSlip: (input: CreateDispatchSlipInput) => string }) {
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
    if (draft.linkedSlipId) { setLocation(`/phieu-xuat/${draft.linkedSlipId}`); return; }
    const quantity = draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0);
    const linkedSlipId = createSlip({ orderCode: draft.id, customer: draft.customer, date: draft.deliveryDate, dispatchAt: `${draft.deliveryDate}T${draft.deliveryTime}:00`, meal: draft.meal, quantity, amount: quantity * draft.unitPrice });
    const updated = { ...draft, linkedSlipId };
    setDraft(updated); onUpdate(updated); setLocation(`/phieu-xuat/${linkedSlipId}`);
  };
  return <main className="content-wrap"><div className="page-heading detail-heading"><div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-order-list"><ArrowLeft size={14} /> Đơn hàng cần xử lý</Link><div className="detail-title-line"><h1>{draft.id}</h1><OrderStatusBadge status={draft.status} /></div><p className="page-subtitle">Chi tiết đơn hàng · {draft.customer}</p></div><div className="action-row">{draft.source === 'A' && draft.status !== 'Đã xác nhận' && <button className="button button-primary" onClick={confirm} data-testid="button-confirm-order"><CheckCircle2 size={14} /> Xác nhận đơn</button>}{draft.status === 'Đã xác nhận' && <button className="button button-primary" onClick={createSlipForConfirmed} data-testid="button-create-slip-from-order"><FileText size={14} /> {draft.linkedSlipId ? 'Mở phiếu xuất' : 'Tạo phiếu xuất'}</button>}</div></div><div className="order-detail-grid"><div className="detail-stack"><section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Dữ liệu do khách hàng gửi từ hệ thống · chỉ đọc' : 'Dữ liệu đơn do nhà cung cấp tạo'}</p></div><SourceBadge source={draft.source} /></div><div className="readonly-grid"><div className="readonly-field"><span className="field-label">Khách hàng</span><div className="readonly-value">{draft.customer}</div></div><div className="readonly-field"><span className="field-label">Thực đơn</span><div className="readonly-value">{draft.menu}</div></div><div className="readonly-field"><span className="field-label">Bữa ăn</span><div className="readonly-value">{draft.meal}</div></div><div className="readonly-field"><span className="field-label">Ngày giao</span><div className="readonly-value">{displayDate(draft.deliveryDate)}</div></div><div className="readonly-field"><span className="field-label">Giờ giao khách yêu cầu</span><div className="readonly-value"><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{draft.deliveryTime}</div></div><div className="readonly-field"><span className="field-label">Đơn giá hợp đồng</span><div className="readonly-value">{currency(draft.unitPrice)} VNĐ/suất</div></div></div></section><section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Món ăn & số lượng cung ứng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Chỉ được sửa số lượng nhà cung cấp có thể cung ứng; món ăn và giờ giao là dữ liệu chỉ đọc.' : 'Số lượng đã xác nhận trong đơn thủ công.'}</p></div>{draft.source === 'A' && <button className="button button-quiet" onClick={saveQuantities} data-testid="button-save-order-quantities"><Check size={13} /> Lưu số lượng</button>}</div><div className="order-items"><div className="order-item-head"><span>Món ăn</span><span>Khách yêu cầu</span><span>NCC có thể cung ứng</span></div>{draft.items.map((item) => <div className="order-item-row" key={item.id}><div><strong>{item.dish}</strong><span className="subtext">{item.meal}</span></div><div className="readonly-value">{item.requestedQuantity} suất</div><div>{draft.source === 'A' ? <div className="quantity-input"><input className="input" type="number" min="0" max={item.requestedQuantity} value={item.supplierQuantity} onChange={(event) => setQuantity(item.id, event.target.value)} data-testid={`input-supplier-quantity-${item.id}`} /><span>suất</span></div> : <div className="readonly-value">{item.supplierQuantity} suất</div>}</div></div>)}</div></section>{draft.source === 'A' && <section className="panel proposal-panel"><div className="panel-header"><div><h2 className="panel-heading">Đề xuất thay đổi</h2><p className="panel-kicker">Không tự ý thay đổi món ăn hoặc giờ giao; gửi đề xuất để khách hàng duyệt.</p></div><Send size={17} color="hsl(17 91% 52%)" /></div>{draft.changeRequest && <div className="notice-box"><strong>Đề xuất đã gửi</strong><span>{draft.changeRequest}</span></div>}{proposalOpen ? <div className="proposal-form"><textarea className="input textarea" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Mô tả món ăn hoặc giờ giao cần thay đổi..." data-testid="input-change-proposal" /><div className="action-row"><button className="button button-quiet" onClick={() => setProposalOpen(false)} data-testid="button-cancel-proposal">Hủy</button><button className="button button-primary" onClick={sendProposal} data-testid="button-send-proposal"><Send size={13} /> Gửi đề xuất thay đổi</button></div></div> : <button className="button button-quiet" onClick={() => setProposalOpen(true)} data-testid="button-open-proposal"><Send size={13} /> Đề xuất thay đổi</button>}</section>}</div><aside className="detail-stack"><section className="panel order-summary-panel"><div className="panel-header"><div><h2 className="panel-heading">Tóm tắt xử lý</h2><p className="panel-kicker">Theo dõi trạng thái và liên kết dữ liệu</p></div><CalendarDays size={17} color="hsl(17 91% 52%)" /></div><div className="summary-line"><span>Trạng thái</span><OrderStatusBadge status={draft.status} /></div><div className="summary-line"><span>Tổng số lượng cung ứng</span><strong>{draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0)} suất</strong></div><div className="summary-line"><span>Giá trị dự kiến</span><strong>{currency(draft.items.reduce((sum, item) => sum + item.supplierQuantity, 0) * draft.unitPrice)} VNĐ</strong></div>{draft.linkedSlipId ? <div className="success-box" style={{ marginTop: 14 }}><strong><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Đã liên kết phiếu xuất</strong><Link href={`/phieu-xuat/${draft.linkedSlipId}`} className="slip-link" data-testid="link-linked-slip">{draft.linkedSlipId} <ChevronRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div> : <div className="requirements" style={{ marginTop: 14 }}><strong><Clock3 size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Chưa có phiếu xuất</strong><span>Phiếu xuất sẽ được tạo sau khi đơn được xác nhận.</span></div>}</section></aside></div></main>;
}
