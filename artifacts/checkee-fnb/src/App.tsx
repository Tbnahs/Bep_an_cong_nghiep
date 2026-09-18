import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Factory,
  LayoutDashboard,
  LogOut,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
  Truck,
  UploadCloud,
  UserRound,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import {
  Link,
  Redirect,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from 'wouter';
import type { ReactNode } from 'react';
import NotFound from '@/pages/not-found';
import { CustomerManagement, OrderManagement, type CreateDispatchSlipInput } from '@/pages/business-workflows';

const queryClient = new QueryClient();
const STORAGE_KEY = 'checkee-fnb-slips-v1';

type SlipStatus = 'Nháp' | 'Đã xuất hàng' | 'Khách hàng đã xác nhận';
type Quality = 'Đạt' | 'Không đạt';

type IngredientRow = {
  id: string;
  name: string;
  origin: string;
  lotCode: string;
};

type Slip = {
  id: string;
  orderCode: string;
  customer: string;
  customerShort: string;
  date: string;
  dispatchAt: string;
  status: SlipStatus;
  payment: 'Đã thanh toán' | 'Chưa thanh toán';
  meal: string;
  quantity: number;
  amount: number;
  quality: Quality;
  note?: string;
  lotCode: string;
  documentName: string;
  ingredientOrigin: string;
  sender: string;
  receiver: string;
  vehicle: string;
  ingredients: IngredientRow[];
};

const isoHoursFromNow = (hours: number) => new Date(Date.now() + hours * 3600000).toISOString();
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const today = dateOnly(new Date());

const seedSlips: Slip[] = [
  {
    id: 'PX-250814-01',
    orderCode: 'DH-250814-018',
    customer: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    customerShort: 'TH Nguyễn Bỉnh Khiêm',
    date: today,
    dispatchAt: isoHoursFromNow(1.5),
    status: 'Nháp',
    payment: 'Chưa thanh toán',
    meal: 'Bữa trưa',
    quantity: 486,
    amount: 12636000,
    quality: 'Đạt',
    note: 'Cần hoàn tất hồ sơ trước 10:30',
    lotCode: '',
    documentName: '',
    ingredientOrigin: '',
    sender: '',
    receiver: '',
    vehicle: '51D-428.16',
    ingredients: [
      { id: 'i-1', name: 'Thịt heo nạc', origin: '', lotCode: '' },
      { id: 'i-2', name: 'Cà rốt', origin: '', lotCode: '' },
      { id: 'i-3', name: 'Gạo thơm', origin: '', lotCode: '' },
    ],
  },
  {
    id: 'PX-250814-02',
    orderCode: 'DH-250814-016',
    customer: 'Trường Mầm non Mặt Trời Bé Con',
    customerShort: 'MN Mặt Trời Bé Con',
    date: today,
    dispatchAt: isoHoursFromNow(-1),
    status: 'Đã xuất hàng',
    payment: 'Đã thanh toán',
    meal: 'Bữa trưa + xế',
    quantity: 352,
    amount: 9856000,
    quality: 'Đạt',
    lotCode: 'L250814-B',
    documentName: 'Phieu-kiem-thuc-250814.pdf',
    ingredientOrigin: 'NCC Thực phẩm An Tâm',
    sender: 'Nguyễn Văn Hùng',
    receiver: '',
    vehicle: '51D-191.03',
    ingredients: [
      { id: 'i-4', name: 'Ức gà', origin: 'NCC Thực phẩm An Tâm', lotCode: 'GA250814-08' },
      { id: 'i-5', name: 'Bí đỏ', origin: 'HTX Rau sạch Đà Lạt', lotCode: 'BD250813-21' },
    ],
  },
  {
    id: 'PX-250813-11',
    orderCode: 'DH-250813-097',
    customer: 'Trường THCS Lê Quý Đôn',
    customerShort: 'THCS Lê Quý Đôn',
    date: dateOnly(new Date(Date.now() - 86400000)),
    dispatchAt: isoHoursFromNow(-25),
    status: 'Khách hàng đã xác nhận',
    payment: 'Đã thanh toán',
    meal: 'Bữa trưa',
    quantity: 712,
    amount: 19224000,
    quality: 'Đạt',
    lotCode: 'L250813-A',
    documentName: 'Ho-so-lo-250813.pdf',
    ingredientOrigin: 'NCC Nông sản Minh Châu',
    sender: 'Trần Văn Luyện',
    receiver: 'Phạm Thị Hạnh',
    vehicle: '51D-801.42',
    ingredients: [
      { id: 'i-6', name: 'Cá basa', origin: 'NCC Nông sản Minh Châu', lotCode: 'CB250813-02' },
      { id: 'i-7', name: 'Rau cải xanh', origin: 'NCC Nông sản Minh Châu', lotCode: 'RC250813-11' },
    ],
  },
  {
    id: 'PX-250814-03',
    orderCode: 'DH-250814-021',
    customer: 'Trường Tiểu học Trần Quốc Toản',
    customerShort: 'TH Trần Quốc Toản',
    date: today,
    dispatchAt: isoHoursFromNow(4),
    status: 'Nháp',
    payment: 'Đã thanh toán',
    meal: 'Bữa trưa',
    quantity: 425,
    amount: 11050000,
    quality: 'Không đạt',
    note: 'Món canh có mẫu kiểm tra không đạt',
    lotCode: '',
    documentName: '',
    ingredientOrigin: '',
    sender: '',
    receiver: '',
    vehicle: '51D-428.16',
    ingredients: [
      { id: 'i-8', name: 'Thịt bò', origin: 'NCC Thực phẩm An Tâm', lotCode: 'BO250814-03' },
      { id: 'i-9', name: 'Rau ngót', origin: 'Chưa cập nhật', lotCode: 'RN250814-09' },
    ],
  },
];

const getInitialSlips = (): Slip[] => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Slip[] : seedSlips;
  } catch {
    return seedSlips;
  }
};

