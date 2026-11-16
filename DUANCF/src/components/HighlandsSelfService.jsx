import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNotification } from './CustomNotification';

// Âm thanh chuông Ding-Dong chuẩn Highlands bằng Web Audio API thuần (Không cần tải file ngoài)
function playDingDongSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Nốt thứ 1: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.9);

    // Nốt thứ 2: C5 (523.25 Hz) cách 0.28 giây
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.28);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.28);
    gain2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.32);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.28);
    osc2.stop(ctx.currentTime + 1.4);
  } catch (err) {
    console.warn('AudioContext không khả dụng:', err);
  }
}

// Tổng số thẻ rung trong hệ thống sạc thông minh (Mặc định 24 thẻ)
const TOTAL_BUZZERS = 24;

export default function HighlandsSelfService({
  menu = [],
  inventory = [],
  staffList = [],
  orders = [],
  tables = [],
  setTables,
  onCompleteOrder,
  onDeductInventory,
  onSwitchToTraditionalPos,
}) {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();

  // 1. Chế độ trạm làm việc (Workstation View):
  // 'CASHIER' (Quầy Order & Thẻ Rung), 'BARISTA' (KDS Pha Chế), 'PICKUP_TV' (Tivi Gọi Số Trả Đồ), 'ZONES' (Sơ Đồ Khu Vực Tự Do)
  const [activeStation, setActiveStation] = useState(() => {
    return localStorage.getItem('HIGHLANDS_ACTIVE_STATION') || 'CASHIER';
  });

  useEffect(() => {
    localStorage.setItem('HIGHLANDS_ACTIVE_STATION', activeStation);
  }, [activeStation]);

  // 2. Danh sách các đơn hàng tự phục vụ đang hoạt động trong chu trình KDS:
  // Trạng thái: 'PREPARING' (Đang pha chế), 'READY_BUZZING' (Đang rung chuông gọi khách), 'COMPLETED' (Đã nhận đồ & trả thẻ)
  const [kdsOrders, setKdsOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('HIGHLANDS_KDS_ORDERS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc HIGHLANDS_KDS_ORDERS:', e);
    }
    // Mặc định ban đầu trống để nhóm tự tạo đơn và kiểm tra dòng chảy dữ liệu
    return [];
  });

  useEffect(() => {
    localStorage.setItem('HIGHLANDS_KDS_ORDERS', JSON.stringify(kdsOrders));
  }, [kdsOrders]);

  // 3. Trạng thái Giỏ hàng tại Quầy Order Thu Ngân
  const [currentCart, setCurrentCart] = useState([]);
  const [selectedBuzzer, setSelectedBuzzer] = useState(null);
  const [orderCustomerType, setOrderCustomerType] = useState('DINE_IN'); // 'DINE_IN' | 'TAKE_AWAY'
  const [selectedStaff, setSelectedStaff] = useState(staffList[0]?.name || 'Tiến Phát');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER_MB'); // CASH, TRANSFER_MB, CARD
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [customBuzzerInput, setCustomBuzzerInput] = useState('');

  // 4. Modal Hóa Đơn & Cấp Thẻ Rung
  const [showBillModal, setShowBillModal] = useState(false);
  const [latestCompletedOrder, setLatestCompletedOrder] = useState(null);

  // 5. Timer thời gian thực đếm giây phục vụ
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 6. Tính toán tình trạng các thẻ rung (Buzzer Pagers Dock):
  // Mỗi thẻ có trạng thái: 'FREE' (Trên dock sạc), 'PREPARING' (Khách giữ, đang pha), 'BUZZING' (Đang rung & chuông)
  const buzzerStatusMap = useMemo(() => {
    const map = {};
    for (let i = 1; i <= TOTAL_BUZZERS; i++) {
      map[i] = { number: i, status: 'FREE', order: null };
    }
    kdsOrders.forEach((o) => {
      if (o.status !== 'COMPLETED' && o.buzzerNo) {
        map[o.buzzerNo] = {
          number: o.buzzerNo,
          status: o.status === 'READY_BUZZING' ? 'BUZZING' : 'PREPARING',
          order: o,
        };
      }
    });
    return map;
  }, [kdsOrders]);

  // Tự động tìm số thẻ rung rảnh kế tiếp để gợi ý cho thu ngân
  const nextAvailableBuzzer = useMemo(() => {
    for (let i = 1; i <= TOTAL_BUZZERS; i++) {
      if (buzzerStatusMap[i]?.status === 'FREE') return i;
    }
    return null;
  }, [buzzerStatusMap]);

  // Nếu thu ngân chưa chọn thẻ rung nào, tự động gán thẻ rảnh kế tiếp
  useEffect(() => {
    if (!selectedBuzzer && nextAvailableBuzzer) {
      setSelectedBuzzer(nextAvailableBuzzer);
    }
  }, [selectedBuzzer, nextAvailableBuzzer]);

  // Danh mục phân loại menu kiểu Highlands
  const categories = useMemo(() => {
    const cats = new Set(['Tất cả']);
    menu.forEach((m) => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [menu]);

  // Lọc danh sách món ăn/nước uống
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCat = selectedCategory === 'Tất cả' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchCat && matchSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Thêm món vào giỏ với tùy chọn cỡ ly (S, M, L)
  const addToCart = (dish, size = 'M') => {
    let sizePriceDelta = 0;
    if (size === 'M') sizePriceDelta = 5000;
    if (size === 'L') sizePriceDelta = 10000;

    const finalPrice = Number(dish.price) + sizePriceDelta;
    const cartItemId = `${dish.id}_${size}`;

    setCurrentCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          id: dish.id,
          name: dish.name,
          category: dish.category || 'Nước uống',
          size,
          price: finalPrice,
          basePrice: dish.price,
          qty: 1,
          note: '',
        },
      ];
    });
  };

  const updateCartQty = (cartItemId, delta) => {
    setCurrentCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateItemNote = (cartItemId, note) => {
    setCurrentCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, note } : item))
    );
  };

  const clearCart = () => {
    setCurrentCart([]);
    setOrderNote('');
  };

  // Tính tổng tiền giỏ hàng
  const subTotal = useMemo(() => {
    return currentCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [currentCart]);

  const total = subTotal; // Có thể mở rộng voucher nếu cần

  // Xử lý tạo đơn hàng tự phục vụ & Cấp thẻ rung
  const handleCheckoutAndIssueBuzzer = () => {
    if (currentCart.length === 0) {
      showWarning('Vui lòng chọn món vào giỏ hàng trước khi thanh toán!');
      return;
    }

    const buzzerToAssign = Number(selectedBuzzer);
    if (!buzzerToAssign || buzzerToAssign < 1 || buzzerToAssign > 99) {
      showWarning('Vui lòng chọn hoặc nhập số thẻ rung hợp lệ!');
      return;
    }

    // Kiểm tra thẻ rung này có đang được đơn nào giữ không
    if (buzzerStatusMap[buzzerToAssign]?.status !== 'FREE') {
      showWarning(`⚠️ Thẻ rung #${buzzerToAssign} hiện đang phục vụ đơn khác! Vui lòng chọn thẻ rảnh khác.`);
      return;
    }

    const orderId = `HL-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString('vi-VN');

    const newKdsOrder = {
      id: orderId,
      buzzerNo: buzzerToAssign,
      customerType: orderCustomerType,
      staffName: selectedStaff,
      status: 'PREPARING', // Đưa ngay vào hàng chờ pha chế Barista
      createdAt: nowIso,
      orderNote,
      items: currentCart.map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        size: it.size,
        qty: it.qty,
        price: it.price,
        itemNote: it.note || '',
      })),
      subTotal,
      total,
      paymentMethod,
    };

    // 1. Thêm vào chu trình Barista KDS
    setKdsOrders((prev) => [newKdsOrder, ...prev]);

    // 2. Ghi nhận doanh thu tự động vào hệ thống chung (RevenueAnalytics)
    const revenueInvoice = {
      id: orderId,
      tableName: `Thẻ Rung #${buzzerToAssign} (${orderCustomerType === 'DINE_IN' ? 'Tại quán' : 'Mang về'})`,
      staffName: selectedStaff,
      items: currentCart.map((it) => ({
        id: it.id,
        name: `${it.name} (${it.size})`,
        price: it.price,
        qty: it.qty,
        category: it.category,
        itemNote: it.note,
      })),
      orderNote: `[Tự phục vụ Highlands - Thẻ #${buzzerToAssign}] ${orderNote}`.trim(),
      subTotal,
      discountAmount: 0,
      vat: 0,
      total,
      paymentMethod,
      createdAt: nowLocal,
      isSelfService: true,
      buzzerNo: buzzerToAssign,
    };

    if (onCompleteOrder) {
      onCompleteOrder(revenueInvoice);
    }

    // 3. Tự động trừ kho nguyên vật liệu
    if (onDeductInventory) {
      onDeductInventory(currentCart);
    }

    // 4. Lưu lại lịch sử sử dụng bàn/thẻ tự phục vụ
    try {
      const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const nowDateStr = new Date().toLocaleDateString('vi-VN');
      const newUsage = {
        id: 'HL-USE-' + Date.now(),
        tableId: `BUZZER-${buzzerToAssign}`,
        tableName: `Thẻ #${buzzerToAssign} (Highlands QSR)`,
        area: orderCustomerType === 'DINE_IN' ? 'Khu Tự Do' : 'Mang Về',
        seatedAt: `${nowTimeStr} - ${nowDateStr}`,
        completedAt: `${nowTimeStr} - ${nowDateStr}`,
        durationMinutes: 15,
        orderId,
        items: newKdsOrder.items,
        totalItemsCount: newKdsOrder.items.reduce((s, it) => s + it.qty, 0),
        subTotal,
        discount: 0,
        total,
        paymentMethod,
        orderNote,
        staffName: selectedStaff,
      };
      const existingRaw = localStorage.getItem('POS_TABLE_USAGE_HISTORY');
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('POS_TABLE_USAGE_HISTORY', JSON.stringify([newUsage, ...existingList]));
    } catch (e) {
      console.warn('Lỗi ghi POS_TABLE_USAGE_HISTORY:', e);
    }

    // Hiển thị hóa đơn thành công
    setLatestCompletedOrder(revenueInvoice);
    setShowBillModal(true);

    // Dọn giỏ hàng & chuyển sang thẻ rung rảnh tiếp theo
    setCurrentCart([]);
    setOrderNote('');
    showSuccess(`Đã thanh toán thành công! Vui lòng trao Thẻ Rung #${buzzerToAssign} cho khách.`);
  };

  // Thao tác Barista: Bấm Rung Thẻ gọi khách
  const handleBuzzPager = (order) => {
    playDingDongSound();

    setKdsOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'READY_BUZZING',
              buzzedAt: new Date().toISOString(),
            }
          : o
      )
    );

    showSuccess(`🔔 Đã kích hoạt RUNG THẺ #${order.buzzerNo} và phát chuông gọi khách đến quầy nhận đồ!`);
  };

  // Thao tác Barista: Khách đã tới nhận đồ & Trả lại thẻ rung
  const handleCompleteAndReturnBuzzer = (order) => {
    setKdsOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'COMPLETED', completedAt: new Date().toISOString() } : o))
    );

    showInfo(`✅ Khách đã nhận đồ & trả lại Thẻ Rung #${order.buzzerNo}. Thẻ đã sẵn sàng để cấp cho đơn mới!`);
  };

  // Tính số lượng đơn đang phục vụ
  const preparingCount = kdsOrders.filter((o) => o.status === 'PREPARING').length;
  const buzzingCount = kdsOrders.filter((o) => o.status === 'READY_BUZZING').length;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER BANNER CHUẨN HIGHLANDS COFFEE */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#8B181B] via-[#A81C20] to-[#5C0F12] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-amber-600/30">
        {/* Họa tiết trang trí phin cà phê chìm */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center font-serif text-9xl font-black">
          ☕
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-200 border border-amber-300/30 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-sm">
              <span>🏆 HIGHLANDS SMART QSR</span>
              <span>•</span>
              <span>MÔ HÌNH TỰ PHỤC VỤ THÔNG MINH</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Hệ Thống Tự Phục Vụ Quán Cà Phê Tiến Phát</span>
            </h1>
            <p className="text-red-100/80 text-xs md:text-sm max-w-2xl leading-relaxed">
              Order tại quầy siêu tốc • Cấp thẻ rung điện tử không dây • Màn hình Barista KDS điều phối • Màn hình Tivi gọi số trả đồ & Giám sát sức chứa khu vực tự do.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-3 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl font-bold">
                ⏳
              </div>
              <div>
                <div className="text-[11px] text-amber-200/80 uppercase font-bold">Đang pha chế</div>
                <div className="text-xl font-black text-white">{preparingCount} đơn</div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-3 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl font-bold animate-pulse">
                🔔
              </div>
              <div>
                <div className="text-[11px] text-emerald-200/80 uppercase font-bold">Đang rung gọi</div>
                <div className="text-xl font-black text-white">{buzzingCount} thẻ</div>
              </div>
            </div>

            <button
              type="button"
              onClick={playDingDongSound}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold px-3.5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-xs"
              title="Thử nghiệm âm thanh chuông Ding-Dong gọi lấy nước"
            >
              <span>🔊</span>
              <span>Thử Chuông</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. THANH TAB ĐIỀU HƯỚNG 4 TRẠM LÀM VIỆC (WORKSTATION SWITCHER) */}
        {/* ======================================================== */}
        <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveStation('CASHIER')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 ${
                activeStation === 'CASHIER'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🛎️</span>
              <span>1. Quầy Thu Ngân & Cấp Thẻ Rung</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStation('BARISTA')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 relative ${
                activeStation === 'BARISTA'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🧑‍🍳</span>
              <span>2. Màn Hình Pha Chế Barista (KDS)</span>
              {preparingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                  {preparingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveStation('PICKUP_TV')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 ${
                activeStation === 'PICKUP_TV'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>📺</span>
              <span>3. Màn Hình Tivi Gọi Số Trả Đồ</span>
              {buzzingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveStation('ZONES')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 ${
                activeStation === 'ZONES'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🪑</span>
              <span>4. Sơ Đồ Không Gian Tự Do</span>
            </button>
          </div>

          {/* Nút chuyển đổi nhanh về chế độ sơ đồ bàn truyền thống nếu cần */}
          {onSwitchToTraditionalPos && (
            <button
              type="button"
              onClick={onSwitchToTraditionalPos}
              className="text-xs text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2.5 rounded-xl transition border border-white/20 font-bold flex items-center gap-2"
              title="Chuyển về xem giao diện sơ đồ bàn truyền thống"
            >
              <span>🔄</span>
              <span>Sơ Đồ Bàn Cũ</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TRẠM 1: QUẦY THU NGÂN & CẤP THẺ RUNG (CASHIER ORDERING) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {activeStation === 'CASHIER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: DOCK THẺ RUNG & THỰC ĐƠN MÓN (8 CỘT) */}
          <div className="lg:col-span-8 space-y-6">
            {/* --- KHAY SẠC THẺ RUNG THÔNG MINH (SMART BUZZER DOCK) --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>📡 KHAY THẺ RUNG TỰ PHỤC VỤ (BUZZER DOCK - {TOTAL_BUZZERS} THẺ)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bấm vào số thẻ để cấp cho khách. Thẻ rung sẽ báo khi Barista pha chế xong.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Rảnh ({Object.values(buzzerStatusMap).filter(b => b.status === 'FREE').length})
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Đang pha ({Object.values(buzzerStatusMap).filter(b => b.status === 'PREPARING').length})
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Đang rung ({Object.values(buzzerStatusMap).filter(b => b.status === 'BUZZING').length})
                  </span>
                </div>
              </div>

              {/* Lưới 24 thẻ rung mô phỏng thực tế */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2.5 pt-2">
                {Array.from({ length: TOTAL_BUZZERS }, (_, i) => i + 1).map((num) => {
                  const buzzer = buzzerStatusMap[num];
                  const isSelected = Number(selectedBuzzer) === num;
                  const isFree = buzzer.status === 'FREE';
                  const isPreparing = buzzer.status === 'PREPARING';
                  const isBuzzing = buzzer.status === 'BUZZING';

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (isFree) {
                          setSelectedBuzzer(num);
                        } else {
                          showInfo(`Thẻ #${num} đang phục vụ đơn ${buzzer.order?.id}. Bạn có thể xem tại màn hình Barista.`);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#8B181B] bg-red-50 text-[#8B181B] shadow-md scale-105 ring-2 ring-red-400 font-black'
                          : isBuzzing
                          ? 'border-rose-500 bg-rose-50 text-rose-700 animate-pulse font-black'
                          : isPreparing
                          ? 'border-amber-400 bg-amber-50/70 text-amber-800 font-bold opacity-80'
                          : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 text-slate-700 font-bold'
                      }`}
                      title={
                        isFree
                          ? `Thẻ #${num} đang rảnh (Bấm để gán cho đơn này)`
                          : isBuzzing
                          ? `Thẻ #${num} ĐANG RUNG GỌI KHÁCH!`
                          : `Thẻ #${num} đang pha chế`
                      }
                    >
                      {/* Đèn LED trên đỉnh thẻ */}
                      <span
                        className={`w-2 h-2 rounded-full mb-1 ${
                          isBuzzing
                            ? 'bg-rose-500 animate-ping'
                            : isPreparing
                            ? 'bg-amber-400'
                            : isFree
                            ? 'bg-emerald-400'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span className="text-xs">#{num}</span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#8B181B] text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Thông tin thẻ đang chọn */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-900">Thẻ đang cấp:</span>
                  <span className="px-3 py-1 bg-[#8B181B] text-white rounded-xl font-black text-sm tracking-wide shadow-sm">
                    THẺ #{selectedBuzzer || 'Chưa chọn'}
                  </span>
                  {selectedBuzzer === nextAvailableBuzzer && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                      ⚡ Thẻ trống gợi ý tốt nhất
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Nhập số thẻ khác:</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={customBuzzerInput}
                    onChange={(e) => setCustomBuzzerInput(e.target.value)}
                    placeholder="Số..."
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(customBuzzerInput, 10);
                      if (val > 0) {
                        setSelectedBuzzer(val);
                        setCustomBuzzerInput('');
                      }
                    }}
                    className="bg-slate-800 text-white px-2.5 py-1 rounded-lg font-bold text-xs hover:bg-slate-700"
                  >
                    Gán
                  </button>
                </div>
              </div>
            </div>

            {/* --- THỰC ĐƠN MÓN & TÙY CHỌN SIZE HIGHLANDS --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              {/* Thanh tìm kiếm & Phân loại danh mục */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh trà sen, phin sữa đá, freeze..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B181B]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-[#8B181B] text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lưới các món ăn thức uống */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto p-1">
                {filteredMenu.map((dish) => (
                  <div
                    key={dish.id}
                    className="bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-[#8B181B] transition leading-snug">
                          {dish.name}
                        </h4>
                        <span className="text-xs font-extrabold text-[#8B181B] whitespace-nowrap">
                          {Number(dish.price).toLocaleString()}đ
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                        {dish.recipe || dish.category || 'Món đặc trưng'}
                      </p>
                    </div>

                    {/* Nút bấm chọn Size S - M - L chuẩn Highlands */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-400 font-bold">Cỡ ly:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addToCart(dish, 'S')}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-[10px] font-black border border-slate-200 shadow-xs"
                          title="Cỡ Nhỏ (S) - Giá gốc"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(dish, 'M')}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black border border-amber-300 shadow-xs"
                          title="Cỡ Vừa (M) - Thêm 5.000đ"
                        >
                          M (+5k)
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCart(dish, 'L')}
                          className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-[10px] font-black border border-red-300 shadow-xs"
                          title="Cỡ Lớn (L) - Thêm 10.000đ"
                        >
                          L (+10k)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: GIỎ HÀNG ORDER & THANH TOÁN (4 CỘT) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span>🧾 ĐƠN ORDER TẠI QUẦY</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Thẻ Rung: <span className="font-extrabold text-[#8B181B]">#{selectedBuzzer || 'Chưa gán'}</span>
                  </div>
                </div>

                {currentCart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Xóa hết
                  </button>
                )}
              </div>

              {/* Tùy chọn DÙNG TẠI QUÁN vs MANG ĐI */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOrderCustomerType('DINE_IN')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    orderCustomerType === 'DINE_IN'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>☕</span>
                  <span>Uống Tại Quán</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderCustomerType('TAKE_AWAY')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    orderCustomerType === 'TAKE_AWAY'
                      ? 'bg-[#8B181B] text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🛍️</span>
                  <span>Mang Đi (Take Away)</span>
                </button>
              </div>

              {/* Danh sách món trong giỏ */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {currentCart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <div className="text-3xl mb-2">🛎️</div>
                    <div>Chưa có món nào trong giỏ</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Chọn món và cỡ ly S/M/L bên trái để bắt đầu
                    </div>
                  </div>
                ) : (
                  currentCart.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-slate-800">
                            {item.name}
                            <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-[10px]">
                              Size {item.size}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8B181B] font-bold mt-0.5">
                            {item.price.toLocaleString()}đ
                          </div>
                        </div>

                        {/* Nút tăng giảm số lượng */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.cartItemId, -1)}
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-black text-slate-800 text-xs">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.cartItemId, 1)}
                            className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Ghi chú đá đường riêng cho từng ly */}
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => updateItemNote(item.cartItemId, e.target.value)}
                        placeholder="Ghi chú: Ít đá, không đường, thạch riêng..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Ghi chú chung của toàn đơn */}
              <div>
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ghi chú toàn đơn (ví dụ: giao chung khay, gấp)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Hình thức thanh toán</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER_MB')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black border transition flex flex-col items-center gap-0.5 ${
                      paymentMethod === 'TRANSFER_MB'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>📱</span>
                    <span>QR MBBank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black border transition flex flex-col items-center gap-0.5 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>💵</span>
                    <span>Tiền Mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black border transition flex flex-col items-center gap-0.5 ${
                      paymentMethod === 'CARD'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>💳</span>
                    <span>Thẻ / POS</span>
                  </button>
                </div>
              </div>

              {/* Tổng tiền & Nút xác nhận cấp thẻ rung */}
              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-[#8B181B]">
                    {total.toLocaleString()} VNĐ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutAndIssueBuzzer}
                  disabled={currentCart.length === 0}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 ${
                    currentCart.length > 0
                      ? 'bg-gradient-to-r from-[#8B181B] to-[#B91C1C] hover:from-[#731316] hover:to-[#991B1B] text-white shadow-red-950/20 active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>🛎️</span>
                  <span>Thanh Toán & Cấp Thẻ #{selectedBuzzer || '...'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TRẠM 2: MÀN HÌNH BARISTA KDS (KITCHEN DISPLAY SYSTEM) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {activeStation === 'BARISTA' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>🧑‍🍳 MÀN HÌNH ĐIỀU PHỐI PHA CHẾ BARISTA (KDS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pha chế theo thứ tự thẻ rung. Khi xong bấm <b>"RUNG THẺ GỌI KHÁCH"</b> để chuông kêu và màn hình Tivi báo nhận nước.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>Chờ pha: {preparingCount} đơn</span>
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Đang rung chờ lấy: {buzzingCount} thẻ</span>
              </span>
            </div>
          </div>

          {/* Lưới các thẻ đơn KDS */}
          {kdsOrders.filter((o) => o.status !== 'COMPLETED').length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="text-5xl">☕✨</div>
              <h4 className="text-base font-extrabold text-slate-700">Tất cả đơn đã được pha chế và trả thẻ xong!</h4>
              <p className="text-xs text-slate-400">
                Khi có đơn mới từ Quầy Thu Ngân, thẻ đơn sẽ tự động hiển thị tại đây kèm số thẻ rung.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kdsOrders
                .filter((o) => o.status !== 'COMPLETED')
                .map((order) => {
                  const elapsedMs = nowTick - new Date(order.createdAt).getTime();
                  const elapsedMins = Math.floor(elapsedMs / 60000);
                  const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);
                  const isLate = elapsedMins >= 5;
                  const isBuzzing = order.status === 'READY_BUZZING';

                  return (
                    <div
                      key={order.id}
                      className={`rounded-3xl p-5 border-2 shadow-md transition-all flex flex-col justify-between ${
                        isBuzzing
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-emerald-500/10'
                          : isLate
                          ? 'bg-rose-50/70 border-rose-500 shadow-rose-500/10 animate-pulse'
                          : 'bg-white border-amber-300 shadow-amber-500/5'
                      }`}
                    >
                      {/* Thẻ Header: Số thẻ rung to khổng lồ */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3 border-b pb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${
                                isBuzzing
                                  ? 'bg-emerald-600 text-white animate-bounce'
                                  : 'bg-[#8B181B] text-amber-300'
                              }`}
                            >
                              <span className="text-[10px] leading-none opacity-80">THẺ</span>
                              <span className="text-2xl leading-none font-black mt-0.5">
                                #{order.buzzerNo}
                              </span>
                            </div>

                            <div>
                              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <span>{order.id}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    order.customerType === 'DINE_IN'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {order.customerType === 'DINE_IN' ? 'Tại quán' : 'Mang đi'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                NV: {order.staffName || 'Tiến Phát'}
                              </div>
                            </div>
                          </div>

                          {/* Bộ đếm thời gian chờ */}
                          <div className="text-right">
                            <div
                              className={`text-xs font-black px-2.5 py-1 rounded-xl inline-block ${
                                isLate
                                  ? 'bg-rose-600 text-white'
                                  : elapsedMins >= 3
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              ⏱️ {elapsedMins}p {String(elapsedSecs).padStart(2, '0')}s
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Danh sách các ly nước cần pha */}
                        <div className="space-y-2 py-1">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/80 text-xs"
                            >
                              <div className="flex items-center justify-between font-black text-slate-800">
                                <span>
                                  {it.qty}x {it.name}
                                </span>
                                <span className="px-2 py-0.5 bg-amber-200/70 text-amber-950 rounded font-black text-[10px]">
                                  Size {it.size || 'M'}
                                </span>
                              </div>
                              {it.itemNote && (
                                <div className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  ⚠️ {it.itemNote}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {order.orderNote && (
                          <div className="text-xs bg-amber-50 p-2 rounded-xl text-amber-900 border border-amber-200 font-medium">
                            📝 {order.orderNote}
                          </div>
                        )}
                      </div>

                      {/* Nút bấm hành động của Barista */}
                      <div className="mt-4 pt-3 border-t space-y-2">
                        {!isBuzzing ? (
                          <button
                            type="button"
                            onClick={() => handleBuzzPager(order)}
                            className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2 active:scale-98"
                          >
                            <span>🔔</span>
                            <span>Pha Xong • Rung Thẻ #{order.buzzerNo}</span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-center text-xs font-black border border-emerald-300 animate-pulse">
                              📡 ĐANG RUNG & KÊU CHUÔNG GỌI KHÁCH...
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => playDingDongSound()}
                                className="py-2.5 px-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center gap-1"
                              >
                                <span>🔊</span>
                                <span>Rung Lại</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteAndReturnBuzzer(order)}
                                className="py-2.5 px-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-sm"
                              >
                                <span>✅</span>
                                <span>Đã Trả Thẻ</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TRẠM 3: MÀN HÌNH TIVI GỌI SỐ TRẢ ĐỒ (PICKUP DISPLAY TV) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {activeStation === 'PICKUP_TV' && (
        <div className="bg-slate-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800 space-y-6">
          {/* Topbar của màn hình Tivi */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8B181B] text-amber-300 flex items-center justify-center font-black text-sm">
                HL
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black tracking-wide text-amber-400 uppercase">
                  Màn Hình Gọi Nhận Đồ • Quầy Trả Nước
                </h3>
                <p className="text-xs text-slate-400">
                  Pickup Counter Display System • Chế độ chiếu màn hình TV công cộng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-amber-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
                🕒 {new Date(nowTick).toLocaleTimeString('vi-VN')}
              </div>
              <button
                type="button"
                onClick={() => {
                  const elem = document.documentElement;
                  if (!document.fullscreenElement) {
                    elem.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <span>🖥️</span>
                <span>Toàn Màn Hình TV</span>
              </button>
            </div>
          </div>

          {/* Hai Cột Lớn: ĐANG PHA CHẾ vs MỜI NHẬN ĐỒ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[420px]">
            {/* CỘT 1: ĐANG PHA CHẾ (PREPARING) */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>⏳ ĐANG CHUẨN BỊ (PREPARING)</span>
                  </h4>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold">
                    {preparingCount} đơn
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {kdsOrders
                    .filter((o) => o.status === 'PREPARING')
                    .map((order) => (
                      <div
                        key={order.id}
                        className="bg-slate-800/80 rounded-2xl p-4 border border-amber-500/30 text-center space-y-1 shadow-inner"
                      >
                        <div className="text-[10px] text-amber-400 font-bold uppercase">Thẻ</div>
                        <div className="text-3xl font-black text-white font-mono">
                          #{order.buzzerNo}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{order.id}</div>
                      </div>
                    ))}

                  {preparingCount === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                      Không có đơn đang chờ pha
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-center italic">
                Quý khách vui lòng giữ thẻ rung và chờ trong giây lát...
              </div>
            </div>

            {/* CỘT 2: MỜI NHẬN ĐỒ (READY FOR PICKUP) */}
            <div className="bg-gradient-to-b from-emerald-950/60 to-slate-900 rounded-3xl p-6 border-2 border-emerald-500/50 space-y-5 flex flex-col justify-between shadow-2xl shadow-emerald-950/40">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                  <h4 className="text-base font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <span>🔔 MỜI NHẬN ĐỒ (READY FOR PICKUP)</span>
                  </h4>
                  <span className="text-xs bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full font-black animate-pulse">
                    {buzzingCount} sẵn sàng
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {kdsOrders
                    .filter((o) => o.status === 'READY_BUZZING')
                    .map((order) => (
                      <div
                        key={order.id}
                        className="bg-emerald-900/50 rounded-3xl p-5 border-2 border-emerald-400 text-center space-y-1 shadow-xl animate-pulse"
                      >
                        <div className="text-xs text-emerald-300 font-extrabold uppercase tracking-widest">
                          MỜI THẺ SỐ
                        </div>
                        <div className="text-5xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-md">
                          #{order.buzzerNo}
                        </div>
                        <div className="text-[11px] text-emerald-200/80 font-bold">
                          Đến Quầy Nhận Nước
                        </div>
                      </div>
                    ))}

                  {buzzingCount === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                      Chưa có đồ uống mới hoàn thành
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-center text-xs text-emerald-300 font-bold">
                🎉 Khi thẻ rung và phát chuông, kính mời Quý khách mang thẻ đến Quầy Nhận Nước để đổi đồ uống!
              </div>
            </div>
          </div>

          {/* Dải thông báo chạy chân trang (Marquee News Ticker) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-amber-200/90 font-medium overflow-hidden whitespace-nowrap">
            <span className="animate-marquee inline-block">
              ☕ Chào mừng Quý khách đến với Cà Phê Tiến Phát • Mô hình tự phục vụ thông minh Highlands QSR • Thưởng thức Cà phê Phin nguyên bản, Freeze đá xay & Trà Sen Vàng thượng hạng • Wifi miễn phí: TienPhat_Coffee (Pass: 88888888) • Hotline hỗ trợ: 0905.292.193.
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TRẠM 4: SƠ ĐỒ KHÔNG GIAN & CHỖ NGỒI TỰ DO (ZONE CAPACITY) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {activeStation === 'ZONES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <span>🪑 GIÁM SÁT KHÔNG GIAN & SỨC CHỨA CHỖ NGỒI (ZONE CAPACITY)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Trong mô hình Highlands, khách hàng tự do chọn chỗ ngồi sau khi lấy thẻ rung. Nhân viên theo dõi tỷ lệ lấp đầy để hướng dẫn khách đến khu vực còn bàn trống.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                  🟢 Nhiều chỗ trống (&lt;50%)
                </span>
                <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
                  🟡 Đông khách (50-80%)
                </span>
                <span className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200">
                  🔴 Gần kín chỗ (&gt;80%)
                </span>
              </div>
            </div>

            {/* Các khu vực chính của quán */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Khu vực 1: Tầng trệt máy lạnh */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">❄️</span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">Tầng Trệt Máy Lạnh</h4>
                      <p className="text-[11px] text-slate-500">Khu vực mát mẻ, làm việc & trò chuyện</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    73%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Đang ngồi: 22 chỗ</span>
                    <span>Sức chứa: 30 chỗ</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '73%' }}></div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">💡 Gợi ý tư vấn khách:</div>
                  <div className="text-[11px] text-slate-500">
                    Còn khoảng 4 bàn đôi trống gần quầy bar. Phù hợp khách đi 1-2 người.
                  </div>
                </div>
              </div>

              {/* Khu vực 2: Ban công ngắm phố */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌆</span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">Ban Công Tầng 2</h4>
                      <p className="text-[11px] text-slate-500">View ngắm đường phố, gió tự nhiên</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    40%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Đang ngồi: 8 chỗ</span>
                    <span>Sức chứa: 20 chỗ</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">💡 Gợi ý tư vấn khách:</div>
                  <div className="text-[11px] text-slate-500">
                    Rất nhiều chỗ thoáng mát. Phù hợp nhóm bạn từ 3-6 người ngắm hoàng hôn.
                  </div>
                </div>
              </div>

              {/* Khu vực 3: Sân vườn ngoài trời */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌿</span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">Sân Vườn Xanh</h4>
                      <p className="text-[11px] text-slate-500">Cây xanh thoáng đãng, hút thuốc</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    52%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Đang ngồi: 13 chỗ</span>
                    <span>Sức chứa: 25 chỗ</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '52%' }}></div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">💡 Gợi ý tư vấn khách:</div>
                  <div className="text-[11px] text-slate-500">
                    Còn khoảng 3 bàn nhóm tròn ngoài trời. Không gian yên tĩnh, mát mẻ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL XÁC NHẬN HÓA ĐƠN HIGHLANDS & TRAO THẺ RUNG */}
      {/* ======================================================== */}
      {showBillModal && latestCompletedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#8B181B] to-[#B91C1C] p-5 text-white text-center space-y-1 relative">
              <div className="inline-block px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-full text-xs uppercase tracking-wider mb-1">
                🎉 THANH TOÁN THÀNH CÔNG
              </div>
              <h3 className="text-xl font-black">PHIẾU BÁO NHẬN MÓN</h3>
              <p className="text-xs text-red-100">Tiến Phát Coffee • Mô hình Tự Phục Vụ</p>
            </div>

            {/* Khối Thẻ Rung To Khổng Lồ Để Nhân Viên & Khách Cùng Thấy */}
            <div className="p-6 text-center space-y-4">
              <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-3xl p-5 space-y-1">
                <div className="text-xs text-amber-800 font-extrabold uppercase tracking-widest">
                  SỐ THẺ RUNG ĐƯỢC CẤP
                </div>
                <div className="text-6xl font-black text-[#8B181B] font-mono tracking-tight">
                  #{latestCompletedOrder.buzzerNo}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Vui lòng giao thiết bị Thẻ Rung #{latestCompletedOrder.buzzerNo} cho khách hàng
                </div>
              </div>

              {/* Chi tiết đơn */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Mã đơn:</span>
                  <span className="font-mono text-slate-900">{latestCompletedOrder.id}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Thời gian:</span>
                  <span className="text-slate-900">{latestCompletedOrder.createdAt}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>Thanh toán:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {latestCompletedOrder.paymentMethod === 'TRANSFER_MB'
                      ? 'Chuyển khoản MBBank'
                      : latestCompletedOrder.paymentMethod === 'CASH'
                      ? 'Tiền mặt'
                      : 'Thẻ / POS'}
                  </span>
                </div>

                <div className="border-t pt-2 space-y-1">
                  {latestCompletedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>
                        {it.qty}x {it.name}
                      </span>
                      <span className="font-bold">{(it.price * it.qty).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2 flex justify-between text-sm font-black text-[#8B181B]">
                  <span>Tổng tiền:</span>
                  <span>{latestCompletedOrder.total.toLocaleString()} VNĐ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>In Phiếu Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#701315] text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Đã Trao Thẻ (Xong)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

