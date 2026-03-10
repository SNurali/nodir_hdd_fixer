import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Language = 'ru' | 'en' | 'uz-cyr' | 'uz-lat';

type OrderStatus =
  | 'new'
  | 'assigned'
  | 'diagnosing'
  | 'awaiting_approval'
  | 'approved'
  | 'in_repair'
  | 'ready_for_pickup'
  | 'issued'
  | 'unrepairable'
  | 'cancelled';

type PaymentMethod =
  | 'CASH'
  | 'UZCARD'
  | 'HUMO'
  | 'VISA'
  | 'CLICK'
  | 'PAYME'
  | 'PAYNET'
  | 'UZUM'
  | 'FREE';

interface OrderDetail {
  equipment?: { name_rus?: string; name_eng?: string };
  issue?: { name_rus?: string; name_eng?: string };
  description_of_issue?: string;
  price?: number | string;
  status?: OrderStatus;
  is_completed?: boolean | number;
  master?: { full_name?: string };
}

interface PaymentRecord {
  paid_amount?: number | string;
  amount_uzs?: number | string;
  payment_type?: string;
  method?: string;
  currency?: string;
  paid_at?: string;
  created_at?: string;
}

interface LifecycleEntry {
  comments?: string;
  created_at?: string;
  creator?: { full_name?: string };
}

interface Order {
  id: string;
  status: OrderStatus;
  order_date: string;
  total_price_uzs?: number | string;
  total_paid_uzs?: number | string;
  deadline?: string;
  price_approved_at?: string | null;
  price_rejected_at?: string | null;
  client?: {
    full_name?: string;
    phone?: string;
    email?: string;
    telegram?: string;
    preferred_language?: string;
  };
  details?: OrderDetail[];
  payments?: PaymentRecord[];
  lifecycle?: LifecycleEntry[];
}

interface CurrencyReport {
  currency: string;
  amount: number;
  percentage: number;
}