const persistSlips = (slips: Slip[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
};

const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const displayDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
const displayTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const isDueSoon = (slip: Slip) => slip.status === 'Nháp' && new Date(slip.dispatchAt).getTime() - Date.now() < 2 * 3600000 && new Date(slip.dispatchAt).getTime() > Date.now();

function SideNav({ currentPath, mobileOpen, onClose }: { currentPath: string; mobileOpen: boolean; onClose: () => void }) {
  const items = [
    { label: 'Trang chủ', icon: LayoutDashboard, href: '/' },
    { label: 'Quản lý món ăn', icon: Utensils, href: '#' },
    { label: 'Quản lý chế biến', icon: Factory, href: '#' },
    { label: 'Nguồn cung cấp', icon: Truck, href: '#' },
    { label: 'Nguyên liệu', icon: Boxes, href: '#' },
    { label: 'Quản lý khách hàng', icon: Users, href: '/quan-ly-khach-hang', active: currentPath.startsWith('/quan-ly-khach-hang') },
    { label: 'Quản lý đơn hàng', icon: ClipboardCheck, href: '/quan-ly-don-hang', active: currentPath.startsWith('/quan-ly-don-hang') },
    { label: 'Quản lý tài khoản', icon: UserRound, href: '#' },
    { label: 'Quản lý nhân sự', icon: Users, href: '#' },
    { label: 'Sổ kiểm thực 3 bước', icon: ClipboardCheck, href: '#' },
    { label: 'Báo cáo thống kê', icon: BarChart3, href: '#' },
  ];
  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="brand-lockup" aria-label="Checkee F&B">
        <span className="brand-mark">C</span><span>heck<span style={{ color: 'hsl(17 91% 52%)' }}>ee</span> <strong>F&amp;B</strong></span>
        <small>Giải pháp Truy xuất nguồn gốc</small>
      </div>
      <p className="nav-caption">Không gian nhà cung cấp</p>
      <nav className="side-nav" aria-label="Điều hướng chính">
        {items.map(({ label, icon: Icon, href, active }) => href === '#' ? (
          <a href="#" key={label} className="side-link secondary" onClick={(event) => event.preventDefault()} data-testid={`link-sidebar-${label}`}>
            <Icon /><span>{label}</span>
          </a>
        ) : (
          <Link href={href} key={label} className={`side-link${active ? ' active' : ''}`} onClick={onClose} data-testid={`link-sidebar-${label}`}>
            <Icon /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">Phiên bản 2.4.1 · NCC</div>
      {mobileOpen && <button className="icon-button" style={{ position: 'absolute', right: 10, top: 10, zIndex: 3 }} onClick={onClose} data-testid="button-close-sidebar"><X size={16} /></button>}
    </aside>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topNotice, setTopNotice] = useState('');
  const showTopNotice = (message: string) => {
    setTopNotice(message);
    window.setTimeout(() => setTopNotice(''), 2400);
  };
  return (
    <div className="app-shell">
      <SideNav currentPath={location} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-column">
        <header className="topbar">
          <div className="crumbs">
            <button className="icon-button mobile-nav-toggle" onClick={() => setMobileOpen(true)} data-testid="button-open-sidebar"><ChevronRight size={16} /></button>
            <span>Không gian nhà cung cấp</span><ChevronRight size={14} /><strong>{location.startsWith('/phieu-xuat') ? 'Chi tiết phiếu xuất' : location.startsWith('/quan-ly-khach-hang') ? 'Quản lý khách hàng' : 'Quản lý đơn hàng'}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="Thông báo" onClick={() => showTopNotice('Bạn đang có 2 thông báo cần xem')} data-testid="button-notifications"><Bell size={16} /></button>
            <div className="user-chip">
              <div className="avatar">TL</div>
              <span><b>Trần Văn Luyện</b><small>Nhà cung cấp</small></span>
            </div>
            <button className="icon-button" title="Đăng xuất" onClick={() => showTopNotice('Phiên làm việc vẫn đang hoạt động')} data-testid="button-logout"><LogOut size={15} /></button>
          </div>
        </header>
        {topNotice && <div className="top-toast" role="status" data-testid="status-top-notice">{topNotice}</div>}
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SlipStatus }) {
  const className = status === 'Nháp' ? 'badge-draft' : status === 'Đã xuất hàng' ? 'badge-exported' : 'badge-confirmed';
  return <span className={`badge ${className}`} data-testid={`status-${status}`}>{status === 'Nháp' ? <Clock3 size={12} /> : status === 'Đã xuất hàng' ? <Truck size={12} /> : <CheckCircle2 size={12} />}{status}</span>;
}

function Overview({ slips }: { slips: Slip[] }) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customer, setCustomer] = useState('Tất cả khách hàng');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const [payment, setPayment] = useState('Tất cả thanh toán');
  const filtered = useMemo(() => slips.filter((slip) => {
    const matchesSearch = !search || `${slip.id} ${slip.orderCode} ${slip.customer}`.toLowerCase().includes(search.toLowerCase());
    const matchesFrom = !fromDate || slip.date >= fromDate;
    const matchesTo = !toDate || slip.date <= toDate;
    const matchesCustomer = customer === 'Tất cả khách hàng' || slip.customer === customer;
    const matchesStatus = status === 'Tất cả trạng thái' || slip.status === status;
    const matchesPayment = payment === 'Tất cả thanh toán' || slip.payment === payment;
    return matchesSearch && matchesFrom && matchesTo && matchesCustomer && matchesStatus && matchesPayment;
  }), [slips, search, fromDate, toDate, customer, status, payment]);
  const dueSoon = slips.filter(isDueSoon).length;
  const exportedCount = slips.filter((slip) => slip.status === 'Đã xuất hàng').length;
  const confirmedCount = slips.filter((slip) => slip.status === 'Khách hàng đã xác nhận').length;
  const customers = Array.from(new Set(slips.map((slip) => slip.customer)));
  const exportReport = () => {
    const rows = [['Mã phiếu', 'Khách hàng', 'Ngày xuất', 'Trạng thái', 'Bữa ăn', 'Số lượng suất', 'Số tiền trả (VNĐ)'], ...filtered.map((slip) => [slip.id, slip.customer, slip.date, slip.status, slip.meal, String(slip.quantity), String(slip.amount)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `bao-cao-phieu-xuat-${today}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const resetFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setCustomer('Tất cả khách hàng'); setStatus('Tất cả trạng thái'); setPayment('Tất cả thanh toán'); };
  return (
    <main className="content-wrap">
      <div className="page-heading">
        <div><p className="eyebrow">Điều phối hôm nay</p><h1>Phiếu xuất suất ăn</h1><p className="page-subtitle">Theo dõi tiến độ giao suất ăn và đối soát cùng khách hàng.</p></div>
        <div className="action-row">
          <button className="button button-quiet" onClick={exportReport} data-testid="button-export-report"><Download size={14} /> Xuất báo cáo</button>
          <button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang/moi')} data-testid="button-open-due-slip"><Plus size={14} /> Tạo đơn hàng / phiếu xuất</button>
        </div>
      </div>
      <section className="stats-grid" aria-label="Tổng quan phiếu xuất">
        <div className="stat-card primary"><div className="stat-label">Tổng phiếu xuất trong kỳ</div><div className="stat-value" data-testid="stat-total">{slips.length}</div><div className="stat-meta">Cập nhật vừa xong</div></div>
        <div className="stat-card"><div className="stat-label">Chờ xuất hàng</div><div className="stat-value" data-testid="stat-draft">{slips.filter((slip) => slip.status === 'Nháp').length}</div><div className="stat-meta">{dueSoon > 0 ? `${dueSoon} phiếu cần xử lý sớm` : 'Không có phiếu quá hạn'}</div></div>
        <div className="stat-card"><div className="stat-label">Đã xuất hàng</div><div className="stat-value" data-testid="stat-exported">{exportedCount}</div><div className="stat-meta">Đang chờ xác nhận</div></div>
        <div className="stat-card"><div className="stat-label">Khách hàng xác nhận</div><div className="stat-value" data-testid="stat-confirmed">{confirmedCount}</div><div className="stat-meta">Đối soát hoàn tất</div></div>
      </section>
      <section className="filters-panel" aria-label="Bộ lọc phiếu xuất">
        <div className="filter-grid">
          <div className="field"><label className="field-label" htmlFor="filter-search">Tìm kiếm</label><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="filter-search" className="input" style={{ paddingLeft: 30 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu, đơn hàng..." data-testid="input-filter-search" /></div></div>
          <div className="field"><label className="field-label" htmlFor="filter-from">Từ ngày</label><div style={{ position: 'relative' }}><CalendarDays size={13} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="filter-from" type="date" className="input" style={{ paddingLeft: 30 }} value={fromDate} onChange={(event) => setFromDate(event.target.value)} data-testid="input-filter-from" /></div></div>
          <div className="field"><label className="field-label" htmlFor="filter-to">Đến ngày</label><div style={{ position: 'relative' }}><CalendarDays size={13} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="filter-to" type="date" className="input" style={{ paddingLeft: 30 }} value={toDate} onChange={(event) => setToDate(event.target.value)} data-testid="input-filter-to" /></div></div>
          <div className="field"><label className="field-label" htmlFor="filter-customer">Khách hàng</label><select id="filter-customer" className="select" value={customer} onChange={(event) => setCustomer(event.target.value)} data-testid="select-filter-customer"><option>Tất cả khách hàng</option>{customers.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label className="field-label" htmlFor="filter-status">Trạng thái</label><select id="filter-status" className="select" value={status} onChange={(event) => setStatus(event.target.value)} data-testid="select-filter-status"><option>Tất cả trạng thái</option><option>Nháp</option><option>Đã xuất hàng</option><option>Khách hàng đã xác nhận</option></select></div>
          <div className="field"><label className="field-label" htmlFor="filter-payment">Thanh toán</label><select id="filter-payment" className="select" value={payment} onChange={(event) => setPayment(event.target.value)} data-testid="select-filter-payment"><option>Tất cả thanh toán</option><option>Đã thanh toán</option><option>Chưa thanh toán</option></select></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}><button className="button button-quiet" onClick={resetFilters} data-testid="button-reset-filters"><Filter size={13} /> Đặt lại bộ lọc</button></div>
      </section>
      <section className="table-card">
        <div className="table-toolbar"><div><h2 className="table-title">Danh sách phiếu xuất</h2><span className="table-note">{filtered.length} phiếu hiển thị · Nền vàng là phiếu cần xử lý trong 2 giờ</span></div><span className="table-note" data-testid="text-quality-legend"><CircleAlert size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Hồng: có món không đạt</span></div>
        <div className="table-scroll">
          <table className="data-table"><thead><tr><th>Mã phiếu xuất</th><th>Khách hàng</th><th>Ngày xuất</th><th>Bữa ăn</th><th>Số lượng suất</th><th>Số tiền trả (VNĐ)</th><th>Thanh toán</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><FileText size={25} style={{ marginBottom: 8 }} /><div>Không có phiếu xuất phù hợp</div><button className="button button-quiet" style={{ marginTop: 14 }} onClick={resetFilters} data-testid="button-empty-reset">Xóa bộ lọc</button></div></td></tr> : filtered.map((slip) => <tr key={slip.id} className={slip.quality === 'Không đạt' ? 'fail-row' : isDueSoon(slip) ? 'warn-row' : ''} data-testid={`row-slip-${slip.id}`}>
              <td><Link href={`/phieu-xuat/${slip.id}`} className="slip-link" data-testid={`link-slip-${slip.id}`}>{slip.id}</Link><span className="subtext mono">{slip.orderCode}</span></td>
              <td><span className="customer-name">{slip.customerShort}</span><span className="subtext">{slip.customer}</span></td>
              <td><span className="mono">{displayDate(slip.date)}</span><span className="subtext">{displayTime(slip.dispatchAt)} xuất</span>{isDueSoon(slip) && <span className="warning-note"><Clock3 size={11} /> Còn dưới 2 giờ</span>}</td>
              <td>{slip.meal}</td><td><strong>{slip.quantity}</strong></td><td><strong>{currency(slip.amount)}</strong></td>
              <td><span className={slip.payment === 'Đã thanh toán' ? 'badge badge-pass' : 'badge badge-draft'}>{slip.payment}</span></td><td><StatusBadge status={slip.status} />{slip.quality === 'Không đạt' && <span className="warning-note" style={{ color: 'hsl(345 69% 53%)' }}><CircleAlert size={11} /> Có món không đạt</span>}</td>
              <td><Link href={`/phieu-xuat/${slip.id}`} className="icon-button" aria-label={`Xem ${slip.id}`} data-testid={`button-view-slip-${slip.id}`}><ChevronRight size={15} /></Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stepper({ status }: { status: SlipStatus }) {
  const current = status === 'Nháp' ? 0 : status === 'Đã xuất hàng' ? 2 : 3;
  const steps = ['Tạo phiếu', 'Hoàn thiện hồ sơ', 'Đã xuất hàng', 'Khách xác nhận'];
  return <div className="stepper" aria-label="Tiến trình phiếu xuất">{steps.map((step, index) => <div className={`step ${index < current ? 'is-done' : ''} ${index === current ? 'is-current' : ''}`} key={step}><span className="step-dot">{index < current ? <Check size={12} /> : index + 1}</span><span>{step}</span>{index < steps.length - 1 && <span style={{ display: 'contents' }} />}</div>)}</div>;
}

function Detail({ slips, updateSlip }: { slips: Slip[]; updateSlip: (slip: Slip) => void }) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const slip = slips.find((item) => item.id === params.id);
  const [draft, setDraft] = useState<Slip | null>(slip ?? null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setDraft(slip ?? null); }, [slip]);
  if (!draft) return <main className="content-wrap not-found"><div><CircleAlert size={30} color="hsl(17 91% 52%)" /><h1>Không tìm thấy phiếu xuất</h1><button className="button button-primary" onClick={() => setLocation('/')} data-testid="button-back-list">Về danh sách</button></div></main>;
  const patch = (changes: Partial<Slip>) => setDraft((current) => current ? { ...current, ...changes } : current);
  const patchIngredient = (id: string, changes: Partial<IngredientRow>) => patch({ ingredients: draft.ingredients.map((item) => item.id === id ? { ...item, ...changes } : item) });
  const missing: string[] = [];
  if (!draft.lotCode.trim()) missing.push('Mã lô suất ăn');
  if (!draft.documentName) missing.push('Chứng từ / tài liệu đính kèm');
  if (!draft.ingredients.length || draft.ingredients.some((item) => !item.origin.trim())) missing.push('Nguồn gốc nguyên liệu');
  if (!draft.sender.trim()) missing.push('Người giao (NCC)');
  const saveDraft = () => { updateSlip(draft); setNotice('Đã lưu thông tin phiếu xuất'); window.setTimeout(() => setNotice(''), 2800); };
  const completeSlip = () => {
    if (missing.length > 0) { setNotice(`Chưa thể xuất hàng: còn ${missing.length} thông tin bắt buộc`); return; }
    const completed = { ...draft, status: 'Đã xuất hàng' as SlipStatus };
    updateSlip(completed); setDraft(completed); setNotice('Phiếu đã chuyển sang trạng thái Đã xuất hàng'); window.setTimeout(() => setNotice(''), 3000);
  };
  const uploadDocument = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) patch({ documentName: file.name }); };
  const addIngredient = () => patch({ ingredients: [...draft.ingredients, { id: `ingredient-${Date.now()}`, name: '', origin: '', lotCode: '' }] });
  const removeIngredient = (id: string) => patch({ ingredients: draft.ingredients.filter((item) => item.id !== id) });
  const qrVisible = draft.status !== 'Nháp';
  const downloadQr = () => { const blob = new Blob([`CHECKEE F&B | ${draft.id} | ${draft.lotCode}`], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${draft.id}-qr.txt`; anchor.click(); URL.revokeObjectURL(url); };
  return (
    <main className="content-wrap">
      <div className="page-heading detail-heading">
        <div><Link href="/" className="back-link" data-testid="link-back-list"><ArrowLeft size={14} /> Danh sách phiếu xuất</Link><div className="detail-title-line"><h1>{draft.id}</h1><StatusBadge status={draft.status} /></div><p className="page-subtitle">Chi tiết phiếu xuất suất ăn · Đơn hàng {draft.orderCode}</p></div>
        <div className="action-row">{notice && <span className="save-status" data-testid="status-save-notice">{notice}</span>}<button className="button button-quiet" onClick={saveDraft} data-testid="button-save-draft"><CheckCircle2 size={14} /> Lưu nháp</button>{draft.status === 'Nháp' && <button className="button button-primary" onClick={completeSlip} data-testid="button-complete-slip"><Truck size={14} /> Hoàn tất &amp; xuất hàng</button>}</div>
      </div>
      <Stepper status={draft.status} />
      <div className="detail-grid">
        <div className="detail-stack">
          <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin đơn hàng</h2><p className="panel-kicker">Dữ liệu lấy từ đơn hàng, chỉ đọc</p></div><span className="badge badge-exported">Đơn hàng đã duyệt</span></div><div className="readonly-grid">
            <div className="readonly-field"><span className="field-label">Mã đơn hàng</span><div className="readonly-value mono">{draft.orderCode}</div></div>
            <div className="readonly-field"><span className="field-label">Khách hàng</span><div className="readonly-value">{draft.customer}</div></div>
            <div className="readonly-field"><span className="field-label">Ngày giao</span><div className="readonly-value">{displayDate(draft.date)}</div></div>
            <div className="readonly-field"><span className="field-label">Bữa ăn</span><div className="readonly-value">{draft.meal}</div></div>
            <div className="readonly-field"><span className="field-label">Số lượng suất</span><div className="readonly-value">{draft.quantity} suất</div></div>
            <div className="readonly-field"><span className="field-label">Số tiền trả (VNĐ)</span><div className="readonly-value">{currency(draft.amount)}</div></div>
          </div></section>
          <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Món ăn trong phiếu</h2><p className="panel-kicker">Kết quả kiểm tra chất lượng theo từng món</p></div><span className={draft.quality === 'Đạt' ? 'badge badge-pass' : 'badge badge-fail'}>{draft.quality === 'Đạt' ? <CheckCircle2 size={12} /> : <CircleAlert size={12} />}{draft.quality}</span></div>
            <table className="meal-table"><thead><tr><th>Bữa ăn</th><th>Tên món</th><th>Số lượng</th><th>Kết quả</th></tr></thead><tbody><tr><td>{draft.meal}</td><td>Cơm thịt rau củ</td><td>{draft.quantity} suất</td><td><span className={draft.quality === 'Đạt' ? 'badge badge-pass' : 'badge badge-fail'}>{draft.quality}</span></td></tr><tr><td>{draft.meal}</td><td>Canh theo thực đơn</td><td>{draft.quantity} suất</td><td><span className="badge badge-pass"><CheckCircle2 size={11} /> Đạt</span></td></tr></tbody></table>
          </section>
          <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Nguồn gốc nguyên liệu</h2><p className="panel-kicker">Bổ sung đầy đủ nguồn gốc và mã lô cho từng nguyên liệu</p></div><button className="button add-row" onClick={addIngredient} data-testid="button-add-ingredient"><Plus size={13} /> Thêm nguyên liệu</button></div>
            {draft.ingredients.map((item) => <div className="ingredient-row" key={item.id}><div className="field"><label className="field-label">Tên nguyên liệu</label><input className="input" value={item.name} onChange={(event) => patchIngredient(item.id, { name: event.target.value })} placeholder="Ví dụ: Thịt heo" data-testid={`input-ingredient-name-${item.id}`} /></div><div className="field"><label className="field-label">Nguồn gốc</label><input className="input" value={item.origin} onChange={(event) => patchIngredient(item.id, { origin: event.target.value })} placeholder="Tên nhà cung cấp" data-testid={`input-ingredient-origin-${item.id}`} /></div><div className="field"><label className="field-label">Mã lô nguyên liệu</label><input className="input" value={item.lotCode} onChange={(event) => patchIngredient(item.id, { lotCode: event.target.value })} placeholder="Mã lô" data-testid={`input-ingredient-lot-${item.id}`} /></div><button className="remove-row" onClick={() => removeIngredient(item.id)} title="Xóa nguyên liệu" data-testid={`button-remove-ingredient-${item.id}`}><Trash2 size={13} /></button></div>)}
          </section>
        </div>
        <div className="detail-stack">
          <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Hồ sơ phiếu xuất</h2><p className="panel-kicker">Chứng từ kiểm thực và mã lô suất ăn</p></div><FileText size={17} color="hsl(17 91% 52%)" /></div><div className="field" style={{ marginBottom: 12 }}><label className="field-label" htmlFor="lot-code">Mã lô suất ăn</label><input id="lot-code" className="input" value={draft.lotCode} onChange={(event) => patch({ lotCode: event.target.value })} placeholder="Nhập mã lô suất ăn" data-testid="input-lot-code" /></div><div className="upload-box"><div className="upload-icon"><UploadCloud size={18} /></div><div style={{ minWidth: 0, flex: 1 }}>{draft.documentName ? <><div className="document-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.documentName}</div><div className="document-meta">Tài liệu đã sẵn sàng để đối soát</div></> : <><div className="document-name">Chưa có chứng từ</div><div className="document-meta">PDF, JPG hoặc PNG · tối đa 10 MB</div></>}<label className="button button-quiet" style={{ marginTop: 9, minHeight: 30, fontSize: 10 }} htmlFor="document-upload" data-testid="button-upload-document"><UploadCloud size={12} /> {draft.documentName ? 'Đổi tài liệu' : 'Tải tài liệu lên'}</label><input id="document-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={uploadDocument} style={{ display: 'none' }} data-testid="input-upload-document" /></div></div></section>
          <section className="panel"><div className="panel-header"><div><h2 className="panel-heading">Thông tin giao hàng</h2><p className="panel-kicker">Xác nhận người giao và người nhận</p></div><Truck size={17} color="hsl(17 91% 52%)" /></div><div className="form-two"><div className="field"><label className="field-label" htmlFor="sender">Người giao (NCC)</label><input id="sender" className="input" value={draft.sender} onChange={(event) => patch({ sender: event.target.value })} placeholder="Họ và tên người giao" data-testid="input-sender" /></div><div className="field"><label className="field-label" htmlFor="receiver">Người nhận (khách hàng)</label><input id="receiver" className="input" value={draft.receiver} onChange={(event) => patch({ receiver: event.target.value })} placeholder="Nhập khi khách nhận" data-testid="input-receiver" /></div><div className="field"><label className="field-label" htmlFor="vehicle">Biển số xe</label><input id="vehicle" className="input" value={draft.vehicle} onChange={(event) => patch({ vehicle: event.target.value })} placeholder="51D-000.00" data-testid="input-vehicle" /></div><div className="field"><label className="field-label">Giờ dự kiến xuất</label><div className="readonly-value" style={{ paddingTop: 10 }}><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{displayTime(draft.dispatchAt)}</div></div></div><div className="confirm-box"><input id="confirm-info" type="checkbox" defaultChecked={draft.status !== 'Nháp'} data-testid="checkbox-confirm-info" /><label htmlFor="confirm-info">Tôi xác nhận thông tin giao hàng là chính xác</label></div></section>
          {draft.status === 'Nháp' && missing.length > 0 && <section className="requirements"><strong><CircleAlert size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Còn thiếu thông tin bắt buộc</strong><ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {draft.status !== 'Nháp' && <section className="success-box"><strong><CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Phiếu đã được xuất hàng</strong><span>QR chỉ hiển thị sau khi phiếu chuyển sang trạng thái Đã xuất hàng.</span><div className="qr-panel"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={{ margin: 0 }}><QrCode size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />Mã QR truy xuất</strong><span className="badge badge-confirmed">Đã kích hoạt</span></div><div className="qr-wrap"><div className="qr-code" aria-label="Mã QR phiếu xuất" data-testid="qr-code" /><div className="qr-copy"><strong>{draft.id}</strong>Quét mã để xem thông tin lô suất ăn và hồ sơ giao hàng.<div className="action-row" style={{ marginTop: 9 }}><button className="button button-quiet" onClick={() => window.print()} data-testid="button-print-qr"><Printer size={12} /> In mã QR</button><button className="button button-quiet" onClick={downloadQr} data-testid="button-download-qr"><Download size={12} /> Tải mã</button></div></div></div></div></section>}
        </div>
      </div>
    </main>
  );
}

function Router({ slips, updateSlip, createSlip }: { slips: Slip[]; updateSlip: (slip: Slip) => void; createSlip: (input: CreateDispatchSlipInput) => string }) {
  const [location] = useLocation();
  return <AppShell><ErrorBoundary resetKey={location}><Switch><Route path="/" component={() => <Redirect to="/quan-ly-don-hang" />} /><Route path="/quan-ly-khach-hang" component={CustomerManagement} /><Route path="/quan-ly-khach-hang/:id" component={CustomerManagement} /><Route path="/quan-ly-don-hang" component={() => <OrderManagement createSlip={createSlip} />} /><Route path="/quan-ly-don-hang/:id" component={() => <OrderManagement createSlip={createSlip} />} /><Route component={NotFound} /></Switch></ErrorBoundary></AppShell>;
}

function App() {
  const [slips, setSlips] = useState<Slip[]>(getInitialSlips);
  const updateSlip = (updated: Slip) => setSlips((current) => { const next = current.map((item) => item.id === updated.id ? updated : item); persistSlips(next); return next; });
  const createSlip = (input: CreateDispatchSlipInput) => {
    const slipId = `PX-${input.orderCode.replace('DH-', '')}`;
    setSlips((current) => {
      if (current.some((item) => item.id === slipId)) return current;
      const next: Slip[] = [{
        id: slipId,
        orderCode: input.orderCode,
        customer: input.customer,
        customerShort: input.customer.length > 24 ? `${input.customer.slice(0, 24)}…` : input.customer,
        date: input.date,
        dispatchAt: input.dispatchAt,
        status: input.status ?? 'Nháp',
        payment: 'Chưa thanh toán',
        meal: input.meal,
        quantity: input.quantity,
        amount: input.amount,
        quality: 'Đạt',
        note: 'Phiếu được tạo từ đơn hàng đã xác nhận',
        lotCode: input.lotCode ?? '',
        documentName: '',
        ingredientOrigin: input.ingredients?.[0]?.origin ?? '',
        sender: input.sender ?? '',
        receiver: input.receiver ?? '',
        vehicle: input.vehicle ?? '',
        ingredients: input.ingredients?.map((item, index) => ({ id: `${slipId}-i${index + 1}`, ...item })) ?? [
          { id: `${slipId}-i1`, name: '', origin: '', lotCode: '' },
          { id: `${slipId}-i2`, name: '', origin: '', lotCode: '' },
        ],
      }, ...current];
      persistSlips(next);
      return next;
    });
    return slipId;
  };
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router slips={slips} updateSlip={updateSlip} createSlip={createSlip} /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;