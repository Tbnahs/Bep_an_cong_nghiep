import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, PointerEvent } from 'react';
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
  Eye,
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
  X,
} from 'lucide-react';

export type CustomerType = 'Trường học' | 'Bệnh viện' | 'Công ty' | 'Khác';

export type CustomerRecord = {
  id: string;
  type: CustomerType;
  name: string;
  taxCode: string;
  contact: string;
  phone?: string;
  deliveryAddress: string;
  allowedMenu: string;
  unitPrice: number;
  contractStart: string;
  contractEnd: string;
  contractFile: string;
};

export type OrderSource = 'A' | 'B';
export type OrderStatus = 'Chờ xuất' | 'Chờ xác nhận' | 'Đề xuất thay đổi' | 'Đã xác nhận' | 'Đã xuất hàng';

export type OrderItem = {
  id: string;
  dish: string;
  meal: string;
  requestedQuantity: number;
  supplierQuantity: number;
  quality?: 'Đạt' | 'Không đạt';
  sampleStatus?: 'Chưa lưu' | 'Đã lưu' | 'Không đạt';
  sampleSavedAt?: string;
  sampleNote?: string;
  sampleInfo?: SampleInfo;
};

export type SampleIngredient = {
  name: string;
  supplier: string;
  lotCode: string;
  unit: string;
};

export type SampleInfo = {
  traceCode: string;
  menuType: string;
  description: string;
  chef: string;
  processCode: string;
  preparedAt: string;
  ingredients: SampleIngredient[];
};

