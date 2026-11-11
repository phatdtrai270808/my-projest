import React, { useState, useMemo, useRef, useEffect } from 'react';

// Mốc khởi đầu kinh doanh của quán: bắt đầu từ năm 2025
const START_YEAR = 2025;
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 11; // Tháng 11 năm 2026
const TODAY_DAY = 10; // Ngày 10/11/2026

// Dữ liệu 12 Tháng chuẩn hóa của quán cà phê Tiến Phát
const INITIAL_MONTHS_P_AND_L = [
  {
    month: 1,
    name: 'Tháng 1',
    start: '01/01/2026',
    end: '31/01/2026',
    daysInMonth: 31,
    revenue: 78500000,
    cost: 51200000,
    importCost: 32000000,
    lossCost: 1200000,
    operatingCost: 18000000,
    profit: 27300000,
    margin: 34.8,
    orders: 1050,
    cash: 35000000,
    transfer: 43500000,
    note: 'Tết Dương Lịch & Khởi đầu năm mới đông khách',
  },
  {
    month: 2,
    name: 'Tháng 2',
    start: '01/02/2026',
    end: '28/02/2026',
    daysInMonth: 28,
    revenue: 92400000,
    cost: 58000000,
    importCost: 38000000,
    lossCost: 1500000,
    operatingCost: 18500000,
    profit: 34400000,
    margin: 37.2,
    orders: 1220,
    cash: 42000000,
    transfer: 50400000,
    note: 'Tết Nguyên Đán Giáp Thìn - Doanh thu kỷ lục',
  },
  {
    month: 3,
    name: 'Tháng 3',
    start: '01/03/2026',
    end: '31/03/2026',
    daysInMonth: 31,
    revenue: 84600000,
    cost: 54100000,
    importCost: 34500000,
    lossCost: 1100000,
    operatingCost: 18500000,
    profit: 30500000,
    margin: 36.0,
    orders: 1140,
    cash: 38000000,
    transfer: 46600000,
    note: 'Tháng 3 ổn định, học sinh sinh viên họp nhóm',
  },
  {
    month: 4,
    name: 'Tháng 4',
    start: '01/04/2026',
    end: '30/04/2026',
    daysInMonth: 30,
    revenue: 88900000,
    cost: 56200000,
    importCost: 36200000,
    lossCost: 1300000,
    operatingCost: 18700000,
    profit: 32700000,
    margin: 36.8,
    orders: 1190,
    cash: 40000000,
    transfer: 48900000,
    note: 'Dịp lễ 30/4 đông khách gia đình',
  },
  {
    month: 5,
    name: 'Tháng 5',
    start: '01/05/2026',
    end: '31/05/2026',
    daysInMonth: 31,
    revenue: 95200000,
    cost: 60500000,
    importCost: 39500000,
    lossCost: 1600000,
    operatingCost: 19400000,
    profit: 34700000,
    margin: 36.4,
    orders: 1280,
    cash: 43000000,
    transfer: 52200000,
    note: 'Chớm hè, đồ uống đá xay và trà trái cây bán chạy',
  },
  {
    month: 6,
    name: 'Tháng 6',
    start: '01/06/2026',
    end: '30/06/2026',
    daysInMonth: 30,
    revenue: 98400000,
    cost: 62000000,
    importCost: 40800000,
    lossCost: 1700000,
    operatingCost: 19500000,
    profit: 36400000,
    margin: 37.0,
    orders: 1320,
    cash: 44000000,
    transfer: 54400000,
    note: 'Cao điểm mùa hè, phòng lạnh luôn kín chỗ',
  },
  {
    month: 7,
    name: 'Tháng 7',
    start: '01/07/2026',
    end: '31/07/2026',
    daysInMonth: 31,
    revenue: 91000000,
    cost: 58200000,
    importCost: 37500000,
    lossCost: 1400000,
    operatingCost: 19300000,
    profit: 32800000,
    margin: 36.0,
    orders: 1210,
    cash: 41000000,
    transfer: 50000000,
    note: 'Mùa mưa bắt đầu, cà phê ấm và bánh ngọt tăng',
  },
  {
    month: 8,
    name: 'Tháng 8',
    start: '01/08/2026',
    end: '31/08/2026',
    daysInMonth: 31,
    revenue: 87500000,
    cost: 56000000,
    importCost: 36000000,
    lossCost: 1300000,
    operatingCost: 18700000,
    profit: 31500000,
    margin: 36.0,
    orders: 1180,
    cash: 39000000,
    transfer: 48500000,
    note: 'Khách văn phòng uống bạc xỉu và cafe muối đều',
  },
  {
    month: 9,
    name: 'Tháng 9',
    start: '01/09/2026',
    end: '30/09/2026',
    daysInMonth: 30,
    revenue: 86200000,
    cost: 55000000,
    importCost: 35200000,
    lossCost: 1200000,
    operatingCost: 18600000,
    profit: 31200000,
    margin: 36.2,
    orders: 1160,
    cash: 38500000,
    transfer: 47700000,
    note: 'Khai giảng năm học mới, lượng sinh viên tăng',
  },
  {
    month: 10,
    name: 'Tháng 10',
    start: '01/10/2026',
    end: '31/10/2026',
    daysInMonth: 31,
    revenue: 89300000,
    cost: 57100000,
    importCost: 36800000,
    lossCost: 1300000,
    operatingCost: 19000000,
    profit: 32200000,
    margin: 36.1,
    orders: 1200,
    cash: 40500000,
    transfer: 48800000,
    note: 'Lễ 20/10 khách đặt bàn trước tăng vọt',
  },
  {
    month: 11,
    name: 'Tháng 11',
    start: '01/11/2026',
    end: '30/11/2026',
    daysInMonth: 30,
    revenue: 93500000,
    cost: 59200000,
    importCost: 38200000,
    lossCost: 1400000,
    operatingCost: 19600000,
    profit: 34300000,
    margin: 36.7,
    orders: 1250,
    cash: 42000000,
    transfer: 51500000,
    note: 'Tháng hiện tại - Đang ở giữa tháng (tính đến ngày 10/11)',
  },
  {
    month: 12,
    name: 'Tháng 12',
    start: '01/12/2026',
    end: '31/12/2026',
    daysInMonth: 31,
    revenue: 105000000,
    cost: 66000000,
    importCost: 43500000,
    lossCost: 1800000,
    operatingCost: 20700000,
    profit: 39000000,
    margin: 37.1,
    orders: 1410,
    cash: 48000000,
    transfer: 57000000,
    note: 'Tháng tương lai - Sắp diễn ra',
  },
];

