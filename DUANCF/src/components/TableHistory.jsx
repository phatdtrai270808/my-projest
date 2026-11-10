import React, { useState, useEffect } from 'react';

// Dữ liệu mẫu khởi tạo phong phú cho Lịch sử bàn đã dùng
const INITIAL_TABLE_USAGE = [
  {
    id: 'TU-001',
    tableId: 'T1',
    tableName: 'Bàn 1-Phòng thường',
    area: 'Phòng thường',
    seatedAt: '08:00 - 10/11/2026',
    completedAt: '09:15 - 10/11/2026',
    durationMinutes: 75,
    orderId: 'DH-001-10112026',
    items: [
      { id: 'CF1', name: 'Cà Phê Đen Đá', price: 20000, qty: 1, itemNote: 'Đậm vị, ít đường', category: 'Cà Phê', orderedAt: '08:02' },
      { id: 'CF3', name: 'Bạc Xỉu Sài Gòn', price: 29000, qty: 1, itemNote: 'Nhiều sữa, đá riêng', category: 'Cà Phê', orderedAt: '08:02' },
      { id: 'BN1', name: 'Bánh Croissant Bơ Tỏi', price: 28000, qty: 1, itemNote: 'Làm nóng giòn', category: 'Bánh & Ăn Vặt', orderedAt: '08:15' },
    ],
    totalItemsCount: 3,
    subTotal: 77000,
    discount: 0,
    total: 77000,
    paymentMethod: 'CASH',
    orderNote: 'Khách quen phòng thường, dùng tại quán',
    staffName: 'Tiến Phát',
  },
  {
    id: 'TU-002',
    tableId: 'L3',
    tableName: 'Bàn 3-Phòng lạnh',
    area: 'Phòng lạnh',
    seatedAt: '09:00 - 10/11/2026',
    completedAt: '10:20 - 10/11/2026',
    durationMinutes: 80,
    orderId: 'DH-002-10112026',
    items: [
      { id: 'TR1', name: 'Trà Đào Cam Sả', price: 35000, qty: 2, itemNote: 'Ít ngọt, nhiều đào', category: 'Trà Trái Cây', orderedAt: '09:05' },
      { id: 'TR2', name: 'Trà Vải Hoa Hồng', price: 35000, qty: 1, itemNote: 'Không đá', category: 'Trà Trái Cây', orderedAt: '09:05' },
    ],
    totalItemsCount: 3,
    subTotal: 105000,
    discount: 5000,
    total: 100000,
    paymentMethod: 'TRANSFER',
    orderNote: 'Họp nhóm sinh viên, quét mã MBBank',
    staffName: 'Ng Thư',
  },
  {
    id: 'TU-003',
    tableId: 'T2',
    tableName: 'Bàn 2-Phòng thường',
    area: 'Phòng thường',
    seatedAt: '09:30 - 10/11/2026',
    completedAt: '10:10 - 10/11/2026',
    durationMinutes: 40,
    orderId: 'DH-003-10112026',
    items: [
      { id: 'CF2', name: 'Cà Phê Sữa Đá', price: 25000, qty: 2, itemNote: 'Ít đường', category: 'Cà Phê', orderedAt: '09:32' },
      { id: 'BN4', name: 'Hạt Hướng Dương Vị Dừa', price: 15000, qty: 1, itemNote: '', category: 'Bánh & Ăn Vặt', orderedAt: '09:35' },
    ],
    totalItemsCount: 3,
    subTotal: 65000,
    discount: 0,
    total: 65000,
    paymentMethod: 'CASH',
    orderNote: 'Ngồi bàn ngoài thoáng mát',
    staffName: 'Thanh Hà',
  },
  {
    id: 'TU-004',
    tableId: 'L4',
    tableName: 'Bàn 4-Phòng lạnh',
    area: 'Phòng lạnh',
    seatedAt: '10:15 - 10/11/2026',
    completedAt: '11:35 - 10/11/2026',
    durationMinutes: 80,
    orderId: 'DH-004-10112026',
    items: [
      { id: 'DX1', name: 'Freeze Cà Phê Đá Xay', price: 42000, qty: 1, itemNote: 'Nhiều kem whipping', category: 'Đá Xay', orderedAt: '10:18' },
      { id: 'DX2', name: 'Matcha Đá Xay Kem Tuyết', price: 42000, qty: 1, itemNote: 'Ít ngọt', category: 'Đá Xay', orderedAt: '10:18' },
      { id: 'BN2', name: 'Bánh Tiramisu Ý', price: 35000, qty: 1, itemNote: '', category: 'Bánh & Ăn Vặt', orderedAt: '10:30' },
    ],
    totalItemsCount: 3,
    subTotal: 119000,
    discount: 10000,
    total: 109000,
    paymentMethod: 'TRANSFER',
    orderNote: 'Khách nhận bàn từ lịch đặt trước thành công',
    staffName: 'Tiến Phát',
  },
];

