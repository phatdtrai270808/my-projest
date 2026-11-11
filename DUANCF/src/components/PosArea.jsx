import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotification } from './CustomNotification';
import {
  apiCreateTable,
  apiUpdateTable,
  apiDeleteTable,
  apiMergeTables,
} from '../services/api';

export default function PosArea({ 
  tables,
  setTables,
  menu, 
  staffList, 
  orders = [],
  inventory = [],
  onCompleteOrder,
  onDeductInventory
}) {
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || 'T1');
  const [selectedArea, setSelectedArea] = useState('Tất cả');
  
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotification();

  const [tableCarts, setTableCarts] = useState(() => {
    const saved = localStorage.getItem('POS_CARTS_DATA');
    return saved ? JSON.parse(saved) : {};
  });
  const [tableNotes, setTableNotes] = useState(() => {
    const saved = localStorage.getItem('POS_NOTES_DATA');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('POS_CARTS_DATA', JSON.stringify(tableCarts));
  }, [tableCarts]);

  useEffect(() => {
    localStorage.setItem('POS_NOTES_DATA', JSON.stringify(tableNotes));
  }, [tableNotes]);

  // Danh sách các gợi ý ghi chú thông minh (Tự động lưu và nhớ vĩnh viễn)
  const DEFAULT_NOTE_SUGGESTIONS = [
    'Ít đường',
    'Không đường',
    'Ít đá',
    'Không đá',
    'Đá riêng',
    'Nhiều sữa',
    'Uống nóng',
    'Mang về',
    'Ít ngọt',
    'Đậm cà phê',
    'Nhiều đá',
    'Giao cùng lúc'
  ];

  const [savedNoteTags, setSavedNoteTags] = useState(() => {
    try {
      const saved = localStorage.getItem('POS_SAVED_NOTE_TAGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc POS_SAVED_NOTE_TAGS:', e);
    }
    return DEFAULT_NOTE_SUGGESTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('POS_SAVED_NOTE_TAGS', JSON.stringify(savedNoteTags));
    } catch (e) {
      console.warn('Lỗi lưu POS_SAVED_NOTE_TAGS:', e);
    }
  }, [savedNoteTags]);

  // Ref và State phục vụ nút cuộn & tìm kiếm nhanh thẻ ghi chú
  const orderNoteTagsScrollRef = useRef(null);
  const [isNoteTagsExpanded, setIsNoteTagsExpanded] = useState(false);
  const [noteSearchFilter, setNoteSearchFilter] = useState('');

  // Ref và hàm cuộn ngang thanh danh mục thực đơn
  const categoryTabsScrollRef = useRef(null);
  const [isCatDragging, setIsCatDragging] = useState(false);
  const [catStartX, setCatStartX] = useState(0);
  const [catScrollLeft, setCatScrollLeft] = useState(0);

  const scrollCategoryTabs = (direction) => {
    if (categoryTabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryTabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCatMouseDown = (e) => {
    if (!categoryTabsScrollRef.current) return;
    setIsCatDragging(true);
    setCatStartX(e.pageX - categoryTabsScrollRef.current.offsetLeft);
    setCatScrollLeft(categoryTabsScrollRef.current.scrollLeft);
  };

  const handleCatMouseLeaveOrUp = () => {
    setIsCatDragging(false);
  };

  const handleCatMouseMove = (e) => {
    if (!isCatDragging || !categoryTabsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryTabsScrollRef.current.offsetLeft;
    const walk = (x - catStartX) * 1.5;
    categoryTabsScrollRef.current.scrollLeft = catScrollLeft - walk;
  };

  const handleCatWheel = (e) => {
    if (categoryTabsScrollRef.current && e.deltaY !== 0) {
      categoryTabsScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Hàm cuộn ngang danh sách thẻ ghi chú
  const scrollNoteTags = (direction) => {
    if (orderNoteTagsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      orderNoteTagsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Hàm chuẩn hóa tiếng Việt không dấu để tìm kiếm thông minh (VD: gõ 'i' -> khớp 'ít', 'd' -> khớp 'đá')
  const normalizeVietnamese = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();

  // Hàm sắp xếp ưu tiên thẻ ghi chú theo từ khóa đang gõ (VD: bấm 'i' -> đẩy 'Ít đường', 'Ít đá', 'Ít ngọt' lên đầu)
  const sortTagsByQuery = (tags, query) => {
    if (!query || typeof query !== 'string') return tags;
    // Lấy cụm từ cuối cùng đang gõ nếu có dấu phẩy (VD: "Không đá, i" -> tìm "i")
    const lastToken = query.split(/[,;\n|]/).pop().trim();
    if (!lastToken) return tags;

    const normQuery = normalizeVietnamese(lastToken);
    if (!normQuery) return tags;

    return [...tags].sort((a, b) => {
      const normA = normalizeVietnamese(a);
      const normB = normalizeVietnamese(b);

      const aStarts = normA.startsWith(normQuery);
      const bStarts = normB.startsWith(normQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const aIncludes = normA.includes(normQuery);
      const bIncludes = normB.includes(normQuery);
      if (aIncludes && !bIncludes) return -1;
      if (!aIncludes && bIncludes) return 1;

      return 0;
    });
  };

  // Hàm tự động ghi nhớ và lưu ghi chú mới vào danh sách gợi ý
  const saveNewNoteTag = (newNote) => {
    if (!newNote || typeof newNote !== 'string') return;
    const parts = newNote.split(/[,;\n|]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;

    let newlyAdded = [];
    setSavedNoteTags((prev) => {
      let updated = [...prev];
      parts.forEach((part) => {
        if (
          part.length >= 2 &&
          part.length <= 40 &&
          !updated.some((t) => t.toLowerCase() === part.toLowerCase())
        ) {
          updated = [part, ...updated];
          newlyAdded.push(part);
        }
      });
      return updated.slice(0, 40);
    });

    if (newlyAdded.length > 0) {
      showInfo(`Đã tự động lưu ghi nhớ gợi ý: "${newlyAdded.join(', ')}" cho các lần sau!`);
    }
  };

  // Hàm xóa bớt gợi ý không dùng nữa
  const removeSavedNoteTag = (tagToRemove, e) => {
    if (e) e.stopPropagation();
    setSavedNoteTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Hàm bấm 1-chạm để gắn/bỏ ghi chú cho món ăn
  const toggleItemNoteTag = (itemId, currentNote, tag) => {
    const parts = (currentNote || '').split(',').map((s) => s.trim()).filter(Boolean);
    let newNote = '';
    if (parts.some((p) => p.toLowerCase() === tag.toLowerCase())) {
      newNote = parts.filter((p) => p.toLowerCase() !== tag.toLowerCase()).join(', ');
    } else {
      newNote = [...parts, tag].join(', ');
    }
    updateItemNote(itemId, newNote);
    saveNewNoteTag(tag);
  };

  // Hàm bấm 1-chạm để gắn/bỏ ghi chú cho toàn đơn
  const toggleOrderNoteTag = (tag) => {
    const parts = (orderNote || '').split(',').map((s) => s.trim()).filter(Boolean);
    let newNote = '';
    if (parts.some((p) => p.toLowerCase() === tag.toLowerCase())) {
      newNote = parts.filter((p) => p.toLowerCase() !== tag.toLowerCase()).join(', ');
    } else {
      newNote = [...parts, tag].join(', ');
    }
    setTableNotes((prev) => ({
      ...prev,
      [cartKey]: newNote,
    }));
    saveNewNoteTag(tag);
  };
  const [pendingOrderCodes, setPendingOrderCodes] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(staffList[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);

  // State Quản lý Thêm Bàn Mới & Quản Lý Phòng
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState('Phòng thường');
  const [customAreaName, setCustomAreaName] = useState('');
  const [isCreatingCustomArea, setIsCreatingCustomArea] = useState(false);

  // State Quản lý In Hóa Đơn & Xem Công Thức
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [recipeModalDish, setRecipeModalDish] = useState(null);

  // State Quản lý Chuyển Bàn / Gộp Bàn thông minh
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveActionType, setMoveActionType] = useState('MERGE'); // 'MOVE' hoặc 'MERGE'
  const [selectedTargetIds, setSelectedTargetIds] = useState([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalAreaFilter, setModalAreaFilter] = useState('ALL');
  const [modalStatusFilter, setModalStatusFilter] = useState('ALL');

  // State Quản lý Tách Bàn (Ungroup)
  const [showUngroupModal, setShowUngroupModal] = useState(false);

  // State Quản lý Đặt Bàn Trước (Reservation)
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [targetReserveTable, setTargetReserveTable] = useState(null);
  const [reserveFormName, setReserveFormName] = useState('');
  const [reserveFormPhone, setReserveFormPhone] = useState('');
  const [reserveFormTime, setReserveFormTime] = useState('');
  const [reserveFormNote, setReserveFormNote] = useState('');
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // Cập nhật timestamp mỗi giây để tính toán đếm ngược giờ hẹn & đếm ngược 10 phút hủy tự động
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bộ lọc danh mục & tìm kiếm món cho Thực đơn món ăn
  const [menuFilterCategory, setMenuFilterCategory] = useState('Tất cả');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  // Hàm lấy icon theo tên danh mục
  const getCategoryIcon = (cat) => {
    if (!cat) return '🍽️';
    const c = cat.toLowerCase();
    if (c.includes('cà phê') || c.includes('cafe') || c.includes('coffee')) return '☕';
    if (c.includes('trà') || c.includes('tea')) return '🍵';
    if (c.includes('đá xay') || c.includes('nước') || c.includes('sinh tố') || c.includes('ép') || c.includes('uống')) return '🥤';
    if (c.includes('bánh') || c.includes('ăn') || c.includes('food')) return '🥐';
    return '🍽️';
  };

  // Danh sách các danh mục có trong menu
  const menuCategories = useMemo(() => {
    const cats = ['Tất cả'];
    menu.forEach((item) => {
      const cat = item.category || 'Khác';
      if (!cats.includes(cat)) {
        cats.push(cat);
      }
    });
    return cats;
  }, [menu]);

  // Thực đơn sau khi lọc theo Danh mục và Ô tìm kiếm
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const itemCat = item.category || 'Khác';
      const matchCat =
        menuFilterCategory === 'Tất cả' ||
        itemCat === menuFilterCategory ||
        (menuFilterCategory === 'Cà Phê' && (itemCat.includes('Cà Phê') || itemCat.includes('Cafe'))) ||
        (menuFilterCategory === 'Trà & Trà Sữa' && (itemCat.includes('Trà') || itemCat.includes('Tea'))) ||
        (menuFilterCategory === 'Nước Uống & Đá Xay' && (itemCat.includes('Nước') || itemCat.includes('Đá Xay') || itemCat.includes('Sinh Tố') || itemCat.includes('Ép'))) ||
        (menuFilterCategory === 'Đồ Ăn & Bánh' && (itemCat.includes('Bánh') || itemCat.includes('Ăn')));

      const matchSearch =
        !menuSearchTerm ||
        normalizeVietnamese(item.name).includes(normalizeVietnamese(menuSearchTerm));

      return matchCat && matchSearch;
    });
  }, [menu, menuFilterCategory, menuSearchTerm]);

  // Kiểm tra món có bị thiếu nguyên liệu trong kho hay không
  const checkDishMissingIngredients = (dish) => {
    if (!Array.isArray(dish.ingredients) || dish.ingredients.length === 0) return null;
    for (const ing of dish.ingredients) {
      const found = inventory.find(
        (inv) => inv.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
      );
      if (!found) return `Thiếu "${ing.name}" (chưa có trong kho)`;
      if (found.stock <= 0) return `Hết "${ing.name}" (Tồn kho = 0)`;
      if (found.stock < (ing.amount || 1)) return `Tồn không đủ "${ing.name}"`;
    }
    return null;
  };

  // Xử lý bấm vào thẻ món: nếu thiếu nguyên liệu sẽ nhắc nhở nhập kho
  const handleDishCardClick = (item) => {
    const missingReason = checkDishMissingIngredients(item);
    if (missingReason) {
      showWarning(
        `Món "${item.name}" đang tạm ngưng do kho: ${missingReason}! Vui lòng bổ sung tại tab "Quản Lý Kho".`
      );
      return;
    }
    addToCart(item);
  };

  // Lấy bàn hiện tại đang được chọn (luôn cập nhật theo state tables mới nhất)
  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0] || {};

  // Xác định key giỏ hàng (Nếu bàn thuộc Nhóm gộp, lấy theo groupId)
  const cartKey = selectedTable?.groupId || selectedTable?.id;
  const cart = tableCarts[cartKey] || [];
  const orderNote = tableNotes[cartKey] || '';

  // Hàm tiện ích: Lấy tóm tắt giỏ hàng của bất kỳ bàn nào (số món, tổng tiền)
  const getTableSummary = (table) => {
    if (!table) return { count: 0, total: 0, items: [] };
    const key = table.groupId || table.id;
    const items = tableCarts[key] || [];
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { count, total, items };
  };

  // 1. THÊM MÓN VÀO GIỎ HÀNG (ĐỒNG BỘ CHO TẤT CẢ BÀN TRONG NHÓM GỘP)
  const addToCart = (product) => {
    if (!selectedTable?.id) return;

    setTableCarts((prev) => {
      const currentCart = prev[cartKey] || [];
      const exist = currentCart.find((item) => item.id === product.id);
      let updatedCart;
      if (exist) {
        updatedCart = currentCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        updatedCart = [...currentCart, { ...product, qty: 1, itemNote: '' }];
      }
      return { ...prev, [cartKey]: updatedCart };
    });

    setTables((prevTables) =>
      prevTables.map((t) => {
        const isMatch = selectedTable.groupId
          ? (t.id === selectedTable.id || t.groupId === selectedTable.groupId)
          : t.id === selectedTable.id;
        return isMatch ? { ...t, occupied: true } : t;
      })
    );
  };

  const updateItemNote = (id, note) => {
    setTableCarts((prev) => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = currentCart.map((item) =>
        item.id === id ? { ...item, itemNote: note } : item
      );
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  const removeFromCart = (id) => {
    setTableCarts((prev) => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = currentCart.filter((item) => item.id !== id);
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  // Cập nhật số lượng món (+ hoặc -) trực tiếp trong giỏ hàng
  const updateItemQty = (id, delta) => {
    setTableCarts((prev) => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = currentCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  // 2. ĐỔI TRẠNG THÁI THẬT CỦA BÀN: BẬN (CÓ KHÁCH) HOẶC RẢNH (TRỐNG)
  const setTableOccupiedStatus = (tableId, occupiedStatus) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;

    // Nếu muốn chuyển sang RẢNH mà bàn đang có món gọi trong đơn
    if (!occupiedStatus) {
      const summary = getTableSummary(targetTable);
      if (summary.count > 0) {
        showConfirm({
          title: 'Trả Bàn Về Trạng Thái Rảnh',
          message: `Bàn "${targetTable.name}" hiện đang có ${summary.count} món gọi (${summary.total.toLocaleString()} VNĐ). Bạn có chắc chắn muốn hủy đơn và trả bàn này về trạng thái RẢNH (Trống)?`,
          confirmText: 'Xác nhận trả rảnh',
          cancelText: 'Giữ lại đơn',
          type: 'warning',
          onConfirm: () => {
            const key = targetTable.groupId || targetTable.id;
            setTableCarts((prev) => ({ ...prev, [key]: [] }));
            setTableNotes((prev) => ({ ...prev, [key]: '' }));

            setTables((prev) =>
              prev.map((t) =>
                t.id === tableId
                  ? {
                      ...t,
                      occupied: false,
                      groupId: null,
                      isReserved: false,
                      reservedName: null,
                      reservedPhone: null,
                      reservedTime: null,
                      reservedNote: null,
                    }
                  : t
              )
            );
            apiUpdateTable(tableId, {
              occupied: false,
              groupId: null,
              isReserved: false,
              reservedName: null,
              reservedPhone: null,
              reservedTime: null,
              reservedNote: null,
            }).catch(() => {});

            setSelectedTableId(tableId);
            showSuccess(`Đã trả "${targetTable.name}" về trạng thái RẢNH (Trống)!`);
          },
        });
        return;
      }
    }

    // Đổi trạng thái thật của bàn trong state và đồng bộ lên Supabase DB
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            occupied: occupiedStatus,
            groupId: !occupiedStatus ? null : t.groupId,
            // Nếu chuyển sang Bận hoặc Rảnh thì hủy trạng thái đặt trước
            isReserved: false,
            reservedName: null,
            reservedPhone: null,
            reservedTime: null,
            reservedNote: null,
          };
        }
        return t;
      })
    );

    // Đồng bộ lên Supabase Database
    apiUpdateTable(tableId, {
      occupied: occupiedStatus,
      groupId: !occupiedStatus ? null : targetTable.groupId,
      isReserved: false,
      reservedName: null,
      reservedPhone: null,
      reservedTime: null,
      reservedNote: null,
    }).catch((err) => {
      console.warn('Đồng bộ trạng thái bàn lên server:', err.message);
    });

    setSelectedTableId(tableId);

    if (occupiedStatus) {
      showSuccess(`Đã chuyển "${targetTable.name}" sang trạng thái BẬN (Có khách). Bạn có thể bấm chọn món bên thực đơn để order thêm!`);
    } else {
      showSuccess(`Đã chuyển "${targetTable.name}" về trạng thái RẢNH (Trống)!`);
    }
  };

  // 2.1. CÁC HÀM XỬ LÝ ĐẶT BÀN TRƯỚC (RESERVATION)
  // Mở modal đặt bàn
  const openReserveModal = (table) => {
    setTargetReserveTable(table);
    setReserveFormName(table.reservedName || '');
    setReserveFormPhone(table.reservedPhone || '');

    // Nếu đã có giờ hẹn thì lấy, nếu chưa thì gợi ý 30 phút sau
    if (table.reservedTime) {
      setReserveFormTime(table.reservedTime);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setReserveFormTime(`${hh}:${mm}`);
    }

    setReserveFormNote(table.reservedNote || '');
    setShowReserveModal(true);
  };

  // Lưu thông tin đặt bàn
  const handleSaveReservation = (e) => {
    if (e) e.preventDefault();
    if (!targetReserveTable) return;

    if (!reserveFormName.trim()) {
      showWarning('Vui lòng nhập tên người đặt bàn!');
      return;
    }
    if (!reserveFormTime) {
      showWarning('Vui lòng chọn thời gian hẹn!');
      return;
    }

    const tableId = targetReserveTable.id;
    const updatePayload = {
      isReserved: true,
      reservedName: reserveFormName.trim(),
      reservedPhone: reserveFormPhone.trim(),
      reservedTime: reserveFormTime,
      reservedNote: reserveFormNote.trim(),
      occupied: false,
    };

    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, ...updatePayload } : t))
    );

    apiUpdateTable(tableId, updatePayload).catch((err) => {
      console.warn('Lỗi lưu đặt bàn lên Supabase:', err.message);
    });

    setShowReserveModal(false);
    setSelectedTableId(tableId);

    // Lưu vào Lịch sử đặt bàn (POS_RESERVATION_HISTORY)
    try {
      const newReservation = {
        id: 'RES-' + Date.now(),
        tableId: targetReserveTable.id,
        tableName: targetReserveTable.name,
        area: targetReserveTable.area,
        customerName: reserveFormName.trim(),
        customerPhone: reserveFormPhone.trim(),
        reserveTime: reserveFormTime,
        reserveDate: new Date().toLocaleDateString('vi-VN'),
        note: reserveFormNote.trim(),
        status: 'WAITING',
        createdAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('vi-VN')}`,
      };
      const existingResRaw = localStorage.getItem('POS_RESERVATION_HISTORY');
      const existingRes = existingResRaw ? JSON.parse(existingResRaw) : [];
      localStorage.setItem('POS_RESERVATION_HISTORY', JSON.stringify([newReservation, ...existingRes]));
    } catch (errRes) {
      console.warn('Lỗi ghi nhật ký đặt bàn:', errRes);
    }

    showSuccess(`Đã đặt bàn "${targetReserveTable.name}" cho ${reserveFormName} lúc ${reserveFormTime}!`);
  };

  // Hủy đặt bàn (trả về bàn rảnh)
  const handleCancelReservation = (table, isAutoCancel = false) => {
    if (!table) return;

    const performCancel = () => {
      const updatePayload = {
        isReserved: false,
        reservedName: null,
        reservedPhone: null,
        reservedTime: null,
        reservedNote: null,
      };

      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, ...updatePayload } : t))
      );

      apiUpdateTable(table.id, updatePayload).catch((err) => {
        console.warn('Lỗi hủy đặt bàn lên Supabase:', err.message);
      });

      if (isAutoCancel) {
        showError(`⚠️ Bàn "${table.name}" đã tự động hủy đặt lịch do quá 10 phút khách không tới!`);
      } else {
        showSuccess(`Đã hủy đặt bàn "${table.name}" thành công! Bàn đã trở lại trạng thái Rảnh.`);
      }

      // Cập nhật trạng thái hủy vào Lịch sử đặt bàn
      try {
        const existingResRaw = localStorage.getItem('POS_RESERVATION_HISTORY');
        if (existingResRaw) {
          const list = JSON.parse(existingResRaw);
          const updated = list.map((r) =>
            r.tableId === table.id && r.status === 'WAITING'
              ? {
                  ...r,
                  status: isAutoCancel ? 'CANCELLED_AUTO' : 'CANCELLED_MANUAL',
                  cancelledAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('vi-VN')}${
                    isAutoCancel ? ' (Quá 10 phút vắng mặt)' : ''
                  }`,
                }
              : r
          );
          localStorage.setItem('POS_RESERVATION_HISTORY', JSON.stringify(updated));
        }
      } catch (errRes) {
        console.warn('Lỗi cập nhật lịch sử hủy đặt bàn:', errRes);
      }
    };

    if (isAutoCancel) {
      performCancel();
    } else {
      showConfirm({
        title: 'Hủy Lịch Đặt Bàn',
        message: `Bạn có chắc chắn muốn hủy đặt bàn "${table.name}" của khách ${table.reservedName || ''} (Hẹn: ${table.reservedTime || ''}) không? Bàn sẽ trở về trạng thái RẢNH.`,
        confirmText: 'Xác nhận hủy đặt',
        cancelText: 'Giữ lại lịch hẹn',
        type: 'danger',
        onConfirm: performCancel,
      });
    }
  };

  // Khách đặt bàn đã đến nhận bàn (chuyển sang BẬN)
  const handleCheckinReservation = (table) => {
    if (!table) return;
    setTableOccupiedStatus(table.id, true);

    // Cập nhật trạng thái nhận bàn vào Lịch sử đặt bàn
    try {
      const existingResRaw = localStorage.getItem('POS_RESERVATION_HISTORY');
      if (existingResRaw) {
        const list = JSON.parse(existingResRaw);
        const updated = list.map((r) =>
          r.tableId === table.id && r.status === 'WAITING'
            ? {
                ...r,
                status: 'ARRIVED',
                arrivedAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('vi-VN')}`,
              }
            : r
        );
        localStorage.setItem('POS_RESERVATION_HISTORY', JSON.stringify(updated));
      }
    } catch (errRes) {
      console.warn('Lỗi cập nhật lịch sử nhận bàn:', errRes);
    }

    showSuccess(`Khách ${table.reservedName || ''} đã nhận "${table.name}". Chúc quý khách ngon miệng!`);
  };

  // Hàm tính toán trạng thái hẹn giờ & đếm ngược 10 phút trễ
  const getReservationCountdownInfo = (table) => {
    if (!table.isReserved || !table.reservedTime) return null;

    try {
      const now = new Date(nowTimestamp);
      let targetDate = new Date();

      if (table.reservedTime.includes('T') || table.reservedTime.includes('-')) {
        targetDate = new Date(table.reservedTime);
      } else {
        const [h, m] = table.reservedTime.split(':').map(Number);
        targetDate.setHours(h, m, 0, 0);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      // Nếu chưa đến giờ hẹn
      if (diffMs > 0) {
        const hoursLeft = Math.floor(diffMs / 3600000);
        const minsLeft = Math.floor((diffMs % 3600000) / 60000);
        const secsLeft = Math.floor((diffMs % 60000) / 1000);

        let timeStr = `${minsLeft}p`;
        if (hoursLeft > 0) timeStr = `${hoursLeft}h ${minsLeft}p`;
        else timeStr = `${minsLeft}:${String(secsLeft).padStart(2, '0')}`;

        return {
          status: 'UPCOMING',
          diffMs,
          timeStr,
          text: `Hẹn lúc ${table.reservedTime} (còn ${timeStr})`,
        };
      }

      // Đã đến giờ hẹn hoặc trễ giờ hẹn
      // Giới hạn tối đa trễ 10 phút (10 * 60 * 1000 ms)
      const MAX_GRACE_MS = 10 * 60 * 1000;
      const lateMs = Math.abs(diffMs);

      if (lateMs <= MAX_GRACE_MS) {
        const remainingMs = MAX_GRACE_MS - lateMs;
        const remMins = Math.floor(remainingMs / 60000);
        const remSecs = Math.floor((remainingMs % 60000) / 1000);

        return {
          status: 'LATE_COUNTDOWN',
          diffMs,
          lateMs,
          remainingMs,
          countdownStr: `${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`,
          text: `⚠️ Trễ hẹn! Tự hủy sau: ${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`,
        };
      }

      // Quá 10 phút -> Đã hết hạn, cần tự hủy
      return {
        status: 'EXPIRED',
        diffMs,
        lateMs,
        text: '❌ Đã quá 10 phút, đang tự hủy...',
      };
    } catch {
      return null;
    }
  };

  // Tự động kiểm tra các bàn đặt trước xem bàn nào trễ quá 10 phút thì tự động hủy đặt bàn
  useEffect(() => {
    tables.forEach((t) => {
      if (t.isReserved && t.reservedTime) {
        const info = getReservationCountdownInfo(t);
        if (info && info.status === 'EXPIRED') {
          handleCancelReservation(t, true); // Tự động hủy
        }
      }
    });
  }, [nowTimestamp, tables]);

  // Đặt bàn trước / Trả bàn trống cho bàn hiện tại
  const toggleTableStatus = () => {
    if (!selectedTable?.id) return;
    setTableOccupiedStatus(selectedTable.id, !selectedTable.occupied);
  };

  // Mở Popup Gộp Bàn / Chuyển Bàn
  const handleOpenMoveModal = (type) => {
    setMoveActionType(type);
    setSelectedTargetIds([]);
    setModalSearchTerm('');
    setModalAreaFilter('ALL');
    setModalStatusFilter('ALL');
    setShowMoveModal(true);
  };

  // Toggle chọn bàn trong Modal (hỗ trợ chọn nhiều bàn khi Gộp, 1 bàn khi Chuyển)
  const handleToggleTargetTable = (tableId) => {
    if (moveActionType === 'MOVE') {
      setSelectedTargetIds([tableId]);
    } else {
      if (selectedTargetIds.includes(tableId)) {
        setSelectedTargetIds(selectedTargetIds.filter((id) => id !== tableId));
      } else {
        setSelectedTargetIds([...selectedTargetIds, tableId]);
      }
    }
  };

  // 3. XỬ LÝ CHUYỂN BÀN & GỘP BÀN THÔNG MINH
  const handleExecuteMoveOrMerge = (e) => {
    if (e) e.preventDefault();

    if (selectedTargetIds.length === 0) {
      showWarning(moveActionType === 'MERGE' ? 'Vui lòng chọn ít nhất một bàn để gộp!' : 'Vui lòng chọn bàn đích để chuyển tới!');
      return;
    }

    if (moveActionType === 'MOVE') {
      // --- XỬ LÝ CHUYỂN BÀN ---
      const targetTableId = selectedTargetIds[0];
      if (targetTableId === selectedTable.id) {
        showError('Bàn đích không được trùng với bàn hiện tại!');
        return;
      }

      const targetTableObj = tables.find((t) => t.id === targetTableId);
      const sourceKey = selectedTable.groupId || selectedTable.id;
      const targetKey = targetTableObj.groupId || targetTableObj.id;

      const sourceCart = tableCarts[sourceKey] || [];
      const sourceNote = tableNotes[sourceKey] || '';
      const targetCart = tableCarts[targetKey] || [];
      const targetNote = tableNotes[targetKey] || '';

      // Nếu bàn đích đã có món, gộp đơn hàng sang bàn đích
      let newTargetCart = [...sourceCart];
      let newTargetNote = sourceNote;
      if (targetCart.length > 0) {
        newTargetCart = [...targetCart];
        sourceCart.forEach((item) => {
          const idx = newTargetCart.findIndex((x) => x.id === item.id);
          if (idx > -1) {
            newTargetCart[idx] = { ...newTargetCart[idx], qty: newTargetCart[idx].qty + item.qty };
          } else {
            newTargetCart.push({ ...item });
          }
        });
        newTargetNote = [targetNote, sourceNote].filter(Boolean).join(' | ');
      }

      setTableCarts((prev) => ({
        ...prev,
        [targetKey]: newTargetCart,
        [sourceKey]: [],
      }));
      setTableNotes((prev) => ({
        ...prev,
        [targetKey]: newTargetNote,
        [sourceKey]: '',
      }));

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === selectedTable.id) return { ...t, occupied: false, groupId: null };
          if (t.id === targetTableId) return { ...t, occupied: true, groupId: targetTableObj.groupId || null };
          return t;
        })
      );

      setSelectedTableId(targetTableId);
      setShowMoveModal(false);
      setSelectedTargetIds([]);
      showSuccess(`Đã chuyển toàn bộ đơn hàng từ ${selectedTable.name} sang ${targetTableObj.name} thành công!`);
    } else {
      // --- XỬ LÝ GỘP BÀN (HỖ TRỢ GỘP NHIỀU BÀN CÙNG LÚC) ---
      const selectedTargetTables = tables.filter((t) => selectedTargetIds.includes(t.id));
      const allInvolvedTables = [selectedTable, ...selectedTargetTables];

      // Tìm groupId có sẵn nếu các bàn đã có nhóm, hoặc tạo nhóm mới
      const existingGroupId = allInvolvedTables.find((t) => t.groupId)?.groupId;
      const finalGroupId = existingGroupId || `GROUP-${Date.now()}`;

      // Tập hợp tất cả các key giỏ hàng cần gộp
      const keysToMerge = new Set();
      allInvolvedTables.forEach((t) => {
        keysToMerge.add(t.groupId || t.id);
      });

      // Gom toàn bộ món ăn và ghi chú
      const mergedCart = [];
      const mergedNotesList = [];

      keysToMerge.forEach((key) => {
        const c = tableCarts[key] || [];
        c.forEach((sourceItem) => {
          const existIndex = mergedCart.findIndex((item) => item.id === sourceItem.id);
          if (existIndex > -1) {
            mergedCart[existIndex] = {
              ...mergedCart[existIndex],
              qty: mergedCart[existIndex].qty + sourceItem.qty,
            };
          } else {
            mergedCart.push({ ...sourceItem });
          }
        });

        const n = tableNotes[key];
        if (n && !mergedNotesList.includes(n)) {
          mergedNotesList.push(n);
        }
      });

      const mergedNote = mergedNotesList.filter(Boolean).join(' | ');

      // Cập nhật Carts và Notes
      setTableCarts((prev) => {
        const next = { ...prev };
        keysToMerge.forEach((key) => {
          if (key !== finalGroupId) {
            next[key] = [];
          }
        });
        next[finalGroupId] = mergedCart;
        return next;
      });

      setTableNotes((prev) => {
        const next = { ...prev };
        keysToMerge.forEach((key) => {
          if (key !== finalGroupId) {
            next[key] = '';
          }
        });
        next[finalGroupId] = mergedNote;
        return next;
      });

      // Cập nhật tất cả bàn thuộc nhóm mới
      setTables((prev) =>
        prev.map((t) => {
          const isInvolved =
            allInvolvedTables.some((tb) => tb.id === t.id) ||
            (t.groupId && keysToMerge.has(t.groupId));

          if (isInvolved) {
            return { ...t, occupied: true, groupId: finalGroupId };
          }
          return t;
        })
      );

      // Đồng bộ gộp bàn lên Supabase Database
      const mergedIds = allInvolvedTables.map((tb) => tb.id);
      apiMergeTables(mergedIds, finalGroupId).catch((err) => {
        console.warn('Đồng bộ gộp bàn lên server:', err.message);
      });

      const targetNames = selectedTargetTables.map((t) => t.name.split('-')[0]).join(', ');
      showSuccess(`Đã gộp ${selectedTable.name.split('-')[0]} và [${targetNames}] vào cùng một nhóm đơn hàng thành công!`);

      setShowMoveModal(false);
      setSelectedTargetIds([]);
    }
  };

  // 4. XỬ LÝ TÁCH BÀN / HỦY GỘP NHÓM
  const handleUngroup = (mode) => {
    if (!selectedTable?.groupId) return;

    const currentGroupId = selectedTable.groupId;
    const groupTables = tables.filter((t) => t.groupId === currentGroupId);

    if (mode === 'CURRENT_ONLY') {
      // Gỡ bàn hiện tại ra khỏi nhóm
      if (groupTables.length <= 2) {
        // Nếu nhóm chỉ có 2 bàn, gỡ bàn hiện tại thì cả nhóm giải tán
        const otherTable = groupTables.find((t) => t.id !== selectedTable.id);
        const groupCart = tableCarts[currentGroupId] || [];
        const groupNote = tableNotes[currentGroupId] || '';

        setTableCarts((prev) => ({
          ...prev,
          [otherTable.id]: groupCart,
          [selectedTable.id]: [],
          [currentGroupId]: [],
        }));
        setTableNotes((prev) => ({
          ...prev,
          [otherTable.id]: groupNote,
          [selectedTable.id]: '',
          [currentGroupId]: '',
        }));

        setTables((prev) =>
          prev.map((t) => {
            if (t.id === selectedTable.id) return { ...t, occupied: false, groupId: null };
            if (t.id === otherTable.id) return { ...t, occupied: true, groupId: null };
            return t;
          })
        );
        setSelectedTableId(otherTable.id);
      } else {
        // Nhóm có >= 3 bàn, chỉ gỡ bàn này ra
        setTables((prev) =>
          prev.map((t) => {
            if (t.id === selectedTable.id) return { ...t, occupied: false, groupId: null };
            return t;
          })
        );
        const remainingTable = groupTables.find((t) => t.id !== selectedTable.id);
        if (remainingTable) setSelectedTableId(remainingTable.id);
      }
      showSuccess(`Đã tách ${selectedTable.name} ra khỏi nhóm thành công!`);
    } else if (mode === 'DISSOLVE_ALL') {
      // Giải tán toàn bộ nhóm gộp, giữ đơn hàng cho bàn hiện tại
      const groupCart = tableCarts[currentGroupId] || [];
      const groupNote = tableNotes[currentGroupId] || '';

      setTableCarts((prev) => ({
        ...prev,
        [selectedTable.id]: groupCart,
        [currentGroupId]: [],
      }));
      setTableNotes((prev) => ({
        ...prev,
        [selectedTable.id]: groupNote,
        [currentGroupId]: '',
      }));

      setTables((prev) =>
        prev.map((t) => {
          if (t.groupId === currentGroupId) {
            return {
              ...t,
              occupied: t.id === selectedTable.id,
              groupId: null,
            };
          }
          return t;
        })
      );
      showSuccess(`Đã giải tán nhóm gộp. Toàn bộ đơn hàng hiện được lưu tại ${selectedTable.name}!`);
    }

    setShowUngroupModal(false);
  };

  // Danh sách các phòng / khu vực duy nhất hiện có trong hệ thống
  const existingAreas = Array.from(
    new Set(tables.map((t) => t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường')))
  );

  // Mở modal thêm bàn mới (tự động gợi ý tên bàn theo phòng)
  const openAddTableModal = (defaultArea = null) => {
    const targetArea = defaultArea || (selectedArea !== 'Tất cả' ? selectedArea : existingAreas[0] || 'Phòng thường');
    setNewTableArea(targetArea);
    setIsCreatingCustomArea(false);
    setCustomAreaName('');

    // Tính số lượng bàn hiện có trong phòng để gợi ý số tiếp theo
    const countInArea = tables.filter(
      (t) => (t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường')) === targetArea
    ).length;

    setNewTableName(`Bàn ${countInArea + 1}-${targetArea}`);
    setShowAddTableModal(true);
  };

  // Xử lý tạo bàn mới
  const handleAddTable = (e) => {
    if (e) e.preventDefault();
    const finalArea = isCreatingCustomArea ? customAreaName.trim() : newTableArea.trim();
    const finalName = newTableName.trim();

    if (!finalArea) {
      showWarning('Vui lòng chọn hoặc nhập tên phòng / khu vực!');
      return;
    }
    if (!finalName) {
      showWarning('Vui lòng nhập tên bàn hiển thị!');
      return;
    }

    // Kiểm tra tên bàn trùng lặp
    const nameExists = tables.some((t) => t.name.toLowerCase() === finalName.toLowerCase());
    if (nameExists) {
      showWarning(`Tên bàn "${finalName}" đã tồn tại! Vui lòng đặt tên khác.`);
      return;
    }

    const newId = `T_${Date.now()}`;
    const newTable = {
      id: newId,
      name: finalName,
      area: finalArea,
      occupied: false,
      groupId: null,
    };

    setTables((prev) => [...prev, newTable]);
    setSelectedTableId(newId);
    setShowAddTableModal(false);

    // Gửi tạo bàn mới trực tiếp lên Supabase Database
    apiCreateTable({ name: finalName, area: finalArea })
      .then((created) => {
        if (created && created.id) {
          setTables((prev) => prev.map((t) => (t.id === newId ? created : t)));
          setSelectedTableId(created.id);
        }
      })
      .catch((err) => {
        console.warn('Lỗi lưu bàn lên Supabase:', err.message);
      });

    showSuccess(`Đã thêm bàn mới: "${finalName}" (${finalArea}) thành công!`);
  };

  // Xử lý xóa bàn khỏi hệ thống
  const handleDeleteTable = (tableToDelete) => {
    if (!tableToDelete) return;

    if (tableToDelete.occupied) {
      showWarning(`Bàn "${tableToDelete.name}" đang có khách ngồi. Vui lòng thanh toán hoặc hủy bàn trước khi xóa!`);
      return;
    }

    const cartSummary = getTableSummary(tableToDelete);
    if (cartSummary.count > 0) {
      showWarning(`Bàn "${tableToDelete.name}" đang có món gọi trong đơn. Vui lòng xóa món trước khi xóa bàn!`);
      return;
    }

    if (tables.length <= 1) {
      showWarning('Quán phải có tối thiểu ít nhất 1 bàn hoạt động!');
      return;
    }

    showConfirm({
      title: 'Xóa Bàn Khỏi Hệ Thống',
      message: `Bạn có chắc chắn muốn xóa "${tableToDelete.name}" (Khu vực: ${tableToDelete.area || 'Phòng thường'}) không? Bàn sẽ bị gỡ bỏ vĩnh viễn khỏi sơ đồ.`,
      confirmText: 'Xác nhận xóa bàn',
      cancelText: 'Giữ lại bàn',
      type: 'danger',
      onConfirm: () => {
        const remaining = tables.filter((t) => t.id !== tableToDelete.id);
        setTables(remaining);

        // Đồng bộ xóa bàn trên Supabase
        apiDeleteTable(tableToDelete.id).catch((err) => {
          console.warn('Lỗi xóa bàn trên Supabase:', err.message);
        });

        // Nếu bàn đang chọn là bàn bị xóa, chuyển sang bàn khác
        if (selectedTableId === tableToDelete.id) {
          if (remaining.length > 0) setSelectedTableId(remaining[0].id);
        }

        showSuccess(`Đã xóa bàn "${tableToDelete.name}" thành công!`);
      },
    });
  };

  // Tính toán hóa đơn bàn hiện tại
  const subTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = (subTotal * discount) / 100;
  const vat = (subTotal - discountAmount) * 0.1;
  const total = subTotal - discountAmount + vat;

  // Hàm tạo mã đơn hàng chuẩn mẫu: DH-số thứ tự đúng-ngày tháng năm (VD: DH-001-08112026)
  const getOrGenerateOrderCode = (key) => {
    // Nếu bàn này đã có mã trong phiên thanh toán hiện tại, giữ nguyên để không bị nhảy số thứ tự
    if (pendingOrderCodes[key]) {
      return pendingOrderCodes[key];
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const dateStr = `${day}${month}${year}`; // e.g. "08112026"

    const counterKey = `POS_DAILY_COUNTER_${dateStr}`;
    const savedCount = parseInt(localStorage.getItem(counterKey) || '0', 10);
    const countFromOrders = (orders || []).filter((o) => o.id && o.id.includes(dateStr)).length;
    const nextSeq = Math.max(savedCount, countFromOrders) + 1;

    localStorage.setItem(counterKey, String(nextSeq));

    const formattedSeq = String(nextSeq).padStart(3, '0');
    const newCode = `DH-${formattedSeq}-${dateStr}`;

    setPendingOrderCodes((prev) => ({
      ...prev,
      [key]: newCode,
    }));

    return newCode;
  };

  // 5. CHUẨN BỊ IN HÓA ĐƠN
  const handleCheckout = () => {
    if (cart.length === 0) {
      showWarning('Vui lòng chọn món trước khi thanh toán!');
      return;
    }

    const staffObj = staffList.find((s) => s.id === selectedStaff);

    let groupTableNames = selectedTable?.name;
    if (selectedTable?.groupId) {
      const groupedTables = tables.filter((t) => t.groupId === selectedTable.groupId);
      groupTableNames = groupedTables.map((t) => t.name.split('-')[0]).join(' + ');
    }

    const orderCode = getOrGenerateOrderCode(cartKey);

    const invoiceData = {
      id: orderCode,
      tableName: groupTableNames,
      staffName: staffObj?.name || 'Nhân viên',
      items: [...cart],
      orderNote,
      subTotal,
      discountAmount,
      vat,
      total,
      paymentMethod,
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setCurrentInvoice(invoiceData);
    setShowPrintModal(true);
  };

  // 6. GIẢI PHÓNG TOÀN BỘ CÁC BÀN TRONG NHÓM KHI THANH TOÁN XONG
  const confirmPaymentAndPrint = () => {
    if (currentInvoice) {
      onCompleteOrder(currentInvoice);

      // Tự động trừ kho nguyên vật liệu theo định lượng công thức món
      if (onDeductInventory && Array.isArray(currentInvoice.items)) {
        onDeductInventory(currentInvoice.items);
      }

      // Lưu nhật ký vào Lịch sử bàn đã dùng (POS_TABLE_USAGE_HISTORY)
      try {
        const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const nowDateStr = new Date().toLocaleDateString('vi-VN');
        const seatedTimeStr = currentInvoice.seatedAt || new Date(Date.now() - 40 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        const newUsage = {
          id: 'TU-' + Date.now(),
          tableId: selectedTable?.id || 'T1',
          tableName: currentInvoice.tableName,
          area: selectedTable?.area || 'Phòng thường',
          seatedAt: `${seatedTimeStr} - ${nowDateStr}`,
          completedAt: `${nowTimeStr} - ${nowDateStr}`,
          durationMinutes: 40,
          orderId: currentInvoice.id,
          items: (currentInvoice.items || []).map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            qty: it.qty,
            itemNote: it.itemNote || '',
            category: it.category || '',
            orderedAt: it.orderedAt || seatedTimeStr,
          })),
          totalItemsCount: (currentInvoice.items || []).reduce((s, it) => s + it.qty, 0),
          subTotal: currentInvoice.subTotal,
          discount: currentInvoice.discountAmount || 0,
          total: currentInvoice.total,
          paymentMethod: currentInvoice.paymentMethod,
          orderNote: currentInvoice.orderNote || '',
          staffName: currentInvoice.staffName || 'Tiến Phát',
        };

        const existingRaw = localStorage.getItem('POS_TABLE_USAGE_HISTORY');
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem('POS_TABLE_USAGE_HISTORY', JSON.stringify([newUsage, ...existingList]));
      } catch (errUsage) {
        console.warn('Lỗi lưu lịch sử bàn đã dùng:', errUsage);
      }

      const targetGroupId = selectedTable?.groupId;

      // Xóa mã tạm của bàn sau khi đã thanh toán thành công
      setPendingOrderCodes((prev) => {
        const next = { ...prev };
        delete next[cartKey];
        if (targetGroupId) delete next[targetGroupId];
        return next;
      });

      setTableCarts((prev) => {
        const updated = { ...prev, [cartKey]: [] };
        if (targetGroupId) updated[targetGroupId] = [];
        return updated;
      });

      setTableNotes((prev) => {
        const updated = { ...prev, [cartKey]: '' };
        if (targetGroupId) updated[targetGroupId] = '';
        return updated;
      });

      setTables((prevTables) =>
        prevTables.map((t) => {
          const isMatch = targetGroupId
            ? t.groupId === targetGroupId
            : t.id === selectedTable.id;

          if (isMatch) {
            return { ...t, occupied: false, groupId: null };
          }
          return t;
        })
      );

      setShowPrintModal(false);
      window.print();
    }
  };

  // Lọc danh sách bàn cho Lưới hiển thị chính (theo Tab Khu Vực)
  const displayedTables = tables.filter((t) => {
    if (selectedArea === 'Tất cả') return true;
    const tableArea = t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường');
    return tableArea === selectedArea;
  });

  // DANH SÁCH BÀN KHẢ DỤNG CHO MODAL GỘP / CHUYỂN
  // SỬA LỖI LOGIC: Không dùng !== giữa 2 biến undefined/null
  // Chỉ loại trừ chính bàn đang chọn và các bàn ĐÃ CÙNG NHÓM với bàn đang chọn
  const availableTargetTables = tables.filter((t) => {
    if (t.id === selectedTable?.id) return false;
    if (selectedTable?.groupId && t.groupId === selectedTable.groupId) return false;
    return true;
  });

  // Lọc thêm theo tìm kiếm & bộ lọc trong modal
  const filteredModalTables = availableTargetTables.filter((t) => {
    if (modalSearchTerm.trim()) {
      const term = modalSearchTerm.toLowerCase();
      const matchName = t.name.toLowerCase().includes(term);
      const matchId = t.id.toLowerCase().includes(term);
      if (!matchName && !matchId) return false;
    }
    if (modalAreaFilter !== 'ALL') {
      const area = t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường');
      if (area !== modalAreaFilter) return false;
    }
    if (modalStatusFilter === 'EMPTY' && t.occupied) return false;
    if (modalStatusFilter === 'OCCUPIED' && !t.occupied) return false;
    return true;
  });

  // Tính toán tóm tắt Live Preview trước khi gộp
  const sourceSummary = getTableSummary(selectedTable);
  const selectedTargetTables = tables.filter((t) => selectedTargetIds.includes(t.id));
  const targetsSummary = selectedTargetTables.reduce(
    (acc, t) => {
      const key = t.groupId || t.id;
      if (!acc.processedKeys.has(key)) {
        acc.processedKeys.add(key);
        const s = getTableSummary(t);
        acc.count += s.count;
        acc.total += s.total;
      }
      return acc;
    },
    { count: 0, total: 0, processedKeys: new Set() }
  );

  const projectedTotalItems = sourceSummary.count + targetsSummary.count;
  const projectedTotalPrice = sourceSummary.total + targetsSummary.total;

  return (
    <div className="space-y-6">
      {/* SECTION 1: SƠ ĐỒ BÀN QUÁN CAFE */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4 pb-2 border-b flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span>☕ SƠ ĐỒ BÀN QUÁN CAFE</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                {tables.length} Bàn
              </span>
            </h2>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span> Bàn trống ({tables.filter(t => !t.occupied && !t.isReserved).length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block shadow-sm"></span> Đặt trước ({tables.filter(t => t.isReserved).length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm"></span> Đang dùng ({tables.filter(t => t.occupied).length})
              </span>
              <span className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-medium">
                🔗 Có nhóm gộp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* NÚT THÊM BÀN MỚI */}
            <button
              type="button"
              onClick={() => openAddTableModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
              title="Thêm bàn mới vào phòng"
            >
              ➕ Thêm Bàn
            </button>

            {/* NÚT ĐẶT BÀN TRƯỚC (HIỆN KHI BÀN ĐANG CHỌN LÀ BÀN TRỐNG) */}
            {!selectedTable?.occupied && !selectedTable?.isReserved && (
              <button
                type="button"
                onClick={() => openReserveModal(selectedTable)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                title="Khách hẹn giờ đặt bàn trước"
              >
                📅 Đặt Bàn Trước
              </button>
            )}

            {/* NÚT THAO TÁC KHI BÀN ĐANG ĐƯỢC ĐẶT TRƯỚC */}
            {selectedTable?.isReserved && (
              <>
                <button
                  type="button"
                  onClick={() => handleCheckinReservation(selectedTable)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                  title="Khách hẹn đã tới quán, vào bàn order"
                >
                  ✅ Khách Đã Đến / Nhận Bàn
                </button>
                <button
                  type="button"
                  onClick={() => openReserveModal(selectedTable)}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                  title="Chỉnh sửa thông tin/giờ hẹn"
                >
                  ✏️ Sửa Giờ Hẹn
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelReservation(selectedTable)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-3 py-2.5 rounded-xl shadow-sm transition text-xs flex items-center gap-1.5"
                  title="Hủy đặt bàn này"
                >
                  ✕ Hủy Đặt
                </button>
              </>
            )}

            {/* NÚT XÓA BÀN ĐANG CHỌN (HIỆN KHI BÀN TRỐNG & KHÔNG ĐẶT) */}
            {!selectedTable?.occupied && !selectedTable?.isReserved && (
              <button
                type="button"
                onClick={() => handleDeleteTable(selectedTable)}
                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-bold px-3 py-2.5 rounded-xl shadow-sm transition text-xs flex items-center gap-1.5"
                title="Xóa bàn đang chọn khỏi hệ thống"
              >
                🗑️ Xóa Bàn
              </button>
            )}

            {/* CÁC NÚT THAO TÁC BÀN KHI CÓ KHÁCH */}
            {selectedTable?.occupied && (
              <>
                <button
                  onClick={() => handleOpenMoveModal('MERGE')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                  title="Gộp chung với một hoặc nhiều bàn khác"
                >
                  🔀 Gộp Thêm Bàn
                </button>
                <button
                  onClick={() => handleOpenMoveModal('MOVE')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                  title="Chuyển toàn bộ đơn hàng sang bàn khác"
                >
                  ➡️ Chuyển Bàn
                </button>
                {selectedTable?.groupId && (
                  <button
                    onClick={() => setShowUngroupModal(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow transition text-xs flex items-center gap-1.5"
                    title="Tách bàn hoặc giải tán nhóm gộp"
                  >
                    ✂️ Tách / Hủy Gộp
                  </button>
                )}
              </>
            )}

            <button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2 text-xs">
              🛍️ Khách Mang Về
            </button>
          </div>
        </div>

        {/* Tab Khu vực hoạt động thực tế (Tự động mở rộng khi thêm phòng mới) */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['Tất cả', ...existingAreas].map((area) => {
            const count = area === 'Tất cả'
              ? tables.length
              : tables.filter(t => (t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường')) === area).length;
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition flex items-center gap-2 ${selectedArea === area
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span>🏡 {area}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedArea === area ? 'bg-slate-700 text-amber-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lưới Bàn Hiển thị Nhãn Gộp Chuẩn */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedTables.map((t) => {
            const isSelected = selectedTable?.id === t.id;
            const summary = getTableSummary(t);
            const reserveInfo = getReservationCountdownInfo(t);

            // Lấy danh sách tất cả bàn thuộc cùng nhóm
            const groupedNames = t.groupId
              ? tables.filter((tb) => tb.groupId === t.groupId).map((tb) => tb.name.split('-')[0])
              : [];

            // Màu sắc bàn:
            // 1. Đang bận: Đỏ (bg-red-500)
            // 2. Đặt trước: Tím (bg-purple-600) hoặc Tím đỏ nhấp nháy nếu trễ giờ
            // 3. Bàn rảnh: Xanh lá (bg-emerald-500)
            let tableBgColor = 'bg-emerald-500 hover:bg-emerald-600';
            if (t.occupied) {
              tableBgColor = 'bg-red-500 hover:bg-red-600';
            } else if (t.isReserved) {
              tableBgColor = reserveInfo?.status === 'LATE_COUNTDOWN'
                ? 'bg-purple-700 ring-2 ring-red-400 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700';
            }

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`p-4 rounded-2xl text-white font-bold text-center shadow-md transition transform hover:-translate-y-1 relative flex flex-col justify-between min-h-[125px] group cursor-pointer select-none overflow-hidden ${
                  isSelected ? 'ring-4 ring-amber-400 scale-105 z-10' : ''
                } ${tableBgColor}`}
              >
                {/* Nút xóa bàn nhanh khi bàn trống & không đặt */}
                {!t.occupied && !t.isReserved && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(t);
                    }}
                    title={`Xóa bàn "${t.name}"`}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg opacity-0 group-hover:opacity-100 transition z-20 hover:scale-110"
                  >
                    ✕
                  </button>
                )}

                <div>
                  <div className="text-base font-extrabold truncate">{t.name}</div>
                  
                  {/* Trạng thái Bàn */}
                  <div className="text-xs font-normal opacity-95 mt-1">
                    {t.occupied ? (
                      summary.count > 0 ? (
                        <span className="font-semibold bg-red-700/60 px-2 py-0.5 rounded-full inline-block">
                          {summary.count} món • {summary.total.toLocaleString()}đ
                        </span>
                      ) : (
                        '🔴 Đang bận (Có khách)'
                      )
                    ) : t.isReserved ? (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold bg-purple-900/60 px-2 py-0.5 rounded-lg inline-block">
                          🟣 Hẹn: <strong className="text-amber-300">{t.reservedName || 'Khách'}</strong> ({t.reservedTime})
                        </div>
                        {reserveInfo && (
                          <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            reserveInfo.status === 'LATE_COUNTDOWN'
                              ? 'bg-rose-600 text-white animate-bounce mt-1'
                              : 'bg-purple-800/80 text-purple-100'
                          }`}>
                            {reserveInfo.text}
                          </div>
                        )}
                      </div>
                    ) : (
                      '🟢 Bàn rảnh'
                    )}
                  </div>
                </div>

                {/* NHÃN GỘP BÀN HIỂN THỊ ĐẦY ĐỦ CÁC BÀN TRONG NHÓM */}
                {t.groupId && groupedNames.length > 1 && (
                  <div className="mt-1.5 bg-yellow-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-inner truncate">
                    🔗 Gộp: {groupedNames.join(' + ')}
                  </div>
                )}

                {/* THANH ĐỔI TRẠNG THÁI THẬT KHI HOVER */}
                {t.isReserved ? (
                  // Bàn Đặt Trước: Hover hiện nút Khách Đến Nhận Bàn & Hủy Đặt
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckinReservation(t);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow flex items-center gap-0.5 hover:scale-105 transition"
                      title="Khách hẹn đã đến, nhận bàn gọi món"
                    >
                      <span>✅ Nhận Bàn</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReserveModal(t);
                      }}
                      className="bg-purple-800 hover:bg-purple-900 text-white text-[10px] font-black px-1.5 py-1 rounded-lg shadow flex items-center hover:scale-105 transition"
                      title="Sửa giờ hẹn"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelReservation(t);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-1.5 py-1 rounded-lg shadow flex items-center hover:scale-105 transition"
                      title="Hủy lịch đặt bàn"
                    >
                      <span>✕</span>
                    </button>
                  </div>
                ) : !t.occupied ? (
                  // Bàn Rảnh: Hover hiện nút Báo Bận & Đặt Bàn Trước
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableOccupiedStatus(t.id, true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow flex items-center gap-1 hover:scale-105 transition"
                      title="Chuyển bàn sang trạng thái BẬN"
                    >
                      <span>🔴 Báo Bận</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReserveModal(t);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow flex items-center gap-1 hover:scale-105 transition"
                      title="Đặt bàn hẹn giờ trước cho khách"
                    >
                      <span>📅 Đặt Lịch</span>
                    </button>
                  </div>
                ) : (
                  // Bàn Bận: Hover hiện nút Thêm Món & Trả Bàn Rảnh
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTableId(t.id);
                        showInfo(`Đang chọn ${t.name}. Hãy click các món trong thực đơn bên cạnh để order thêm!`);
                      }}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg shadow flex items-center gap-0.5 hover:scale-105 transition"
                      title="Gọi thêm món cho bàn này"
                    >
                      <span>➕ Thêm Món</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableOccupiedStatus(t.id, false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow flex items-center gap-0.5 hover:scale-105 transition"
                      title="Trả về trạng thái Bàn Rảnh"
                    >
                      <span>🟢 Trả Rảnh</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 & 3: THỰC ĐƠN & HÓA ĐƠN */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Thực đơn món ăn */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b flex-wrap gap-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>☕ Thực Đơn Món Ăn ({filteredMenu.length}/{menu.length})</span>
              </h3>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                selectedTable?.occupied
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : selectedTable?.isReserved
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Đang chọn: <strong>{selectedTable?.name}</strong> (
                {selectedTable?.occupied
                  ? '🔴 Đang bận'
                  : selectedTable?.isReserved
                  ? `🟣 Đặt trước (${selectedTable?.reservedTime})`
                  : '🟢 Bàn rảnh'}
                )
                {selectedTable?.groupId && (
                  <span className="font-bold text-amber-800 ml-1">
                    (Nhóm: {tables.filter(t => t.groupId === selectedTable.groupId).map(t => t.name.split('-')[0]).join(' + ')})
                  </span>
                )}
              </span>
            </div>

            {/* THANH TÌM KIẾM MÓN & LỌC DANH MỤC PHÂN THEO NHÓM */}
            <div className="space-y-2.5 mb-4">
              {/* Ô TÌM KIẾM MÓN NHANH */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  placeholder="Tìm món nhanh (VD: muối, đào, latte, matcha, bánh...)"
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                {menuSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchTerm('')}
                    className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-700 text-xs px-1 font-bold"
                  >
                    ✖
                  </button>
                )}
              </div>

              {/* THANH TAB PHÂN CHIA DANH MỤC (CÀ PHÊ, TRÀ, NƯỚC UỐNG, ĐỒ ĂN...) */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => scrollCategoryTabs('left')}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-white hover:bg-amber-500 hover:text-white text-slate-700 text-xs font-black shadow-xs transition flex-shrink-0 border border-slate-200"
                  title="Cuộn danh mục sang trái"
                >
                  ◀
                </button>

                <div
                  ref={categoryTabsScrollRef}
                  onMouseDown={handleCatMouseDown}
                  onMouseLeave={handleCatMouseLeaveOrUp}
                  onMouseUp={handleCatMouseLeaveOrUp}
                  onMouseMove={handleCatMouseMove}
                  onWheel={handleCatWheel}
                  className={`flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 flex-1 custom-category-scrollbar select-none ${
                    isCatDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  {menuCategories.map((cat) => {
                    const count = cat === 'Tất cả'
                      ? menu.length
                      : menu.filter((it) => (it.category || 'Khác') === cat).length;
                    const isActive = menuFilterCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMenuFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <span>{getCategoryIcon(cat)}</span>
                        <span>{cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-amber-800 text-amber-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollCategoryTabs('right')}
                  className="w-7 h-7 flex items-center justify-center rounded-xl bg-white hover:bg-amber-500 hover:text-white text-slate-700 text-xs font-black shadow-xs transition flex-shrink-0 border border-slate-200"
                  title="Cuộn danh mục sang phải"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Banner thông báo Order Thêm khi bàn BẬN */}
            {selectedTable?.occupied && (
              <div className="mb-4 bg-gradient-to-r from-amber-50 to-red-50 border border-amber-300 p-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-amber-950 font-bold">
                  <span className="p-1 bg-amber-200 text-amber-950 rounded-lg text-sm">☕</span>
                  <span>Bàn đang <strong>BẬN (Có khách)</strong>. Bấm vào bất kỳ món nào dưới đây để <strong>Order thêm</strong> vào hóa đơn bàn này!</span>
                </div>
                <span className="text-[11px] font-extrabold text-red-600 bg-white px-2.5 py-1 rounded-xl border border-red-200 shadow-sm flex-shrink-0">
                  Đang có: {cart.reduce((s, it) => s + it.qty, 0)} món
                </span>
              </div>
            )}

            {menu.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic">
                Chưa có món nào trong thực đơn. Vui lòng sang tab <strong>"📖 Quản Lý Công Thức"</strong> để tạo món mới!
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-2xl mb-1">🔍</div>
                <div className="text-sm font-bold text-slate-700 mb-1">Không tìm thấy món phù hợp</div>
                <p className="text-xs text-gray-500 mb-3">Thử xóa bộ lọc tìm kiếm hoặc chuyển sang danh mục khác</p>
                <button
                  type="button"
                  onClick={() => {
                    setMenuFilterCategory('Tất cả');
                    setMenuSearchTerm('');
                  }}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
                >
                  Xem tất cả món
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[530px] overflow-y-auto overflow-x-hidden pr-1.5 custom-vertical-scrollbar">
                {filteredMenu.map((item) => {
                  const missingReason = checkDishMissingIngredients(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleDishCardClick(item)}
                      className={`p-2.5 sm:p-3 border rounded-2xl transition flex items-center justify-between gap-2 relative group overflow-hidden cursor-pointer select-none min-w-0 ${
                        missingReason
                          ? 'border-amber-300 bg-amber-50/40 opacity-80'
                          : 'border-gray-200 hover:border-amber-500 hover:shadow-md bg-white'
                      }`}
                    >
                      {/* HÌNH ẢNH HOẶC ICON MÓN */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl group-hover:scale-105 transition duration-200 flex-shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-xl flex-shrink-0 border border-amber-200">
                          {getCategoryIcon(item.category)}
                        </div>
                      )}

                      {/* THÔNG TIN CHI TIẾT MÓN (ĐƯỢC GIỚI HẠN GỌN GÀNG TRONG Ô) */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 truncate max-w-full">
                            {getCategoryIcon(item.category)} {item.category || 'Khác'}
                          </span>
                          {missingReason && (
                            <span className="text-[10px] font-black text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                              🟡 {missingReason}
                            </span>
                          )}
                        </div>
                        <div
                          className="font-bold text-slate-800 truncate group-hover:text-amber-700 text-sm"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div className="text-amber-600 font-extrabold mt-0.5 text-xs">
                          {item.price.toLocaleString()} VNĐ
                        </div>
                      </div>

                      {/* KHU VỰC NÚT BẤM (GỒM NÚT CÔNG THỨC 📝 VÀ DẤU CỘNG +, HOÀN TOÀN Ở TRONG Ô) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.recipe && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecipeModalDish(item);
                            }}
                            title="Xem công thức pha chế"
                            className="w-7 h-7 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white rounded-xl flex items-center justify-center text-xs font-bold transition shadow-2xs border border-amber-200 hover:border-amber-500"
                          >
                            📝
                          </button>
                        )}

                        <div
                          className={`w-7 h-7 rounded-xl font-black text-base flex items-center justify-center transition shadow-2xs border ${
                            missingReason
                              ? 'bg-slate-200 text-slate-400 border-slate-300'
                              : 'bg-amber-50 group-hover:bg-amber-600 text-amber-700 group-hover:text-white border-amber-200 group-hover:border-amber-600'
                          }`}
                          title={missingReason ? missingReason : 'Thêm vào hóa đơn'}
                        >
                          {missingReason ? '✕' : '+'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hóa đơn gọi món */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1 pb-2 border-b">
              <h3 className="text-lg font-bold text-slate-800">
                🧾 Hóa Đơn Gọi Món
              </h3>
            </div>

            {/* THANH CHUYỂN ĐỔI TRẠNG THÁI BÀN (RẢNH / ĐẶT TRƯỚC / BẬN) */}
            <div className="my-3 p-1 bg-slate-100 rounded-xl flex items-center gap-1.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setTableOccupiedStatus(selectedTable.id, false)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  !selectedTable?.occupied && !selectedTable?.isReserved
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>🟢 Rảnh</span>
              </button>

              <button
                type="button"
                onClick={() => openReserveModal(selectedTable)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  selectedTable?.isReserved
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>🟣 Đặt Trước</span>
              </button>

              <button
                type="button"
                onClick={() => setTableOccupiedStatus(selectedTable.id, true)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  selectedTable?.occupied
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>🔴 Bận</span>
              </button>
            </div>

            {/* THÔNG BÁO KHI BÀN ĐƯỢC ĐẶT TRƯỚC */}
            {selectedTable?.isReserved && (
              <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm flex items-center gap-1.5 text-purple-900">
                    <span>🟣</span> Lịch Đặt Bàn Trước
                  </span>
                  <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded-lg font-mono font-bold text-xs">
                    Hẹn: {selectedTable.reservedTime}
                  </span>
                </div>

                <div className="space-y-1 text-slate-700 bg-white p-2.5 rounded-xl border border-purple-100">
                  <div>👤 Khách hẹn: <strong className="text-purple-900 text-sm">{selectedTable.reservedName}</strong></div>
                  {selectedTable.reservedPhone && (
                    <div>📞 Số ĐT: <strong className="text-slate-800">{selectedTable.reservedPhone}</strong></div>
                  )}
                  {selectedTable.reservedNote && (
                    <div className="text-gray-500 italic">📌 Ghi chú: {selectedTable.reservedNote}</div>
                  )}
                  {getReservationCountdownInfo(selectedTable) && (
                    <div className="pt-1 mt-1 border-t border-dashed border-gray-200 font-bold text-amber-700 flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{getReservationCountdownInfo(selectedTable)?.text}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCheckinReservation(selectedTable)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl transition shadow flex items-center justify-center gap-1"
                  >
                    <span>✅ Nhận Bàn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openReserveModal(selectedTable)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-1.5 px-2.5 rounded-xl transition"
                  >
                    <span>✏️ Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelReservation(selectedTable)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-1.5 px-2.5 rounded-xl transition"
                  >
                    <span>✕ Hủy</span>
                  </button>
                </div>
              </div>
            )}

            {/* THÔNG BÁO BẬN & CHO PHÉP ORDER THÊM */}
            {selectedTable?.occupied && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block"></span>
                  <span>Bàn đang <strong>BẬN</strong>. Hãy click vào món bên thực đơn để <strong>order thêm</strong>!</span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTableOccupiedStatus(selectedTable.id, false)}
                    className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 whitespace-nowrap"
                  >
                    Hủy & Trả rảnh
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 mb-3">
              Vị trí: <strong className="text-slate-800">{selectedTable?.name}</strong>
              {selectedTable?.groupId && (
                <span className="text-amber-600 font-bold text-xs block mt-0.5">
                  🔗 Gộp chung: {tables.filter(t => t.groupId === selectedTable.groupId).map(t => t.name.split('-')[0]).join(' + ')}
                </span>
              )}
            </p>

            <div className="max-h-56 overflow-y-auto space-y-3 mb-4 border-b pb-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-6 text-center">
                  Bàn này chưa chọn món nào...
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800 flex-1 truncate pr-2">
                        {item.name}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        {/* BỘ ĐIỀU CHỈNH SỐ LƯỢNG MÓN (+ / -) */}
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs transition"
                            title="Giảm 1"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-black text-amber-700 min-w-[1.5rem] text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs transition"
                            title="Tăng 1"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-slate-800 text-xs min-w-[70px] text-right">
                          {(item.price * item.qty).toLocaleString()}đ
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 w-6 h-6 rounded-full flex items-center justify-center transition"
                          title="Xóa món"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="mt-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.itemNote || ''}
                          onChange={(e) => updateItemNote(item.id, e.target.value)}
                          onBlur={(e) => saveNewNoteTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveNewNoteTag(e.target.value);
                              e.target.blur();
                            }
                          }}
                          placeholder="✏️ Ghi chú (VD: Ít đường, nhiều đá... Enter để lưu)"
                          className="w-full text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1 pr-6 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        {item.itemNote && (
                          <button
                            type="button"
                            onClick={() => updateItemNote(item.id, '')}
                            title="Xóa ghi chú món này"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs w-4 h-4 flex items-center justify-center rounded-full"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Danh sách thẻ ghi chú bấm-chọn nhanh (Tự động lưu và nhớ, ưu tiên theo từ khóa đang gõ) */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">Gợi ý nhanh:</span>
                        {sortTagsByQuery(savedNoteTags, item.itemNote).slice(0, 6).map((tag) => {
                          const isSelected = (item.itemNote || '')
                            .split(',')
                            .map((s) => s.trim().toLowerCase())
                            .includes(tag.toLowerCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleItemNoteTag(item.id, item.itemNote, tag)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium transition flex items-center gap-0.5 ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-amber-50 text-gray-600 border-gray-200 hover:border-amber-300'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  📌 Ghi chú chung cho đơn hàng:
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tự nhớ ghi chú mới
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) =>
                    setTableNotes((prev) => ({
                      ...prev,
                      [cartKey]: e.target.value,
                    }))
                  }
                  onBlur={(e) => saveNewNoteTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveNewNoteTag(e.target.value);
                      e.target.blur();
                    }
                  }}
                  placeholder="VD: Mang về, Khách quen, Giao cùng lúc... (Enter hoặc bấm ra ngoài để tự lưu)"
                  className="w-full border border-gray-300 p-2 pr-7 rounded-xl text-xs bg-amber-50/50 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                {orderNote && (
                  <button
                    type="button"
                    onClick={() =>
                      setTableNotes((prev) => ({
                        ...prev,
                        [cartKey]: '',
                      }))
                    }
                    title="Xóa ghi chú đơn hàng"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs w-4 h-4 flex items-center justify-center rounded-full"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Các thẻ Tag ghi chú thông minh với thanh cuộn gọn gàng & tìm kiếm nhanh */}
              {(() => {
                const activeQuery = noteSearchFilter || orderNote || '';
                const sortedTags = sortTagsByQuery(savedNoteTags, activeQuery);
                const queryToken = activeQuery.split(/[,;\n|]/).pop().trim();
                const hasMatchingFilter = queryToken.length > 0;

                const renderTagPill = (tag) => {
                  const isSelected = (orderNote || '')
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .includes(tag.toLowerCase());
                  const isHighlighted =
                    hasMatchingFilter &&
                    normalizeVietnamese(tag).includes(normalizeVietnamese(queryToken));

                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center rounded-lg border text-xs transition-all shrink-0 group ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : isHighlighted
                          ? 'bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-400 font-bold'
                          : 'bg-white hover:bg-amber-50 text-gray-700 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOrderNoteTag(tag)}
                        className="px-2 py-1 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span className="text-[10px]">{isSelected ? '✓' : isHighlighted ? '★' : '+'}</span>
                        <span>{tag}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeSavedNoteTag(tag, e)}
                        title={`Xóa gợi ý "${tag}"`}
                        className={`px-1 py-1 text-[9px] rounded-r-lg opacity-0 group-hover:opacity-100 transition cursor-pointer ${
                          isSelected
                            ? 'text-white/80 hover:text-white hover:bg-amber-700'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                };

                return (
                  <div className="mt-2 p-2 bg-gray-50/90 rounded-xl border border-gray-200 shadow-2xs">
                    {/* Thanh điều khiển: Tiêu đề + Ô tìm kiếm nhanh + Nút Cuộn Trái/Phải + Mở rộng */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-gray-200/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1 shrink-0">
                          <span>💡 Gợi ý</span>
                          {hasMatchingFilter && (
                            <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-semibold">
                              Khớp "{queryToken}"
                            </span>
                          )}
                        </span>
                        {/* Ô lọc nhanh */}
                        <div className="relative shrink-0">
                          <input
                            type="text"
                            value={noteSearchFilter}
                            onChange={(e) => setNoteSearchFilter(e.target.value)}
                            placeholder="🔍 Lọc (gõ 'i', 'đá')..."
                            className="w-24 text-[10px] bg-white border border-gray-300 rounded-md px-1.5 py-0.5 focus:w-32 transition-all focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          {noteSearchFilter && (
                            <button
                              type="button"
                              onClick={() => setNoteSearchFilter('')}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-red-500"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nút Cuộn ◀ ▶ và Nút Xem Tất Cả / Thu Gọn */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isNoteTagsExpanded && (
                          <div className="flex items-center bg-white border border-gray-300 rounded-md shadow-2xs p-0.5">
                            <button
                              type="button"
                              onClick={() => scrollNoteTags('left')}
                              title="Cuộn sang trái (Xem thêm thẻ trước)"
                              className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-amber-700 hover:bg-amber-100 text-[10px] font-bold transition active:scale-95"
                            >
                              ◀
                            </button>
                            <div className="w-px h-3 bg-gray-200 mx-0.5"></div>
                            <button
                              type="button"
                              onClick={() => scrollNoteTags('right')}
                              title="Cuộn sang phải (Xem thêm thẻ tiếp theo)"
                              className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:text-amber-700 hover:bg-amber-100 text-[10px] font-bold transition active:scale-95"
                            >
                              ▶
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsNoteTagsExpanded(!isNoteTagsExpanded)}
                          className="text-[10px] text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md font-semibold transition active:scale-95"
                          title={isNoteTagsExpanded ? 'Thu gọn thành thanh cuộn 1 dòng' : 'Mở rộng hiển thị toàn bộ thẻ'}
                        >
                          {isNoteTagsExpanded ? '▲ Gọn' : '▼ Tất cả'}
                        </button>
                      </div>
                    </div>

                    {/* Vùng hiển thị thẻ: Cuộn 1 dòng siêu gọn (mặc định) HOẶC Mở rộng nhiều dòng */}
                    {isNoteTagsExpanded ? (
                      <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-0.5">
                        {sortedTags.map(renderTagPill)}
                      </div>
                    ) : (
                      <div
                        ref={orderNoteTagsScrollRef}
                        className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {sortedTags.map(renderTagPill)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Nhân viên phục vụ:
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg font-medium bg-white"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-gray-600 font-medium">Giảm giá (%):</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 border border-gray-300 p-1.5 rounded-lg text-right font-bold"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tiền hàng:</span>
              <span>{subTotal.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Giảm giá:</span>
              <span>-{discountAmount.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Thuế VAT (10%):</span>
              <span>+{vat.toLocaleString()} VNĐ</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-amber-600 pt-2 border-t">
              <span>TỔNG CỘNG:</span>
              <span>{total.toLocaleString()} VNĐ</span>
            </div>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-xl font-bold mt-2 bg-white"
            >
              <option value="CASH">💵 Tiền Mặt</option>
              <option value="TRANSFER">💳 Chuyển Khoản (VietQR)</option>
            </select>

            <button
              onClick={handleCheckout}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition mt-3 uppercase tracking-wider"
            >
              Thanh Toán & In Hóa Đơn
            </button>
          </div>
        </div>
      </div>

      {/* POPUP THÊM BÀN MỚI VÀO PHÒNG */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex justify-between items-start border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-base">➕</span>
                  <span>Thêm Bàn Mới Vào Hệ Thống</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Tạo bàn mới cho phòng hiện có hoặc mở thêm phòng / khu vực mới.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4">
              {/* Chọn khu vực / phòng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  1. Chọn Khu vực / Phòng:
                </label>
                <select
                  value={isCreatingCustomArea ? '__NEW__' : newTableArea}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingCustomArea(true);
                      if (customAreaName.trim()) {
                        setNewTableName(`Bàn 1-${customAreaName.trim()}`);
                      }
                    } else {
                      setIsCreatingCustomArea(false);
                      setNewTableArea(e.target.value);
                      const countInArea = tables.filter(
                        (t) => (t.area || (t.name.includes('Phòng lạnh') ? 'Phòng lạnh' : 'Phòng thường')) === e.target.value
                      ).length;
                      setNewTableName(`Bàn ${countInArea + 1}-${e.target.value}`);
                    }
                  }}
                  className="w-full border-2 border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-bold bg-white"
                >
                  {existingAreas.map((area) => (
                    <option key={area} value={area}>🏡 {area}</option>
                  ))}
                  <option value="__NEW__">➕ Tạo phòng / khu vực mới...</option>
                </select>

                {/* Nếu chọn tạo phòng mới */}
                {isCreatingCustomArea && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={customAreaName}
                      onChange={(e) => {
                        setCustomAreaName(e.target.value);
                        if (e.target.value.trim()) {
                          setNewTableName(`Bàn 1-${e.target.value.trim()}`);
                        }
                      }}
                      placeholder="Nhập tên phòng mới (VD: Sân thượng, Tầng 2, VIP...)"
                      className="w-full text-xs border-2 border-emerald-400 focus:border-emerald-600 rounded-xl p-2.5 bg-emerald-50/50 font-bold focus:outline-none"
                      autoFocus
                      required
                    />
                  </div>
                )}
              </div>

              {/* Tên bàn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  2. Tên bàn hiển thị:
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="VD: Bàn 5-Phòng thường"
                  className="w-full text-xs border-2 border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 font-bold focus:outline-none"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Gợi ý: Đặt tên theo dạng <code className="text-amber-800 font-mono font-bold">Bàn số-Tên phòng</code> để thu ngân dễ nhận diện.
                </p>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end gap-2.5 pt-3 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition flex items-center gap-1.5"
                >
                  <span>➕ Tạo Bàn Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP GỘP BÀN & CHUYỂN BÀN THÔNG MINH (PHIÊN BẢN CẢI TIẾN) */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  {moveActionType === 'MERGE' ? (
                    <>
                      <span className="p-1.5 bg-purple-100 text-purple-700 rounded-xl">🔀</span>
                      <span>Gộp Thêm Bàn Vào:</span>
                    </>
                  ) : (
                    <>
                      <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">➡️</span>
                      <span>Chuyển Toàn Bộ Đơn Từ:</span>
                    </>
                  )}
                  <span className="text-amber-600">{selectedTable?.name}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {moveActionType === 'MERGE'
                    ? 'Chọn một hoặc nhiều bàn để gộp chung đơn hàng và hóa đơn thanh toán.'
                    : 'Chọn bàn đích trống hoặc bàn cần chuyển toàn bộ đơn hàng sang.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Nội dung Modal - Scrollable */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* THANH CHỌN LỰA THÔNG MINH (DROPDOWN ĐÃ ĐƯỢC FIX TOÀN DIỆN) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>
                    {moveActionType === 'MERGE' ? '1. Chọn bàn cần gộp chung (Thanh chọn nhanh):' : 'Chọn bàn đích để chuyển tới:'}
                  </span>
                  <span className="text-[11px] font-normal text-purple-600">
                    Khả dụng: <strong>{availableTargetTables.length}</strong> bàn
                  </span>
                </label>

                <select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    if (moveActionType === 'MOVE') {
                      setSelectedTargetIds([id]);
                    } else {
                      if (!selectedTargetIds.includes(id)) {
                        setSelectedTargetIds([...selectedTargetIds, id]);
                      }
                    }
                  }}
                  className="w-full border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl font-medium bg-white text-sm text-slate-800 cursor-pointer shadow-sm"
                >
                  <option value="">
                    -- {moveActionType === 'MERGE' ? '➕ Click vào đây để chọn bàn thêm vào nhóm gộp...' : '➡️ Click chọn bàn đích cần chuyển sang...'} --
                  </option>
                  {availableTargetTables.map((t) => {
                    const isSelected = selectedTargetIds.includes(t.id);
                    const summary = getTableSummary(t);
                    const statusText = t.occupied
                      ? `🔴 Đang có khách (${summary.count} món • ${summary.total.toLocaleString()}đ)`
                      : `🟢 Bàn trống`;
                    const groupBadge = t.groupId ? ` [🔗 Đã có nhóm]` : '';

                    return (
                      <option key={t.id} value={t.id} disabled={isSelected}>
                        {t.name} - {statusText}{groupBadge} {isSelected ? '(✓ Đã chọn)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Danh sách các bàn đã chọn (Tags) */}
              {selectedTargetIds.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-900 uppercase">
                      Đã chọn ({selectedTargetIds.length} bàn):
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTargetIds([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTargetTables.map((t) => {
                      const summary = getTableSummary(t);
                      return (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1.5 bg-white border border-purple-300 text-purple-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${t.occupied ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          <span>{t.name}</span>
                          {summary.count > 0 && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              ({summary.count}m • {summary.total.toLocaleString()}đ)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedTargetIds(selectedTargetIds.filter((id) => id !== t.id))}
                            className="w-4 h-4 rounded-full bg-purple-100 hover:bg-rose-100 text-purple-600 hover:text-rose-600 flex items-center justify-center font-bold text-[10px] ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Thanh tìm kiếm & bộ lọc khu vực cho Lưới chọn trực tiếp */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    2. Hoặc click chọn trực tiếp trên sơ đồ bàn:
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-500">Lọc:</span>
                    <button
                      type="button"
                      onClick={() => setModalStatusFilter('ALL')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${modalStatusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStatusFilter('EMPTY')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${modalStatusFilter === 'EMPTY' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      🟢 Trống ({availableTargetTables.filter(t => !t.occupied).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStatusFilter('OCCUPIED')}
                      className={`px-2 py-0.5 rounded-md font-semibold ${modalStatusFilter === 'OCCUPIED' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      🔴 Có khách ({availableTargetTables.filter(t => t.occupied).length})
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      placeholder="🔍 Gõ tìm nhanh số bàn, tên bàn..."
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 pl-8 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                  </div>

                  <select
                    value={modalAreaFilter}
                    onChange={(e) => setModalAreaFilter(e.target.value)}
                    className="text-xs border border-gray-300 rounded-xl px-3 py-2 font-medium bg-white"
                  >
                    <option value="ALL">🏡 Tất cả phòng</option>
                    <option value="Phòng thường">Phòng thường</option>
                    <option value="Phòng lạnh">Phòng lạnh</option>
                  </select>
                </div>

                {/* Lưới các thẻ bàn tương tác nhanh */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-slate-50/50">
                  {filteredModalTables.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-gray-400 italic">
                      Không tìm thấy bàn nào phù hợp với bộ lọc.
                    </div>
                  ) : (
                    filteredModalTables.map((t) => {
                      const isSelected = selectedTargetIds.includes(t.id);
                      const summary = getTableSummary(t);

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTargetTable(t.id)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer select-none text-left relative flex flex-col justify-between ${isSelected
                              ? 'border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-200'
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                            }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-extrabold text-xs text-slate-800 truncate">
                              {t.name}
                            </span>
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${t.occupied ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[11px]">
                            <span className={t.occupied ? 'text-red-600 font-bold' : 'text-emerald-600 font-medium'}>
                              {t.occupied ? (summary.count > 0 ? `${summary.count} món` : 'Có khách') : 'Trống'}
                            </span>
                            {summary.total > 0 && (
                              <span className="text-slate-600 font-semibold text-[10px]">
                                {summary.total.toLocaleString()}đ
                              </span>
                            )}
                          </div>

                          {/* Huy hiệu Đã Chọn */}
                          {isSelected && (
                            <span className="absolute -top-2 -right-1 bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                              ✓ Đã chọn
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* TÓM TẮT XEM TRƯỚC (LIVE PREVIEW) */}
              {selectedTargetIds.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-purple-50 rounded-2xl border border-amber-200 text-xs text-slate-800 space-y-1.5 shadow-sm">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <span>⚡ Xem Trước Kết Quả {moveActionType === 'MERGE' ? 'Gộp Bàn' : 'Chuyển Bàn'}:</span>
                  </div>
                  {moveActionType === 'MERGE' ? (
                    <div className="text-xs space-y-1">
                      <div>
                        • Bàn gốc: <strong>{selectedTable?.name}</strong> ({sourceSummary.count} món • {sourceSummary.total.toLocaleString()}đ)
                      </div>
                      <div>
                        • Gộp thêm: <strong>{selectedTargetTables.map(t => t.name.split('-')[0]).join(', ')}</strong> ({targetsSummary.count} món • {targetsSummary.total.toLocaleString()}đ)
                      </div>
                      <div className="pt-1 border-t border-amber-300 font-bold text-purple-900 flex justify-between items-center text-sm">
                        <span>➡️ Nhóm mới ({1 + selectedTargetTables.length} bàn):</span>
                        <span className="text-amber-700 font-extrabold">{projectedTotalItems} món • {projectedTotalPrice.toLocaleString()} VNĐ</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1">
                      <div>
                        • Chuyển từ: <strong>{selectedTable?.name}</strong> ({sourceSummary.count} món • {sourceSummary.total.toLocaleString()}đ)
                      </div>
                      <div>
                        • Tới bàn: <strong>{selectedTargetTables[0]?.name}</strong> {selectedTargetTables[0]?.occupied ? '(Bàn đang có đơn hàng, sẽ gộp chung)' : '(Bàn trống)'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-3">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={selectedTargetIds.length === 0}
                onClick={handleExecuteMoveOrMerge}
                className={`px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition flex items-center gap-2 ${selectedTargetIds.length === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none'
                    : moveActionType === 'MERGE'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/30'
                  }`}
              >
                {moveActionType === 'MERGE' ? (
                  <>
                    <span>🔀 Xác nhận Gộp</span>
                    <span>({selectedTargetIds.length} Bàn)</span>
                  </>
                ) : (
                  <>
                    <span>➡️ Xác nhận Chuyển Đơn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP TÁCH BÀN / HỦY GỘP NHÓM (UNGROUP MODAL) */}
      {showUngroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>✂️ Tách Bàn / Hủy Gộp Nhóm</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUngroupModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs text-gray-600">
                Bàn <strong>{selectedTable?.name}</strong> hiện đang nằm trong nhóm gộp:
              </p>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs font-bold text-purple-900">
                🔗 Danh sách bàn cùng nhóm:{' '}
                {tables
                  .filter((t) => t.groupId === selectedTable?.groupId)
                  .map((t) => t.name.split('-')[0])
                  .join(' + ')}
              </div>
              <p className="text-xs text-gray-500">
                Vui lòng chọn phương án xử lý bạn mong muốn:
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUngroup('CURRENT_ONLY')}
                  className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
                      1. Gỡ riêng {selectedTable?.name} ra khỏi nhóm
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Bàn này trở thành bàn trống riêng, đơn hàng vẫn nằm ở các bàn còn lại.
                    </div>
                  </div>
                  <span className="text-base text-gray-400 group-hover:text-amber-600 font-bold">➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUngroup('DISSOLVE_ALL')}
                  className="w-full text-left p-3.5 rounded-xl border-2 border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-rose-700 group-hover:text-rose-800">
                      2. Giải tán toàn bộ nhóm gộp này
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Tách rời tất cả các bàn trong nhóm, đơn hàng hiện tại giữ lại cho {selectedTable?.name}.
                    </div>
                  </div>
                  <span className="text-base text-gray-400 group-hover:text-rose-600 font-bold">➔</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUngroupModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              Hủy bỏ / Quay lại
            </button>
          </div>
        </div>
      )}

      {/* POPUP IN HÓA ĐƠN K80 (VIETQR TỰ ĐỘNG) */}
      {showPrintModal && currentInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-slate-800 font-mono text-xs">
            <div className="text-center border-b pb-3 mb-3">
              <h2 className="font-extrabold text-base tracking-wider uppercase">CA PHÊ TIẾN PHÁT</h2>
              <p className="text-[11px] text-gray-500">ĐC: Tiên Sơn núi vip pro</p>
              <p className="text-[11px] text-gray-500">Hotline: 0905292193</p>
              <h3 className="font-bold text-sm uppercase mt-2">HÓA ĐƠN THỦ NGÂN</h3>
              <div className="mt-1.5 inline-block bg-amber-50 text-amber-900 px-3 py-1 rounded-xl font-black text-xs tracking-wider border border-amber-300 shadow-sm font-mono">
                MÃ ĐƠN: {currentInvoice.id}
              </div>
            </div>

            <div className="space-y-1 mb-3 text-[11px]">
              <div><strong>Vị trí:</strong> {currentInvoice.tableName}</div>
              <div><strong>Thu ngân:</strong> {currentInvoice.staffName}</div>
              <div><strong>Thời gian:</strong> {currentInvoice.createdAt}</div>
              {currentInvoice.orderNote && (
                <div className="bg-amber-50 p-1.5 rounded border border-amber-200 font-sans italic text-amber-900">
                  📌 Ghi chú: {currentInvoice.orderNote}
                </div>
              )}
            </div>

            <div className="border-t border-b py-2 mb-3 space-y-2">
              {currentInvoice.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{item.name} x{item.qty}</span>
                    <span>{(item.price * item.qty).toLocaleString()}đ</span>
                  </div>
                  {item.itemNote && (
                    <div className="text-[10px] text-gray-500 pl-2">-- Note: {item.itemNote}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1 border-b pb-3 mb-3 text-right text-[11px]">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{currentInvoice.subTotal.toLocaleString()} VNĐ</span>
              </div>
              {currentInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Giảm giá:</span>
                  <span>-{currentInvoice.discountAmount.toLocaleString()} VNĐ</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Thuế VAT (10%):</span>
                <span>+{currentInvoice.vat.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-amber-700 pt-1 border-t">
                <span>TỔNG TIỀN:</span>
                <span>{currentInvoice.total.toLocaleString()} VNĐ</span>
              </div>
              <div className="text-[10px] text-gray-500 pt-1">
                Hình thức: {currentInvoice.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}
              </div>
            </div>

            {currentInvoice.paymentMethod === 'TRANSFER' && (
              <div className="text-center my-3 py-2.5 border-b border-dashed border-gray-300 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200">
                <p className="font-sans text-[10px] text-gray-500 font-bold mb-1.5 uppercase tracking-wide">
                  Quét mã VietQR để chuyển khoản thanh toán
                </p>
                <img
                  src={`https://img.vietqr.io/image/MB-0358311551-compact2.png?amount=${Math.round(currentInvoice.total)}&addInfo=${encodeURIComponent(currentInvoice.id)}&accountName=${encodeURIComponent('DOAN TIEN PHAT')}`}
                  alt="VietQR Hóa đơn"
                  className="w-36 mx-auto rounded-xl border p-1 bg-white shadow-sm"
                />
                <div className="font-sans text-[10px] text-slate-700 mt-2 space-y-1">
                  <p className="font-bold">MBBank - STK: <span className="text-amber-800 font-extrabold text-xs">0358311551</span></p>
                  <p className="font-bold uppercase text-slate-900">DOAN TIEN PHAT</p>
                  <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-center gap-1.5 text-xs">
                    <span className="text-gray-500 font-medium">Nội dung CK:</span>
                    <span className="font-black text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300 font-mono shadow-sm">
                      {currentInvoice.id}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 italic mt-0.5">
                    (Mã đơn <strong className="text-amber-800">{currentInvoice.id}</strong> tự động điền khi quét QR)
                  </p>
                </div>
              </div>
            )}

            <div className="text-center text-[10px] text-gray-400 mb-4">
              Cảm ơn quý khách & Hẹn gặp lại!
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmPaymentAndPrint}
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                🖨️ Xác nhận In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ĐẶT BÀN TRƯỚC (RESERVATION MODAL) */}
      {showReserveModal && targetReserveTable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 text-purple-800 rounded-xl">📅</span>
                  <span>Đặt Lịch Giữ Bàn Trước</span>
                </h3>
                <p className="text-xs text-purple-700 font-bold mt-0.5">
                  Vị trí: {targetReserveTable.name} ({targetReserveTable.area || 'Phòng thường'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReserveModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên người đặt bàn: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reserveFormName}
                  onChange={(e) => setReserveFormName(e.target.value)}
                  placeholder="Ví dụ: Anh Hoàng / Chị Thảo"
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="tel"
                    value={reserveFormPhone}
                    onChange={(e) => setReserveFormPhone(e.target.value)}
                    placeholder="VD: 0905123456"
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Giờ hẹn đến: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={reserveFormTime}
                    onChange={(e) => setReserveFormTime(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-bold text-purple-800 bg-purple-50/50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú đặt bàn:
                </label>
                <input
                  type="text"
                  value={reserveFormNote}
                  onChange={(e) => setReserveFormNote(e.target.value)}
                  placeholder="VD: Nhóm 4 người, chuẩn bị trước trà đá..."
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Quy định giữ bàn:</strong> Bàn sẽ đổi sang <strong>màu tím</strong>. Khi tới giờ hẹn ({reserveFormTime || 'đã chọn'}), nếu khách trễ quá <strong>10 phút</strong>, hệ thống sẽ tự động hủy đặt bàn và trả bàn về lại trạng thái trống!
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition"
                >
                  🟣 Xác Nhận Đặt Bàn
                </button>
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition"
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP CÔNG THỨC MÓN */}
      {recipeModalDish && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                📝 Công Thức: <span className="text-amber-600">{recipeModalDish.name}</span>
              </h3>
              <button
                onClick={() => setRecipeModalDish(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-slate-700 text-sm whitespace-pre-line leading-relaxed font-mono mb-6">
              {recipeModalDish.recipe}
            </div>
            <button
              onClick={() => setRecipeModalDish(null)}
              className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