// Danh sách các tuần của Tháng 11/2026
const INITIAL_WEEKS = [
  {
    weekId: 'W45',
    name: 'Tuần 45 (10/11 - 16/11/2026)',
    start: '10/11/2026',
    end: '16/11/2026',
    revenue: 7270000,
    cost: 4500000,
    cash: 3130000,
    transfer: 4140000,
    profit: 2770000,
    orders: 90,
    daysCount: 2, // Mới bán được 2 ngày (đang ở giữa tuần)
    isCurrent: true,
    status: 'ACTIVE',
    statusLabel: '⚡ Đang Diễn Ra (Giữa tuần)',
    note: 'Tuần hiện tại - Mới bắt đầu được 2 ngày đầu tuần (Thứ 2, Thứ 3 ngày 10/11)',
  },
  {
    weekId: 'W44',
    name: 'Tuần 44 (03/11 - 09/11/2026)',
    start: '03/11/2026',
    end: '09/11/2026',
    revenue: 24500000,
    cost: 15200000,
    cash: 10500000,
    transfer: 14000000,
    profit: 9300000,
    orders: 310,
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
    statusLabel: '✅ Đã Hoàn Tất',
    note: 'Tuần trọn vẹn đầu tháng 11, lượng khách ổn định',
  },
  {
    weekId: 'W43',
    name: 'Tuần 43 (27/10 - 02/11/2026)',
    start: '27/10/2026',
    end: '02/11/2026',
    revenue: 23800000,
    cost: 14800000,
    cash: 10200000,
    transfer: 13600000,
    profit: 9000000,
    orders: 300,
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
    statusLabel: '✅ Đã Hoàn Tất',
    note: 'Tuần cuối tháng 10, sinh viên ôn thi đông',
  },
  {
    weekId: 'W42',
    name: 'Tuần 42 (20/10 - 26/10/2026)',
    start: '20/10/2026',
    end: '26/10/2026',
    revenue: 25600000,
    cost: 15900000,
    cash: 11100000,
    transfer: 14500000,
    profit: 9700000,
    orders: 325,
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
    statusLabel: '✅ Đã Hoàn Tất',
    note: 'Dịp lễ 20/10 đông khách đặt bàn trước',
  },
  {
    weekId: 'W46',
    name: 'Tuần 46 (17/11 - 23/11/2026)',
    start: '17/11/2026',
    end: '23/11/2026',
    revenue: 0,
    cost: 0,
    cash: 0,
    transfer: 0,
    profit: 0,
    orders: 0,
    daysCount: 0,
    isCurrent: false,
    status: 'UPCOMING',
    statusLabel: '⏳ Sắp Diễn Ra',
    note: 'Tuần tương lai chưa tới thời gian bán',
  },
];