// Dữ liệu mẫu khởi tạo cho Lịch sử bàn đặt trước
const INITIAL_RESERVATIONS = [
  {
    id: 'RES-001',
    tableId: 'T1',
    tableName: 'Bàn 1-Phòng thường',
    area: 'Phòng thường',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0912.345.678',
    reserveTime: '08:00',
    reserveDate: '10/11/2026',
    note: 'Hẹn đối tác bàn công việc, chuẩn bị sẵn phin cafe',
    status: 'ARRIVED', // Đã nhận bàn
    createdAt: '07:20 - 10/11/2026',
    arrivedAt: '07:58 - 10/11/2026',
  },
  {
    id: 'RES-002',
    tableId: 'L4',
    tableName: 'Bàn 4-Phòng lạnh',
    area: 'Phòng lạnh',
    customerName: 'Chị Lan Anh',
    customerPhone: '0988.777.666',
    reserveTime: '10:15',
    reserveDate: '10/11/2026',
    note: 'Sinh nhật nhóm 3 bạn, cần chỗ cắm sạc laptop',
    status: 'ARRIVED', // Đã nhận bàn
    createdAt: '08:45 - 10/11/2026',
    arrivedAt: '10:14 - 10/11/2026',
  },
  {
    id: 'RES-003',
    tableId: 'L2',
    tableName: 'Bàn 2-Phòng lạnh',
    area: 'Phòng lạnh',
    customerName: 'Anh Quốc Bảo',
    customerPhone: '0905.999.888',
    reserveTime: '09:30',
    reserveDate: '10/11/2026',
    note: 'Cần bàn yên tĩnh đọc sách',
    status: 'CANCELLED_AUTO', // Tự hủy quá 10 phút
    createdAt: '08:10 - 10/11/2026',
    cancelledAt: '09:41 - 10/11/2026 (Quá 10 phút vắng mặt)',
  },
  {
    id: 'RES-004',
    tableId: 'T3',
    tableName: 'Bàn 3-Phòng thường',
    area: 'Phòng thường',
    customerName: 'Chị Minh Thư',
    customerPhone: '0977.112.233',
    reserveTime: '14:30',
    reserveDate: '10/11/2026',
    note: 'Họp nhóm câu lạc bộ tiếng Anh',
    status: 'WAITING', // Đang chờ khách
    createdAt: '09:15 - 10/11/2026',
  },
  {
    id: 'RES-005',
    tableId: 'L1',
    tableName: 'Bàn 1-Phòng lạnh',
    area: 'Phòng lạnh',
    customerName: 'Bác Hùng',
    customerPhone: '0935.444.555',
    reserveTime: '07:30',
    reserveDate: '09/11/2026',
    note: 'Bận việc đột xuất xin hủy trước',
    status: 'CANCELLED_MANUAL', // Hủy thủ công
    createdAt: '19:00 - 08/11/2026',
    cancelledAt: '07:10 - 09/11/2026',
  },
];