export type OrderRecord = {
  id: string;
  orderCode?: string;
  customerId: string;
  customer: string;
  customerType?: CustomerType;
  source: OrderSource;
  menu: string;
  meal: string;
  orderDate?: string;
  orderTime?: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress?: string;
  status: OrderStatus;
  items: OrderItem[];
  exportItems?: OrderItem[];
  exportItemIds?: string[];
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

export type DispatchMode = 'preorder' | 'normal';

export type DispatchDetails = {
  exporterName: string;
  deliveryAddress: string;
  receiver: string;
  signature: string;
  vehicleType: string;
  vehiclePlate: string;
  lotCode: string;
  attachmentName?: string;
  entryMode: DispatchMode;
  qrMode: 'lot' | 'dish';
  traceability: TraceabilityItem[];
  exportedAt: string;
};

function SignaturePad({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const drawFromValue = (canvas: HTMLCanvasElement, image: string) => {
    if (!image) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const saved = new Image();
    saved.onload = () => context.drawImage(saved, 0, 0, canvas.width, canvas.height);
    saved.src = image;
  };

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    const context = canvas.getContext('2d');
    if (!context) return;
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const point = getPoint(event);
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = 'hsl(224 27% 17%)';
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="signature-pad-wrap">
      <div className="signature-pad">
        <canvas
          ref={(canvas) => {
            canvasRef.current = canvas;
            if (canvas) drawFromValue(canvas, value);
          }}
          width={720}
          height={190}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          aria-label="Ô ký tên trực tiếp"
          style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.72 : 1 }}
          data-testid="signature-pad"
        />
        {!value && !disabled && <span className="signature-hint">Ký tên tại đây</span>}
        {disabled && value && !value.startsWith('data:image/') && <span className="signature-hint">{value}</span>}
      </div>
      <button type="button" className="text-button signature-clear" onClick={clear} disabled={disabled || !value} data-testid="button-clear-signature">Xóa chữ ký</button>
    </div>
  );
}

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
const ORDER_STORAGE = 'checkee-fnb-orders-v3';
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
const today = dateOnly(new Date());
const inDays = (days: number) => dateOnly(new Date(Date.now() + days * 86400000));
const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const displayDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const orderDateFor = (order: OrderRecord) => order.orderDate ?? order.createdAt.slice(0, 10);
const orderTimeFor = (order: OrderRecord) => order.orderTime ?? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(order.createdAt));
const batchCodeFor = (date: string, sequence: number) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}${month}${year}-${String(sequence).padStart(3, '0')}`;
};
const sampleStatus = (item: OrderItem) => item.sampleStatus ?? 'Chưa lưu';
const MEAL_OPTIONS = ['Sáng', 'Trưa', 'Xế', 'Tối'] as const;
type MealOption = typeof MEAL_OPTIONS[number];
const mealOptionFor = (meal: string): MealOption => {
  const normalized = meal.toLowerCase();
  if (normalized.includes('sáng')) return 'Sáng';
  if (normalized.includes('xế')) return 'Xế';
  if (normalized.includes('tối')) return 'Tối';
  return 'Trưa';
};
const mealDisplay = (meal: string) => `Buổi ${mealOptionFor(meal)}`;
const sampleInfoFor = (item: OrderItem, deliveryDate: string): SampleInfo => item.sampleInfo ?? {
  traceCode: item.dish === 'Mì trộn hải sản' ? '1753402417699' : `17534024${item.id.replace(/\D/g, '').padStart(5, '0')}`,
  menuType: 'Đặc (nấu chín)',
  description: 'Món ăn được theo dõi trong 24h từ lúc bắt đầu chế biến.',
  chef: 'Đầu bếp Checkee',
  processCode: item.dish === 'Mì trộn hải sản' ? 'MTHS-001' : 'MÓN-001',
  preparedAt: `${item.sampleSavedAt ?? '10:30'} ${displayDate(deliveryDate)}`,
  ingredients: [
    { name: 'Tôm sú', supplier: 'Công ty TNHH Thương mại quốc tế hải sản Hoàng Gia', lotCode: '2025071008', unit: 'Gram' },
    { name: 'Cải thìa xanh', supplier: 'Khu A5-013 Chợ Bình Điền', lotCode: '2025070512', unit: 'Kg' },
    { name: 'Mì gói', supplier: 'Nhà cung cấp Sỉ & Sẻ Minh Hằng', lotCode: '20250708', unit: 'Gói' },
    { name: 'Trứng gà', supplier: 'Chi nhánh Trứng Gà Ba Huân', lotCode: '2025070101', unit: 'Quả' },
  ],
};
const traceabilityForItems = (items: OrderItem[], deliveryDate: string): TraceabilityItem[] => items.map((item) => {
  const sample = sampleInfoFor(item, deliveryDate);
  return {
    id: item.id,
    dish: item.dish,
    origin: sample.ingredients.map((ingredient) => ingredient.supplier).join(' · '),
    lotCode: sample.ingredients.map((ingredient) => ingredient.lotCode).join(' · '),
  };
});

const seedCustomers: CustomerRecord[] = [
  {
    id: 'KH-001',
    type: 'Trường học',
    name: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    taxCode: '0302456812',
    contact: 'Phạm Thị Hạnh',
    phone: '0908 215 642',
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
    contact: 'Lê Minh Quân',
    phone: '0913 540 229',
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
    contact: 'Nguyễn Hoàng Anh',
    phone: '0987 321 408',
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
    contact: 'Vũ Ngọc Lan',
    phone: '0932 118 770',
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
    orderCode: undefined,
    customerId: 'KH-001',
    customer: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    source: 'A',
    menu: 'Thực đơn tuần 33 · Thứ năm',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '10:30',
    status: 'Chờ xuất',
    unitPrice: 26000,
    createdAt: new Date().toISOString(),
    items: [
      { id: 'oi-1', dish: 'Mì trộn hải sản', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486, sampleStatus: 'Đã lưu', sampleSavedAt: '10:30' },
      { id: 'oi-2', dish: 'Canh cải xanh', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 470, sampleStatus: 'Chưa lưu' },
      { id: 'oi-3', dish: 'Trứng gà', meal: 'Bữa trưa', requestedQuantity: 486, supplierQuantity: 486, sampleStatus: 'Đã lưu', sampleSavedAt: '10:35' },
    ],
  },
  {
    id: 'DH-250814-016',
    orderCode: undefined,
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
    orderCode: undefined,
    customerId: 'KH-003',
    customer: 'Công ty Phần mềm Sao Mai',
    source: 'A',
    menu: 'Suất văn phòng tiêu chuẩn',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '11:45',
    status: 'Chờ xuất',
    unitPrice: 38000,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { id: 'oi-6', dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', requestedQuantity: 68, supplierQuantity: 68, sampleStatus: 'Đã lưu', sampleSavedAt: '10:40' },
    ],
  },
  {
    id: 'DH-MANUAL-001',
    orderCode: batchCodeFor(today, 1),
    customerId: 'KH-001',
    customer: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
    customerType: 'Trường học',
    source: 'B',
    menu: 'Mì trộn hải sản · Trứng gà',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '12:00',
    deliveryAddress: '18 Nguyễn Bỉnh Khiêm, P. Đa Kao, Q. 1, TP. HCM',
    status: 'Đã xác nhận',
    unitPrice: 26000,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    items: [
      { id: 'oi-7', dish: 'Mì trộn hải sản', meal: 'Bữa trưa', requestedQuantity: 120, supplierQuantity: 120, sampleStatus: 'Đã lưu', sampleSavedAt: '10:20' },
      { id: 'oi-8', dish: 'Trứng gà', meal: 'Bữa trưa', requestedQuantity: 120, supplierQuantity: 120, sampleStatus: 'Đã lưu', sampleSavedAt: '10:25' },
    ],
  },
  {
    id: 'DH-MANUAL-002',
    orderCode: batchCodeFor(today, 2),
    customerId: 'KH-003',
    customer: 'Công ty Phần mềm Sao Mai',
    customerType: 'Công ty',
    source: 'B',
    menu: 'Cơm gà nướng mật ong',
    meal: 'Bữa trưa',
    deliveryDate: today,
    deliveryTime: '13:15',
    deliveryAddress: 'Tòa nhà RiverGate, 151 Bến Vân Đồn, Q. 4, TP. HCM',
    status: 'Đã xuất hàng',
    unitPrice: 38000,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    items: [
      { id: 'oi-9', dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', requestedQuantity: 68, supplierQuantity: 68, sampleStatus: 'Đã lưu', sampleSavedAt: '10:40' },
    ],
  },
];

const dailyMenu = [
  { dish: 'Mì trộn hải sản', meal: 'Bữa trưa', available: 520, sampleStatus: 'Đã lưu' as const },
  { dish: 'Cơm thịt heo kho trứng', meal: 'Bữa trưa', available: 520, sampleStatus: 'Đã lưu' as const },
  { dish: 'Cơm gà nướng mật ong', meal: 'Bữa trưa', available: 180, sampleStatus: 'Đã lưu' as const },
  { dish: 'Canh bí đỏ nấu thịt', meal: 'Bữa trưa', available: 500, sampleStatus: 'Chưa lưu' as const },
  { dish: 'Canh cải xanh', meal: 'Bữa trưa', available: 500, sampleStatus: 'Chưa lưu' as const },
  { dish: 'Rau củ xào thập cẩm', meal: 'Bữa trưa', available: 520, sampleStatus: 'Đã lưu' as const },
  { dish: 'Trứng gà', meal: 'Bữa trưa', available: 520, sampleStatus: 'Đã lưu' as const },
  { dish: 'Trái cây theo mùa', meal: 'Bữa xế', available: 300, sampleStatus: 'Đã lưu' as const },
];
const savedSampleMenu = dailyMenu.filter((item) => item.sampleStatus === 'Đã lưu');
const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value));
const legacyManualDispatch = (order: OrderRecord): DispatchDetails => ({
  exporterName: 'Đã lưu khi tạo đơn',
  deliveryAddress: order.deliveryAddress ?? '',
  receiver: order.customer,
  signature: 'Đã ký',
  vehicleType: 'Đã lưu khi tạo đơn',
  vehiclePlate: 'Đã lưu khi tạo đơn',
  lotCode: batchCodeFor(order.deliveryDate, 1),
  entryMode: 'normal',
  qrMode: 'lot',
  traceability: traceabilityForItems(order.items, order.deliveryDate),
  exportedAt: order.createdAt,
});
const normalizeOrder = (order: OrderRecord): OrderRecord => {
  const migrated = (order.id === 'DH-250814-018' || order.id === 'DH-250814-021') && order.status === 'Đã xuất hàng' && !order.dispatch
    ? { ...order, status: 'Chờ xuất' as OrderStatus }
    : order;
  if (migrated.source !== 'B') return migrated;
  return {
    ...migrated,
    status: 'Đã xuất hàng',
    dispatch: migrated.dispatch ?? legacyManualDispatch(migrated),
  };
};

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
    phone: '',
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
    if (!form.name.trim() || !form.contact.trim() || !form.phone?.trim() || !form.deliveryAddress.trim()) return;
    onSave({ ...form, name: form.name.trim(), contact: form.contact.trim(), phone: form.phone.trim(), deliveryAddress: form.deliveryAddress.trim(), unitPrice: Number(form.unitPrice) || 0 });
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
            <div className="field"><label className="field-label" htmlFor="customer-contact">Người liên hệ</label><input id="customer-contact" className="input" required value={form.contact} onChange={(event) => set('contact', event.target.value)} placeholder="Họ và tên" data-testid="input-customer-contact" /></div>
            <div className="field"><label className="field-label" htmlFor="customer-phone">Số điện thoại</label><input id="customer-phone" type="tel" className="input" required value={form.phone ?? ''} onChange={(event) => set('phone', event.target.value)} placeholder="0908 123 456" data-testid="input-customer-phone" /></div>
            <div className="field form-span-2"><label className="field-label" htmlFor="customer-address">Địa chỉ</label><input id="customer-address" className="input" required value={form.deliveryAddress} onChange={(event) => set('deliveryAddress', event.target.value)} placeholder="Địa chỉ nhận suất ăn" data-testid="input-customer-address" /></div>
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
    const query = `${customer.name} ${customer.taxCode} ${customer.contact} ${customer.phone ?? ''}`.toLowerCase();
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
       <div className="table-scroll"><table className="data-table customer-table"><thead><tr><th>Khách hàng</th><th>Loại</th><th>Người liên hệ</th><th>Số điện thoại</th><th>Địa chỉ điểm giao</th><th>Thời hạn hợp đồng</th><th /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><UsersRound size={25} style={{ marginBottom: 8 }} /><div>Không có khách hàng phù hợp</div></div></td></tr> : filtered.map((customer) => { const state = contractState(customer.contractEnd); return <tr key={customer.id} data-testid={`row-customer-${customer.id}`} className={state.label === 'Đã hết hạn' ? 'fail-row' : state.label === 'Sắp hết hạn' ? 'warn-row' : ''}><td><Link href={`/quan-ly-khach-hang/${customer.id}`} className="slip-link" data-testid={`link-customer-${customer.id}`}>{customer.name}</Link><span className="subtext mono">{customer.taxCode || 'Chưa cập nhật MST'}</span></td><td><span className="type-cell"><CustomerTypeIcon type={customer.type} />{customer.type}</span></td><td>{customer.contact}</td><td>{customer.phone || <span className="subtext">Chưa cập nhật</span>}</td><td><span className="address-cell">{customer.deliveryAddress}</span></td><td><span className={`badge ${state.className}`}>{state.label === 'Còn hiệu lực' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{state.label}</span><span className="subtext">{state.detail}</span>{customer.contractFile && <span className="subtext"><FileText size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{customer.contractFile}</span>}</td><td><div className="row-actions"><Link href={`/quan-ly-khach-hang/${customer.id}`} className="icon-button" aria-label={`Sửa ${customer.name}`} data-testid={`button-edit-customer-${customer.id}`}><Pencil size={14} /></Link><button className="icon-button" aria-label={`Xóa ${customer.name}`} onClick={() => remove(customer)} data-testid={`button-delete-customer-${customer.id}`}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div>
      </section>
    </main>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const completed = orderStatusLabel(status) === 'Hoàn thành';
  return <span className={`badge ${completed ? 'badge-exported' : 'badge-pass'}`}>{completed ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{completed ? 'Hoàn thành' : 'Chờ xuất'}</span>;
}

function orderStatusLabel(status: OrderStatus) {
  return status === 'Đã xuất hàng' ? 'Hoàn thành' : 'Chờ xuất';
}

function SourceBadge({ source }: { source: OrderSource }) {
  return <span className={`badge ${source === 'A' ? 'badge-source-a' : 'badge-source-b'}`}>{source === 'A' ? <ClipboardList size={12} /> : <Pencil size={12} />}{source === 'A' ? 'Từ hệ thống khách hàng' : 'Tạo thủ công'}</span>;
}

function OrderForm({ customers, onSave, onCancel }: { customers: CustomerRecord[]; onSave: (order: OrderRecord) => void; onCancel: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>(customers[0]?.type ?? 'Trường học');
  const [customerName, setCustomerName] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderTime, setOrderTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote] = useState('');
  const [selectedDish, setSelectedDish] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [sampleOpenId, setSampleOpenId] = useState<string | null>(null);
  const [dispatch, setDispatch] = useState<DispatchDetails>({
    exporterName: '',
    deliveryAddress: '',
    receiver: '',
    signature: '',
    vehicleType: '',
    vehiclePlate: '',
    lotCode: '',
    entryMode: 'normal',
    qrMode: 'lot',
    traceability: [],
    exportedAt: '',
  });
  const [formError, setFormError] = useState('');
  const generatedLotCode = batchCodeFor(deliveryDate, 1);
  const addDish = () => {
    const menuItem = dailyMenu.find((item) => item.dish === selectedDish);
    if (!menuItem || items.some((item) => item.dish === menuItem.dish)) return;
    const item: OrderItem = {
      id: `oi-${Date.now()}-${items.length}`,
      dish: menuItem.dish,
      meal: menuItem.meal,
      requestedQuantity: 1,
      supplierQuantity: 1,
      quality: 'Đạt',
      sampleStatus: menuItem.sampleStatus,
      sampleSavedAt: menuItem.sampleStatus === 'Đã lưu' ? '10:30' : undefined,
    };
    setItems((current) => [...current, item]);
    setSelectedDish('');
    setFormError('');
  };
  const updateDishQuantity = (id: string, value: string) => {
    const nextQuantity = Math.max(0, Number(value) || 0);
    setItems((current) => current.map((item) => item.id === id ? { ...item, requestedQuantity: nextQuantity, supplierQuantity: nextQuantity } : item));
    setFormError('');
  };
  const updateDishMeal = (id: string, meal: MealOption) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, meal: `Bữa ${meal.toLowerCase()}` } : item));
    setFormError('');
  };
  const removeDish = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };
  const updateDispatch = (changes: Partial<DispatchDetails>) => {
    setDispatch((current) => ({ ...current, ...changes }));
    setFormError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!customerName.trim() || !orderDate || !orderTime || !deliveryDate || !deliveryTime || !deliveryAddress.trim() || items.length === 0 || items.some((item) => item.requestedQuantity < 1)) {
      setFormError('Vui lòng bổ sung đầy đủ thông tin đơn hàng và số suất cho từng món.');
      return;
    }
    const draftDispatch: DispatchDetails = {
      ...dispatch,
      deliveryAddress: deliveryAddress.trim(),
      lotCode: generatedLotCode,
      traceability: traceabilityForItems(items, deliveryDate),
      exportedAt: new Date().toISOString(),
    };
    const missingDispatch: string[] = [];
    if (!draftDispatch.exporterName.trim()) missingDispatch.push('Tên người giao hàng');
    if (!draftDispatch.vehicleType.trim()) missingDispatch.push('Phương tiện');
    if (!draftDispatch.vehiclePlate.trim()) missingDispatch.push('Biển số xe');
    if (!draftDispatch.signature.trim()) missingDispatch.push('Chữ ký');
    if (missingDispatch.length) {
      setFormError(`Vui lòng bổ sung thông tin vận chuyển: ${missingDispatch.join(', ')}.`);
      return;
    }
    const order: OrderRecord = {
      id: `DH-${today.replaceAll('-', '').slice(2)}-${String(Date.now()).slice(-3)}`,
      customerId,
      customer: customerName.trim(),
      customerType,
      source: 'B',
      menu: items.map((item) => item.dish).join(' · '),
      meal: items.map((item) => item.meal).join(' + '),
      orderDate,
      orderTime,
      deliveryDate,
      deliveryTime,
      deliveryAddress: deliveryAddress.trim(),
      status: 'Đã xuất hàng',
      unitPrice: 0,
      changeRequest: note.trim() || undefined,
      dispatch: draftDispatch,
      createdAt: new Date().toISOString(),
      items,
    };
    onSave(order);
  };
  return (
    <main className="content-wrap">
       <div className="page-heading detail-heading">
          <div><Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-orders"><ArrowLeft size={14} /> Danh sách đơn hàng</Link><h1>Tạo đơn hàng thủ công</h1><p className="page-subtitle">Tự nhập đầy đủ thông tin đơn hàng, món ăn và vận chuyển.</p></div>
      </div>
       <form className="workflow-form" onSubmit={submit}>
        <section className="panel">
            <div className="panel-header"><div><h2 className="panel-heading">① Thông tin đơn hàng</h2><p className="panel-kicker">Thông tin khách hàng, thời điểm đặt và lịch giao.</p></div><span className="badge badge-source-b"><Pencil size={12} /> Tạo thủ công</span></div>
           <div className="form-grid-3">
              <div className="field"><label className="field-label" htmlFor="manual-customer-type">Loại khách hàng</label><select id="manual-customer-type" className="select" value={customerType} onChange={(event) => { const nextType = event.target.value as CustomerType; setCustomerType(nextType); setCustomerId(''); setDeliveryAddress(''); updateDispatch({ deliveryAddress: '' }); }} data-testid="select-manual-customer-type"><option>Trường học</option><option>Bệnh viện</option><option>Công ty</option><option>Khác</option></select></div>
               <div className="field form-span-2"><label className="field-label" htmlFor="manual-customer">{customerType === 'Trường học' ? 'Tên trường học' : customerType === 'Bệnh viện' ? 'Tên bệnh viện' : 'Tên khách hàng'}</label><input id="manual-customer" className="input" value={customerName} onChange={(event) => { setCustomerName(event.target.value); setCustomerId(''); }} placeholder={`Nhập ${customerType === 'Trường học' ? 'tên trường học' : customerType === 'Bệnh viện' ? 'tên bệnh viện' : 'tên khách hàng'}`} required data-testid="input-manual-customer" /></div>
             <div className="field"><label className="field-label" htmlFor="manual-date">Ngày đặt</label><input id="manual-date" type="date" className="input" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} required data-testid="input-manual-date" /></div>
             <div className="field"><label className="field-label" htmlFor="manual-time">Giờ đặt</label><input id="manual-time" type="time" className="input" value={orderTime} onChange={(event) => setOrderTime(event.target.value)} required data-testid="input-manual-time" /></div>
               <div className="field"><label className="field-label" htmlFor="manual-delivery-date">Ngày giao</label><input id="manual-delivery-date" type="date" className="input" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} required data-testid="input-manual-delivery-date" /></div>
               <div className="field"><label className="field-label" htmlFor="manual-delivery-time">Giờ giao</label><input id="manual-delivery-time" type="time" className="input" value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} required data-testid="input-manual-delivery-time" /></div>
              <div className="field form-span-2"><label className="field-label" htmlFor="manual-address">Địa chỉ giao</label><input id="manual-address" className="input" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Địa chỉ giao suất ăn" required data-testid="input-manual-address" /></div>
              <div className="field form-span-3"><label className="field-label" htmlFor="manual-note">Ghi chú</label><input id="manual-note" className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú cho đơn hàng (nếu có)" data-testid="input-manual-note" /></div>
          </div>
        </section>
          <section className="panel">
              <div className="panel-header"><div><h2 className="panel-heading">② Danh sách món</h2><p className="panel-kicker">Chọn món từ danh sách hệ thống đã lưu mẫu để đưa vào đơn xuất.</p></div><Utensils size={17} color="hsl(17 91% 52%)" /></div>
             <div className="add-dish-row"><select className="select" value={selectedDish} onChange={(event) => setSelectedDish(event.target.value)} aria-label="Chọn món đã lưu mẫu" data-testid="select-manual-dish"><option value="">Chọn món đã lưu mẫu</option>{savedSampleMenu.map((item) => <option value={item.dish} key={item.dish} disabled={items.some((selectedItem) => selectedItem.dish === item.dish)}>{item.dish}</option>)}</select><button type="button" className="button button-quiet" onClick={addDish} disabled={!selectedDish} data-testid="button-add-manual-dish"><Plus size={14} /> Thêm món</button></div>
              {items.length === 0 ? <div className="empty-state manual-dish-empty"><Utensils size={24} /><div>Chưa có món</div><span>Chọn món ở trên để thêm vào đơn hàng.</span></div> : <div className="manual-dish-list">{items.map((item) => <div className="manual-dish-item" key={item.id}><div><strong>{item.dish}</strong><span className="subtext">{item.sampleStatus === 'Đã lưu' ? 'Đã lưu mẫu' : 'Chưa lưu mẫu trong ngày'}</span></div><div className="manual-dish-meal"><label className="field-label" htmlFor={`meal-${item.id}`}>Buổi</label><select id={`meal-${item.id}`} className="select" value={mealOptionFor(item.meal)} onChange={(event) => updateDishMeal(item.id, event.target.value as MealOption)} data-testid={`select-manual-meal-${item.id}`}>{MEAL_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}</select></div><div className="manual-dish-quantity"><label className="field-label" htmlFor={`quantity-${item.id}`}>Số suất</label><div className="quantity-input"><input id={`quantity-${item.id}`} className="input" type="number" min="1" value={item.requestedQuantity} onChange={(event) => updateDishQuantity(item.id, event.target.value)} data-testid={`input-manual-quantity-${item.id}`} /><span>suất</span></div></div><div className="manual-dish-actions"><SampleStatusBadge status={item.sampleStatus} />{sampleStatus(item) === 'Đã lưu' && <button type="button" className="text-button" onClick={() => setSampleOpenId(sampleOpenId === item.id ? null : item.id)} data-testid={`button-open-manual-sample-${item.id}`}><Eye size={12} /> Xem lưu mẫu</button>}</div><button type="button" className="remove-row" onClick={() => { removeDish(item.id); if (sampleOpenId === item.id) setSampleOpenId(null); }} aria-label={`Xóa ${item.dish}`} data-testid={`button-remove-manual-dish-${item.id}`}><X size={13} /></button>{sampleOpenId === item.id && sampleStatus(item) === 'Đã lưu' && <SampleViewer item={item} deliveryDate={deliveryDate || today} onClose={() => setSampleOpenId(null)} />}</div>)}</div>}
         </section>
        <section className="panel">
              <div className="panel-header"><div><h2 className="panel-heading">③ Thông tin vận chuyển</h2><p className="panel-kicker">Nhập người giao, phương tiện và ký tên trực tiếp trên giao diện.</p></div><Truck size={17} color="hsl(17 91% 52%)" /></div>
          <div className="form-grid-3">
             <div className="field"><label className="field-label" htmlFor="manual-dispatch-exporter">Tên người giao hàng</label><input id="manual-dispatch-exporter" className="input" value={dispatch.exporterName} onChange={(event) => updateDispatch({ exporterName: event.target.value })} placeholder="Nhập họ và tên" data-testid="input-manual-dispatch-exporter" /></div>
             <div className="field"><label className="field-label" htmlFor="manual-dispatch-vehicle-type">Phương tiện</label><input id="manual-dispatch-vehicle-type" className="input" value={dispatch.vehicleType} onChange={(event) => updateDispatch({ vehicleType: event.target.value })} placeholder="Ví dụ: Xe tải lạnh" data-testid="input-manual-dispatch-vehicle-type" /></div>
             <div className="field"><label className="field-label" htmlFor="manual-dispatch-vehicle-plate">Biển số xe</label><input id="manual-dispatch-vehicle-plate" className="input" value={dispatch.vehiclePlate} onChange={(event) => updateDispatch({ vehiclePlate: event.target.value })} placeholder="51D-000.00" data-testid="input-manual-dispatch-vehicle-plate" /></div>
             <div className="field form-span-3"><span className="field-label">Chữ ký người giao hàng</span><SignaturePad value={dispatch.signature} onChange={(signature) => updateDispatch({ signature })} /></div>
          </div>
        </section>
         {formError && <div className="sample-warning dispatch-error" role="alert"><AlertCircle size={16} /><div><strong>Chưa thể tạo đơn hàng</strong><span>{formError}</span></div></div>}
         <div className="detail-actions"><button type="button" className="button button-quiet" onClick={onCancel} data-testid="button-cancel-manual-order">Hủy bỏ</button><button type="submit" className="button button-primary" disabled={items.length === 0} data-testid="button-save-manual-order"><Check size={14} /> Tạo đơn hàng</button></div>
      </form>
    </main>
  );
}

export function OrderManagement({ createSlip }: { createSlip: (input: CreateDispatchSlipInput) => string }) {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<OrderRecord[]>(() => readStorage(ORDER_STORAGE, seedOrders).map(normalizeOrder));
  const [customers] = useState<CustomerRecord[]>(() => readStorage(CUSTOMER_STORAGE, seedCustomers));
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('Tất cả nguồn');
  const [status, setStatus] = useState('Tất cả trạng thái');
  const params = useParams();
  const saveOrders = (next: OrderRecord[]) => { setOrders(next); saveStorage(ORDER_STORAGE, next); };
  const filtered = useMemo(() => orders.filter((order) => {
    const query = `${order.id} ${order.customer} ${order.menu}`.toLowerCase();
    return (!search || query.includes(search.toLowerCase())) && (source === 'Tất cả nguồn' || order.source === source) && (status === 'Tất cả trạng thái' || orderStatusLabel(order.status) === status);
  }), [orders, search, source, status]);
  const renderOrderRow = (order: OrderRecord) => {
    const exportList = order.exportItems
      ?? (order.source === 'A'
        ? order.items.filter((item) => order.exportItemIds ? order.exportItemIds.includes(item.id) : sampleStatus(item) === 'Đã lưu')
        : order.items);
    const quantity = exportList.reduce((sum, item) => sum + item.supplierQuantity, 0);
    const savedSamples = order.items.filter((item) => sampleStatus(item) === 'Đã lưu').length;
    const samplesComplete = savedSamples === order.items.length;
    const customer = customers.find((item) => item.id === order.customerId);
    return (
      <tr key={order.id} data-testid={`row-order-${order.id}`}>
        <td>
          {order.orderCode ? <>
            <Link href={`/quan-ly-don-hang/${order.id}`} className="slip-link mono" data-testid={`link-order-${order.id}`}>
              {order.orderCode}
            </Link>
          </> : null}
        </td>
        <td><span className={`badge ${order.source === 'A' ? 'badge-source-a' : 'badge-source-b'}`}>{order.source === 'A' ? <ClipboardList size={12} /> : <Pencil size={12} />}{order.source === 'A' ? 'Đặt hàng' : 'Tạo thủ công'}</span></td>
        <td><span className="type-cell">{order.customerType ?? customer?.type ?? 'Chưa cập nhật'}</span></td>
         <td><span className="customer-name">{order.customer}</span></td>
        <td><strong>{quantity}</strong><span className="subtext">suất xuất · {savedSamples}/{order.items.length} món lưu mẫu</span>{!samplesComplete && <span className="warning-note"><AlertCircle size={11} />Chưa đủ mẫu</span>}</td>
         <td><OrderStatusBadge status={order.status} /></td>
        <td><Link href={`/quan-ly-don-hang/${order.id}`} className="icon-button" aria-label={`Xem ${order.id}`} data-testid={`button-view-order-${order.id}`}><ChevronRight size={15} /></Link></td>
      </tr>
    );
  };
  if (params.id === 'moi') return <OrderForm customers={customers} onSave={(order) => {
     const nextOrder = order.source === 'B' && !order.orderCode
       ? { ...order, orderCode: batchCodeFor(order.deliveryDate, orders.filter((item) => item.deliveryDate === order.deliveryDate && item.orderCode).length + 1) }
       : order;
     saveOrders([nextOrder, ...orders]);
    setLocation(`/quan-ly-don-hang/${order.id}`);
  }} onCancel={() => setLocation('/quan-ly-don-hang')} />;
  if (params.id) {
    const selectedOrder = orders.find((item) => item.id === params.id);
    const usedBatches = orders.filter((item) => item.deliveryDate === selectedOrder?.deliveryDate && item.dispatch?.exportedAt).length;
    return <OrderDetail order={selectedOrder} customer={customers.find((item) => item.id === selectedOrder?.customerId)} batchCode={batchCodeFor(selectedOrder?.deliveryDate ?? '', usedBatches + 1)} onUpdate={(updated) => saveOrders(orders.map((item) => item.id === updated.id ? updated : item))} createSlip={createSlip} />;
  }
  return (
    <main className="content-wrap">
       <div className="page-heading"><div><p className="eyebrow">Điều phối suất ăn</p><h1>Quản lý đơn hàng</h1><p className="page-subtitle">Theo dõi đơn đặt hàng, kiểm tra lưu mẫu và xác nhận các lượt xuất suất ăn.</p></div><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang/moi')} data-testid="button-create-manual-order"><Plus size={14} /> Tạo đơn xuất hàng</button></div>
        <section className="stats-grid order-stats"><div className="stat-card primary"><div className="stat-label">Tổng đơn hàng</div><div className="stat-value" data-testid="stat-orders">{orders.length}</div><div className="stat-meta">Đơn đặt trước và đơn tạo trực tiếp</div></div><div className="stat-card"><div className="stat-label">Chờ xuất</div><div className="stat-value">{orders.filter((item) => orderStatusLabel(item.status) === 'Chờ xuất').length}</div><div className="stat-meta">Cần kiểm tra lưu mẫu và thông tin giao nhận</div></div><div className="stat-card"><div className="stat-label">Hoàn thành</div><div className="stat-value">{orders.filter((item) => orderStatusLabel(item.status) === 'Hoàn thành').length}</div><div className="stat-meta">Đã hoàn tất xuất và giao nhận</div></div></section>
        <section className="filters-panel"><div className="filter-grid order-filters"><div className="field order-search"><label className="field-label" htmlFor="order-search">Tìm kiếm</label><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'hsl(220 10% 48%)' }} /><input id="order-search" className="input" style={{ paddingLeft: 30 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, khách hàng, thực đơn..." data-testid="input-search-orders" /></div></div><div className="field"><label className="field-label" htmlFor="order-source-filter">Nguồn đơn hàng</label><select id="order-source-filter" className="select" value={source} onChange={(event) => setSource(event.target.value)} data-testid="select-filter-order-source"><option>Tất cả nguồn</option><option value="A">Đặt hàng</option><option value="B">Tạo thủ công</option></select></div><div className="field"><label className="field-label" htmlFor="order-status-filter">Trạng thái</label><select id="order-status-filter" className="select" value={status} onChange={(event) => setStatus(event.target.value)} data-testid="select-filter-order-status"><option>Tất cả trạng thái</option><option>Chờ xuất</option><option>Hoàn thành</option></select></div></div></section>
          <section className="table-card"><div className="table-toolbar"><div><h2 className="table-title">Danh sách đơn hàng</h2><span className="table-note">{filtered.length} đơn hàng hiển thị</span></div><span className="table-note">Món ăn chỉ được xuất khi đã lưu mẫu trong ngày giao</span></div><div className="table-scroll"><table className="data-table order-table"><thead><tr><th>Mã đơn hàng</th><th>Nguồn đơn hàng</th><th>Loại khách hàng</th><th>Tên khách hàng</th><th>Số lượng xuất</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><ClipboardList size={25} style={{ marginBottom: 8 }} /><div>Không có đơn hàng phù hợp</div></div></td></tr> : filtered.map(renderOrderRow)}</tbody></table></div></section>
    </main>
  );
}

const createDispatchDraft = (order?: OrderRecord, customer?: CustomerRecord, batchCode = ''): DispatchDetails => {
  const fallback: DispatchDetails = {
    exporterName: '',
    deliveryAddress: order?.deliveryAddress ?? customer?.deliveryAddress ?? '',
    receiver: '',
    signature: '',
    vehicleType: '',
    vehiclePlate: '',
    lotCode: batchCode,
    entryMode: order?.source === 'A' ? 'preorder' : 'normal',
    qrMode: 'lot',
    traceability: order ? traceabilityForItems(order.items, order.deliveryDate || today) : [],
    exportedAt: '',
  };
  return order?.dispatch ? { ...fallback, ...order.dispatch, entryMode: order.dispatch.entryMode ?? fallback.entryMode } : fallback;
};

function SampleStatusBadge({ status }: { status: OrderItem['sampleStatus'] }) {
  const normalized = status ?? 'Chưa lưu';
  const className = normalized === 'Đã lưu' ? 'badge-pass' : normalized === 'Không đạt' ? 'badge-fail' : 'badge-warn';
  return <span className={`badge ${className}`}>{normalized === 'Đã lưu' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}{normalized}</span>;
}

function SampleViewer({ item, deliveryDate, onClose }: { item: OrderItem; deliveryDate: string; onClose: () => void }) {
  const info = sampleInfoFor(item, deliveryDate);
  return <div className="sample-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="sample-viewer" role="dialog" aria-modal="true" aria-labelledby={`sample-viewer-title-${item.id}`} data-testid={`dialog-sample-viewer-${item.id}`}>
      <div className="sample-viewer-header">
        <div><p className="eyebrow">Hồ sơ lưu mẫu trong ngày</p><h2 id={`sample-viewer-title-${item.id}`}>Thông tin lưu mẫu</h2><p className="page-subtitle">{item.dish}</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Đóng thông tin lưu mẫu" data-testid={`button-close-sample-${item.id}`}><X size={16} /></button>
      </div>
      <div className="sample-viewer-scroll">
          <div className="sample-summary-card">
           <div className="sample-dish-image"><img src="/sample-mi-tron-hai-san.png" alt={`Hình minh họa ${item.dish}`} /></div>
          <div className="sample-summary-fields">
            <div><span>Trạng thái</span><strong className="sample-live-status"><CheckCircle2 size={13} /> Đã lưu mẫu</strong></div>
            <div><span>Tên thực đơn</span><strong>{item.dish}</strong></div>
            <div><span>Mã truy vết</span><strong className="mono">{info.traceCode}</strong></div>
            <div><span>Loại thực đơn</span><strong>{info.menuType}</strong></div>
            <div className="sample-description"><span>Mô tả loại thực đơn</span><strong>{info.description}</strong></div>
          </div>
        </div>
        <section className="sample-process-card">
          <div className="sample-section-heading"><div><h3>Quy trình chế biến (lưu vết)</h3><span>Thông tin chỉ xem từ hồ sơ lưu mẫu</span></div><CheckCircle2 size={18} /></div>
          <div className="sample-process-grid">
            <div><span>Đầu bếp</span><strong>{info.chef}</strong></div>
            <div><span>Mã quy trình</span><strong className="mono">{info.processCode}</strong></div>
            <div><span>Chế biến lúc</span><strong>{info.preparedAt}</strong></div>
          </div>
        </section>
        <section className="sample-ingredients">
          <div className="sample-section-heading"><div><h3>Nguyên liệu</h3><span>Danh sách nguyên liệu và lô/mẻ đã ghi nhận</span></div></div>
          <div className="sample-ingredient-table">
            <div className="sample-ingredient-row sample-ingredient-head"><span>Nguyên liệu</span><span>Nguồn cung cấp</span><span>Số lô/mẻ</span><span>Đơn vị tính</span></div>
            {info.ingredients.map((ingredient) => <div className="sample-ingredient-row" key={`${ingredient.name}-${ingredient.lotCode}`}><span>{ingredient.name}</span><span>{ingredient.supplier}</span><span className="mono">{ingredient.lotCode}</span><span>{ingredient.unit}</span></div>)}
          </div>
        </section>
      </div>
      <div className="sample-viewer-footer"><span><Eye size={14} /> Chế độ xem · Không thể chỉnh sửa hồ sơ lưu mẫu</span><button className="button button-primary" onClick={onClose} data-testid={`button-done-sample-${item.id}`}>Đóng</button></div>
    </section>
  </div>;
}

function ReplaceDishDialog({ item, alternatives, onReplace, onClose }: { item: OrderItem; alternatives: typeof dailyMenu; onReplace: (dish: string) => void; onClose: () => void }) {
  return <div className="sample-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="replace-dialog" role="dialog" aria-modal="true" aria-labelledby={`replace-title-${item.id}`} data-testid={`dialog-replace-dish-${item.id}`}>
      <div className="sample-viewer-header"><div><p className="eyebrow">Điều kiện xuất món</p><h2 id={`replace-title-${item.id}`}>Đổi món xuất</h2><p className="page-subtitle">Món hiện tại: <strong>{item.dish}</strong></p></div><button className="icon-button" onClick={onClose} aria-label="Đóng đổi món"><X size={16} /></button></div>
      <div className="replace-dialog-body"><div className="sample-warning" style={{ marginBottom: 14 }}><AlertCircle size={16} /><div><strong>Chưa lưu mẫu trong ngày</strong><span>Món hiện tại không được phép xuất. Chỉ chọn món đã lưu mẫu.</span></div></div><div className="field"><label className="field-label">Chọn món thay thế</label><div className="replace-options">{alternatives.map((alternative) => <button type="button" key={alternative.dish} className="replace-option" disabled={alternative.sampleStatus !== 'Đã lưu'} onClick={() => { onReplace(alternative.dish); onClose(); }}><span><strong>{alternative.dish}</strong><small>{alternative.sampleStatus === 'Đã lưu' ? `Đã lưu mẫu · còn ${alternative.available} suất` : 'Chưa lưu mẫu · không được xuất'}</small></span>{alternative.sampleStatus === 'Đã lưu' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</button>)}</div></div></div>
      <div className="sample-viewer-footer"><span><Eye size={14} /> Chỉ hiển thị món đáp ứng điều kiện xuất</span><button className="button button-quiet" onClick={onClose}>Hủy</button></div>
    </section>
  </div>;
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
  const [draft, setDraft] = useState<OrderRecord | undefined>(() => order
    ? order.source === 'A' && order.status !== 'Đã xuất hàng'
      ? { ...order, deliveryDate: '', deliveryTime: '' }
      : order
    : order);
  const [dispatchError, setDispatchError] = useState('');
  const [selectedExportDish, setSelectedExportDish] = useState('');
  const [sampleOpenId, setSampleOpenId] = useState<string | null>(null);
  const [dispatch, setDispatch] = useState<DispatchDetails>(() => createDispatchDraft(order, customer, batchCode));

  if (!draft) return <main className="content-wrap not-found"><div><ClipboardList size={30} color="hsl(17 91% 52%)" /><h1>Không tìm thấy đơn hàng</h1><button className="button button-primary" onClick={() => setLocation('/quan-ly-don-hang')} data-testid="button-back-orders">Về danh sách đơn hàng</button></div></main>;

  const isExported = draft.status === 'Đã xuất hàng';
  const exportItems = draft.exportItems ?? draft.items.filter((item) => (draft.exportItemIds ? draft.exportItemIds.includes(item.id) : true) && sampleStatus(item) === 'Đã lưu');
  const exportItemIds = exportItems.map((item) => item.id);
  const availableExportDishes = savedSampleMenu.filter((menuItem) => !exportItems.some((item) => item.dish === menuItem.dish));
  const totalQuantity = exportItems.reduce((sum, item) => sum + item.supplierQuantity, 0);
  const sampleItem = sampleOpenId ? draft.items.find((item) => item.id === sampleOpenId) ?? exportItems.find((item) => item.id === sampleOpenId) : undefined;
  const updateDraft = (changes: Partial<OrderRecord>) => {
    const updated = { ...draft, ...changes };
    setDraft(updated);
    onUpdate(updated);
  };
  const addExportDish = () => {
    if (isExported) return;
    const menuItem = savedSampleMenu.find((item) => item.dish === selectedExportDish);
    if (!menuItem || exportItems.some((item) => item.dish === menuItem.dish)) return;
    const newItem: OrderItem = {
      id: `export-${Date.now()}-${exportItems.length}`,
      dish: menuItem.dish,
      meal: menuItem.meal,
      requestedQuantity: 1,
      supplierQuantity: 1,
      quality: 'Đạt',
      sampleStatus: menuItem.sampleStatus,
      sampleSavedAt: '10:30',
    };
    const nextItems = [...exportItems, newItem];
    updateDraft({ exportItems: nextItems, exportItemIds: nextItems.map((item) => item.id) });
    setSelectedExportDish('');
    setDispatchError('');
  };
  const removeExportDish = (id: string) => {
    if (isExported) return;
    const nextItems = exportItems.filter((item) => item.id !== id);
    updateDraft({ exportItems: nextItems, exportItemIds: nextItems.map((item) => item.id) });
    setDispatchError('');
  };
  const updateExportMeal = (id: string, meal: MealOption) => {
    if (isExported) return;
    updateDraft({ exportItems: exportItems.map((item) => item.id === id ? { ...item, meal: `Bữa ${meal.toLowerCase()}` } : item) });
    setDispatchError('');
  };
  const updateExportQuantity = (id: string, value: string) => {
    if (isExported) return;
    const currentItem = exportItems.find((item) => item.id === id);
    if (!currentItem) return;
    const nextQuantity = Math.min(currentItem.requestedQuantity, Math.max(0, Number(value) || 0));
    updateDraft({ exportItems: exportItems.map((item) => item.id === id ? { ...item, supplierQuantity: nextQuantity } : item) });
    setDispatchError('');
  };
  const updateDispatch = (changes: Partial<DispatchDetails>) => {
    setDispatch((current) => ({ ...current, ...changes }));
    setDispatchError('');
  };
  const completeDispatch = () => {
    const missing: string[] = [];
    if (!draft.deliveryDate) missing.push('Ngày giao');
    if (!draft.deliveryTime) missing.push('Giờ giao');
    if (!dispatch.exporterName.trim()) missing.push('Tên người giao hàng');
    if (!dispatch.vehicleType.trim()) missing.push('Phương tiện');
    if (!dispatch.vehiclePlate.trim()) missing.push('Biển số xe');
    if (!dispatch.signature.trim()) missing.push('Chữ ký');
    if (missing.length) {
      setDispatchError(`Vui lòng bổ sung: ${missing.join(', ')}.`);
      return;
    }
    const orderCode = draft.orderCode ?? batchCodeFor(draft.deliveryDate, 1) ?? batchCode;
    if (draft.source === 'A' && exportItems.length === 0) {
      setDispatchError('Vui lòng chọn ít nhất một món trong Danh sách xuất.');
      return;
    }
    if (exportItems.some((item) => item.supplierQuantity < 1)) {
      setDispatchError('Vui lòng nhập số suất lớn hơn 0 cho từng món trong Danh sách xuất.');
      return;
    }
    const exportedDispatch: DispatchDetails = {
      ...dispatch,
      deliveryAddress: draft.deliveryAddress ?? customer?.deliveryAddress ?? '',
      lotCode: dispatch.lotCode || batchCode,
      traceability: traceabilityForItems(exportItems, draft.deliveryDate || today),
      exportedAt: new Date().toISOString(),
    };
    const linkedSlipId = draft.linkedSlipId ?? createSlip({
      orderCode,
      customer: draft.customer,
      date: draft.deliveryDate,
      dispatchAt: `${draft.deliveryDate}T${draft.deliveryTime}:00`,
      meal: draft.meal,
      quantity: totalQuantity,
      amount: totalQuantity * draft.unitPrice,
      status: 'Đã xuất hàng',
      sender: exportedDispatch.exporterName,
      receiver: exportedDispatch.receiver,
      vehicle: `${exportedDispatch.vehicleType} · ${exportedDispatch.vehiclePlate}`,
      lotCode: exportedDispatch.lotCode,
      ingredients: exportedDispatch.traceability.map((item) => ({ name: item.dish, origin: item.origin, lotCode: item.lotCode })),
    });
    const updated = { ...draft, orderCode, status: 'Đã xuất hàng' as OrderStatus, linkedSlipId, dispatch: exportedDispatch };
    setDispatch(exportedDispatch);
    setDraft(updated);
    onUpdate(updated);
  };

  return (
    <main className="content-wrap">
      <div className="page-heading detail-heading">
        <div>
          <Link href="/quan-ly-don-hang" className="back-link" data-testid="link-back-order-list"><ArrowLeft size={14} /> Danh sách đơn hàng</Link>
          <div className="detail-title-line"><h1>Chi tiết đơn hàng</h1><OrderStatusBadge status={draft.status} /></div>
          <p className="page-subtitle">{draft.source === 'A' ? 'Đơn đặt trước từ khách hàng' : 'Đơn tạo thủ công'} · {draft.customer}</p>
        </div>
      </div>
      <div className="order-detail-form">
        <section className="panel">
           <div className="panel-header"><div><h2 className="panel-heading">① Thông tin đơn hàng</h2><p className="panel-kicker">{draft.source === 'A' ? 'Mã đơn hàng chỉ được sinh sau khi xuất hàng.' : 'Đơn tạo thủ công đã sinh mã ngay khi hoàn tất tạo đơn.'}</p></div><SourceBadge source={draft.source} /></div>
          <div className="readonly-grid">
            <div className="readonly-field"><span className="field-label">Mã đơn hàng</span><div className="readonly-value mono">{draft.orderCode ?? 'Chưa sinh mã đơn hàng'}</div></div>
            <div className="readonly-field"><span className="field-label">Loại khách hàng</span><div className="readonly-value">{draft.customerType ?? customer?.type ?? 'Chưa cập nhật'}</div></div>
            <div className="readonly-field"><span className="field-label">Tên khách hàng</span><div className="readonly-value">{draft.customer}</div></div>
            <div className="readonly-field form-span-2"><span className="field-label">Địa chỉ</span><div className="readonly-value">{draft.deliveryAddress || customer?.deliveryAddress || 'Chưa cập nhật'}</div></div>
             <div className="readonly-field"><span className="field-label">Ngày đặt</span><div className="readonly-value">{displayDate(orderDateFor(draft))}</div></div>
             <div className="readonly-field"><span className="field-label">Giờ đặt</span><div className="readonly-value"><Clock3 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{orderTimeFor(draft)}</div></div>
             <div className="readonly-field"><span className="field-label">Tổng số suất xuất</span><div className="readonly-value">{totalQuantity} suất</div></div>
          </div>
        </section>
          {draft.source === 'A' && <section className="panel">
            <div className="table-scroll order-detail-meal-scroll"><table className="meal-table order-detail-meal-table"><thead><tr><th>Tên món ăn</th><th>{draft.source === 'A' ? 'Số lượng đặt' : 'Số lượng'}</th><th>Buổi</th></tr></thead><tbody>{draft.items.map((item) => <tr key={item.id}><td><strong>{item.dish}</strong></td><td>{draft.source === 'A' ? item.requestedQuantity : item.supplierQuantity} suất</td><td>{mealDisplay(item.meal)}</td></tr>)}</tbody></table></div>
          </section>}
          <section className="panel">
             <div className="panel-header"><div><h2 className="panel-heading">{draft.source === 'A' ? '③' : '②'} Danh sách xuất</h2><p className="panel-kicker">{draft.source === 'A' ? 'Chọn món từ danh sách hệ thống đã lưu mẫu để đưa vào phiếu xuất.' : 'Danh sách món đã xuất trong đơn thủ công.'}</p></div><Truck size={17} color="hsl(17 91% 52%)" /></div>
            <div className="add-dish-row"><select className="select" value={selectedExportDish} onChange={(event) => setSelectedExportDish(event.target.value)} aria-label="Chọn món đã lưu mẫu để xuất" disabled={isExported} data-testid="select-detail-export-dish"><option value="">Chọn món đã lưu mẫu</option>{availableExportDishes.map((item) => <option value={item.dish} key={item.dish}>{item.dish}</option>)}</select><button type="button" className="button button-quiet" onClick={addExportDish} disabled={isExported || !selectedExportDish} data-testid="button-add-detail-export-dish"><Plus size={14} /> Thêm món</button></div>
             {exportItems.length === 0 ? <div className="empty-state manual-dish-empty"><Truck size={24} /><div>Chưa có món xuất</div><span>Chọn món đã lưu mẫu ở trên để thêm vào danh sách xuất.</span></div> : <div className="manual-dish-list">{exportItems.map((item) => <div className="manual-dish-item" key={item.id}><div><strong>{item.dish}</strong><span className="subtext">Đã lưu mẫu</span></div><div className="manual-dish-meal"><label className="field-label" htmlFor={`detail-meal-${item.id}`}>Buổi</label><select id={`detail-meal-${item.id}`} className="select" value={mealOptionFor(item.meal)} onChange={(event) => updateExportMeal(item.id, event.target.value as MealOption)} disabled={isExported} data-testid={`select-detail-export-meal-${item.id}`}>{MEAL_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}</select></div><div className="manual-dish-quantity"><label className="field-label" htmlFor={`detail-quantity-${item.id}`}>Số suất</label><div className="quantity-input"><input id={`detail-quantity-${item.id}`} className="input" type="number" min="1" value={item.supplierQuantity} onChange={(event) => updateExportQuantity(item.id, event.target.value)} disabled={isExported} data-testid={`input-export-quantity-${item.id}`} /><span>suất</span></div></div><div className="manual-dish-actions"><SampleStatusBadge status={item.sampleStatus} /><button type="button" className="text-button" onClick={() => setSampleOpenId(item.id)} data-testid={`button-open-export-sample-${item.id}`}><Eye size={12} /> Xem chi tiết</button></div><button type="button" className="remove-row" onClick={() => removeExportDish(item.id)} disabled={isExported} aria-label={`Xóa ${item.dish} khỏi danh sách xuất`} data-testid={`button-remove-detail-export-dish-${item.id}`}><X size={13} /></button></div>)}</div>}
          </section>
          {sampleItem && <SampleViewer item={sampleItem} deliveryDate={draft.deliveryDate || today} onClose={() => setSampleOpenId(null)} />}
        <section className="panel">
            <div className="panel-header"><div><h2 className="panel-heading">{draft.source === 'A' ? '④' : '③'} Thông tin vận chuyển</h2><p className="panel-kicker">{draft.source === 'B' ? 'Thông tin vận chuyển đã lưu khi hoàn tất tạo đơn.' : 'Nhập thông tin giao hàng và ký tên trực tiếp trên giao diện.'}</p></div><Truck size={17} color="hsl(17 91% 52%)" /></div>
          <div className="form-grid-3">
              <div className="field"><label className="field-label" htmlFor="order-delivery-date">Ngày giao</label><input id="order-delivery-date" type="date" className="input" value={draft.deliveryDate} onChange={(event) => updateDraft({ deliveryDate: event.target.value })} disabled={isExported} required data-testid="input-order-delivery-date" /></div>
              <div className="field"><label className="field-label" htmlFor="order-delivery-time">Giờ giao</label><input id="order-delivery-time" type="time" className="input" value={draft.deliveryTime} onChange={(event) => updateDraft({ deliveryTime: event.target.value })} disabled={isExported} required data-testid="input-order-delivery-time" /></div>
              <div className="field"><label className="field-label" htmlFor="order-exporter">Tên người giao hàng</label><input id="order-exporter" className="input" value={dispatch.exporterName} onChange={(event) => updateDispatch({ exporterName: event.target.value })} placeholder="Nhập họ và tên" disabled={isExported} data-testid="input-order-exporter" /></div>
            <div className="field"><label className="field-label" htmlFor="order-vehicle">Phương tiện</label><input id="order-vehicle" className="input" value={dispatch.vehicleType} onChange={(event) => updateDispatch({ vehicleType: event.target.value })} placeholder="Ví dụ: Xe tải lạnh" disabled={isExported} data-testid="input-order-vehicle" /></div>
            <div className="field"><label className="field-label" htmlFor="order-plate">Biển số xe</label><input id="order-plate" className="input" value={dispatch.vehiclePlate} onChange={(event) => updateDispatch({ vehiclePlate: event.target.value })} placeholder="51D-000.00" disabled={isExported} data-testid="input-order-plate" /></div>
             <div className="field form-span-3"><span className="field-label">Chữ ký người giao hàng</span><SignaturePad value={dispatch.signature} onChange={(signature) => updateDispatch({ signature })} disabled={isExported} /></div>
          </div>
        </section>
        {dispatchError && <div className="sample-warning dispatch-error" role="alert"><AlertCircle size={16} /><div><strong>Chưa thể xuất hàng</strong><span>{dispatchError}</span></div></div>}
        <div className="detail-actions order-final-actions">
          <button type="button" className="button button-quiet" onClick={() => setLocation('/quan-ly-don-hang')} data-testid="button-cancel-order">Hủy bỏ</button>
          <button type="button" className="button button-primary" onClick={completeDispatch} disabled={isExported} data-testid="button-export-order"><Truck size={14} /> {isExported ? 'Đã xuất hàng' : 'Xuất hàng'}</button>
        </div>
      </div>
    </main>
  );
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