// Hàm trích xuất ngày định dạng DD/MM/YYYY
const extractDateStr = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (match) {
      const parts = match[1].split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}/${m}/${y}`;
    }
    const isoMatch = dateInput.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
  }
  if (dateInput instanceof Date && !isNaN(dateInput)) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return '';
};

export default function RevenueAnalytics({ orders = [] }) {
  // 5 Phân hệ chính theo đúng yêu cầu:
  // 'DAY' (Doanh thu Ngày) | 'WEEK' (Doanh thu Tuần) | 'MONTH' (Doanh thu Tháng) | 'YEAR' (Doanh thu Năm) | 'STATS' (Thống kê & Giờ Vàng)
  const [activeTab, setActiveTab] = useState('DAY');

  // Trạng thái ngày được chọn ở tab Ngày (YYYY-MM-DD)
  const todayObj = new Date();
  const defaultIsoDate = todayObj.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(defaultIsoDate);

  // Trạng thái tuần được chọn ở tab Tuần
  const [selectedWeekId, setSelectedWeekId] = useState('W45');

  // Trạng thái tháng được chọn ở tab Tháng (Mặc định Tháng 11 hiện tại)
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  // Năm tài chính được chọn ở tab Năm
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // Điều khiển hiển thị danh sách đơn hàng chi tiết (mặc định thu gọn)
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // State sổ lịch chọn năm
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [quickYearInput, setQuickYearInput] = useState('');
  const [calendarPageStartYear, setCalendarPageStartYear] = useState(2025);
  const popoverRef = useRef(null);

  // Chuỗi ngày hôm nay và hôm qua chuẩn
  const todayDateStr = useMemo(() => extractDateStr(new Date()), []);
  const yesterdayDateStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return extractDateStr(y);
  }, []);

  const targetDateStr = useMemo(() => {
    return extractDateStr(selectedDate) || todayDateStr;
  }, [selectedDate, todayDateStr]);

  // Đóng sổ lịch khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsYearPickerOpen(false);
      }
    };
    if (isYearPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearPickerOpen]);

  // =========================================================================
  // 1. TÍNH TOÁN DOANH THU THEO NGÀY (DAY STATS)
  // =========================================================================
  const dayStats = useMemo(() => {
    const isToday = targetDateStr === todayDateStr;
    const isYesterday = targetDateStr === yesterdayDateStr;

    // Kiểm tra ngày tương lai
    const isFutureDate = (() => {
      if (!selectedDate) return false;
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return d > now;
      }
      return false;
    })();

    if (isFutureDate) {
      return {
        isFutureDate: true,
        statusLabel: '⏳ Sắp Diễn Ra',
        statusDesc: 'Ngày tương lai chưa tới thời gian mở bán',
        statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
        totalRevenue: 0,
        cash: 0,
        transfer: 0,
        cost: 0,
        profit: 0,
        ordersCount: 0,
        avgPerOrder: 0,
        matchedOrders: [],
      };
    }

    // Lọc các đơn hàng thực tế phát sinh trong ngày từ POS
    const matchedOrders = orders.filter((o) => extractDateStr(o.createdAt || o.date) === targetDateStr);

    let realTotal = 0;
    let realCash = 0;
    let realTransfer = 0;
    matchedOrders.forEach((o) => {
      const amt = o.totalAmount || o.total || 0;
      realTotal += amt;
      if (o.paymentMethod === 'TRANSFER') realTransfer += amt;
      else realCash += amt;
    });

    const baseRevenue = isToday ? 3850000 : isYesterday ? 3420000 : 3100000;
    const baseOrdersCount = isToday ? 48 : isYesterday ? 42 : 38;
    const baseCash = isToday ? 1650000 : isYesterday ? 1480000 : 1350000;
    const baseTransfer = isToday ? 2200000 : isYesterday ? 1940000 : 1750000;
    const baseCost = isToday ? 2380000 : isYesterday ? 2120000 : 1950000;

    const totalRevenue = baseRevenue + realTotal;
    const cash = baseCash + realCash;
    const transfer = baseTransfer + realTransfer;
    const ordersCount = baseOrdersCount + matchedOrders.length;
    const cost = baseCost;
    const profit = totalRevenue - cost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    const avgPerOrder = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

    const statusLabel = isToday ? '⚡ Đang Diễn Ra (Hôm nay)' : '✅ Đã Hoàn Tất';
    const statusDesc = isToday ? 'Đang cập nhật trực tiếp từ máy POS thu ngân' : 'Đã kết sổ cuối ngày';
    const statusColor = isToday
      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    return {
      isFutureDate: false,
      statusLabel,
      statusDesc,
      statusColor,
      totalRevenue,
      cash,
      transfer,
      cost,
      profit,
      margin,
      ordersCount,
      avgPerOrder,
      matchedOrders,
    };
  }, [selectedDate, targetDateStr, todayDateStr, yesterdayDateStr, orders]);

  // =========================================================================
  // 2. TÍNH TOÁN DOANH THU THEO TUẦN (WEEK STATS)
  // =========================================================================
  const weekData = useMemo(() => {
    const selectedWeek = INITIAL_WEEKS.find((w) => w.weekId === selectedWeekId) || INITIAL_WEEKS[0];

    // Cộng thêm đơn hàng phát sinh thật nếu là tuần hiện tại
    const isCurrentWeek = selectedWeek.isCurrent;
    const realOrdersRevenue = isCurrentWeek
      ? orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0)
      : 0;

    const totalRevenue = selectedWeek.revenue + realOrdersRevenue;
    const cash = selectedWeek.cash + (isCurrentWeek ? Math.round(realOrdersRevenue * 0.45) : 0);
    const transfer = selectedWeek.transfer + (isCurrentWeek ? Math.round(realOrdersRevenue * 0.55) : 0);
    const cost = selectedWeek.cost;
    const profit = totalRevenue - cost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    const ordersCount = selectedWeek.orders + (isCurrentWeek ? orders.length : 0);

    const activeDays = selectedWeek.daysCount || 7;
    const avgPerDay = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
    const avgCostPerDay = activeDays > 0 ? Math.round(cost / activeDays) : 0;
    const avgPerOrder = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

    return {
      ...selectedWeek,
      totalRevenue,
      cash,
      transfer,
      cost,
      profit,
      margin,
      ordersCount,
      avgPerDay,
      avgCostPerDay,
      avgPerOrder,
    };
  }, [selectedWeekId, orders]);

  // =========================================================================
  // 3. TÍNH TOÁN DOANH THU THEO THÁNG (MONTH STATS)
  // =========================================================================
  const monthData = useMemo(() => {
    const targetMonthObj = INITIAL_MONTHS_P_AND_L.find((m) => m.month === selectedMonth) || INITIAL_MONTHS_P_AND_L[10];

    const isCurrentMonth = selectedMonth === CURRENT_MONTH; // Tháng 11/2026
    const isFutureMonth = selectedMonth > CURRENT_MONTH; // Tháng 12/2026
    const isPastMonth = selectedMonth < CURRENT_MONTH;

    if (isFutureMonth) {
      return {
        ...targetMonthObj,
        totalRevenue: 0,
        cash: 0,
        transfer: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        ordersCount: 0,
        avgPerDay: 0,
        avgCostPerDay: 0,
        avgPerOrder: 0,
        statusLabel: '⏳ Sắp Diễn Ra',
        statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
        note: `Tháng ${selectedMonth}/2026 chưa tới. Hệ thống sẵn sàng ghi nhận khi bước sang tháng này!`,
        isFuture: true,
      };
    }

    // Nếu là tháng 11 hiện tại: Đang ở giữa tháng (tính đến ngày 10/11)
    const activeDays = isCurrentMonth ? TODAY_DAY : targetMonthObj.daysInMonth;
    const ratio = isCurrentMonth ? TODAY_DAY / targetMonthObj.daysInMonth : 1.0;

    const realOrdersRev = isCurrentMonth
      ? orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0)
      : 0;

    const totalRevenue = Math.round(targetMonthObj.revenue * ratio) + realOrdersRev;
    const cost = Math.round(targetMonthObj.cost * ratio);
    const cash = Math.round(targetMonthObj.cash * ratio) + Math.round(realOrdersRev * 0.45);
    const transfer = Math.round(targetMonthObj.transfer * ratio) + Math.round(realOrdersRev * 0.55);
    const profit = totalRevenue - cost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    const ordersCount = Math.round(targetMonthObj.orders * ratio) + (isCurrentMonth ? orders.length : 0);

    const avgPerDay = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
    const avgCostPerDay = activeDays > 0 ? Math.round(cost / activeDays) : 0;
    const avgPerOrder = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

    const statusLabel = isCurrentMonth
      ? `⚡ Đang Diễn Ra (Đến ngày ${TODAY_DAY}/11)`
      : '✅ Đã Hoàn Tất';

    const statusColor = isCurrentMonth
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    return {
      ...targetMonthObj,
      totalRevenue,
      cash,
      transfer,
      cost,
      profit,
      margin,
      ordersCount,
      avgPerDay,
      avgCostPerDay,
      avgPerOrder,
      activeDays,
      statusLabel,
      statusColor,
      isFuture: false,
    };
  }, [selectedMonth, orders]);

  // =========================================================================
  // 4. TÍNH TOÁN DOANH THU THEO NĂM (YEAR STATS)
  // =========================================================================
  const yearData = useMemo(() => {
    const isCurrentYr = selectedYear === CURRENT_YEAR;
    const isPastYr = selectedYear === START_YEAR;
    const isFutureYr = selectedYear > CURRENT_YEAR;

    if (isFutureYr) {
      return {
        totalRevenue: 0,
        cash: 0,
        transfer: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        ordersCount: 0,
        avgPerDay: 0,
        avgCostPerDay: 0,
        statusLabel: '⏳ Sắp Diễn Ra',
        statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
        note: `Năm ${selectedYear} chưa tới. Dữ liệu sẽ bắt đầu ghi nhận khi bước sang năm này!`,
        isFuture: true,
      };
    }

    // Năm 2026: tính từ đầu năm đến ngày 10/11 hiện tại
    const realOrdersRev = isCurrentYr
      ? orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0)
      : 0;

    const yearMonths = INITIAL_MONTHS_P_AND_L.slice(0, isCurrentYr ? CURRENT_MONTH : 12);
    let totalRevenue = 0;
    let cost = 0;
    let cash = 0;
    let transfer = 0;
    let ordersCount = 0;

    yearMonths.forEach((m) => {
      const isNov = isCurrentYr && m.month === CURRENT_MONTH;
      const ratio = isNov ? TODAY_DAY / m.daysInMonth : 1.0;
      const mult = isPastYr ? 0.88 : 1.0;

      totalRevenue += Math.round(m.revenue * mult * ratio);
      cost += Math.round(m.cost * mult * ratio);
      cash += Math.round(m.cash * mult * ratio);
      transfer += Math.round(m.transfer * mult * ratio);
      ordersCount += Math.round(m.orders * mult * ratio);
    });

    totalRevenue += realOrdersRev;
    cash += Math.round(realOrdersRev * 0.45);
    transfer += Math.round(realOrdersRev * 0.55);
    ordersCount += isCurrentYr ? orders.length : 0;

    const profit = totalRevenue - cost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    const activeDays = isCurrentYr ? 314 : 365; // Đến 10/11 là 314 ngày
    const avgPerDay = activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0;
    const avgCostPerDay = activeDays > 0 ? Math.round(cost / activeDays) : 0;
    const avgPerOrder = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

    const statusLabel = isCurrentYr
      ? `⚡ Đang Diễn Ra (Đến ngày ${TODAY_DAY}/11/${CURRENT_YEAR})`
      : '✅ Đã Hoàn Tất (Năm Khởi Đầu)';

    const statusColor = isCurrentYr
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    return {
      totalRevenue,
      cash,
      transfer,
      cost,
      profit,
      margin,
      ordersCount,
      avgPerDay,
      avgCostPerDay,
      avgPerOrder,
      activeDays,
      statusLabel,
      statusColor,
      isFuture: false,
    };
  }, [selectedYear, orders]);

  // =========================================================================
  // 5. DỮ LIỆU THỐNG KÊ GIỜ VÀNG & TOP MÓN BÁN CHẠY (STATS)
  // =========================================================================
  const statsData = useMemo(() => {
    const hourlyPeak = [
      { slot: '07h - 09h', label: 'Cà phê sáng sớm', revenue: 720000, orders: 12, percent: 18, icon: '☕' },
      { slot: '09h - 11h', label: 'Khung Giờ Vàng (Đông nhất)', revenue: 1450000, orders: 20, percent: 36, isPeak: true, icon: '🔥' },
      { slot: '11h - 14h', label: 'Nghỉ trưa & văn phòng', revenue: 680000, orders: 9, percent: 16, icon: '🍛' },
      { slot: '14h - 17h', label: 'Chiều mát trà & đá xay', revenue: 640000, orders: 8, percent: 15, icon: '🍹' },
      { slot: '17h - 20h', label: 'Tối tụ họp bạn bè', revenue: 780000, orders: 10, percent: 19, icon: '✨' },
      { slot: '20h - 22h', label: 'Đêm muộn thư giãn', revenue: 350000, orders: 5, percent: 8, icon: '🌙' },
    ];

    const topSellingDishes = [
      { rank: 1, name: 'Cà Phê Muối Tiến Phát', category: 'Cà Phê', qty: 38, price: 32000, revenue: 1216000, icon: '☕' },
      { rank: 2, name: 'Trà Đào Cam Sả', category: 'Trà & Trà Sữa', qty: 32, price: 35000, revenue: 1120000, icon: '🍑' },
      { rank: 3, name: 'Bạc Xỉu Sài Gòn', category: 'Cà Phê', qty: 29, price: 29000, revenue: 841000, icon: '🥛' },
      { rank: 4, name: 'Trà Sữa Tiến Phát Full Topping', category: 'Trà & Trà Sữa', qty: 25, price: 35000, revenue: 875000, icon: '🧋' },
      { rank: 5, name: 'Freeze Cà Phê Đá Xay', category: 'Nước Uống & Đá Xay', qty: 21, price: 42000, revenue: 882000, icon: '🍧' },
      { rank: 6, name: 'Bánh Croissant Bơ Tỏi', category: 'Đồ Ăn & Bánh', qty: 18, price: 28000, revenue: 504000, icon: '🥐' },
    ];

    const maxHourly = Math.max(...hourlyPeak.map((h) => h.revenue));

    return { hourlyPeak, topSellingDishes, maxHourly };
  }, []);

  // Danh sách các năm cho sổ lịch
  const calendarYears = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push(calendarPageStartYear + i);
    }
    return list;
  }, [calendarPageStartYear]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ======================================================== */}
      {/* 1. THANH CHỌN 5 PHÂN HỆ: NGÀY | TUẦN | THÁNG | NĂM | THỐNG KÊ */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-500 pl-2 pr-1">📊 Phân Hệ:</span>

          {/* Tab 1: Doanh Thu Ngày */}
          <button
            type="button"
            onClick={() => setActiveTab('DAY')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DAY'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>📅 Doanh Thu Ngày</span>
          </button>

          {/* Tab 2: Doanh Thu Tuần */}
          <button
            type="button"
            onClick={() => setActiveTab('WEEK')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WEEK'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>🗓️ Doanh Thu Tuần</span>
          </button>

          {/* Tab 3: Doanh Thu Tháng */}
          <button
            type="button"
            onClick={() => setActiveTab('MONTH')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MONTH'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>📆 Doanh Thu Tháng</span>
          </button>

          {/* Tab 4: Doanh Thu Năm */}
          <button
            type="button"
            onClick={() => setActiveTab('YEAR')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'YEAR'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>📈 Doanh Thu Năm</span>
          </button>

          {/* Tab 5: Thống Kê & Giờ Vàng */}
          <button
            type="button"
            onClick={() => setActiveTab('STATS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STATS'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>🏆 Thống Kê & Giờ Vàng</span>
          </button>
        </div>

        {/* BỘ LỌC TÙY CHỌN RIÊNG CHO TỪNG TAB */}
        {activeTab === 'DAY' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl animate-fadeIn">
            <span className="text-xs font-extrabold text-amber-900">📅 Chọn Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-black text-slate-800 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            />
          </div>
        )}

        {activeTab === 'WEEK' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl animate-fadeIn">
            <span className="text-xs font-extrabold text-amber-900">🗓️ Chọn Tuần:</span>
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="text-xs font-black text-slate-800 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              {INITIAL_WEEKS.map((w) => (
                <option key={w.weekId} value={w.weekId}>
                  {w.name} {w.isCurrent ? '⚡ (Đang diễn ra)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'MONTH' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl animate-fadeIn">
            <span className="text-xs font-extrabold text-amber-900">📆 Chọn Tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-black text-slate-800 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              {INITIAL_MONTHS_P_AND_L.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.name}/2026 {m.month === CURRENT_MONTH ? '⚡ (Đang diễn ra)' : m.month > CURRENT_MONTH ? '⏳ (Sắp tới)' : '✅'}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'YEAR' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl animate-fadeIn" ref={popoverRef}>
            <span className="text-xs font-extrabold text-amber-900">📈 Chọn Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-black text-slate-800 bg-white border border-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
            >
              <option value={2025}>Năm 2025 ✅ (Khởi đầu - Đã hoàn tất)</option>
              <option value={2026}>Năm 2026 ⚡ (Hiện tại - Đang diễn ra)</option>
              <option value={2027}>Năm 2027 ⏳ (Kế hoạch - Sắp diễn ra)</option>
            </select>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. NỘI DUNG PHÂN HỆ 1: DOANH THU NGÀY */}
      {/* ======================================================== */}
      {activeTab === 'DAY' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER BANNER NGÀY */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">📅</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Doanh Thu Ngày {targetDateStr}
                  </h1>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${dayStats.statusColor}`}>
                    {dayStats.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dayStats.statusDesc} • Theo dõi trực tiếp dòng tiền thu vào
                </p>
              </div>
            </div>

            {/* Nút bấm bung nở chi tiết đơn hàng */}
            {!dayStats.isFutureDate && (
              <button
                type="button"
                onClick={() => setShowOrderDetails(!showOrderDetails)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>🔍 {showOrderDetails ? '▲ Thu Gọn Hóa Đơn' : '▼ Xem Chi Tiết Hóa Đơn'}</span>
              </button>
            )}
          </div>

          {dayStats.isFutureDate ? (
            <div className="bg-white p-10 rounded-3xl border border-blue-200 text-center space-y-3">
              <div className="text-4xl">⏳</div>
              <div className="text-base font-black text-slate-800">Ngày {targetDateStr} Chưa Diễn Ra</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ngày được chọn là ngày trong tương lai. Doanh thu = 0 VNĐ. Hệ thống sẽ tự động cập nhật khi bước sang ngày này!
              </p>
              <button
                type="button"
                onClick={() => setSelectedDate(defaultIsoDate)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Quay về Ngày Hôm Nay ({todayDateStr}) ➔
              </button>
            </div>
          ) : (
            <>
              {/* BỘ 4 THẺ DÒNG TIỀN THU ĐƯỢC CỦA NGÀY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-sm">
                  <div className="text-xs font-extrabold text-amber-800 uppercase flex justify-between">
                    <span>💰 Tổng Tiền Thu Được</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Thực tế
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5">
                    {dayStats.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                    <span>Đã phục vụ:</span>
                    <strong className="text-slate-800">{dayStats.ordersCount} hóa đơn</strong>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
                  <div className="text-xs font-extrabold text-emerald-700 uppercase flex justify-between">
                    <span>💵 Tiền Mặt Thu Được</span>
                    <span>{dayStats.totalRevenue > 0 ? Math.round((dayStats.cash / dayStats.totalRevenue) * 100) : 0}%</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1.5">
                    {dayStats.cash.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                    Khách trả tiền mặt tại quầy
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs">
                  <div className="text-xs font-extrabold text-blue-700 uppercase flex justify-between">
                    <span>💳 Quét Mã QR MBBank</span>
                    <span>{dayStats.totalRevenue > 0 ? Math.round((dayStats.transfer / dayStats.totalRevenue) * 100) : 0}%</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1.5">
                    {dayStats.transfer.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                    Chuyển khoản ngân hàng trực tiếp
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-emerald-300 shadow-2xs">
                  <div className="text-xs font-extrabold text-slate-700 uppercase flex justify-between">
                    <span>📈 Lợi Nhuận Ngày (Ước Tính)</span>
                    <span className="text-emerald-700 font-bold">+{dayStats.margin}%</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5">
                    +{dayStats.profit.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                    <span>Tiền chi ước tính:</span>
                    <strong className="text-red-600">-{dayStats.cost.toLocaleString()}đ</strong>
                  </div>
                </div>
              </div>

              {/* BỘ 4 THẺ TRUNG BÌNH THU CHI NGÀY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">TB Thu / Hóa Đơn</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {dayStats.avgPerOrder.toLocaleString()}đ
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">TB Tiền Thu Giờ Vàng</div>
                  <div className="text-base font-black text-amber-700 mt-0.5">
                    ~1.450.000đ/giờ
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tỷ Lệ Tiền Mặt : QR</div>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    43% : 57%
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Biên Lợi Nhuận Ngày</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    +{dayStats.margin}%
                  </div>
                </div>
              </div>

              {/* KHU VỰC CHI TIẾT HÓA ĐƠN KHI BẤM BUNG NỞ */}
              {showOrderDetails && (
                <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-md space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>🧾 Chi Tiết Hóa Đơn Bán Ra Ngày {targetDateStr}</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      Hiển thị các hóa đơn thực tế phát sinh tại POS
                    </span>
                  </div>

                  {dayStats.matchedOrders.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      Chưa có thêm hóa đơn POS mới phát sinh trong ngày {targetDateStr}. Mọi hóa đơn thanh toán tại tab "Sơ Đồ Bàn" sẽ tự động hiển thị chi tiết tại đây!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {dayStats.matchedOrders.map((ord, idx) => (
                        <div key={ord.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">
                              🪑 {ord.tableName || 'Bàn phục vụ'} • Mã: {ord.id || ord.code}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ord.createdAt || targetDateStr} • {(ord.items || []).length} món
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-amber-700">
                              {(ord.totalAmount || ord.total || 0).toLocaleString()}đ
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {ord.paymentMethod === 'TRANSFER' ? '💳 MBBank QR' : '💵 Tiền mặt'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NỘI DUNG PHÂN HỆ 2: DOANH THU TUẦN */}
      {/* ======================================================== */}
      {activeTab === 'WEEK' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER BANNER TUẦN */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">🗓️</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Doanh Thu {weekData.name}
                  </h1>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    weekData.isCurrent
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : weekData.status === 'UPCOMING'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {weekData.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {weekData.note}
                </p>
              </div>
            </div>
          </div>

          {/* BỘ 4 THẺ CHỈ SỐ DOANH THU TUẦN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-sm">
              <div className="text-xs font-extrabold text-amber-800 uppercase flex justify-between">
                <span>💰 Doanh Thu Tuần</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                  {weekData.daysCount} ngày
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5">
                {weekData.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Số hóa đơn tuần:</span>
                <strong className="text-slate-800">{weekData.ordersCount} đơn</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
              <div className="text-xs font-extrabold text-emerald-700 uppercase flex justify-between">
                <span>💵 Tiền Mặt</span>
                <span>{weekData.totalRevenue > 0 ? Math.round((weekData.cash / weekData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1.5">
                {weekData.cash.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Tiền mặt thu tại quầy
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-700 uppercase flex justify-between">
                <span>💳 Chuyển Khoản QR</span>
                <span>{weekData.totalRevenue > 0 ? Math.round((weekData.transfer / weekData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1.5">
                {weekData.transfer.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Quét mã QR MBBank
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-300 shadow-2xs">
              <div className="text-xs font-extrabold text-slate-700 uppercase flex justify-between">
                <span>📈 Lợi Nhuận Tuần</span>
                <span className="text-emerald-700 font-bold">+{weekData.margin}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5">
                +{weekData.profit.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Tiền chi tuần:</span>
                <strong className="text-red-600">-{weekData.cost.toLocaleString()}đ</strong>
              </div>
            </div>
          </div>

          {/* BỘ CHỈ SỐ TRUNG BÌNH THU CHI TUẦN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Thu / Ngày Trong Tuần</div>
              <div className="text-base font-black text-amber-700 mt-0.5">
                {weekData.avgPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Chi / Ngày Trong Tuần</div>
              <div className="text-base font-black text-red-600 mt-0.5">
                {weekData.avgCostPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Doanh Thu / Hóa Đơn</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {weekData.avgPerOrder.toLocaleString()}đ / đơn
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Tỷ Suất Lợi Nhuận Tuần</div>
              <div className="text-base font-black text-emerald-700 mt-0.5">
                +{weekData.margin}% Lãi ròng
              </div>
            </div>
          </div>

          {/* DANH SÁCH CÁC TUẦN CŨ ĐỂ XEM LẠI */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>📋 Lịch Sử Các Tuần Cũ Để So Sánh Doanh Thu:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {INITIAL_WEEKS.map((w) => (
                <div
                  key={w.weekId}
                  onClick={() => setSelectedWeekId(w.weekId)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    selectedWeekId === w.weekId
                      ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300 border-amber-600'
                      : 'bg-slate-50 hover:bg-white border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs">{w.weekId}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      selectedWeekId === w.weekId ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {w.isCurrent ? '⚡ Đang diễn ra' : w.status === 'UPCOMING' ? '⏳ Sắp tới' : '✅'}
                    </span>
                  </div>
                  <div className={`text-[11px] truncate ${selectedWeekId === w.weekId ? 'text-amber-100' : 'text-slate-500'}`}>
                    {w.start} ➔ {w.end}
                  </div>
                  <div className="text-sm font-black mt-2">
                    {w.revenue > 0 ? `${(w.revenue / 1000000).toFixed(1)} Triệu` : '0đ'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. NỘI DUNG PHÂN HỆ 3: DOANH THU THÁNG */}
      {/* ======================================================== */}
      {activeTab === 'MONTH' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER BANNER THÁNG */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">📆</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Doanh Thu {monthData.name}/2026 ({monthData.start} ➔ {monthData.end})
                  </h1>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${monthData.statusColor}`}>
                    {monthData.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {monthData.note}
                </p>
              </div>
            </div>
          </div>

          {/* BỘ 4 THẺ CHỈ SỐ DOANH THU THÁNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-sm">
              <div className="text-xs font-extrabold text-amber-800 uppercase flex justify-between">
                <span>💰 Doanh Thu Tháng</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                  {monthData.activeDays || monthData.daysInMonth} ngày
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5">
                {monthData.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Số hóa đơn:</span>
                <strong className="text-slate-800">{monthData.ordersCount} đơn</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
              <div className="text-xs font-extrabold text-emerald-700 uppercase flex justify-between">
                <span>💵 Tiền Mặt Thu Được</span>
                <span>{monthData.totalRevenue > 0 ? Math.round((monthData.cash / monthData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1.5">
                {monthData.cash.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Khách trả tiền mặt tại quán
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-700 uppercase flex justify-between">
                <span>💳 Quét Mã QR MBBank</span>
                <span>{monthData.totalRevenue > 0 ? Math.round((monthData.transfer / monthData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1.5">
                {monthData.transfer.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Thanh toán qua quét mã QR
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-300 shadow-2xs">
              <div className="text-xs font-extrabold text-slate-700 uppercase flex justify-between">
                <span>📈 Lợi Nhuận Tháng</span>
                <span className="text-emerald-700 font-bold">+{monthData.margin}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5">
                +{monthData.profit.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Tiền chi tháng:</span>
                <strong className="text-red-600">-{monthData.cost.toLocaleString()}đ</strong>
              </div>
            </div>
          </div>

          {/* BỘ CHỈ SỐ TRUNG BÌNH THU CHI THÁNG */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Thu / Ngày Trong Tháng</div>
              <div className="text-base font-black text-amber-700 mt-0.5">
                {monthData.avgPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Chi / Ngày Trong Tháng</div>
              <div className="text-base font-black text-red-600 mt-0.5">
                {monthData.avgCostPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Doanh Thu / Hóa Đơn</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {monthData.avgPerOrder.toLocaleString()}đ / đơn
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Tỷ Suất Sinh Lời Tháng</div>
              <div className="text-base font-black text-emerald-700 mt-0.5">
                +{monthData.margin}% Lãi ròng
              </div>
            </div>
          </div>

          {/* DANH SÁCH 12 THÁNG ĐỂ XEM LẠI CÁC THÁNG CŨ */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>📋 Lịch Sử Các Tháng Năm 2026 Để So Sánh Doanh Thu:</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {INITIAL_MONTHS_P_AND_L.map((m) => {
                const isSelected = selectedMonth === m.month;
                const isNov = m.month === CURRENT_MONTH;
                const isDec = m.month > CURRENT_MONTH;

                return (
                  <div
                    key={m.month}
                    onClick={() => setSelectedMonth(m.month)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300 border-amber-600'
                        : 'bg-slate-50 hover:bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-xs">{m.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isSelected ? 'bg-amber-800 text-amber-100' : isNov ? 'bg-amber-100 text-amber-900' : isDec ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isNov ? '⚡ Đang diễn ra' : isDec ? '⏳ Sắp tới' : '✅'}
                      </span>
                    </div>
                    <div className="text-sm font-black mt-2">
                      {isDec ? '0đ' : isNov ? '35.4 Tr (10 ngày)' : `${(m.revenue / 1000000).toFixed(1)} Tr`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. NỘI DUNG PHÂN HỆ 4: DOANH THU NĂM */}
      {/* ======================================================== */}
      {activeTab === 'YEAR' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER BANNER NĂM */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">📈</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Báo Cáo Doanh Thu Năm {selectedYear}
                  </h1>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${yearData.statusColor}`}>
                    {yearData.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khởi đầu kinh doanh từ năm <strong>{START_YEAR}</strong> • Số liệu năm hiện tại tính đến ngày {TODAY_DAY}/11/{CURRENT_YEAR}
                </p>
              </div>
            </div>
          </div>

          {/* BỘ 4 THẺ CHỈ SỐ DOANH THU NĂM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-amber-300 shadow-sm">
              <div className="text-xs font-extrabold text-amber-800 uppercase flex justify-between">
                <span>💰 Doanh Thu Năm {selectedYear}</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                  {yearData.activeDays || 365} ngày
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5">
                {yearData.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Hóa đơn năm:</span>
                <strong className="text-slate-800">{yearData.ordersCount} đơn</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs">
              <div className="text-xs font-extrabold text-emerald-700 uppercase flex justify-between">
                <span>💵 Tiền Mặt Thu Được</span>
                <span>{yearData.totalRevenue > 0 ? Math.round((yearData.cash / yearData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1.5">
                {yearData.cash.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Tổng thu tiền mặt trong năm
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs">
              <div className="text-xs font-extrabold text-blue-700 uppercase flex justify-between">
                <span>💳 Quét Mã QR MBBank</span>
                <span>{yearData.totalRevenue > 0 ? Math.round((yearData.transfer / yearData.totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1.5">
                {yearData.transfer.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500">
                Tổng thu chuyển khoản trong năm
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-300 shadow-2xs">
              <div className="text-xs font-extrabold text-slate-700 uppercase flex justify-between">
                <span>📈 Lợi Nhuận Năm {selectedYear}</span>
                <span className="text-emerald-700 font-bold">+{yearData.margin}%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5">
                +{yearData.profit.toLocaleString()} <span className="text-xs font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="mt-2.5 pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                <span>Tổng chi năm:</span>
                <strong className="text-red-600">-{yearData.cost.toLocaleString()}đ</strong>
              </div>
            </div>
          </div>

          {/* BỘ CHỈ SỐ TRUNG BÌNH THU CHI NĂM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Thu / Ngày Cả Năm</div>
              <div className="text-base font-black text-amber-700 mt-0.5">
                {yearData.avgPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Chi / Ngày Cả Năm</div>
              <div className="text-base font-black text-red-600 mt-0.5">
                {yearData.avgCostPerDay.toLocaleString()}đ / ngày
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">TB Doanh Thu / Hóa Đơn</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {yearData.avgPerOrder.toLocaleString()}đ / đơn
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Biên Lợi Nhuận Ròng Năm</div>
              <div className="text-base font-black text-emerald-700 mt-0.5">
                +{yearData.margin}% Lãi ròng
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. NỘI DUNG PHÂN HỆ 5: THỐNG KÊ GIỜ VÀNG & TOP MÓN BÁN CHẠY */}
      {/* ======================================================== */}
      {activeTab === 'STATS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* BANNER THỐNG KÊ */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">🏆</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Thống Kê Khung Giờ Vàng & Top Món Bán Chạy
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân tích dữ liệu kinh doanh thông minh phục vụ lập kế hoạch nhân sự và chuẩn bị nguyên liệu kho
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: BIỂU ĐỒ KHUNG GIỜ VÀNG (7 COLS) */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                    <span>🔥 Biểu Đồ Phân Tích Khung Giờ Vàng (Doanh Thu Theo Giờ)</span>
                  </h3>
                  <span className="text-xs text-amber-700 font-bold">Khung Giờ Cao Điểm</span>
                </div>

                {/* BIỂU ĐỒ CỘT GIỜ VÀNG */}
                <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-3 pt-8 pb-2 px-1 border-b border-slate-100">
                  {statsData.hourlyPeak.map((h, i) => {
                    const heightPercent = Math.max(18, Math.round((h.revenue / statsData.maxHourly) * 100));

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        <div className="opacity-0 group-hover:opacity-100 transition absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-xl pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          {h.slot}: {h.revenue.toLocaleString()}đ ({h.orders} đơn - {h.percent}%)
                        </div>

                        <span className="text-[10px] font-bold text-slate-600 mb-1">
                          {(h.revenue / 1000000).toFixed(1)}Tr
                        </span>

                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[44px] rounded-t-2xl transition-all ${
                            h.isPeak
                              ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 shadow-md ring-2 ring-amber-300'
                              : 'bg-gradient-to-t from-slate-300 to-slate-200 group-hover:from-amber-400 group-hover:to-amber-300'
                          }`}
                        ></div>

                        <div className="text-center mt-2.5">
                          <div className={`text-[11px] font-black ${h.isPeak ? 'text-amber-700 font-extrabold' : 'text-slate-800'}`}>
                            {h.slot}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[70px]">{h.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div>⚡ <strong>Khung giờ vàng đông khách nhất:</strong> <strong>09h00 - 11h00 Sáng</strong> (Đóng góp tới <strong>36%</strong> doanh thu cả ngày).</div>
                <div>💡 <strong>Khuyến nghị vận hành:</strong> Bố trí tối thiểu 2 Barista pha chế và 2 nhân viên phục vụ trong khung giờ 09h - 11h để không làm khách chờ lâu.</div>
              </div>
            </div>

            {/* CỘT PHẢI: TOP MÓN BÁN CHẠY NHẤT (5 COLS) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                    <span>🏆 Top Món Bán Chạy Nhất Quán</span>
                  </h3>
                  <span className="text-xs text-slate-400">Xếp theo số ly bán ra</span>
                </div>

                <div className="space-y-2.5">
                  {statsData.topSellingDishes.map((dish) => (
                    <div
                      key={dish.rank}
                      className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2.5 text-xs hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          dish.rank === 1
                            ? 'bg-amber-500 text-white shadow-sm'
                            : dish.rank === 2
                            ? 'bg-slate-300 text-slate-800'
                            : dish.rank === 3
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{dish.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">
                            {dish.icon} {dish.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {dish.qty} ly • Đơn giá: {dish.price.toLocaleString()}đ
                          </div>
                        </div>
                      </div>
                      <span className="font-black text-amber-700 text-right shrink-0">
                        {dish.revenue.toLocaleString()}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                ⭐ <strong>Cà Phê Muối</strong> và <strong>Trà Đào Cam Sả</strong> là hai món chủ lực đem lại doanh thu cao nhất cho quán Tiến Phát.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