export default function TableHistory() {
  // Tab con: 'USAGE' (Bàn đã dùng) hoặc 'RESERVATION' (Bàn đặt trước)
  const [subTab, setSubTab] = useState('USAGE');

  // Dữ liệu Lịch sử bàn đã dùng
  const [usageList, setUsageList] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_TABLE_USAGE_HISTORY');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_TABLE_USAGE;
  });

  // Dữ liệu Lịch sử đặt bàn
  const [reservationList, setReservationList] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_RESERVATION_HISTORY');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_RESERVATIONS;
  });

  // Lưu tự động vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('POS_TABLE_USAGE_HISTORY', JSON.stringify(usageList));
    } catch (e) {
      console.warn(e);
    }
  }, [usageList]);

  useEffect(() => {
    try {
      localStorage.setItem('POS_RESERVATION_HISTORY', JSON.stringify(reservationList));
    } catch (e) {
      console.warn(e);
    }
  }, [reservationList]);

  // Bộ lọc tìm kiếm & khu vực
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Danh sách ID đang được bung mở (Accordion expanded items)
  const [expandedIds, setExpandedIds] = useState({});

  // Bật/tắt bung mở một dòng
  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Mở rộng tất cả / Thu gọn tất cả
  const toggleExpandAll = () => {
    const currentList = subTab === 'USAGE' ? filteredUsageList : filteredReservationList;
    const allExpanded = currentList.every((item) => expandedIds[item.id]);
    const nextState = {};
    currentList.forEach((item) => {
      nextState[item.id] = !allExpanded;
    });
    setExpandedIds(nextState);
  };

  // Lọc dữ liệu Bàn đã dùng
  const filteredUsageList = usageList.filter((item) => {
    if (areaFilter !== 'ALL' && item.area !== areaFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTable = item.tableName.toLowerCase().includes(term);
      const matchStaff = (item.staffName || '').toLowerCase().includes(term);
      const matchOrder = (item.orderId || '').toLowerCase().includes(term);
      const matchItems = item.items?.some((it) => it.name.toLowerCase().includes(term));
      if (!matchTable && !matchStaff && !matchOrder && !matchItems) return false;
    }
    return true;
  });

  // Lọc dữ liệu Bàn đặt trước
  const filteredReservationList = reservationList.filter((item) => {
    if (areaFilter !== 'ALL' && item.area !== areaFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTable = item.tableName.toLowerCase().includes(term);
      const matchCustomer = item.customerName.toLowerCase().includes(term);
      const matchPhone = (item.customerPhone || '').includes(term);
      const matchNote = (item.note || '').toLowerCase().includes(term);
      if (!matchTable && !matchCustomer && !matchPhone && !matchNote) return false;
    }
    return true;
  });

  // Thống kê nhanh
  const totalUsageRevenue = usageList.reduce((sum, item) => sum + (item.total || 0), 0);
  const avgDuration =
    usageList.length > 0
      ? Math.round(usageList.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) / usageList.length)
      : 0;
  const arrivedCount = reservationList.filter((r) => r.status === 'ARRIVED').length;
  const autoCancelledCount = reservationList.filter((r) => r.status === 'CANCELLED_AUTO').length;
  const waitingCount = reservationList.filter((r) => r.status === 'WAITING').length;

  return (
    <div className="space-y-5 pb-12">
      {/* ======================================================== */}
      {/* 1. HEADER & THỐNG KÊ TỔNG QUAN HIỆU SUẤT SỬ DỤNG BÀN */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕒</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Lịch Sử Bàn & Nhật Ký Hoạt Động
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi chi tiết thời lượng sử dụng bàn, từng món được gọi và lịch sử khách đặt bàn trước
            </p>
          </div>

          {/* 3 Thẻ thống kê nhanh */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center gap-2.5">
              <span className="text-lg">🍵</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-700">Đã phục vụ</div>
                <div className="text-sm font-extrabold text-amber-900">{usageList.length} lượt bàn</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-xl px-3 py-2 flex items-center gap-2.5">
              <span className="text-lg">⏱️</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-700">Thời gian ngồi TB</div>
                <div className="text-sm font-extrabold text-blue-900">{avgDuration} phút / bàn</div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200/80 rounded-xl px-3 py-2 flex items-center gap-2.5">
              <span className="text-lg">🟣</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-purple-700">Lịch đặt trước</div>
                <div className="text-sm font-extrabold text-purple-900">{reservationList.length} lượt hẹn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh chuyển 2 mục nhỏ (Segmented Tabs) */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setSubTab('USAGE')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              subTab === 'USAGE'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <span>🍵 1. Bàn Đã Phục Vụ</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                subTab === 'USAGE' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {usageList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('RESERVATION')}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              subTab === 'RESERVATION'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <span>🟣 2. Lịch Sử Bàn Đặt Trước</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                subTab === 'RESERVATION' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {reservationList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THANH BỘ LỌC TÌM KIẾM & NÚT THU GỌN / MỞ RỘNG TẤT CẢ */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                subTab === 'USAGE'
                  ? '🔍 Tìm tên bàn, mã đơn, món ăn, nhân viên...'
                  : '🔍 Tìm tên khách, số điện thoại, tên bàn, ghi chú...'
              }
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo khu vực bàn */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-700"
          >
            <option value="ALL">Khu vực: Tất cả</option>
            <option value="Phòng thường">Phòng thường</option>
            <option value="Phòng lạnh">Phòng lạnh</option>
          </select>

          {/* Lọc theo trạng thái đặt bàn (nếu đang ở tab Đặt trước) */}
          {subTab === 'RESERVATION' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 font-bold text-purple-800"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="WAITING">🟣 Đang chờ khách ({waitingCount})</option>
              <option value="ARRIVED">🟢 Đã nhận bàn ({arrivedCount})</option>
              <option value="CANCELLED_AUTO">🔴 Tự động hủy 10p ({autoCancelledCount})</option>
              <option value="CANCELLED_MANUAL">⚪ Hủy thủ công</option>
            </select>
          )}
        </div>

        {/* Nút Mở rộng / Thu gọn tất cả */}
        <button
          type="button"
          onClick={toggleExpandAll}
          className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>
            {(subTab === 'USAGE' ? filteredUsageList : filteredReservationList).every((item) => expandedIds[item.id])
              ? '▲ Thu gọn tất cả'
              : '▼ Mở rộng tất cả'}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. NỘI DUNG MỤC 1: LỊCH SỬ BÀN ĐÃ DÙNG (ACCORDION CUỘN) */}
      {/* ======================================================== */}
      {subTab === 'USAGE' && (
        <div className="space-y-2.5">
          {filteredUsageList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <span className="text-4xl block mb-2">🍵</span>
              <div className="text-sm font-bold text-slate-700">Chưa có lượt sử dụng bàn nào phù hợp</div>
              <p className="text-xs text-slate-400 mt-1">
                Các lượt thanh toán tại Sơ đồ bàn sẽ tự động được lưu lại tại đây
              </p>
            </div>
          ) : (
            filteredUsageList.map((usage) => {
              const isExpanded = !!expandedIds[usage.id];

              return (
                <div
                  key={usage.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200 hover:border-amber-300"
                >
                  {/* DÒNG THU GỌN (CHỈ HIỆN THỜI GIAN, SỐ BÀN, TỔNG TIỀN - CLICK ĐỂ MỞ) */}
                  <div
                    onClick={() => toggleExpand(usage.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                      isExpanded ? 'bg-amber-50/40 border-b border-amber-100' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap flex-1 min-w-0">
                      {/* Khung thời gian ngồi */}
                      <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-400">🕒</span>
                        <span>{usage.seatedAt.split(' - ')[0]} ➔ {usage.completedAt.split(' - ')[0]}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold ml-0.5">
                          {usage.durationMinutes} phút
                        </span>
                      </div>

                      {/* Số bàn & Khu vực */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-black text-slate-800 truncate">
                          🪑 {usage.tableName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          usage.area === 'Phòng lạnh'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {usage.area}
                        </span>
                      </div>

                      {/* Tóm tắt số món */}
                      <div className="text-xs text-slate-500 font-medium hidden md:inline-flex items-center gap-1">
                        <span>•</span>
                        <span>{usage.totalItemsCount || usage.items.length} món</span>
                      </div>
                    </div>

                    {/* Tổng tiền & Mũi tên Accordion */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-black text-amber-700">
                          {usage.total.toLocaleString()}đ
                        </div>
                        <div className="text-[10px] text-slate-400 hidden sm:block">
                          {usage.paymentMethod === 'TRANSFER' ? '💳 MBBank QR' : '💵 Tiền mặt'}
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 bg-amber-100 text-amber-800' : ''
                        }`}
                      >
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* PHẦN CHI TIẾT BUNG NỞ (ACCORDION EXPANDED CONTENT) */}
                  {/* ======================================================== */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/50 space-y-4 text-xs animate-fadeIn">
                      {/* Bảng chi tiết từng món đã gọi và thời gian gọi món */}
                      <div>
                        <div className="font-bold text-slate-700 uppercase mb-2 flex items-center justify-between">
                          <span>📋 Chi tiết món ăn & thời gian gọi:</span>
                          <span className="text-slate-400 font-normal">Mã đơn: {usage.orderId}</span>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Tên món</th>
                                <th className="p-2.5 text-center">SL</th>
                                <th className="p-2.5 text-right">Đơn giá</th>
                                <th className="p-2.5 text-right">Thành tiền</th>
                                <th className="p-2.5 text-center">Giờ gọi</th>
                                <th className="p-2.5">Ghi chú món</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {usage.items.map((it, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="p-2.5 font-bold text-slate-800">{it.name}</td>
                                  <td className="p-2.5 text-center font-bold text-amber-700">x{it.qty}</td>
                                  <td className="p-2.5 text-right text-slate-600">{it.price.toLocaleString()}đ</td>
                                  <td className="p-2.5 text-right font-bold text-slate-800">
                                    {(it.price * it.qty).toLocaleString()}đ
                                  </td>
                                  <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                                    {it.orderedAt || usage.seatedAt.split(' - ')[0]}
                                  </td>
                                  <td className="p-2.5 text-slate-500 italic">
                                    {it.itemNote ? (
                                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-medium not-italic">
                                        ✏️ {it.itemNote}
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Thông tin phụ: Ghi chú bàn, Nhân viên, Giảm giá, Tổng tiền */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div className="space-y-1.5 text-slate-600">
                          <div>
                            <span className="font-bold text-slate-700">📌 Ghi chú bàn:</span>{' '}
                            {usage.orderNote || <span className="italic text-slate-400">Không có ghi chú</span>}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">👤 Nhân viên phục vụ:</span>{' '}
                            {usage.staffName}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">🕒 Khung giờ:</span> Từ {usage.seatedAt} đến {usage.completedAt}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-right">
                          <div className="flex justify-between text-slate-500">
                            <span>Tạm tính ({usage.totalItemsCount || usage.items.length} món):</span>
                            <span>{usage.subTotal.toLocaleString()}đ</span>
                          </div>
                          {usage.discount > 0 && (
                            <div className="flex justify-between text-red-500">
                              <span>Giảm giá:</span>
                              <span>-{usage.discount.toLocaleString()}đ</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-800 font-black text-sm pt-1 border-t border-slate-100">
                            <span>Tổng thanh toán:</span>
                            <span className="text-amber-700 text-base">{usage.total.toLocaleString()}đ</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Hình thức: {usage.paymentMethod === 'TRANSFER' ? 'Chuyển khoản MBBank' : 'Tiền mặt'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. NỘI DUNG MỤC 2: LỊCH SỬ BÀN ĐẶT TRƯỚC (ACCORDION CUỘN) */}
      {/* ======================================================== */}
      {subTab === 'RESERVATION' && (
        <div className="space-y-2.5">
          {filteredReservationList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <span className="text-4xl block mb-2">🟣</span>
              <div className="text-sm font-bold text-slate-700">Chưa có lượt đặt bàn nào phù hợp</div>
              <p className="text-xs text-slate-400 mt-1">
                Các lượt đặt lịch tại Sơ đồ bàn sẽ tự động được ghi nhận tại đây
              </p>
            </div>
          ) : (
            filteredReservationList.map((res) => {
              const isExpanded = !!expandedIds[res.id];

              // Badge trạng thái đẹp mắt
              const statusBadges = {
                WAITING: {
                  label: '🟣 Đang chờ khách',
                  classes: 'bg-purple-100 text-purple-800 border-purple-300',
                },
                ARRIVED: {
                  label: '🟢 Đã nhận bàn',
                  classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                },
                CANCELLED_AUTO: {
                  label: '🔴 Tự hủy (Trễ 10p)',
                  classes: 'bg-red-100 text-red-800 border-red-300',
                },
                CANCELLED_MANUAL: {
                  label: '⚪ Hủy thủ công',
                  classes: 'bg-slate-100 text-slate-700 border-slate-300',
                },
              };

              const badge = statusBadges[res.status] || statusBadges.WAITING;

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200 hover:border-purple-300"
                >
                  {/* DÒNG THU GỌN (CHỈ HIỆN GIỜ HẸN, SỐ BÀN, TÊN KHÁCH, TRẠNG THÁI) */}
                  <div
                    onClick={() => toggleExpand(res.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                      isExpanded ? 'bg-purple-50/40 border-b border-purple-100' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap flex-1 min-w-0">
                      {/* Giờ hẹn */}
                      <div className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-900 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <span>⏰</span>
                        <span>{res.reserveTime}</span>
                        <span className="text-[10px] text-purple-600 font-normal">({res.reserveDate})</span>
                      </div>

                      {/* Số bàn & Khu vực */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-black text-slate-800 truncate">
                          🪑 {res.tableName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {res.area}
                        </span>
                      </div>

                      {/* Tên khách & Số điện thoại */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 min-w-0">
                        <span className="font-bold text-slate-900 truncate">👤 {res.customerName}</span>
                        {res.customerPhone && (
                          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                            ({res.customerPhone})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trạng thái & Mũi tên Accordion */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badge.classes}`}>
                        {badge.label}
                      </span>

                      <div
                        className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 bg-purple-100 text-purple-800' : ''
                        }`}
                      >
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* PHẦN CHI TIẾT BUNG NỞ (ACCORDION EXPANDED CONTENT) */}
                  {/* ======================================================== */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/50 space-y-3 text-xs animate-fadeIn border-t border-purple-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="font-bold text-slate-700 text-xs mb-1">📞 Thông tin liên hệ khách:</div>
                          <div>
                            <span className="font-semibold text-slate-600">Họ và tên:</span>{' '}
                            <span className="font-bold text-slate-900">{res.customerName}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Số điện thoại:</span>{' '}
                            <span className="font-mono font-bold text-purple-700">{res.customerPhone || 'Chưa cung cấp'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Giờ đặt hẹn:</span>{' '}
                            <span className="font-bold text-slate-800">{res.reserveTime} ngày {res.reserveDate}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="font-bold text-slate-700 text-xs mb-1">⏱️ Lịch sử trạng thái:</div>
                          <div>
                            <span className="font-semibold text-slate-600">Thời điểm tạo lịch:</span>{' '}
                            <span className="text-slate-700">{res.createdAt}</span>
                          </div>
                          {res.arrivedAt && (
                            <div>
                              <span className="font-semibold text-emerald-700">Khách đã nhận bàn lúc:</span>{' '}
                              <span className="font-bold text-emerald-800">{res.arrivedAt}</span>
                            </div>
                          )}
                          {res.cancelledAt && (
                            <div>
                              <span className="font-semibold text-red-700">Đã hủy lúc:</span>{' '}
                              <span className="font-bold text-red-800">{res.cancelledAt}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-600">Trạng thái:</span>{' '}
                            <span className="font-bold">{badge.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ghi chú yêu cầu của khách khi đặt bàn */}
                      <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                        <span className="font-bold text-amber-900">📝 Yêu cầu / Ghi chú của khách:</span>{' '}
                        <span className="text-slate-700 font-medium">
                          {res.note || <span className="italic text-slate-400">Không có yêu cầu đặc biệt</span>}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

