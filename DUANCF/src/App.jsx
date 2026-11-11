import React, { useState, useEffect } from 'react';
import PosArea from './components/PosArea';
import ShiftManagement from './components/ShiftManagement';
import Payroll from './components/Payroll';
import RecipeManagement from './components/RecipeManagement';
import TableHistory from './components/TableHistory';
import RevenueAnalytics from './components/RevenueAnalytics';
import InventoryManagement from './components/InventoryManagement';
import { INITIAL_TABLES, INITIAL_MENU, INITIAL_STAFF, INITIAL_INVENTORY } from './data/initialData';
import { NotificationProvider, useNotification } from './components/CustomNotification';
import {
  checkBackendStatus,
  apiGetTables,
  apiGetProducts,
  apiGetOrders,
  apiCreateOrder,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
} from './services/api';

function MainApp() {
  const [activeTab, setActiveTab] = useState('pos');
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('POS_TABLES_DATA');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  // Trạng thái kết nối tới Backend Node.js / Supabase
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });

  // Tự động kiểm tra và đồng bộ dữ liệu từ Supabase Backend khi khởi động
  useEffect(() => {
    async function syncWithBackend() {
      const status = await checkBackendStatus();
      setBackendStatus({ online: status.online, checking: false });

      if (status.online) {
        try {
          const [dbTables, dbProducts, dbOrders] = await Promise.allSettled([
            apiGetTables(),
            apiGetProducts(),
            apiGetOrders(),
          ]);

          if (dbTables.status === 'fulfilled' && dbTables.value?.length > 0) {
            setTables(dbTables.value);
          }
          if (dbProducts.status === 'fulfilled' && dbProducts.value?.length > 0) {
            setMenu(dbProducts.value);
          }
          if (dbOrders.status === 'fulfilled' && dbOrders.value?.length > 0) {
            setOrders(dbOrders.value);
          }
        } catch (e) {
          console.warn('⚠️ Lỗi khi đồng bộ dữ liệu từ Backend:', e);
        }
      }
    }
    syncWithBackend();
  }, []);

  // Tự động lưu danh sách bàn vào localStorage khi thêm/xóa bàn
  useEffect(() => {
    localStorage.setItem('POS_TABLES_DATA', JSON.stringify(tables));
  }, [tables]);

  // Trạng thái thu gọn / mở rộng của sidebar bên trái (mặc định mở, lưu vào localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('POS_SIDEBAR_OPEN');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Đồng hồ thời gian thực trên thanh tiêu đề
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  useEffect(() => {
    localStorage.setItem('POS_SIDEBAR_OPEN', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tải danh sách menu từ localStorage nếu có, nếu chưa có sẽ lấy INITIAL_MENU chuẩn
  const [menu, setMenu] = useState(() => {
    try {
      const savedMenu = localStorage.getItem('POS_MENU_DATA');
      if (savedMenu) {
        const parsed = JSON.parse(savedMenu);
        // Nếu đã có thực đơn đầy đủ (từ 10 món trở lên), dùng dữ liệu này; nếu rỗng thì nạp 25 món khảo sát
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_MENU;
  });

  const handleResetMenu = () => {
    showConfirm('Bạn có chắc muốn khôi phục lại toàn bộ 25 món thực đơn chuẩn được khảo sát không?', () => {
      setMenu(INITIAL_MENU);
      localStorage.setItem('POS_MENU_DATA', JSON.stringify(INITIAL_MENU));
      showSuccess('Đã khôi phục thành công 25 món thực đơn chuẩn!');
    });
  };

  const [staffList] = useState(INITIAL_STAFF);
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('POS_ORDERS_DATA');
    return saved ? JSON.parse(saved) : [];
  });
  const [shiftLogs, setShiftLogs] = useState([]);

  // Quản lý Kho nguyên vật liệu khởi tạo
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_INVENTORY_DATA');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_INVENTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('POS_INVENTORY_DATA', JSON.stringify(inventory));
    } catch (e) {}
  }, [inventory]);

  // Tự động trừ kho nguyên vật liệu theo định lượng khi hoàn tất thanh toán hóa đơn
  const handleDeductInventory = (orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) return;
    setInventory((prev) => {
      let updated = [...prev];
      orderItems.forEach((ordItem) => {
        const dish = menu.find((m) => m.name === ordItem.name || m.id === ordItem.id);
        if (dish && Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach((ing) => {
            const neededAmount = (Number(ing.amount) || 0) * (Number(ordItem.qty) || 1);
            const targetIdx = updated.findIndex(
              (inv) => inv.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
            );
            if (targetIdx !== -1) {
              const currentStock = updated[targetIdx].stock;
              updated[targetIdx] = {
                ...updated[targetIdx],
                stock: Math.max(0, currentStock - neededAmount),
              };
            }
          });
        }
      });
      return updated;
    });
  };

  const { showSuccess, showConfirm } = useNotification();

  // Mỗi khi menu thay đổi, tự động lưu vào localStorage vĩnh viễn (kèm cơ chế phòng vệ chống tràn quota)
  useEffect(() => {
    try {
      localStorage.setItem('POS_MENU_DATA', JSON.stringify(menu));
    } catch (e) {
      console.warn('⚠️ Bộ nhớ localStorage đạt giới hạn, dữ liệu đang được ưu tiên lưu trên Supabase DB:', e.message);
    }
  }, [menu]);

  // Lưu danh sách hóa đơn vào localStorage
  useEffect(() => {
    localStorage.setItem('POS_ORDERS_DATA', JSON.stringify(orders));
  }, [orders]);

  const handleAddDish = async (newDish) => {
    // Thêm tạm vào UI để phản hồi tức thì
    setMenu((prev) => [...prev, newDish]);

    // Đồng bộ trực tiếp vào Supabase Database qua API
    try {
      const created = await apiCreateProduct({
        name: newDish.name,
        price: Number(newDish.price),
        category: newDish.category || 'Khác',
        image: newDish.image,
        recipe: newDish.recipe || '',
      });

      if (created && created.id) {
        // Cập nhật lại món với ID thật từ Supabase DB
        setMenu((prev) =>
          prev.map((item) => (item.id === newDish.id ? created : item))
        );
      }
      showSuccess(`Đã lưu món "${newDish.name}" vào Supabase Database thành công!`);
    } catch (err) {
      console.warn('⚠️ Backend chưa chạy hoặc lỗi kết nối, lưu tạm tại LocalStorage:', err.message);
      showSuccess(`Đã thêm món "${newDish.name}" vào thực đơn (Lưu cục bộ)!`);
    }
  };

  const handleUpdateDish = async (dishId, updatedData) => {
    // Cập nhật ngay trên UI
    setMenu((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, ...updatedData } : item))
    );

    // Đồng bộ cập nhật lên Supabase Database
    try {
      const updated = await apiUpdateProduct(dishId, {
        name: updatedData.name,
        price: Number(updatedData.price),
        category: updatedData.category || 'Khác',
        image: updatedData.image,
        recipe: updatedData.recipe || '',
      });

      if (updated && updated.id) {
        setMenu((prev) =>
          prev.map((item) => (item.id === dishId ? { ...item, ...updated } : item))
        );
      }
      showSuccess(`Đã cập nhật món "${updatedData.name}" vào Supabase Database thành công!`);
    } catch (err) {
      console.warn('⚠️ Lỗi cập nhật lên DB, đã lưu cục bộ:', err.message);
      showSuccess(`Đã cập nhật món "${updatedData.name}" (Lưu cục bộ)!`);
    }
  };

  const handleDeleteDish = (dishId) => {
    const targetDish = menu.find((item) => item.id === dishId);
    const dishName = targetDish ? targetDish.name : 'món này';

    showConfirm({
      title: 'Xóa Món Khỏi Thực Đơn',
      message: `Bạn có chắc chắn muốn xóa "${dishName}" khỏi hệ thống không? Dữ liệu công thức pha chế của món cũng sẽ bị gỡ bỏ.`,
      confirmText: 'Xác nhận xóa',
      cancelText: 'Giữ lại',
      type: 'danger',
      onConfirm: async () => {
        setMenu((prev) => prev.filter((item) => item.id !== dishId));

        // Đồng bộ xóa trên Supabase DB
        try {
          await apiDeleteProduct(dishId);
          showSuccess(`Đã xóa "${dishName}" khỏi Supabase Database!`);
        } catch (err) {
          console.warn('⚠️ Lỗi xóa trên DB:', err.message);
          showSuccess(`Đã xóa "${dishName}" khỏi thực đơn!`);
        }
      },
    });
  };

  const handleCompleteOrder = async (newOrder) => {
    // 1. Cập nhật state nội bộ ngay lập tức để giao diện mượt mà
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Gửi lưu trực tiếp vào Supabase PostgreSQL qua Backend MVC
    if (backendStatus.online) {
      try {
        await apiCreateOrder({
          id: newOrder.id,
          tableId: newOrder.tableId,
          staffId: newOrder.staffId,
          subTotal: newOrder.subTotal,
          discount: newOrder.discount,
          vat: newOrder.vat,
          total: newOrder.total,
          paymentMethod: newOrder.paymentMethod,
          orderNote: newOrder.orderNote,
          items: (newOrder.items || []).map((it) => ({
            productId: it.id || it.productId,
            name: it.name,
            price: it.price,
            qty: it.qty,
            itemNote: it.itemNote || '',
            category: it.category,
          })),
        });
      } catch (err) {
        console.warn('⚠️ Backend chưa phản hồi, đơn hàng đã được lưu an toàn tại LocalStorage:', err.message);
      }
    }
  };

  // Xóa đơn hàng của lượt bàn: trừ doanh thu và chuyển nguyên liệu đã pha chế vào kho hao hụt
  const handleDeleteOrderAndRecordWastage = (targetSession) => {
    const targetId = targetSession.orderId || targetSession.id;

    // 1. Trừ doanh thu: Xóa đơn hàng khỏi state orders
    setOrders((prev) =>
      prev.filter((o) => o.id !== targetId && o.code !== targetId)
    );

    // 2. Chuyển nguyên liệu đã dùng của bàn vào mục Quản Lý Kho Hao Hụt (POS_AUDIT_HISTORY)
    const wastedEntries = [];
    if (Array.isArray(targetSession.items) && targetSession.items.length > 0) {
      targetSession.items.forEach((it) => {
        const dish = menu.find((m) => m.name === it.name || m.id === it.id);
        const ings = (dish && dish.ingredients) || it.ingredients || [];
        ings.forEach((ing) => {
          const qty = Number(it.qty) || 1;
          const ingAmount = (Number(ing.amount) || 1) * qty;
          const invItem = inventory.find(
            (inv) => inv.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
          );
          const unitCost = invItem?.unitCost || 120;
          const lossCost = Math.round(ingAmount * unitCost);

          wastedEntries.push({
            id: `WASTE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            ingName: ing.name,
            theoryStock: invItem ? invItem.stock : 0,
            actualStock: invItem ? invItem.stock : 0,
            diff: -ingAmount,
            unit: ing.unit || invItem?.unit || 'g/ml',
            lossAmount: lossCost,
            reason: `Hao hụt do XÓA LỊCH SỬ BÀN: ${targetSession.tableName} (Đơn: ${targetId})`,
            status: 'ABNORMAL',
          });
        });
      });
    }

    if (wastedEntries.length > 0) {
      try {
        const existingRaw = localStorage.getItem('POS_AUDIT_HISTORY');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem('POS_AUDIT_HISTORY', JSON.stringify([...wastedEntries, ...existing]));
      } catch (err) {
        console.warn('Lỗi ghi hao hụt vào POS_AUDIT_HISTORY:', err);
      }
    }
  };

  // Làm mới dữ liệu từ server backend
  const handleRefreshAllData = async () => {
    const status = await checkBackendStatus();
    setBackendStatus({ online: status.online, checking: false });
    if (status.online) {
      try {
        const [dbTables, dbProducts, dbOrders] = await Promise.allSettled([
          apiGetTables(),
          apiGetProducts(),
          apiGetOrders(),
        ]);
        if (dbTables.status === 'fulfilled' && dbTables.value?.length > 0) {
          setTables(dbTables.value);
        }
        if (dbProducts.status === 'fulfilled' && dbProducts.value?.length > 0) {
          setMenu(dbProducts.value);
        }
        if (dbOrders.status === 'fulfilled' && dbOrders.value?.length > 0) {
          setOrders(dbOrders.value);
        }
      } catch (e) {
        console.warn('⚠️ Lỗi khi đồng bộ dữ liệu từ Backend:', e);
      }
    }
  };

  const handleAddShiftLog = (newLog) => {
    setShiftLogs((prev) => [newLog, ...prev]);
  };

  // Danh mục 4 Tab chức năng
  const navItems = [
    {
      id: 'pos',
      label: 'Sơ Đồ Bàn & Order',
      icon: '🛒',
      desc: 'Bán hàng, gộp bàn & hóa đơn',
    },
    {
      id: 'tableHistory',
      label: 'Lịch Sử Bàn & Hóa Đơn',
      icon: '🕒',
      desc: 'Bàn phục vụ & in lại bill',
    },
    {
      id: 'revenue',
      label: 'Doanh Thu 12 Tháng',
      icon: '📊',
      desc: 'Lời/lỗ 12 tháng & biểu đồ',
    },
    {
      id: 'inventory',
      label: 'Quản Lý Kho & Hao Hụt',
      icon: '📦',
      desc: 'Nhập xuất & định lượng trừ kho',
    },
    {
      id: 'recipe',
      label: 'Quản Lý Công Thức',
      icon: '📖',
      desc: 'Thực đơn & công thức pha chế',
    },
    {
      id: 'shift',
      label: 'Chấm Công & Chốt Ca',
      icon: '⏰',
      desc: 'Quản lý ca trực & tiền két',
    },
    {
      id: 'payroll',
      label: 'Bảng Tính Lương NV',
      icon: '💵',
      desc: 'Lương giờ & hoa hồng',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-x-hidden">
      {/* ======================================================== */}
      {/* SIDEBAR BÊN TRÁI CHO PHÉP THU VÀO / THỤT RA THÔNG MINH */}
      {/* ======================================================== */}
      <aside
        className={`bg-[#0f172a] text-slate-100 flex flex-col justify-between border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out z-40 fixed top-0 bottom-0 left-0 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Phần trên: Logo thương hiệu & Nút thu gọn */}
        <div>
          {/* Header Sidebar */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2 min-h-[72px]">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl border-2 border-amber-500 overflow-hidden bg-amber-950 flex items-center justify-center font-black text-amber-400 text-sm shadow-md flex-shrink-0">
                  CF
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-black text-amber-400 uppercase tracking-wider truncate">
                    Tiến Phát Café
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">Hệ thống POS Thu ngân</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl border-2 border-amber-500 overflow-hidden bg-amber-950 flex items-center justify-center font-black text-amber-400 text-sm shadow-md mx-auto">
                CF
              </div>
            )}

            {/* Nút bấm thụt ra thụt vào ở đầu sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Thu gọn menu (Thuột vào)' : 'Mở rộng menu (Thuột ra)'}
              className={`w-8 h-8 rounded-xl bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs shadow transition flex-shrink-0 ${
                !isSidebarOpen ? 'hidden' : ''
              }`}
            >
              ◀
            </button>
          </div>

          {/* Danh sách các Tab chức năng */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center rounded-2xl transition-all duration-200 group text-left relative ${
                    isSidebarOpen ? 'px-3.5 py-3 gap-3.5' : 'p-3 justify-center'
                  } ${
                    isActive
                      ? 'bg-amber-600 text-white font-extrabold shadow-lg shadow-amber-900/40 ring-1 ring-amber-400/50'
                      : 'text-slate-400 hover:bg-slate-800/90 hover:text-white font-semibold'
                  }`}
                >
                  <span
                    className={`text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'scale-110' : ''
                    }`}
                  >
                    {item.icon}
                  </span>

                  {isSidebarOpen && (
                    <div className="min-w-0 flex-1">
                      <div className="text-xs tracking-wide truncate">{item.label}</div>
                      <div
                        className={`text-[10px] font-normal truncate mt-0.5 ${
                          isActive ? 'text-amber-100 opacity-90' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  )}

                  {/* Thanh chỉ báo active bên cạnh khi sidebar đang thu gọn */}
                  {!isSidebarOpen && isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Phần dưới: Nút thu gọn / mở rộng đáy và thông tin liên hệ */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
              !isSidebarOpen ? 'px-0' : ''
            }`}
            title={isSidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}
          >
            <span className="text-sm">{isSidebarOpen ? '◀' : '▶'}</span>
            {isSidebarOpen && <span>Thu gọn Menu</span>}
          </button>

          {isSidebarOpen && (
            <div className="mt-3 px-1 text-[10px] text-slate-500 leading-tight">
              <div>📍 Tiên Sơn núi vip pro</div>
              <div className="mt-0.5">📞 Hotline: 0905292193</div>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* PHẦN NỘI DUNG CHÍNH (MAIN AREA) DỊCH CHUYỂN THEO SIDEBAR */}
      {/* ======================================================== */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Navbar Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Nút Hamburger bật/tắt sidebar từ thanh trên */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-bold text-sm"
              title="Đóng / Mở menu trái"
            >
              ☰
            </button>

            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <span>{navItems.find((t) => t.id === activeTab)?.icon}</span>
                <span>{navItems.find((t) => t.id === activeTab)?.label}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {navItems.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>
          </div>

          {/* Góc phải Topbar: Trạng thái Supabase, Đồng hồ & Quán Café Info */}
          <div className="flex items-center gap-3 text-xs">
            {backendStatus.online ? (
              <div
                className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                title="Đang kết nối trực tiếp với Backend Prisma & Database Supabase PostgreSQL"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>🟢 Supabase Online</span>
              </div>
            ) : (
              <div
                className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                title="Backend chưa bật. Dữ liệu đang được lưu an toàn tại bộ nhớ cục bộ"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>🟡 Local Offline</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-mono font-bold">
              <span>🕒</span>
              <span>{currentTime}</span>
            </div>

            <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ca phê Tiến Phát</span>
            </div>
          </div>
        </header>

        {/* Nội dung tương ứng với từng Tab */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-slate-200/80">
            {activeTab === 'pos' && (
              <PosArea
                tables={tables}
                setTables={setTables}
                menu={menu}
                staffList={staffList}
                orders={orders}
                inventory={inventory}
                onCompleteOrder={handleCompleteOrder}
                onDeductInventory={handleDeductInventory}
              />
            )}
            {activeTab === 'tableHistory' && (
              <TableHistory
                orders={orders}
                setOrders={setOrders}
                menu={menu}
                inventory={inventory}
                onDeleteOrder={handleDeleteOrderAndRecordWastage}
                onRefreshOrders={handleRefreshAllData}
              />
            )}
            {(activeTab === 'revenue' || activeTab === 'history') && (
              <RevenueAnalytics orders={orders} />
            )}
            {activeTab === 'inventory' && (
              <InventoryManagement
                inventory={inventory}
                setInventory={setInventory}
                menu={menu}
              />
            )}
            {activeTab === 'recipe' && (
              <RecipeManagement
                menu={menu}
                inventory={inventory}
                onAddDish={handleAddDish}
                onUpdateDish={handleUpdateDish}
                onDeleteDish={handleDeleteDish}
                onResetMenu={handleResetMenu}
              />
            )}
            {activeTab === 'shift' && (
              <ShiftManagement
                staffList={staffList}
                shiftLogs={shiftLogs}
                onAddShiftLog={handleAddShiftLog}
              />
            )}
            {activeTab === 'payroll' && <Payroll staffList={staffList} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <MainApp />
    </NotificationProvider>
  );
}