interface PaymentTypeReport {
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

interface DailyRevenue {
  date: string;
  amount: number;
  count: number;
}

interface UnpaidOrder {
  id: string;
  client_name: string;
  total_amount: number;
  paid_amount: number;
  unpaid_amount: number;
  created_at: string;
  deadline: string | null;
  status: string;
}

interface FinancialReport {
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
  total_overdue: number;
  by_currency: CurrencyReport[];
  by_payment_type: PaymentTypeReport[];
  daily_revenue: DailyRevenue[];
  unpaid_orders: UnpaidOrder[];
}

interface ReportOrder {
  id: string;
  status: string;
  order_date: string;
  total_price_uzs?: number | string;
  total_paid_uzs?: number | string;
  client?: { full_name?: string };
  details?: Array<{
    equipment?: { name_rus?: string; name_eng?: string };
    master?: { full_name?: string };
  }>;
}

interface ReportDateRange {
  from?: string;
  to?: string;
}

interface ExportFinancialReportParams {
  report: FinancialReport;
  orders: ReportOrder[];
  dateRange?: ReportDateRange;
  language?: Language;
}

type Copy = {
  orderTitle: string;
  orderSubtitle: string;
  generatedAt: string;
  orderNumber: string;
  createdDate: string;
  deadline: string;
  currentStatus: string;
  client: string;
  phone: string;
  email: string;
  telegram: string;
  preferredLanguage: string;
  totalPrice: string;
  totalPaid: string;
  outstanding: string;
  approval: string;
  approved: string;
  rejected: string;
  pending: string;
  notSet: string;
  items: string;
  completedItems: string;
  assignedMaster: string;
  noData: string;
  equipmentSection: string;
  paymentsSection: string;
  lifecycleSection: string;
  itemNo: string;
  equipment: string;
  issue: string;
  description: string;
  price: string;
  itemStatus: string;
  paymentDate: string;
  paymentMethod: string;
  amount: string;
  currency: string;
  event: string;
  author: string;
  page: string;
  of: string;
  reportTitle: string;
  reportSubtitle: string;
  period: string;
  allTime: string;
  orderCount: string;
  revenue: string;
  paid: string;
  overdueDebt: string;
  statusBreakdown: string;
  mastersSection: string;
  paymentTypes: string;
  currencies: string;
  dailyRevenue: string;
  unpaidOrders: string;
  recentOrders: string;
  share: string;
  count: string;
  master: string;
  averageCheck: string;
};

const COPY_BY_LANGUAGE: Record<Language, Copy> = {
  ru: {
    orderTitle: 'Паспорт заказа',
    orderSubtitle: 'Подробная выгрузка по заказу',
    generatedAt: 'Сформировано',
    orderNumber: 'Номер заказа',
    createdDate: 'Дата создания',
    deadline: 'Срок готовности',
    currentStatus: 'Текущий статус',
    client: 'Клиент',
    phone: 'Телефон',
    email: 'Email',
    telegram: 'Telegram',
    preferredLanguage: 'Язык клиента',
    totalPrice: 'Сумма заказа',
    totalPaid: 'Оплачено',
    outstanding: 'Остаток',
    approval: 'Согласование цены',
    approved: 'Согласовано',
    rejected: 'Отклонено',
    pending: 'Ожидает решения',
    notSet: 'Не указано',
    items: 'Позиции',
    completedItems: 'Завершено',
    assignedMaster: 'Ответственный мастер',
    noData: 'Нет данных',
    equipmentSection: 'Состав работ',
    paymentsSection: 'Платежи',
    lifecycleSection: 'История изменений',
    itemNo: '№',
    equipment: 'Оборудование',
    issue: 'Проблема',
    description: 'Описание',
    price: 'Цена',
    itemStatus: 'Статус',
    paymentDate: 'Дата',
    paymentMethod: 'Метод',
    amount: 'Сумма',
    currency: 'Валюта',
    event: 'Событие',
    author: 'Автор',
    page: 'Стр.',
    of: 'из',
    reportTitle: 'Финансовый и операционный отчёт',
    reportSubtitle: 'Сводка по заказам, оплатам и задолженности',
    period: 'Период',
    allTime: 'За всё время',
    orderCount: 'Заказов',
    revenue: 'Выручка',
    paid: 'Оплачено',
    overdueDebt: 'Просроченный долг',
    statusBreakdown: 'Распределение по статусам',
    mastersSection: 'Эффективность мастеров',
    paymentTypes: 'Структура оплат',
    currencies: 'Валюты',
    dailyRevenue: 'Дневная выручка',
    unpaidOrders: 'Неоплаченные заказы',
    recentOrders: 'Последние заказы',
    share: 'Доля',
    count: 'Количество',
    master: 'Мастер',
    averageCheck: 'Средний чек',
  },
  en: {
    orderTitle: 'Order Report',
    orderSubtitle: 'Detailed order export',
    generatedAt: 'Generated',
    orderNumber: 'Order number',
    createdDate: 'Created at',
    deadline: 'Deadline',
    currentStatus: 'Current status',
    client: 'Client',
    phone: 'Phone',
    email: 'Email',
    telegram: 'Telegram',
    preferredLanguage: 'Client language',
    totalPrice: 'Order total',
    totalPaid: 'Paid',
    outstanding: 'Outstanding',
    approval: 'Price approval',
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending',
    notSet: 'Not specified',
    items: 'Items',
    completedItems: 'Completed',
    assignedMaster: 'Assigned master',
    noData: 'No data',
    equipmentSection: 'Work items',
    paymentsSection: 'Payments',
    lifecycleSection: 'Change history',
    itemNo: 'No.',
    equipment: 'Equipment',
    issue: 'Issue',
    description: 'Description',
    price: 'Price',
    itemStatus: 'Status',
    paymentDate: 'Date',
    paymentMethod: 'Method',
    amount: 'Amount',
    currency: 'Currency',
    event: 'Event',
    author: 'Author',
    page: 'Page',
    of: 'of',
    reportTitle: 'Financial and operational report',
    reportSubtitle: 'Orders, payments and debt summary',
    period: 'Period',
    allTime: 'All time',
    orderCount: 'Orders',
    revenue: 'Revenue',
    paid: 'Paid',
    overdueDebt: 'Overdue debt',
    statusBreakdown: 'Status breakdown',
    mastersSection: 'Master performance',
    paymentTypes: 'Payment structure',
    currencies: 'Currencies',
    dailyRevenue: 'Daily revenue',
    unpaidOrders: 'Unpaid orders',
    recentOrders: 'Recent orders',
    share: 'Share',
    count: 'Count',
    master: 'Master',
    averageCheck: 'Average ticket',
  },
  'uz-lat': {
    orderTitle: 'Buyurtma pasporti',
    orderSubtitle: 'Buyurtma bo‘yicha batafsil eksport',
    generatedAt: 'Yaratilgan vaqti',
    orderNumber: 'Buyurtma raqami',
    createdDate: 'Yaratilgan sana',
    deadline: 'Tayyor bo‘lish muddati',
    currentStatus: 'Joriy holat',
    client: 'Mijoz',
    phone: 'Telefon',
    email: 'Email',
    telegram: 'Telegram',
    preferredLanguage: 'Mijoz tili',
    totalPrice: 'Buyurtma summasi',
    totalPaid: 'To‘langan',
    outstanding: 'Qoldiq',
    approval: 'Narx tasdig‘i',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    pending: 'Kutilmoqda',
    notSet: 'Ko‘rsatilmagan',
    items: 'Pozitsiyalar',
    completedItems: 'Yakunlangan',
    assignedMaster: 'Mas’ul usta',
    noData: 'Ma’lumot yo‘q',
    equipmentSection: 'Ishlar tarkibi',
    paymentsSection: 'To‘lovlar',
    lifecycleSection: 'O‘zgarishlar tarixi',
    itemNo: '№',
    equipment: 'Uskuna',
    issue: 'Muammo',
    description: 'Tavsif',
    price: 'Narx',
    itemStatus: 'Holat',
    paymentDate: 'Sana',
    paymentMethod: 'Usul',
    amount: 'Summa',
    currency: 'Valyuta',
    event: 'Hodisa',
    author: 'Muallif',
    page: 'Bet',
    of: 'dan',
    reportTitle: 'Moliyaviy va operatsion hisobot',
    reportSubtitle: 'Buyurtmalar, to‘lovlar va qarzdorlik bo‘yicha yig‘ma ma’lumot',
    period: 'Davr',
    allTime: 'Butun davr',
    orderCount: 'Buyurtmalar',
    revenue: 'Tushum',
    paid: 'To‘langan',
    overdueDebt: 'Muddati o‘tgan qarz',
    statusBreakdown: 'Holatlar kesimi',
    mastersSection: 'Ustalar samaradorligi',
    paymentTypes: 'To‘lov tarkibi',
    currencies: 'Valyutalar',
    dailyRevenue: 'Kunlik tushum',
    unpaidOrders: 'To‘lanmagan buyurtmalar',
    recentOrders: 'So‘nggi buyurtmalar',
    share: 'Ulushi',
    count: 'Soni',
    master: 'Usta',
    averageCheck: 'O‘rtacha чек',
  },
  'uz-cyr': {
    orderTitle: 'Буюртма паспорти',
    orderSubtitle: 'Буюртма бўйича батафсил экспорт',
    generatedAt: 'Яратилган вақти',
    orderNumber: 'Буюртма рақами',
    createdDate: 'Яратилган сана',
    deadline: 'Тайёр бўлиш муддати',
    currentStatus: 'Жорий ҳолат',
    client: 'Мижоз',
    phone: 'Телефон',
    email: 'Email',
    telegram: 'Telegram',
    preferredLanguage: 'Мижоз тили',
    totalPrice: 'Буюртма суммаси',
    totalPaid: 'Тўланган',
    outstanding: 'Қолдиқ',
    approval: 'Нарх тасдиғи',
    approved: 'Тасдиқланган',
    rejected: 'Рад этилган',
    pending: 'Кутилмоқда',
    notSet: 'Кўрсатилмаган',
    items: 'Позициялар',
    completedItems: 'Якунланган',
    assignedMaster: 'Масъул уста',
    noData: 'Маълумот йўқ',
    equipmentSection: 'Ишлар таркиби',
    paymentsSection: 'Тўловлар',
    lifecycleSection: 'Ўзгаришлар тарихи',
    itemNo: '№',
    equipment: 'Ускуна',
    issue: 'Муаммо',
    description: 'Тавсиф',
    price: 'Нарх',
    itemStatus: 'Ҳолат',
    paymentDate: 'Сана',
    paymentMethod: 'Усул',
    amount: 'Сумма',
    currency: 'Валюта',
    event: 'Ҳодиса',
    author: 'Муаллиф',
    page: 'Бет',
    of: 'дан',
    reportTitle: 'Молиявий ва операцион ҳисобот',
    reportSubtitle: 'Буюртмалар, тўловлар ва қарздорлик бўйича йиғма маълумот',
    period: 'Давр',
    allTime: 'Бутун давр',
    orderCount: 'Буюртмалар',
    revenue: 'Тушум',
    paid: 'Тўланган',
    overdueDebt: 'Муддати ўтган қарз',
    statusBreakdown: 'Ҳолатлар кесими',
    mastersSection: 'Усталар самарадорлиги',
    paymentTypes: 'Тўлов таркиби',
    currencies: 'Валюталар',
    dailyRevenue: 'Кунлик тушум',
    unpaidOrders: 'Тўланмаган буюртмалар',
    recentOrders: 'Сўнгги буюртмалар',
    share: 'Улуши',
    count: 'Сони',
    master: 'Уста',
    averageCheck: 'Ўртача чек',
  },
};

const STATUS_LABELS: Record<Language, Record<OrderStatus, string>> = {
  ru: {
    new: 'Новый',
    assigned: 'Назначен',
    diagnosing: 'Диагностика',
    awaiting_approval: 'Ждёт одобрения',
    approved: 'Одобрен',
    in_repair: 'В ремонте',
    ready_for_pickup: 'Готов к выдаче',
    issued: 'Выдан',
    unrepairable: 'Неремонтопригоден',
    cancelled: 'Отменён',
  },
  en: {
    new: 'New',
    assigned: 'Assigned',
    diagnosing: 'Diagnosing',
    awaiting_approval: 'Awaiting approval',
    approved: 'Approved',
    in_repair: 'In repair',
    ready_for_pickup: 'Ready for pickup',
    issued: 'Issued',
    unrepairable: 'Unrepairable',
    cancelled: 'Cancelled',
  },
  'uz-lat': {
    new: 'Yangi',
    assigned: 'Tayinlangan',
    diagnosing: 'Diagnostika',
    awaiting_approval: 'Tasdiq kutilmoqda',
    approved: 'Tasdiqlangan',
    in_repair: "Ta'mirda",
    ready_for_pickup: 'Topshirishga tayyor',
    issued: 'Berilgan',
    unrepairable: "Ta'mirlab bo'lmaydi",
    cancelled: 'Bekor qilingan',
  },
  'uz-cyr': {
    new: 'Янги',
    assigned: 'Тайинланган',
    diagnosing: 'Диагностика',
    awaiting_approval: 'Тасдиқ кутилмоқда',
    approved: 'Тасдиқланган',
    in_repair: 'Таъмирда',
    ready_for_pickup: 'Топширишга тайёр',
    issued: 'Берилган',
    unrepairable: 'Таъмирлаб бўлмайди',
    cancelled: 'Бекор қилинган',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UZCARD: 'Uzcard',
  HUMO: 'Humo',
  VISA: 'Visa',
  CLICK: 'Click',
  PAYME: 'Payme',
  PAYNET: 'Paynet',
  UZUM: 'Uzum',
  FREE: 'Free',
};

const STATUS_COLORS: Record<OrderStatus, [number, number, number]> = {
  new: [59, 130, 246],
  assigned: [79, 70, 229],
  diagnosing: [245, 158, 11],
  awaiting_approval: [249, 115, 22],
  approved: [34, 197, 94],
  in_repair: [14, 165, 233],
  ready_for_pickup: [16, 185, 129],
  issued: [107, 114, 128],
  unrepairable: [239, 68, 68],
  cancelled: [148, 163, 184],
};

function resolveLanguage(language?: string): Language {
  if (language === 'ru' || language === 'en' || language === 'uz-cyr' || language === 'uz-lat') {
    return language;
  }
  return 'ru';
}

function copy(language?: string): Copy {
  return COPY_BY_LANGUAGE[resolveLanguage(language)];
}

function safeText(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function amountOf(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: unknown, currency = 'UZS'): string {
  const amount = amountOf(value);
  return `${amount.toLocaleString('en-US')} ${currency}`;
}

function formatDate(value?: string | null, locale = 'ru-RU', withTime = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? date.toLocaleString(locale)
    : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function approvalState(order: Order, lang: Language): string {
  const c = copy(lang);
  if (order.price_approved_at) return c.approved;
  if (order.price_rejected_at) return c.rejected;
  if (amountOf(order.total_price_uzs) > 0) return c.pending;
  return c.notSet;
}

function pickLocale(language: Language): string {
  if (language === 'en') return 'en-US';
  if (language === 'uz-lat') return 'uz-UZ';
  if (language === 'uz-cyr') return 'uz-Cyrl-UZ';
  return 'ru-RU';
}

function statusLabel(status: string, language: Language): string {
  const labels = STATUS_LABELS[language];
  return labels[status as OrderStatus] || safeText(status);
}

function equipmentName(detail: OrderDetail): string {
  return safeText(detail.equipment?.name_rus || detail.equipment?.name_eng, '—');
}

function issueName(detail: OrderDetail): string {
  return safeText(detail.issue?.name_rus || detail.issue?.name_eng, '—');
}

function getPrimaryMaster(order: Order): string {
  const names = Array.from(
    new Set(
      (order.details || [])
        .map((detail) => safeText(detail.master?.full_name, ''))
        .filter(Boolean),
    ),
  );
  return names[0] || '—';
}

function addFooter(doc: jsPDF, language: Language) {
  const c = copy(language);
  const totalPages =
    typeof (doc as jsPDF & { getNumberOfPages?: () => number }).getNumberOfPages === 'function'
      ? (doc as jsPDF & { getNumberOfPages: () => number }).getNumberOfPages()
      : (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${c.page} ${page} ${c.of} ${totalPages}`, 196, 290, { align: 'right' });
  }
}

function addHero(
  doc: jsPDF,
  title: string,
  subtitle: string,
  metaLabel: string,
  metaValue: string,
  color: [number, number, number],
) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(14, 14, 182, 26, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 18, 25);
  doc.setFontSize(10);
  doc.text(subtitle, 18, 33);
  doc.setFontSize(9);
  doc.text(`${metaLabel}: ${metaValue}`, 192, 25, { align: 'right' });
}

function addMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  tint: [number, number, number],
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, 20, 3, 3, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(label, x + 4, y + 7);
  doc.setTextColor(tint[0], tint[1], tint[2]);
  doc.setFontSize(12);
  doc.text(value, x + 4, y + 15);
}

function nextY(doc: jsPDF, fallback: number): number {
  return ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || fallback) + 8;
}

export async function exportOrderToPDF(order: Order, language: string = 'ru') {
  const lang = resolveLanguage(language);
  const c = copy(lang);
  const locale = pickLocale(lang);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  addHero(
    doc,
    c.orderTitle,
    c.orderSubtitle,
    c.generatedAt,
    formatDate(new Date().toISOString(), locale, true),
    STATUS_COLORS[order.status] || [37, 99, 235],
  );

  const totalPrice = amountOf(order.total_price_uzs);
  const totalPaid = amountOf(order.total_paid_uzs);
  const details = order.details || [];
  const completedItems = details.filter((detail) => Boolean(detail.is_completed) && Number(detail.is_completed) !== 2).length;

  addMetricCard(doc, 14, 47, 42, c.orderNumber, safeText(order.id.slice(0, 8).toUpperCase()), [15, 23, 42]);
  addMetricCard(doc, 60, 47, 42, c.currentStatus, statusLabel(order.status, lang), STATUS_COLORS[order.status] || [15, 23, 42]);
  addMetricCard(doc, 106, 47, 42, c.totalPrice, formatMoney(totalPrice), [22, 163, 74]);
  addMetricCard(doc, 152, 47, 44, c.outstanding, formatMoney(Math.max(0, totalPrice - totalPaid)), [220, 38, 38]);

  autoTable(doc, {
    startY: 73,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 9,
    },
    body: [
      [c.createdDate, formatDate(order.order_date, locale)],
      [c.deadline, formatDate(order.deadline || null, locale)],
      [c.client, safeText(order.client?.full_name)],
      [c.phone, safeText(order.client?.phone)],
      [c.email, safeText(order.client?.email)],
      [c.telegram, safeText(order.client?.telegram)],
      [c.preferredLanguage, safeText(order.client?.preferred_language?.toUpperCase())],
      [c.assignedMaster, getPrimaryMaster(order)],
      [c.totalPaid, formatMoney(totalPaid)],
      [c.approval, approvalState(order, lang)],
      [c.items, String(details.length)],
      [c.completedItems, String(completedItems)],
    ],
    columnStyles: {
      0: { cellWidth: 48, fillColor: [248, 250, 252], fontStyle: 'bold' },
      1: { cellWidth: 134 },
    },
    margin: { left: 14, right: 14 },
  });

  if (details.length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 120),
      head: [[c.itemNo, c.equipment, c.issue, c.description, c.master, c.itemStatus, c.price]],
      body: details.map((detail, index) => [
        String(index + 1),
        equipmentName(detail),
        issueName(detail),
        safeText(detail.description_of_issue),
        safeText(detail.master?.full_name),
        statusLabel(detail.status || order.status, lang),
        formatMoney(detail.price || 0),
      ]),
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        valign: 'top',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.equipmentSection, 14, 136);
      },
    });
  }

  if ((order.payments || []).length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 170),
      head: [[c.paymentDate, c.paymentMethod, c.amount, c.currency]],
      body: (order.payments || []).map((payment) => [
        formatDate(payment.paid_at || payment.created_at || null, locale, true),
        PAYMENT_METHOD_LABELS[payment.payment_type || payment.method || ''] || safeText(payment.payment_type || payment.method),
        formatMoney(payment.paid_amount ?? payment.amount_uzs ?? 0, payment.currency || 'UZS'),
        safeText(payment.currency || 'UZS'),
      ]),
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: 255,
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.paymentsSection, 14, 14);
      },
    });
  }

  if ((order.lifecycle || []).length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 210),
      head: [[c.paymentDate, c.event, c.author]],
      body: (order.lifecycle || []).map((entry) => [
        formatDate(entry.created_at || null, locale, true),
        safeText(entry.comments),
        safeText(entry.creator?.full_name, 'System'),
      ]),
      theme: 'striped',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 110 },
        2: { cellWidth: 35 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.lifecycleSection, 14, 14);
      },
    });
  }

  addFooter(doc, lang);
  doc.save(`order-${order.id.slice(0, 8).toUpperCase()}.pdf`);
}

export async function exportFinancialReportToPDF({
  report,
  orders,
  dateRange,
  language = 'ru',
}: ExportFinancialReportParams) {
  const lang = resolveLanguage(language);
  const c = copy(lang);
  const locale = pickLocale(lang);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const periodLabel =
    dateRange?.from || dateRange?.to
      ? `${safeText(dateRange?.from, '...')} - ${safeText(dateRange?.to, '...')}`
      : c.allTime;
  const orderCount = orders.length;
  const averageCheck = orderCount > 0 ? report.total_paid / orderCount : 0;

  addHero(
    doc,
    c.reportTitle,
    c.reportSubtitle,
    c.period,
    periodLabel,
    [15, 118, 110],
  );

  addMetricCard(doc, 14, 47, 42, c.orderCount, String(orderCount), [15, 23, 42]);
  addMetricCard(doc, 60, 47, 42, c.revenue, formatMoney(report.total_revenue), [22, 163, 74]);
  addMetricCard(doc, 106, 47, 42, c.paid, formatMoney(report.total_paid), [2, 132, 199]);
  addMetricCard(doc, 152, 47, 44, c.overdueDebt, formatMoney(report.total_overdue), [220, 38, 38]);

  autoTable(doc, {
    startY: 73,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
    },
    body: [
      [c.generatedAt, formatDate(new Date().toISOString(), locale, true)],
      [c.orderCount, String(orderCount)],
      [c.revenue, formatMoney(report.total_revenue)],
      [c.paid, formatMoney(report.total_paid)],
      [c.outstanding, formatMoney(report.total_unpaid)],
      [c.averageCheck, formatMoney(averageCheck)],
    ],
    columnStyles: {
      0: { cellWidth: 54, fillColor: [248, 250, 252], fontStyle: 'bold' },
      1: { cellWidth: 128 },
    },
    margin: { left: 14, right: 14 },
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  autoTable(doc, {
    startY: nextY(doc, 120),
    head: [[c.currentStatus, c.count, c.share]],
    body: Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => [
        statusLabel(status, lang),
        String(count),
        `${orderCount > 0 ? ((count / orderCount) * 100).toFixed(1) : '0.0'}%`,
      ]),
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(c.statusBreakdown, 14, 136);
    },
  });

  const masterStats = orders.reduce<Record<string, { count: number; amount: number }>>((acc, order) => {
    const masterName = safeText(order.details?.[0]?.master?.full_name, '');
    if (!masterName) return acc;
    if (!acc[masterName]) {
      acc[masterName] = { count: 0, amount: 0 };
    }
    acc[masterName].count += 1;
    acc[masterName].amount += amountOf(order.total_price_uzs);
    return acc;
  }, {});

  autoTable(doc, {
    startY: nextY(doc, 170),
    head: [[c.master, c.count, c.revenue]],
    body: Object.entries(masterStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([masterName, data]) => [masterName, String(data.count), formatMoney(data.amount)]),
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(c.mastersSection, 14, 14);
    },
  });

  autoTable(doc, {
    startY: nextY(doc, 210),
    head: [[c.paymentMethod, c.amount, c.count, c.share]],
    body: report.by_payment_type.map((item) => [
      safeText(PAYMENT_METHOD_LABELS[item.type] || item.type),
      formatMoney(item.amount),
      String(item.count),
      `${item.percentage.toFixed(1)}%`,
    ]),
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(c.paymentTypes, 14, 14);
    },
  });

  if (report.by_currency.length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 245),
      head: [[c.currency, c.amount, c.share]],
      body: report.by_currency.map((item) => [
        item.currency,
        formatMoney(item.amount, item.currency),
        `${item.percentage.toFixed(1)}%`,
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.currencies, 14, 14);
      },
    });
  }

  if (report.daily_revenue.length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 60),
      head: [[c.paymentDate, c.revenue, c.count]],
      body: report.daily_revenue.slice(-15).map((item) => [
        formatDate(item.date, locale),
        formatMoney(item.amount),
        String(item.count),
      ]),
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.dailyRevenue, 14, 14);
      },
    });
  }

  if (report.unpaid_orders.length > 0) {
    autoTable(doc, {
      startY: nextY(doc, 120),
      head: [[c.orderNumber, c.client, c.currentStatus, c.totalPrice, c.paid, c.outstanding, c.deadline]],
      body: report.unpaid_orders.slice(0, 15).map((item) => [
        item.id.slice(0, 8).toUpperCase(),
        safeText(item.client_name),
        statusLabel(item.status, lang),
        formatMoney(item.total_amount),
        formatMoney(item.paid_amount),
        formatMoney(item.unpaid_amount),
        formatDate(item.deadline, locale),
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.4, overflow: 'linebreak' },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(c.unpaidOrders, 14, 14);
      },
    });
  }

  autoTable(doc, {
    startY: nextY(doc, 190),
    head: [[c.orderNumber, c.createdDate, c.client, c.currentStatus, c.equipment, c.master, c.totalPrice, c.paid]],
    body: orders
      .slice()
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 15)
      .map((order) => [
        order.id.slice(0, 8).toUpperCase(),
        formatDate(order.order_date, locale),
        safeText(order.client?.full_name),
        statusLabel(order.status, lang),
        safeText(order.details?.[0]?.equipment?.name_rus || order.details?.[0]?.equipment?.name_eng),
        safeText(order.details?.[0]?.master?.full_name),
        formatMoney(order.total_price_uzs || 0),
        formatMoney(order.total_paid_uzs || 0),
      ]),
    theme: 'striped',
    styles: { fontSize: 7.8, cellPadding: 2.2, overflow: 'linebreak' },
    headStyles: { fillColor: [51, 65, 85], textColor: 255 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(c.recentOrders, 14, 14);
    },
  });

  addFooter(doc, lang);
  doc.save(`financial-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
