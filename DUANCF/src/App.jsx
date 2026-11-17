import React, { useState, useEffect, useRef } from 'react';
import PosArea from './components/PosArea';
import HighlandsSelfService from './components/HighlandsSelfService';
import SaaSRoadmapModal from './components/SaaSRoadmapModal';
import ShopLogoModal from './components/ShopLogoModal';
import ShiftManagement from './components/ShiftManagement';
import Payroll from './components/Payroll';
import RecipeManagement from './components/RecipeManagement';
import TableHistory from './components/TableHistory';
import RevenueAnalytics from './components/RevenueAnalytics';
import InventoryManagement from './components/InventoryManagement';
import { INITIAL_TABLES, INITIAL_MENU, INITIAL_STAFF, INITIAL_INVENTORY, DEMO_MENU, DEMO_INVENTORY } from './data/initialData';
import { NotificationProvider, useNotification } from './components/CustomNotification';

// Thông tin quán và Logo nhận diện thương hiệu mặc định
const DEFAULT_SHOP_INFO = {
  name: 'Tiến Phát Café',
  subTitle: 'Hệ thống POS Thu ngân',
  logoType: 'text', // 'text' | 'image' | 'preset'
  logoText: 'CF',
  logoUrl: '',
  presetId: 'preset-8',
  address: 'Tiên Sơn núi vip pro',
  hotline: '0905.292.193',
};
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
  // Chế độ mô hình vận hành: 'SELF_SERVICE' (Highlands Tự Phục Vụ) hoặc 'TRADITIONAL' (Phục Vụ Tại Bàn)
  const [operatingMode, setOperatingMode] = useState(() => {
    return localStorage.getItem('POS_OPERATING_MODE') || 'SELF_SERVICE';
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedMode = localStorage.getItem('POS_OPERATING_MODE') || 'SELF_SERVICE';
    return savedMode === 'SELF_SERVICE' ? 'selfService' : 'pos';
  });

  useEffect(() => {
    localStorage.setItem('POS_OPERATING_MODE', operatingMode);
  }, [operatingMode]);

  // Modal Bản kế hoạch kinh doanh & phát triển thị trường SaaS
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Modal Cập nhật Logo & Thông tin nhận diện quán
  const [showShopLogoModal, setShowShopLogoModal] = useState(false);
  const [shopInfo, setShopInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_SHOP_INFO');
      if (saved) return { ...DEFAULT_SHOP_INFO, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SHOP_INFO;
  });

  const handleSaveShopInfo = (newInfo) => {
    setShopInfo(newInfo);
    try {
      localStorage.setItem('POS_SHOP_INFO', JSON.stringify(newInfo));
    } catch (e) {}
    showSuccess('🎉 Đã cập nhật Logo và thông tin quán thành công!');
  };

  const handleResetShopInfo = () => {
    setShopInfo(DEFAULT_SHOP_INFO);
    try {
      localStorage.setItem('POS_SHOP_INFO', JSON.stringify(DEFAULT_SHOP_INFO));
    } catch (e) {}
    showSuccess('🔄 Đã khôi phục Logo & thông tin quán về mặc định!');
  };

  // Dropdown Cài đặt Dữ liệu Demo / Thử nghiệm
  const [showDevMenu, setShowDevMenu] = useState(false);
  const devMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (devMenuRef.current && !devMenuRef.current.contains(e.target)) {
        setShowDevMenu(false);
      }
    };
    if (showDevMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDevMenu]);

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

  // Tải danh sách menu từ localStorage nếu có, nếu chưa có sẽ mặc định mảng rỗng []
  const [menu, setMenu] = useState(() => {
    try {
      const savedMenu = localStorage.getItem('POS_MENU_DATA');
      if (savedMenu) {
        const parsed = JSON.parse(savedMenu);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_MENU;
  });

  const handleResetMenu = () => {
    showConfirm('Bạn có chắc muốn nạp lại 25 món thực đơn mẫu khảo sát không?', () => {
      setMenu(DEMO_MENU);
      localStorage.setItem('POS_MENU_DATA', JSON.stringify(DEMO_MENU));
      showSuccess('Đã nạp thành công 25 món thực đơn mẫu chuẩn!');
    });
  };

  const [staffList] = useState(INITIAL_STAFF);
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('POS_ORDERS_DATA');
    return saved ? JSON.parse(saved) : [];
  });
  const [shiftLogs, setShiftLogs] = useState([]);

  // Quản lý Kho nguyên vật liệu (Mặc định rỗng [])
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_INVENTORY_DATA');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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

  const { showSuccess, showConfirm, showInfo } = useNotification();

  // Hàm chuyển đổi chế độ vận hành (Dùng công tắc gạt đa năng SaaS)
  const handleSwitchOperatingMode = (newMode) => {
    setOperatingMode(newMode);
    if (newMode === 'SELF_SERVICE') {
      setActiveTab('selfService');
      if (showInfo) showInfo('⚡ Đã chuyển sang mô hình: Tự Phục Vụ Chuỗi (Highlands QSR)!');
    } else {
      setActiveTab('pos');
      if (showInfo) showInfo('☕ Đã chuyển sang mô hình: Phục Vụ Tại Bàn Truyền Thống!');
    }
  };

  // 1. Hàm Xóa Trắng Toàn Bộ Dữ Liệu (Clean Blank Slate theo yêu cầu)
  const handleClearAllData = () => {
    showConfirm({
      title: 'Làm Trống Dữ Liệu Toàn Hệ Thống',
      message: 'Bạn có chắc chắn muốn làm trống toàn bộ dữ liệu (Món ăn, Kho, Đơn hàng, Doanh thu = 0đ) để bắt đầu thảo luận từ con số 0 cùng nhóm không?',
      confirmText: 'Xác nhận xóa trắng',
      cancelText: 'Giữ lại',
      type: 'danger',
      onConfirm: () => {
        setMenu([]);
        setInventory([]);
        setOrders([]);
        setTables((prev) => prev.map((t) => ({ ...t, occupied: false, groupId: null, isReserved: false })));
        try {
          localStorage.setItem('POS_MENU_DATA', JSON.stringify([]));
          localStorage.setItem('POS_INVENTORY_DATA', JSON.stringify([]));
          localStorage.setItem('POS_ORDERS_DATA', JSON.stringify([]));
          localStorage.setItem('POS_CARTS_DATA', JSON.stringify({}));
          localStorage.setItem('POS_NOTES_DATA', JSON.stringify({}));
          localStorage.setItem('POS_TABLE_USAGE_HISTORY', JSON.stringify([]));
          localStorage.setItem('POS_RESERVATION_HISTORY', JSON.stringify([]));
          localStorage.setItem('HIGHLANDS_KDS_ORDERS', JSON.stringify([]));
          localStorage.setItem('POS_EXPENSE_HISTORY', JSON.stringify([]));
          localStorage.setItem('POS_AUDIT_HISTORY', JSON.stringify([]));
        } catch (e) {}
        showSuccess('🧹 Đã làm trống toàn bộ dữ liệu! Toàn bộ Doanh thu = 0đ, Thực đơn rỗng để nhóm bạn tự thiết lập từ số 0.');
      },
    });
  };

  // 2. Hàm Nạp Lại Thực Đơn Khảo Sát Mẫu Chuẩn (25 Món & 19 Nguyên Liệu Kho)
  const handleLoadDemoData = () => {
    showConfirm({
      title: 'Nạp Lại Dữ Liệu Mẫu Khảo Sát',
      message: 'Hệ thống sẽ nạp lại 25 món thực đơn khảo sát kèm công thức pha chế và kho 19 nguyên liệu chuẩn. Bạn có muốn nạp không?',
      confirmText: 'Nạp dữ liệu mẫu',
      cancelText: 'Hủy bỏ',
      type: 'info',
      onConfirm: () => {
        setMenu(DEMO_MENU);
        setInventory(DEMO_INVENTORY);
        try {
          localStorage.setItem('POS_MENU_DATA', JSON.stringify(DEMO_MENU));
          localStorage.setItem('POS_INVENTORY_DATA', JSON.stringify(DEMO_INVENTORY));
        } catch (e) {}
        showSuccess('🔄 Đã nạp thành công 25 món thực đơn khảo sát và kho nguyên liệu chuẩn!');
      },
    });
  };

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

  // Danh mục các Tab chức năng thích ứng tự động theo Mô hình vận hành (SaaS Dynamic Tabs)
  const navItems = [
    ...(operatingMode === 'SELF_SERVICE'
      ? [
          {
            id: 'selfService',
            label: 'Quầy Tự Phục Vụ',
            icon: '🛎️',
            desc: 'Order quầy, Thẻ rung & KDS Barista',
          },
          {
            id: 'tableHistory',
            label: 'Lịch Sử Giao Nhận & Thẻ',
            icon: '📋',
            desc: 'Số thẻ rung & in lại bill',
          },
        ]
      : [
          {
            id: 'pos',
            label: 'Sơ Đồ Bàn & Order',
            icon: '☕',
            desc: 'Bán hàng theo bàn & gộp bàn',
          },
          {
            id: 'tableHistory',
            label: 'Lịch Sử Bàn & Hóa Đơn',
            icon: '🕒',
            desc: 'Bàn phục vụ & in lại bill',
          },
        ]),
    {
      id: 'revenue',
      label: 'Báo Cáo Doanh Thu',
      icon: '📊',
      desc: 'Ngày, Tuần, Tháng, Năm, Giờ vàng',
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
                {/* Logo thương hiệu (Click để đổi Logo) */}
                <div
                  onClick={() => setShowShopLogoModal(true)}
                  title="Nhấp để thay đổi Logo & Tên quán"
                  className="w-10 h-10 rounded-2xl border-2 border-amber-500 overflow-hidden bg-amber-950 flex items-center justify-center font-black text-amber-400 text-sm shadow-md flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-amber-300 hover:scale-105 transition-all group relative"
                >
                  {shopInfo.logoType === 'image' && shopInfo.logoUrl ? (
                    <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{shopInfo.logoText || 'CF'}</span>
                  )}
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">
                    ✎
                  </span>
                </div>
                <div
                  className="min-w-0 cursor-pointer"
                  onClick={() => setShowShopLogoModal(true)}
                  title="Nhấp để đổi tên quán & thương hiệu"
                >
                  <h1 className="text-sm font-black text-amber-400 uppercase tracking-wider truncate hover:text-amber-300 transition">
                    {shopInfo.name}
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">{shopInfo.subTitle}</p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowShopLogoModal(true)}
                title="Nhấp để đổi Logo & Tên quán"
                className="w-10 h-10 rounded-2xl border-2 border-amber-500 overflow-hidden bg-amber-950 flex items-center justify-center font-black text-amber-400 text-sm shadow-md mx-auto cursor-pointer hover:ring-2 hover:ring-amber-300 hover:scale-105 transition-all group relative"
              >
                {shopInfo.logoType === 'image' && shopInfo.logoUrl ? (
                  <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{shopInfo.logoText || 'CF'}</span>
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">
                  ✎
                </span>
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
            <div
              className="mt-3 px-1 text-[10px] text-slate-500 leading-tight cursor-pointer hover:text-slate-400 transition"
              onClick={() => setShowShopLogoModal(true)}
              title="Nhấp để cập nhật địa chỉ & hotline quán"
            >
              <div>📍 {shopInfo.address}</div>
              <div className="mt-0.5">📞 Hotline: {shopInfo.hotline}</div>
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

          {/* CÔNG TẮC GẠT CHUYỂN ĐỔI MÔ HÌNH VẬN HÀNH (SaaS DUAL-MODE SWITCHER) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner">
              <span className="text-[10px] font-black uppercase text-slate-500 px-2 hidden sm:inline-block">
                Mô Hình Quán:
              </span>
              <button
                type="button"
                onClick={() => handleSwitchOperatingMode('SELF_SERVICE')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                  operatingMode === 'SELF_SERVICE'
                    ? 'bg-[#8B181B] text-white shadow-md font-black ring-2 ring-red-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Chuyển sang Mô hình Tự Phục Vụ Highlands (Thẻ rung điện tử & KDS Barista)"
              >
                <span>🛎️</span>
                <span>Tự Phục Vụ (Highlands)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchOperatingMode('TRADITIONAL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                  operatingMode === 'TRADITIONAL'
                    ? 'bg-amber-600 text-white shadow-md font-black ring-2 ring-amber-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Chuyển sang Mô hình Phục Vụ Tại Bàn (Sơ đồ bàn, Gộp bàn & Đặt bàn)"
              >
                <span>☕</span>
                <span>Phục Vụ Tại Bàn</span>
              </button>
            </div>

            {/* NÚT MỞ BẢN KẾ HOẠCH PHÁT TRIỂN THỊ TRƯỜNG SAAS */}
            <button
              type="button"
              onClick={() => setShowRoadmapModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Xem Bản Kế Hoạch Thương Mại Hóa & Phát Triển Thị Trường SaaS"
            >
              <span>💼</span>
              <span className="hidden sm:inline">Kế Hoạch Thị Trường</span>
            </button>

            {/* DROPDOWN MENU GOM GỌN CÀI ĐẶT & THỬ NGHIỆM DỮ LIỆU (NẰM BÊN PHẢI GÓC CỦA KẾ HOẠCH THỊ TRƯỜNG) */}
            <div className="relative" ref={devMenuRef}>
              <button
                type="button"
                onClick={() => setShowDevMenu(!showDevMenu)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base shadow-2xs transition-all active:scale-95 cursor-pointer ${
                  showDevMenu
                    ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-300 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Cài đặt & Quản lý dữ liệu thử nghiệm (Nạp mẫu / Làm trống)"
              >
                <span className={`inline-block transition-transform duration-300 ${showDevMenu ? 'rotate-90 scale-110' : 'hover:rotate-45'}`}>
                  ⚙️
                </span>
              </button>

              {/* HỘP THOẠI DROPDOWN KHI CLICK VÀO NÚT CÀI ĐẶT */}
              {showDevMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>⚙️</span>
                      <span>Quản Lý Cài Đặt & Thử Nghiệm</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Tùy chỉnh nhận diện thương hiệu & công cụ hỗ trợ thảo luận nhóm
                    </div>
                  </div>

                  {/* Lựa chọn 0: Cập nhật Logo & Thông tin quán */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDevMenu(false);
                      setShowShopLogoModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-900 transition flex items-start gap-2.5 text-xs group cursor-pointer"
                  >
                    <span className="text-base p-1.5 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-110 transition flex-shrink-0">
                      🖼️
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-800 group-hover:text-amber-900">
                        Cập Nhật Logo & Tên Quán
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Tải ảnh logo lên, đổi tên quán, địa chỉ và hotline hiển thị toàn hệ thống
                      </div>
                    </div>
                  </button>

                  {/* Lựa chọn 1: Nạp 25 món thực đơn mẫu */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDevMenu(false);
                      handleLoadDemoData();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition flex items-start gap-2.5 text-xs group cursor-pointer"
                  >
                    <span className="text-base p-1.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-110 transition flex-shrink-0">
                      🔄
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-800 group-hover:text-emerald-900">
                        Nạp Mẫu 25 Món & Kho
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Nạp nhanh 25 món đồ uống khảo sát kèm định lượng & 19 nguyên liệu kho chuẩn
                      </div>
                    </div>
                  </button>

                  {/* Lựa chọn 2: Làm trống toàn bộ hệ thống */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDevMenu(false);
                      handleClearAllData();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-900 transition flex items-start gap-2.5 text-xs group cursor-pointer"
                  >
                    <span className="text-base p-1.5 bg-rose-100 text-rose-800 rounded-xl group-hover:scale-110 transition flex-shrink-0">
                      🧹
                    </span>
                    <div>
                      <div className="font-extrabold text-slate-800 group-hover:text-rose-900">
                        Làm Trống Toàn Bộ (Về 0)
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Xóa trắng thực đơn, kho, đơn hàng và đưa doanh thu về 0đ để bắt đầu từ số 0
                      </div>
                    </div>
                  </button>
                </div>
              )}
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

            <div
              onClick={() => setShowShopLogoModal(true)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
              title="Nhấp để thay đổi Logo & Tên thương hiệu quán"
            >
              {shopInfo.logoType === 'image' && shopInfo.logoUrl ? (
                <img src={shopInfo.logoUrl} alt="Logo" className="w-4 h-4 rounded-full object-cover border border-amber-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              <span>{shopInfo.name}</span>
            </div>
          </div>
        </header>

        {/* Nội dung tương ứng với từng Tab */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-slate-200/80">
            {activeTab === 'selfService' && (
              <HighlandsSelfService
                menu={menu}
                inventory={inventory}
                staffList={staffList}
                orders={orders}
                tables={tables}
                setTables={setTables}
                onCompleteOrder={handleCompleteOrder}
                onDeductInventory={handleDeductInventory}
                onSwitchToTraditionalPos={() => handleSwitchOperatingMode('TRADITIONAL')}
              />
            )}
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
                onSwitchToSelfService={() => handleSwitchOperatingMode('SELF_SERVICE')}
              />
            )}
            {activeTab === 'tableHistory' && (
              <TableHistory
                orders={orders}
                setOrders={setOrders}
                menu={menu}
                inventory={inventory}
                operatingMode={operatingMode}
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

      {/* Modal Kế Hoạch Thương Mại Hóa & Phát Triển Thị Trường SaaS */}
      <SaaSRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
      />

      {/* Modal Cập Nhật Logo & Thông Tin Nhận Diện Quán */}
      <ShopLogoModal
        isOpen={showShopLogoModal}
        onClose={() => setShowShopLogoModal(false)}
        shopInfo={shopInfo}
        onSaveShopInfo={handleSaveShopInfo}
        onResetShopInfo={handleResetShopInfo}
      />
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
