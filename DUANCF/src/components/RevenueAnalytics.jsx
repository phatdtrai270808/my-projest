import React, { useState, useMemo, useRef, useEffect } from 'react';

// Mốc khởi đầu kinh doanh của quán: bắt đầu từ năm 2025
const START_YEAR = 2025;
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 11; // Tháng 11 năm 2026
const TODAY_DAY = 10; // Ngày 10/11/2026

// Cấu trúc 12 Tháng của năm - Mọi số liệu Doanh thu & Chi phí được tính 100% động từ Đơn Hàng POS
const INITIAL_MONTHS_P_AND_L = [
  { month: 1, name: 'Tháng 1', daysInMonth: 31 },
  { month: 2, name: 'Tháng 2', daysInMonth: 28 },
  { month: 3, name: 'Tháng 3', daysInMonth: 31 },
  { month: 4, name: 'Tháng 4', daysInMonth: 30 },
  { month: 5, name: 'Tháng 5', daysInMonth: 31 },
  { month: 6, name: 'Tháng 6', daysInMonth: 30 },
  { month: 7, name: 'Tháng 7', daysInMonth: 31 },
  { month: 8, name: 'Tháng 8', daysInMonth: 31 },
  { month: 9, name: 'Tháng 9', daysInMonth: 30 },
  { month: 10, name: 'Tháng 10', daysInMonth: 31 },
  { month: 11, name: 'Tháng 11', daysInMonth: 30 },
  { month: 12, name: 'Tháng 12', daysInMonth: 31 },
];

