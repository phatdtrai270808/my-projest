import React, { useState, useMemo } from 'react';
import { useNotification } from './CustomNotification';

export default function InventoryManagement({
  inventory = [],
  setInventory,
  menu = [],
  onAddExpense,
}) {
  const [activeTab, setActiveTab] = useState('STOCK'); // 'STOCK' | 'IMPORT' | 'AUDIT' | 'PENDING'
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Search & Filter trong kho
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form Thêm nguyên liệu mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('g');
  const [newIngStock, setNewIngStock] = useState('');
  const [newIngCost, setNewIngCost] = useState('');
  const [newIngMin, setNewIngMin] = useState('500');
  const [newIngCategory, setNewIngCategory] = useState('Pha chế');

  // Form Nhập Kho (Stock In)
  const [importIngId, setImportIngId] = useState(inventory[0]?.id || '');
  const [importQty, setImportQty] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [importSupplier, setImportSupplier] = useState('Đại lý Cà Phê Tiến Phát');
  const [importNote, setImportNote] = useState('');

  // Form Kiểm Kê Kho & Tính Hao Hụt (Stock Count & Variance Audit)
  const [auditIngId, setAuditIngId] = useState(inventory[0]?.id || '');
  const [auditActualStock, setAuditActualStock] = useState('');
  const [auditReason, setAuditReason] = useState('Rơi vãi & Dính ca đong khi pha chế');
  const [auditHistory, setAuditHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_AUDIT_HISTORY');
      return saved ? JSON.parse(saved) : [
        {
          id: 'AUD-001',
          date: '10/11/2026 14:30',
          ingName: 'Hạt Cà Phê Robusta Đắk Lắk',
          theoryStock: 15150,
          actualStock: 15000,
          diff: -150,
          unit: 'g',
          lossAmount: 27000,
          reason: 'Bột dính cối xay & rơi vãi khi gạt tamper',
          status: 'NORMAL', // Hao hụt bình thường (dưới 5%)
        },
        {
          id: 'AUD-002',
          date: '09/11/2026 21:00',
          ingName: 'Sữa Tươi Thanh Trùng',
          theoryStock: 18400,
          actualStock: 18000,
          diff: -400,
          unit: 'ml',
          lossAmount: 13600,
          reason: 'Dính ca đánh sữa nóng bọt vi mô microfoam',
          status: 'NORMAL',
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Lịch sử nhập kho
  const [importHistory, setImportHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_IMPORT_HISTORY');
      return saved ? JSON.parse(saved) : [
        {
          id: 'NK-001',
          date: '08/11/2026 09:00',
          ingName: 'Hạt Cà Phê Robusta Đắk Lắk',
          qty: 10000,
          unit: 'g',
          unitCost: 180,
          total: 1800000,
          supplier: 'Nông trại Đắk Lắk',
        },
        {
          id: 'NK-002',
          date: '09/11/2026 10:15',
          ingName: 'Sữa Đặc Ông Thọ',
          qty: 6000,
          unit: 'ml',
          unitCost: 65,
          total: 390000,
          supplier: 'Đại lý Vinamilk',
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Lưu lịch sử kiểm kê & nhập kho
  const saveAuditHistory = (newHistory) => {
    setAuditHistory(newHistory);
    try {
      localStorage.setItem('POS_AUDIT_HISTORY', JSON.stringify(newHistory));
    } catch (e) {}
  };

  const saveImportHistory = (newHistory) => {
    setImportHistory(newHistory);
    try {
      localStorage.setItem('POS_IMPORT_HISTORY', JSON.stringify(newHistory));
    } catch (e) {}
  };

  // Phân tích trạng thái nguyên liệu (Đủ hàng / Sắp hết / Hết hàng)
  const inventoryWithStatus = useMemo(() => {
    return inventory.map((item) => {
      let status = 'GOOD'; // Đủ hàng
      if (item.stock <= 0) {
        status = 'EMPTY'; // Hết hàng
      } else if (item.stock <= (item.minStock || 1000)) {
        status = 'LOW'; // Sắp hết
      }
      return { ...item, status };
    });
  }, [inventory]);

  // Danh mục phân loại trong kho
  const categories = useMemo(() => {
    const cats = ['ALL'];
    inventory.forEach((i) => {
      if (i.category && !cats.includes(i.category)) cats.push(i.category);
    });
    return cats;
  }, [inventory]);

  // Lọc nguyên liệu theo tìm kiếm & phân loại
  const filteredInventory = useMemo(() => {
    return inventoryWithStatus.filter((item) => {
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventoryWithStatus, categoryFilter, searchTerm]);

  // Tổng giá trị kho hiện tại
  const totalStockValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.stock * (item.costPerUnit || 0)), 0);
  }, [inventory]);

  // Số mặt hàng sắp hết hoặc hết hàng
  const lowStockCount = useMemo(() => {
    return inventoryWithStatus.filter((i) => i.status === 'LOW' || i.status === 'EMPTY').length;
  }, [inventoryWithStatus]);

  // ==========================================================
  // XÁC ĐỊNH MÓN CHỜ NGUYÊN LIỆU (PENDING INGREDIENTS DISHES)
  // ==========================================================
  const pendingDishes = useMemo(() => {
    const list = [];
    menu.forEach((dish) => {
      const missingIngs = [];
      if (Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((ing) => {
          const found = inventory.find(
            (inv) => inv.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
          );
          if (!found) {
            missingIngs.push({ name: ing.name, reason: 'Chưa có trong kho' });
          } else if (found.stock <= 0) {
            missingIngs.push({ name: ing.name, reason: 'Đã hết hàng (Tồn = 0)' });
          } else if (found.stock < (ing.amount || 1)) {
            missingIngs.push({ name: ing.name, reason: `Không đủ tồn (${found.stock} ${found.unit} < ${ing.amount} ${ing.unit})` });
          }
        });
      }
      if (missingIngs.length > 0) {
        list.push({ ...dish, missingIngs });
      }
    });
    return list;
  }, [menu, inventory]);

  // Xử lý tạo nguyên liệu mới thủ công
  const handleCreateNewIng = (e) => {
    e.preventDefault();
    if (!newIngName.trim()) {
      showError('Vui lòng nhập tên nguyên liệu!');
      return;
    }
    const exists = inventory.some(
      (i) => i.name.toLowerCase().trim() === newIngName.toLowerCase().trim()
    );
    if (exists) {
      showError(`Nguyên liệu "${newIngName}" đã có sẵn trong kho!`);
      return;
    }

    const newIng = {
      id: `INV-${Date.now()}`,
      name: newIngName.trim(),
      unit: newIngUnit.trim() || 'g',
      stock: Number(newIngStock) || 0,
      costPerUnit: Number(newIngCost) || 0,
      minStock: Number(newIngMin) || 500,
      category: newIngCategory,
    };

    setInventory((prev) => [newIng, ...prev]);
    showSuccess(`Đã thêm nguyên liệu "${newIng.name}" vào kho!`);
    setShowAddModal(false);
    setNewIngName('');
    setNewIngStock('');
    setNewIngCost('');
  };

  // Xử lý Nhập kho (Stock In)
  const handleImportStock = (e) => {
    e.preventDefault();
    const targetIng = inventory.find((i) => i.id === importIngId);
    if (!targetIng) {
      showError('Chưa chọn nguyên liệu để nhập kho!');
      return;
    }
    const qty = Number(importQty);
    if (!qty || qty <= 0) {
      showError('Số lượng nhập phải lớn hơn 0!');
      return;
    }
    const unitPrice = Number(importPrice) || targetIng.costPerUnit || 0;
    const totalCost = qty * unitPrice;

    // Cập nhật tồn kho
    setInventory((prev) =>
      prev.map((i) =>
        i.id === importIngId
          ? {
              ...i,
              stock: i.stock + qty,
              costPerUnit: unitPrice > 0 ? unitPrice : i.costPerUnit,
            }
          : i
      )
    );

    // Ghi vào lịch sử nhập kho
    const newRecord = {
      id: `NK-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleString('vi-VN'),
      ingName: targetIng.name,
      qty,
      unit: targetIng.unit,
      unitCost: unitPrice,
      total: totalCost,
      supplier: importSupplier || 'Nhà cung cấp',
      note: importNote,
    };
    saveImportHistory([newRecord, ...importHistory]);

    // Ghi nhận vào Chi phí tháng
    if (onAddExpense) {
      onAddExpense({
        title: `Nhập kho: ${qty} ${targetIng.unit} ${targetIng.name}`,
        amount: totalCost,
        category: 'Nhập hàng',
      });
    }

    showSuccess(
      `Nhập thành công +${qty} ${targetIng.unit} ${targetIng.name} (Chi: ${totalCost.toLocaleString()}đ)!`
    );
    setImportQty('');
    setImportPrice('');
    setImportNote('');
  };

  // Xử lý Kiểm kê Kho & Tính Hao Hụt (Stock Count & Variance)
  const handleAuditStock = (e) => {
    e.preventDefault();
    const targetIng = inventory.find((i) => i.id === auditIngId);
    if (!targetIng) {
      showError('Chưa chọn nguyên liệu để kiểm kê!');
      return;
    }
    const actual = Number(auditActualStock);
    if (isNaN(actual) || actual < 0) {
      showError('Số lượng kiểm kê thực tế không hợp lệ!');
      return;
    }

    const theory = targetIng.stock;
    const diff = actual - theory; // âm là hao hụt, dương là dư ra
    const lossValue = Math.abs(diff) * (targetIng.costPerUnit || 0);

    // Đánh giá tỷ lệ hao hụt so với tồn lý thuyết
    const lossPercent = theory > 0 ? Math.abs((diff / theory) * 100) : 0;
    const isNormal = lossPercent <= 5; // Dưới 5% là hao hụt tự nhiên cho phép

    // Cân bằng kho: Cập nhật tồn kho về số THỰC TẾ
    setInventory((prev) =>
      prev.map((i) => (i.id === auditIngId ? { ...i, stock: actual } : i))
    );

    const auditRecord = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleString('vi-VN'),
      ingName: targetIng.name,
      theoryStock: theory,
      actualStock: actual,
      diff,
      unit: targetIng.unit,
      lossAmount: lossValue,
      reason: auditReason,
      status: isNormal ? 'NORMAL' : 'ABNORMAL',
    };

    saveAuditHistory([auditRecord, ...auditHistory]);

    // Nếu hao hụt, tự động ghi nhận vào Chi phí hao hụt thất thoát
    if (diff < 0 && onAddExpense) {
      onAddExpense({
        title: `Hao hụt kho: ${Math.abs(diff)} ${targetIng.unit} ${targetIng.name}`,
        amount: lossValue,
        category: 'Hao hụt kiểm kê',
      });
    }

    if (diff < 0) {
      showWarning(
        `Phát hiện hao hụt -${Math.abs(diff)} ${targetIng.unit} ${targetIng.name} (Thiệt hại: ${lossValue.toLocaleString()}đ). Đã tự động cân bằng tồn kho!`
      );
    } else if (diff > 0) {
      showSuccess(
        `Ghi nhận dôi dư +${diff} ${targetIng.unit} ${targetIng.name}. Đã cập nhật lại tồn thực tế!`
      );
    } else {
      showSuccess(`Tuyệt vời! ${targetIng.name} khớp chuẩn 100% giữa lý thuyết và thực tế!`);
    }

    setAuditActualStock('');
  };

  const selectedAuditIng = inventory.find((i) => i.id === auditIngId) || inventory[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ======================================================== */}
      {/* 1. HEADER & CHUÔNG BÁO MÓN CHỜ NGUYÊN LIỆU */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2.5 bg-amber-100 rounded-2xl text-amber-700">📦</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Kho Hàng & Kiểm Kê Hao Hụt
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động trừ kho khi Order, cảnh báo món thiếu nguyên liệu và theo dõi hao hụt dư thừa chuẩn F&B
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Thêm Nguyên Liệu Mới</span>
            </button>
          </div>
        </div>

        {/* CHUÔNG NHẮC NHỞ NẾU CÓ MÓN CHỜ NGUYÊN LIỆU */}
        {pendingDishes.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs mb-4 animate-pulse">
            <div className="flex items-center gap-2.5 text-amber-950 font-bold">
              <span className="text-lg">🔔</span>
              <span>
                Hiện có <strong>{pendingDishes.length} món</strong> đang ở trạng thái{' '}
                <strong className="text-red-700">Chờ nguyên liệu</strong> do kho chưa nhập hoặc hết hàng!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className="bg-amber-600 text-white font-black text-[11px] px-3 py-1.5 rounded-xl hover:bg-amber-700 transition flex-shrink-0"
            >
              Xem & Nhập ngay
            </button>
          </div>
        )}

        {/* 4 TAB ĐIỀU HƯỚNG QUẢN LÝ KHO */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-0.5">
          {[
            { id: 'STOCK', label: '📦 Tồn Kho & Cảnh Báo', count: inventory.length },
            { id: 'IMPORT', label: '📥 Nhập Kho Hàng Hóa', count: importHistory.length },
            { id: 'AUDIT', label: '⚖️ Kiểm Kê Hao Hụt / Dư', count: auditHistory.length },
            { id: 'PENDING', label: '🔔 Món Chờ Nguyên Liệu', count: pendingDishes.length, isAlert: pendingDishes.length > 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-2 py-0.2 rounded-full font-black ${
                  tab.isAlert
                    ? 'bg-red-500 text-white'
                    : activeTab === tab.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NỘI DUNG TAB 1: TỒN KHO & CẢNH BÁO SẮP HẾT */}
      {/* ======================================================== */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* 3 THẺ TỔNG QUAN TỒN KHO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Tổng giá trị tồn kho</div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {totalStockValue.toLocaleString()} <span className="text-sm font-bold text-slate-600">VNĐ</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Gồm {inventory.length} mặt hàng nguyên vật liệu</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Mặt hàng đầy đủ tồn</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {inventoryWithStatus.filter((i) => i.status === 'GOOD').length} / {inventory.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">🟢 Đảm bảo pha chế thông suốt</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-500 uppercase">Cần nhập thêm / Sắp hết</div>
              <div className="text-2xl font-black text-red-600 mt-1">{lowStockCount} mặt hàng</div>
              <div className="text-[11px] text-red-500 font-semibold mt-1">
                {lowStockCount > 0 ? '⚠️ Cần tạo phiếu nhập để tránh đứt hàng' : 'Mức tồn an toàn'}
              </div>
            </div>
          </div>

          {/* THANH TÌM KIẾM & BỘ LỌC DANH MỤC KHO */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nguyên liệu kho (hạt cà phê, sữa, đường, đào...)"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoryFilter(c)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    categoryFilter === c
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c === 'ALL' ? 'Tất cả' : c}
                </button>
              ))}
            </div>
          </div>

          {/* BẢNG DANH SÁCH NGUYÊN VẬT LIỆU TỒN KHO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Nguyên Liệu</th>
                    <th className="p-3">Danh Mục</th>
                    <th className="p-3 text-right">Tồn Kho Hiện Tại</th>
                    <th className="p-3 text-center">ĐVT</th>
                    <th className="p-3 text-right">Giá Vốn / ĐVT</th>
                    <th className="p-3 text-right">Thành Tiền Tồn</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-extrabold text-slate-800">
                        {item.name}
                        {item.stock <= item.minStock && (
                          <span className="block text-[10px] text-red-500 font-normal">
                            Định mức tối thiểu: {item.minStock} {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          {item.category || 'Khác'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        {item.stock.toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-500">{item.unit}</td>
                      <td className="p-3 text-right text-slate-600">
                        {item.costPerUnit?.toLocaleString()}đ
                      </td>
                      <td className="p-3 text-right font-black text-amber-700">
                        {(item.stock * (item.costPerUnit || 0)).toLocaleString()}đ
                      </td>
                      <td className="p-3 text-center">
                        {item.status === 'GOOD' ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            🟢 Đủ hàng
                          </span>
                        ) : item.status === 'LOW' ? (
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            🟡 Sắp hết
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            🔴 Hết hàng
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setImportIngId(item.id);
                            setImportPrice(item.costPerUnit);
                            setActiveTab('IMPORT');
                          }}
                          className="text-[11px] font-bold bg-amber-50 hover:bg-amber-600 text-amber-900 hover:text-white border border-amber-300 px-2.5 py-1 rounded-lg transition"
                        >
                          + Nhập
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NỘI DUNG TAB 2: NHẬP KHO HÀNG HÓA */}
      {/* ======================================================== */}
      {activeTab === 'IMPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORM TẠO PHIẾU NHẬP (5 COLS) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <span>📥 Tạo Phiếu Nhập Kho Mới</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tăng số lượng tồn kho và tự động ghi nhận vào Chi Phí Tháng
            </p>

            <form onSubmit={handleImportStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Chọn Nguyên Liệu: <span className="text-red-500">*</span>
                </label>
                <select
                  value={importIngId}
                  onChange={(e) => {
                    setImportIngId(e.target.value);
                    const selected = inventory.find((i) => i.id === e.target.value);
                    if (selected) setImportPrice(selected.costPerUnit);
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Tồn hiện tại: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số Lượng Nhập: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={importQty}
                    onChange={(e) => setImportQty(e.target.value)}
                    placeholder="VD: 5000"
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Đơn Giá Vốn (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={importPrice}
                    onChange={(e) => setImportPrice(e.target.value)}
                    placeholder="VD: 180"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* TÍNH NHANH TỔNG TIỀN PHIẾU NHẬP */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between items-center font-bold">
                <span className="text-amber-900">Tổng Tiền Chi Nhập:</span>
                <span className="text-base text-amber-700 font-black">
                  {((Number(importQty) || 0) * (Number(importPrice) || 0)).toLocaleString()} VNĐ
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nhà Cung Cấp / Đại Lý:
                </label>
                <input
                  type="text"
                  value={importSupplier}
                  onChange={(e) => setImportSupplier(e.target.value)}
                  placeholder="VD: Đại lý Vinamilk, Cà phê Đắk Lắk..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Ghi Chú Phiếu Nhập:
                </label>
                <input
                  type="text"
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  placeholder="Ghi chú đợt hàng, hạn sử dụng..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer text-sm"
              >
                Xác Nhận Nhập Kho & Ghi Nhận Chi Phí
              </button>
            </form>
          </div>

          {/* LỊCH SỬ CÁC PHIẾU NHẬP GẦN ĐÂY (7 COLS) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>📋 Lịch Sử Nhập Kho Gần Đây</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Các khoản chi nhập hàng hóa của quán</p>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {importHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic">Chưa có phiếu nhập nào</div>
                ) : (
                  importHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-black text-slate-800">
                          {item.ingName} (+{item.qty.toLocaleString()} {item.unit})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.date} • {item.supplier}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-700 text-sm">
                          -{item.total.toLocaleString()}đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.unitCost?.toLocaleString()}đ / {item.unit}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. NỘI DUNG TAB 3: KIỂM KÊ KHO & TÍNH HAO HỤT / DƯ THỪA */}
      {/* ======================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORM KIỂM KÊ CÂN ĐO THỰC TẾ (5 COLS) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <span>⚖️ Cân Đo & Kiểm Kê Hao Hụt</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              So sánh Tồn lý thuyết vs Tồn thực tế để phát hiện hao hụt, dôi dư hoặc gian lận
            </p>

            <form onSubmit={handleAuditStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Chọn Nguyên Liệu Cần Kiểm Kê:
                </label>
                <select
                  value={auditIngId}
                  onChange={(e) => setAuditIngId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* KHUNG THÔNG TIN TỒN LÝ THUYẾT */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex justify-between items-center font-bold">
                <span className="text-slate-600">Tồn Lý Thuyết (Trên Máy):</span>
                <span className="text-base text-slate-800 font-black">
                  {selectedAuditIng?.stock.toLocaleString()} {selectedAuditIng?.unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Số Lượng Cân / Đếm Thực Tế: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={auditActualStock}
                  onChange={(e) => setAuditActualStock(e.target.value)}
                  placeholder={`Nhập số lượng thực tế (${selectedAuditIng?.unit})`}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-amber-700 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* TÍNH TOÁN CHÊNH LỆCH REAL-TIME */}
              {auditActualStock !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    Number(auditActualStock) < selectedAuditIng?.stock
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : Number(auditActualStock) > selectedAuditIng?.stock
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Kết Quả Kiểm Kê:</span>
                    <span className="font-black text-sm">
                      {Number(auditActualStock) < selectedAuditIng?.stock
                        ? `🔴 Hao hụt: -${(selectedAuditIng?.stock - Number(auditActualStock)).toLocaleString()} ${selectedAuditIng?.unit}`
                        : Number(auditActualStock) > selectedAuditIng?.stock
                        ? `🟢 Dôi dư: +${(Number(auditActualStock) - selectedAuditIng?.stock).toLocaleString()} ${selectedAuditIng?.unit}`
                        : 'Khớp chuẩn 100%'}
                    </span>
                  </div>
                  {Number(auditActualStock) < selectedAuditIng?.stock && (
                    <div className="text-[11px] text-red-600 mt-1">
                      Thiệt hại ước tính: -
                      {(
                        (selectedAuditIng?.stock - Number(auditActualStock)) *
                        (selectedAuditIng?.costPerUnit || 0)
                      ).toLocaleString()}
                      đ
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nguyên Nhân Hao Hụt / Ghi Chú:
                </label>
                <select
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Rơi vãi & Dính ca đong khi pha chế">
                    Rơi vãi & Dính ca đong khi pha chế (Định mức 3-5%)
                  </option>
                  <option value="Làm đổ vỡ / Pha sai công thức đổi ly">
                    Làm đổ vỡ / Pha sai công thức đổi ly
                  </option>
                  <option value="Hết hạn sử dụng / Hỏng hóc bảo quản">
                    Hết hạn sử dụng / Hỏng hóc bảo quản
                  </option>
                  <option value="Đong dôi thừa / Thất thoát ca làm việc">
                    Đong dôi thừa / Thất thoát ca làm việc
                  </option>
                  <option value="Khác">Khác...</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer text-sm"
              >
                Cân Bằng Kho & Ghi Nhận Hao Hụt
              </button>
            </form>
          </div>

          {/* NHẬT KÝ KIỂM KÊ & HAO HỤT ĐÃ QUA (7 COLS) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>📋 Nhật Ký Kiểm Kê & Hao Hụt Thực Tế</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Các khoản hao hụt tự động được tính vào Chi Phí Tháng để xác định Lời/Lỗ chuẩn xác
              </p>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {auditHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-amber-200 bg-slate-50/40 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800">{item.ingName}</span>
                      <span className="text-[10px] text-slate-400">{item.date}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>
                        Lý thuyết: <strong>{item.theoryStock.toLocaleString()}</strong> ➔ Thực tế:{' '}
                        <strong>{item.actualStock.toLocaleString()} {item.unit}</strong>
                      </span>
                      <span
                        className={`font-black ${
                          item.diff < 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.diff < 0
                          ? `Hao hụt: ${item.diff} ${item.unit} (-${item.lossAmount?.toLocaleString()}đ)`
                          : `Dư: +${item.diff} ${item.unit}`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 italic">
                      Lý do: {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. NỘI DUNG TAB 4: MÓN CHỜ NGUYÊN LIỆU (PENDING DISHES) */}
      {/* ======================================================== */}
      {activeTab === 'PENDING' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🔔 Danh Sách Món Đang Chờ Nguyên Liệu</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Những món này đang tạm khóa bán tại màn hình POS để tránh nhân viên nhận đơn khi thiếu nguyên liệu.
              Hãy nhập nguyên liệu để hệ thống tự động kích hoạt lại!
            </p>
          </div>

          {pendingDishes.length === 0 ? (
            <div className="text-center py-16 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
              <span className="text-4xl block mb-2">🎉</span>
              <div className="text-base font-bold text-emerald-800">
                Tất cả các món đều có đầy đủ nguyên liệu trong kho!
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Quán Tiến Phát luôn sẵn sàng phục vụ 100% các món trên thực đơn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-800 text-sm">{dish.name}</span>
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                        Tạm ngưng bán
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mb-2 font-medium">
                      {dish.price.toLocaleString()} VNĐ • Danh mục: {dish.category}
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="text-[11px] font-bold text-amber-900">Nguyên liệu thiếu:</div>
                      {dish.missingIngs.map((m, i) => (
                        <div
                          key={i}
                          className="text-xs bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between"
                        >
                          <span className="font-bold text-slate-800">❌ {m.name}</span>
                          <span className="text-red-600 text-[11px] font-semibold">{m.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // Điền tên nguyên liệu thiếu vào form nhập kho
                      const firstMissing = dish.missingIngs[0]?.name;
                      const found = inventory.find(
                        (inv) => inv.name.toLowerCase() === firstMissing?.toLowerCase()
                      );
                      if (found) {
                        setImportIngId(found.id);
                        setImportPrice(found.costPerUnit);
                      } else {
                        // Mở modal thêm nguyên liệu mới
                        setNewIngName(firstMissing || '');
                        setShowAddModal(true);
                      }
                      setActiveTab('IMPORT');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition text-center shadow-xs cursor-pointer"
                  >
                    📥 Nhập Nguyên Liệu Này Để Mở Bán
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL THÊM NGUYÊN LIỆU MỚI THỦ CÔNG */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-black text-base text-slate-800">
                📦 Thêm Nguyên Liệu Mới Vào Kho
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewIng} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên Nguyên Liệu: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="VD: Hạt Cà Phê Moka, Ớt Tươi Cay, Bột Cacao..."
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Đơn Vị Tính:
                  </label>
                  <select
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="g">Gam (g)</option>
                    <option value="ml">Mililít (ml)</option>
                    <option value="kg">Kilôgam (kg)</option>
                    <option value="lít">Lít</option>
                    <option value="miếng">Miếng</option>
                    <option value="quả">Quả</option>
                    <option value="hộp">Hộp</option>
                    <option value="cái">Cái</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Danh Mục:
                  </label>
                  <input
                    type="text"
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value)}
                    placeholder="VD: Cà phê, Trà, Topping..."
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số Lượng Tồn Ban Đầu:
                  </label>
                  <input
                    type="number"
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(e.target.value)}
                    placeholder="VD: 5000"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Giá Vốn Nhập / ĐVT:
                  </label>
                  <input
                    type="number"
                    value={newIngCost}
                    onChange={(e) => setNewIngCost(e.target.value)}
                    placeholder="VD: 180"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Định Mức Tối Thiểu Cảnh Báo Sắp Hết:
                </label>
                <input
                  type="number"
                  value={newIngMin}
                  onChange={(e) => setNewIngMin(e.target.value)}
                  placeholder="VD: 500"
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Lưu Nguyên Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