// Cấu trúc các tuần cơ sở của Tháng 11/2026 - Mọi số liệu tính 100% động từ Đơn Hàng POS
const INITIAL_WEEKS = [
  {
    weekId: 'W45',
    name: 'Tuần 45 (10/11 - 16/11/2026)',
    start: '10/11/2026',
    end: '16/11/2026',
    daysCount: 7,
    isCurrent: true,
    status: 'ACTIVE',
  },
  {
    weekId: 'W44',
    name: 'Tuần 44 (03/11 - 09/11/2026)',
    start: '03/11/2026',
    end: '09/11/2026',
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
  },
  {
    weekId: 'W43',
    name: 'Tuần 43 (27/10 - 02/11/2026)',
    start: '27/10/2026',
    end: '02/11/2026',
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
  },
  {
    weekId: 'W42',
    name: 'Tuần 42 (20/10 - 26/10/2026)',
    start: '20/10/2026',
    end: '26/10/2026',
    daysCount: 7,
    isCurrent: false,
    status: 'COMPLETED',
  },
  {
    weekId: 'W46',
    name: 'Tuần 46 (17/11 - 23/11/2026)',
    start: '17/11/2026',
    end: '23/11/2026',
    daysCount: 7,
    isCurrent: false,
    status: 'UPCOMING',
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

// Hàm chuyển đổi ngày giờ của hóa đơn thành Date object chuẩn
const parseOrderDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date && !isNaN(dateInput)) return dateInput;
  if (typeof dateInput === 'string') {
    const dmyMatch = dateInput.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      return new Date(year, month, day);
    }
    const isoMatch = dateInput.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      return new Date(year, month, day);
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
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
  // 1. TÍNH TOÁN DOANH THU THEO NGÀY (DAY STATS) - 100% TỪ ĐƠN HÀNG THỰC TẾ
  // =========================================================================
  const dayStats = useMemo(() => {
    const isToday = targetDateStr === todayDateStr;
    const isYesterday = targetDateStr === yesterdayDateStr;

    // Lọc các đơn hàng thực tế phát sinh trong ngày từ POS
    const matchedOrders = orders.filter((o) => extractDateStr(o.createdAt || o.date) === targetDateStr);

    let realTotal = 0;
    let realCash = 0;
    let realTransfer = 0;
    let calculatedCost = 0;
    const hourlyRevenue = {};

    matchedOrders.forEach((o) => {
      const amt = o.totalAmount || o.total || 0;
      realTotal += amt;
      const pm = String(o.paymentMethod || '').toUpperCase();
      if (pm.includes('TRANSFER') || pm.includes('MB') || pm.includes('QR') || pm.includes('BANK')) {
        realTransfer += amt;
      } else {
        realCash += amt;
      }

      // Chi phí vốn nguyên liệu (COGS): Tính theo từng món hoặc tỷ lệ chuẩn F&B 35%
      (o.items || []).forEach((it) => {
        const itemCost = it.cost ? it.cost * (it.qty || 1) : Math.round((it.price || 0) * 0.35 * (it.qty || 1));
        calculatedCost += itemCost;
      });

      // Bóc tách khung giờ để tính TB doanh thu giờ vàng
      let hour = null;
      const timeStr = String(o.createdAt || o.time || '');
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
      } else if (o.createdAt && !isNaN(new Date(o.createdAt).getTime())) {
        hour = new Date(o.createdAt).getHours();
      }
      if (hour !== null) {
        hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + amt;
      }
    });

    const totalRevenue = realTotal;
    const cash = realCash;
    const transfer = realTransfer;
    const ordersCount = matchedOrders.length;
    const cost = calculatedCost;
    const profit = totalRevenue - cost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    const avgPerOrder = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

    // Tỷ lệ thực tế Tiền mặt : QR
    const cashPct = totalRevenue > 0 ? Math.round((cash / totalRevenue) * 100) : 0;
    const qrPct = totalRevenue > 0 ? (100 - cashPct) : 0;
    const cashRatioStr = totalRevenue > 0 ? `${cashPct}% : ${qrPct}%` : '0% : 0%';

    // Tính TB tiền thu giờ vàng (doanh thu của giờ cao điểm nhất trong ngày)
    let peakHourlyAvg = 0;
    const hourValues = Object.values(hourlyRevenue);
    if (hourValues.length > 0) {
      peakHourlyAvg = Math.max(...hourValues);
    } else if (totalRevenue > 0) {
      peakHourlyAvg = totalRevenue;
    }

    const statusLabel = ordersCount > 0
      ? isToday ? '⚡ Đang Diễn Ra (Đã có đơn)' : '✅ Đã Hoàn Tất'
      : isToday ? '⚡ Chờ Đơn Hàng Đầu Tiên' : 'Chưa có đơn hàng';
    const statusDesc = ordersCount > 0
      ? `Đã ghi nhận ${ordersCount} đơn thanh toán từ quầy thu ngân`
      : 'Chưa có đơn hàng nào thanh toán trong ngày này';
    const statusColor = ordersCount > 0
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : 'bg-slate-100 text-slate-600 border-slate-200';

    return {
      isFutureDate: false,
      statusLabel,
      statusDesc,
      statusColor,
      totalRevenue,
      cash,
      transfer,
      cashPct,
      qrPct,
      cashRatioStr,
      cost,
      profit,
      margin,
      ordersCount,
      avgPerOrder,
      peakHourlyAvg,
      matchedOrders,
    };
  }, [selectedDate, targetDateStr, todayDateStr, yesterdayDateStr, orders]);

  // =========================================================================
  // 2. TÍNH TOÁN DOANH THU THEO TUẦN (WEEK STATS) - 100% TỪ ĐƠN HÀNG THỰC TẾ
  // =========================================================================
  const computedWeeks = useMemo(() => {
    return INITIAL_WEEKS.map((w) => {
      const startParts = w.start.split('/');
      const endParts = w.end.split('/');
      const startDate = new Date(parseInt(startParts[2], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[0], 10), 0, 0, 0);
      const endDate = new Date(parseInt(endParts[2], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[0], 10), 23, 59, 59);

      const matchedWeekOrders = orders.filter((o) => {
        const d = parseOrderDate(o.createdAt || o.date);
        return d && d >= startDate && d <= endDate;
      });

      let rev = 0;
      let cash = 0;
      let transfer = 0;
      let cost = 0;

      matchedWeekOrders.forEach((o) => {
        const amt = o.totalAmount || o.total || 0;
        rev += amt;
        const pm = String(o.paymentMethod || '').toUpperCase();
        if (pm.includes('TRANSFER') || pm.includes('MB') || pm.includes('QR') || pm.includes('BANK')) {
          transfer += amt;
        } else {
          cash += amt;
        }
        (o.items || []).forEach((it) => {
          cost += it.cost ? it.cost * (it.qty || 1) : Math.round((it.price || 0) * 0.35 * (it.qty || 1));
        });
      });

      const profit = rev - cost;
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
      const count = matchedWeekOrders.length;
      const avgPerOrder = count > 0 ? Math.round(rev / count) : 0;

      return {
        ...w,
        revenue: rev,
        totalRevenue: rev,
        cash,
        transfer,
        cost,
        profit,
        margin,
        ordersCount: count,
        avgPerDay: count > 0 ? Math.round(rev / 7) : 0,
        avgCostPerDay: count > 0 ? Math.round(cost / 7) : 0,
        avgPerOrder,
      };
    });
  }, [orders]);

  const weekData = useMemo(() => {
    const cur = computedWeeks.find((w) => w.weekId === selectedWeekId) || computedWeeks[0];
    const isCurrent = cur.weekId === 'W45';
    const statusLabel = cur.ordersCount > 0
      ? (isCurrent ? '⚡ Đang Diễn Ra (Đã có đơn)' : '✅ Đã Hoàn Tất')
      : (isCurrent ? '⚡ Đang Diễn Ra (Chưa có đơn)' : (cur.status === 'UPCOMING' ? '⏳ Sắp Diễn Ra' : 'Chưa có đơn hàng'));
    const statusColor = cur.ordersCount > 0
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : (cur.status === 'UPCOMING' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200');

    return {
      ...cur,
      statusLabel,
      statusColor,
      note: cur.ordersCount > 0
        ? `Đã ghi nhận ${cur.ordersCount} đơn hàng trong ${cur.name} • Doanh thu: ${cur.totalRevenue.toLocaleString()} VNĐ`
        : `Chưa có đơn hàng nào phát sinh trong ${cur.name}`,
    };
  }, [computedWeeks, selectedWeekId]);

  // =========================================================================
  // 3. TÍNH TOÁN DOANH THU THEO THÁNG (MONTH STATS) - 100% TỪ ĐƠN HÀNG THỰC TẾ
  // =========================================================================
  const computedMonths = useMemo(() => {
    return INITIAL_MONTHS_P_AND_L.map((m) => {
      const matchedMonthOrders = orders.filter((o) => {
        const d = parseOrderDate(o.createdAt || o.date);
        if (!d) return false;
        return (d.getMonth() + 1) === m.month && d.getFullYear() === selectedYear;
      });

      let rev = 0;
      let cash = 0;
      let transfer = 0;
      let cost = 0;

      matchedMonthOrders.forEach((o) => {
        const amt = o.totalAmount || o.total || 0;
        rev += amt;
        const pm = String(o.paymentMethod || '').toUpperCase();
        if (pm.includes('TRANSFER') || pm.includes('MB') || pm.includes('QR') || pm.includes('BANK')) {
          transfer += amt;
        } else {
          cash += amt;
        }
        (o.items || []).forEach((it) => {
          cost += it.cost ? it.cost * (it.qty || 1) : Math.round((it.price || 0) * 0.35 * (it.qty || 1));
        });
      });

      const profit = rev - cost;
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
      const count = matchedMonthOrders.length;
      const avgPerOrder = count > 0 ? Math.round(rev / count) : 0;

      return {
        ...m,
        revenue: rev,
        totalRevenue: rev,
        cash,
        transfer,
        cost,
        profit,
        margin,
        ordersCount: count,
        avgPerDay: count > 0 ? Math.round(rev / m.daysInMonth) : 0,
        avgCostPerDay: count > 0 ? Math.round(cost / m.daysInMonth) : 0,
        avgPerOrder,
      };
    });
  }, [orders, selectedYear]);

  const monthData = useMemo(() => {
    const cur = computedMonths.find((m) => m.month === selectedMonth) || computedMonths[CURRENT_MONTH - 1];
    const isNov = cur.month === CURRENT_MONTH && selectedYear === CURRENT_YEAR;
    const isFuture = cur.month > CURRENT_MONTH && selectedYear === CURRENT_YEAR;

    const statusLabel = cur.ordersCount > 0
      ? (isNov ? `⚡ Đang Diễn Ra (${cur.ordersCount} đơn)` : '✅ Đã Hoàn Tất')
      : (isNov ? '⚡ Đang Diễn Ra (Chưa có đơn)' : (isFuture ? '⏳ Sắp Tới' : 'Chưa có đơn hàng'));
    const statusColor = cur.ordersCount > 0
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : (isFuture ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200');

    return {
      ...cur,
      start: `01/${String(cur.month).padStart(2, '0')}/${selectedYear}`,
      end: `${cur.daysInMonth}/${String(cur.month).padStart(2, '0')}/${selectedYear}`,
      statusLabel,
      statusColor,
      note: cur.ordersCount > 0
        ? `Đã ghi nhận ${cur.ordersCount} đơn hàng trong Tháng ${cur.month} • Doanh thu: ${cur.totalRevenue.toLocaleString()} VNĐ`
        : `Chưa có đơn hàng nào trong Tháng ${cur.month} năm ${selectedYear}`,
      isFuture,
    };
  }, [computedMonths, selectedMonth, selectedYear]);

  // =========================================================================
  // 4. TÍNH TOÁN DOANH THU THEO NĂM (YEAR STATS) - 100% TỪ ĐƠN HÀNG THỰC TẾ
  // =========================================================================
  const yearData = useMemo(() => {
    const matchedYearOrders = orders.filter((o) => {
      const d = parseOrderDate(o.createdAt || o.date);
      if (!d) return selectedYear === CURRENT_YEAR;
      return d.getFullYear() === selectedYear;
    });

    let rev = 0;
    let cash = 0;
    let transfer = 0;
    let cost = 0;
    const count = matchedYearOrders.length;

    matchedYearOrders.forEach((o) => {
      const amt = o.totalAmount || o.total || 0;
      rev += amt;
      const pm = String(o.paymentMethod || '').toUpperCase();
      if (pm.includes('TRANSFER') || pm.includes('MB') || pm.includes('QR') || pm.includes('BANK')) {
        transfer += amt;
      } else {
        cash += amt;
      }
      (o.items || []).forEach((it) => {
        cost += it.cost ? it.cost * (it.qty || 1) : Math.round((it.price || 0) * 0.35 * (it.qty || 1));
      });
    });

    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
    const avgPerOrder = count > 0 ? Math.round(rev / count) : 0;

    const isCurrentY = selectedYear === CURRENT_YEAR;
    const isFutureY = selectedYear > CURRENT_YEAR;

    const statusLabel = count > 0
      ? (isCurrentY ? `⚡ Đang Diễn Ra (${count} đơn)` : '✅ Đã Hoàn Tất')
      : (isCurrentY ? '⚡ Đang Diễn Ra (Chưa có đơn)' : (isFutureY ? '⏳ Sắp Tới' : 'Chưa có đơn hàng'));
    const statusColor = count > 0
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : (isFutureY ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200');

    return {
      totalRevenue: rev,
      cash,
      transfer,
      cost,
      profit,
      margin,
      ordersCount: count,
      avgPerDay: count > 0 ? Math.round(rev / 365) : 0,
      avgCostPerDay: count > 0 ? Math.round(cost / 365) : 0,
      avgPerOrder,
      activeDays: count > 0 ? 1 : 0,
      statusLabel,
      statusColor,
      isFuture: isFutureY,
    };
  }, [selectedYear, orders]);

  // =========================================================================
  // 5. DỮ LIỆU THỐNG KÊ GIỜ VÀNG & TOP MÓN BÁN CHẠY (STATS)
  // =========================================================================
  const statsData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        hourlyPeak: [],
        topSellingDishes: [],
        maxHourly: 0,
        isEmpty: true,
      };
    }

    const slots = [
      { slot: '07h - 09h', startH: 7, endH: 9, label: 'Cà phê sáng sớm', revenue: 0, orders: 0, icon: '☕' },
      { slot: '09h - 11h', startH: 9, endH: 11, label: 'Khung Giờ Vàng', revenue: 0, orders: 0, icon: '🔥' },
      { slot: '11h - 14h', startH: 11, endH: 14, label: 'Nghỉ trưa & văn phòng', revenue: 0, orders: 0, icon: '🍛' },
      { slot: '14h - 17h', startH: 14, endH: 17, label: 'Chiều mát trà & đá xay', revenue: 0, orders: 0, icon: '🍹' },
      { slot: '17h - 20h', startH: 17, endH: 20, label: 'Tối tụ họp bạn bè', revenue: 0, orders: 0, icon: '✨' },
      { slot: '20h - 22h', startH: 20, endH: 22, label: 'Đêm muộn thư giãn', revenue: 0, orders: 0, icon: '🌙' },
    ];

    const dishMap = {};

    orders.forEach((ord) => {
      const amt = ord.totalAmount || ord.total || 0;
      let hour = 9;
      if (ord.createdAt) {
        const timeMatch = ord.createdAt.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) hour = parseInt(timeMatch[1], 10);
      }
      const matchedSlot = slots.find((s) => hour >= s.startH && hour < s.endH) || slots[1];
      matchedSlot.revenue += amt;
      matchedSlot.orders += 1;

      (ord.items || []).forEach((it) => {
        const name = it.name?.split('(')[0]?.trim() || it.name || 'Món';
        if (!dishMap[name]) {
          dishMap[name] = { name, category: it.category || 'Đồ uống', qty: 0, price: it.price || 0, revenue: 0 };
        }
        dishMap[name].qty += it.qty || 1;
        dishMap[name].revenue += (it.price || 0) * (it.qty || 1);
      });
    });

    const totalStatsRev = orders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    slots.forEach((s) => {
      s.percent = totalStatsRev > 0 ? Math.round((s.revenue / totalStatsRev) * 100) : 0;
    });

    const maxSlotRev = Math.max(...slots.map((s) => s.revenue), 1);
    slots.forEach((s) => {
      if (s.revenue === maxSlotRev && s.revenue > 0) s.isPeak = true;
    });

    const topSellingDishes = Object.values(dishMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((d, idx) => ({ ...d, rank: idx + 1, icon: '☕' }));

    return { hourlyPeak: slots, topSellingDishes, maxHourly: maxSlotRev, isEmpty: false };
  }, [orders]);

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
      {/* BANNER HƯỚNG DẪN CƠ CHẾ DÒNG TIỀN & CÔNG THỨC TÍNH LÃI SUẤT (THẢO LUẬN DỰ ÁN) */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 rounded-3xl p-4 border border-amber-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span className="font-black text-xs text-amber-950 uppercase tracking-wide">
              Cơ Chế Dòng Tiền & Công Thức Tính Lãi Suất (Thảo Luận Cùng Nhóm)
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-300">
            Dữ liệu động 100% từ Đơn Hàng POS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs pt-1">
          <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase">1. Tổng Doanh Thu</div>
            <div className="font-extrabold text-[#8B181B] mt-0.5">Tiền Mặt + Chuyển Khoản QR</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Thu trực tiếp từ khách thanh toán</div>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase">2. Giá Vốn (COGS)</div>
            <div className="font-extrabold text-amber-700 mt-0.5">Định Lượng x Giá Nguyên Liệu</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tự động trừ trực tiếp vào Kho</div>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase">3. Lợi Nhuận Ròng (Lãi)</div>
            <div className="font-extrabold text-emerald-700 mt-0.5">Doanh Thu - Tổng Chi Phí</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Số tiền thực lãi sau khi bán</div>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
            <div className="text-[10px] font-bold text-slate-500 uppercase">4. Tỷ Suất Lãi (Biên Lợi Nhuận)</div>
            <div className="font-extrabold text-purple-700 mt-0.5">(Lãi / Doanh Thu) x 100%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hiệu quả sinh lời của quán</div>
          </div>
        </div>
      </div>

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
                    {dayStats.peakHourlyAvg > 0 ? `~${dayStats.peakHourlyAvg.toLocaleString()}đ/giờ` : '0đ/giờ'}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tỷ Lệ Tiền Mặt : QR</div>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    {dayStats.cashRatioStr}
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
              {computedWeeks.map((w) => (
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
                      selectedWeekId === w.weekId ? 'bg-amber-800 text-amber-100' : w.ordersCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {w.ordersCount > 0 ? `⚡ ${w.ordersCount} đơn` : w.isCurrent ? '⚡ Đang diễn ra' : w.status === 'UPCOMING' ? '⏳ Sắp tới' : '0 đơn'}
                    </span>
                  </div>
                  <div className={`text-[11px] truncate ${selectedWeekId === w.weekId ? 'text-amber-100' : 'text-slate-500'}`}>
                    {w.start} ➔ {w.end}
                  </div>
                  <div className="text-sm font-black mt-2">
                    {w.revenue > 0 ? `${(w.revenue / 1000000).toFixed(1)} Triệu` : '0 VNĐ'}
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
              {computedMonths.map((m) => {
                const isSelected = selectedMonth === m.month;
                const isNov = m.month === CURRENT_MONTH && selectedYear === CURRENT_YEAR;
                const isDec = m.month > CURRENT_MONTH && selectedYear === CURRENT_YEAR;

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
                        isSelected ? 'bg-amber-800 text-amber-100' : m.ordersCount > 0 ? 'bg-emerald-100 text-emerald-800' : isNov ? 'bg-amber-100 text-amber-900' : isDec ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {m.ordersCount > 0 ? `⚡ ${m.ordersCount} đơn` : isNov ? '⚡ Đang diễn ra' : isDec ? '⏳ Sắp tới' : '0 đơn'}
                      </span>
                    </div>
                    <div className="text-sm font-black mt-2">
                      {m.revenue > 0 ? `${(m.revenue / 1000000).toFixed(1)} Tr` : '0 VNĐ'}
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

          {statsData.isEmpty ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="text-5xl">📊☕</div>
              <h3 className="text-base font-extrabold text-slate-700">Chưa có đơn hàng nào phát sinh để thống kê!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Khi nhóm của bạn thêm món và thực hiện thanh toán đơn hàng tại Quầy Thu Ngân, hệ thống sẽ tự động vẽ biểu đồ Khung Giờ Vàng và xếp hạng Top món bán chạy nhất tại đây.
              </p>
            </div>
          ) : (
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
                  <div>⚡ <strong>Khung giờ vàng đông khách nhất:</strong> Dựa trên dữ liệu thanh toán thực tế của quán.</div>
                  <div>💡 <strong>Khuyến nghị vận hành:</strong> Bố trí Barista pha chế và nhân viên phục vụ trong khung giờ cao điểm để không làm khách chờ lâu.</div>
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
                  ⭐ Thống kê được tổng hợp tự động từ danh sách đơn hàng đã bán.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
