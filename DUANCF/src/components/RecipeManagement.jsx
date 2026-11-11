import React, { useState, useMemo } from 'react';
import { useNotification } from './CustomNotification';

export default function RecipeManagement({
  menu,
  inventory = [],
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onResetMenu,
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cà Phê');
  const [recipe, setRecipe] = useState('');
  const [image, setImage] = useState('');

  // Định lượng nguyên liệu (BOM) liên kết với Kho
  const [ingredients, setIngredients] = useState([]);
  const [ingSearch, setIngSearch] = useState('');
  const [ingAmount, setIngAmount] = useState('');
  const [ingUnit, setIngUnit] = useState('g');
  const [showIngSuggestions, setShowIngSuggestions] = useState(false);

  // Trạng thái món đang được chọn để chỉnh sửa (null = chế độ thêm mới)
  const [editingDish, setEditingDish] = useState(null);

  // Trạng thái mở popup xem chi tiết công thức
  const [viewingRecipeDish, setViewingRecipeDish] = useState(null);

  // Bộ lọc danh mục & tìm kiếm trong danh sách
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  const { showSuccess, showWarning, showInfo } = useNotification();

  // Danh mục chuẩn của quán
  const CATEGORIES = ['Cà Phê', 'Trà & Trà Sữa', 'Nước Uống & Đá Xay', 'Đồ Ăn & Bánh', 'Khác'];

  // Gợi ý nguyên liệu từ kho khi người dùng gõ tìm kiếm (VD: gõ 'đ', 's', 'c'...)
  const ingSuggestions = useMemo(() => {
    if (!ingSearch.trim()) return [];
    const term = ingSearch.toLowerCase().trim();
    return (inventory || []).filter((inv) => (inv?.name || '').toLowerCase().includes(term));
  }, [ingSearch, inventory]);

  // Kiểm tra xem tên nguyên liệu đang gõ có trong kho chưa
  const isIngInInventory = useMemo(() => {
    if (!ingSearch.trim()) return true;
    return (inventory || []).some(
      (inv) => (inv?.name || '').toLowerCase().trim() === ingSearch.toLowerCase().trim()
    );
  }, [ingSearch, inventory]);

  // Thêm nguyên liệu vào danh sách định lượng của món
  const handleAddIngredient = () => {
    if (!ingSearch.trim()) {
      showWarning('Vui lòng nhập tên nguyên liệu!');
      return;
    }
    const amt = Number(ingAmount);
    if (!amt || amt <= 0) {
      showWarning('Số lượng định lượng phải lớn hơn 0!');
      return;
    }

    const trimmedName = ingSearch.trim();
    if (ingredients.some((it) => it.name.toLowerCase() === trimmedName.toLowerCase())) {
      showWarning(`Nguyên liệu "${trimmedName}" đã có trong danh sách định lượng!`);
      return;
    }

    const newIng = {
      name: trimmedName,
      amount: amt,
      unit: ingUnit || 'g',
    };

    setIngredients((prev) => [...prev, newIng]);
    if (!isIngInInventory) {
      showInfo(
        `Nguyên liệu "${trimmedName}" chưa có trong kho! Món này sẽ ở trạng thái [Chờ Nguyên Liệu] cho đến khi được nhập kho.`
      );
    }
    setIngSearch('');
    setIngAmount('');
    setShowIngSuggestions(false);
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Chọn món vào form để chỉnh sửa
  const handleSelectDishForEdit = (dish) => {
    setEditingDish(dish);
    setName(dish.name || '');
    setPrice(dish.price || '');
    setCategory(dish.category || 'Cà Phê');
    setRecipe(dish.recipe || '');
    setImage(dish.image || '');
    setIngredients(Array.isArray(dish.ingredients) ? [...dish.ingredients] : []);

    // Cuộn nhẹ lên đầu form trên thiết bị di động
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy chế độ chỉnh sửa, quay về form thêm mới
  const handleCancelEdit = () => {
    setEditingDish(null);
    setName('');
    setPrice('');
    setCategory('Cà Phê');
    setRecipe('');
    setImage('');
    setIngredients([]);
    setIngSearch('');
    setIngAmount('');
  };

  // Xử lý chọn ảnh từ máy tính & tự động nén tối ưu (kích thước chuẩn ~40-60KB, chống tràn bộ nhớ)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Giới hạn tối đa 600px để ảnh sắc nét nhưng dung lượng siêu nhẹ (~40-60KB)
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Nén chất lượng 0.82 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        setImage(compressedBase64);
        showSuccess('Đã tải và tối ưu dung lượng ảnh thành công!');
      };
      img.onerror = () => {
        setImage(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showWarning('Vui lòng nhập tên món ăn / đồ uống!');
      return;
    }
    if (!price || Number(price) <= 0) {
      showWarning('Vui lòng nhập giá bán hợp lệ lớn hơn 0!');
      return;
    }

    const defaultImage =
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80';

    const dishPayload = {
      name: name.trim(),
      price: Number(price),
      category: category || 'Khác',
      recipe: recipe.trim() || 'Chưa có công thức ghi chú.',
      image: image || defaultImage,
      ingredients: ingredients,
    };

    if (editingDish) {
      // CHẾ ĐỘ 1: CẬP NHẬT MÓN ĐANG CHỌN
      if (onUpdateDish) {
        onUpdateDish(editingDish.id, dishPayload);
      }
      handleCancelEdit();
    } else {
      // CHẾ ĐỘ 2: THÊM MỚI MÓN
      const newDish = {
        id: `M_${Date.now()}`,
        ...dishPayload,
      };
      if (onAddDish) {
        onAddDish(newDish);
      }
      handleCancelEdit();
    }
  };

  // Lọc danh sách món hiển thị
  const filteredMenu = (Array.isArray(menu) ? menu : []).filter((item) => {
    const matchCategory =
      filterCategory === 'Tất cả' || (item?.category || 'Khác') === filterCategory;
    const matchSearch =
      !searchTerm.trim() ||
      (item?.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchCategory && matchSearch;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* ======================================================== */}
      {/* CỘT TRÁI: FORM THÊM MỚI / CHỈNH SỬA MÓN (5 COLS) */}
      {/* ======================================================== */}
      <div className="md:col-span-5 bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between">
        <div>
          {/* TIÊU ĐỀ FORM & NÚT HỦY CHỈNH SỬA */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                {editingDish ? (
                  <>
                    <span className="text-amber-600">✏️</span>
                    <span>Chỉnh Sửa Món Ăn</span>
                  </>
                ) : (
                  <>
                    <span>📖</span>
                    <span>Thêm Món & Công Thức Mới</span>
                  </>
                )}
              </h2>
              {editingDish && (
                <div className="text-xs text-amber-700 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block">
                  Đang sửa: <strong>{editingDish.name}</strong>
                </div>
              )}
            </div>

            {editingDish && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <span>➕ Tạo món mới</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* TÊN MÓN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên món ăn / đồ uống: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Cà phê Muối"
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            {/* DANH MỤC & GIÁ BÁN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Danh mục:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Giá bán (VNĐ): <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ví dụ: 35000"
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* HÌNH ẢNH MÓN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hình ảnh món:
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                />

                <input
                  type="text"
                  value={image.startsWith('data:') ? '' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                  className="w-full border border-gray-200 p-2 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* XEM TRƯỚC ẢNH */}
            {image && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={image}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded-lg border shadow-xs"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-700 block">Xem trước hình ảnh</span>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="text-red-600 hover:text-red-800 text-[11px] underline mt-0.5"
                  >
                    Xóa ảnh này
                  </button>
                </div>
              </div>
            )}

            {/* CÔNG THỨC & GHI CHÚ PHA CHẾ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Công thức / Ghi chú pha chế:
              </label>
              <textarea
                rows="2"
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
                placeholder="Ví dụ: 25g bột cà phê pha phin, 30ml sữa đặc, đá bi đầy ly..."
                className="w-full border border-gray-300 p-2 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* ĐỊNH LƯỢNG NGUYÊN LIỆU TRỪ KHO TỰ ĐỘNG (BOM) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 uppercase">
                  📦 Định Lượng Trừ Kho ({ingredients.length}):
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">Tự trừ kho khi Order</span>
              </div>

              {/* Danh sách nguyên liệu đã thêm vào món */}
              {ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {ingredients.map((it, idx) => {
                    const foundInInv = inventory.some(
                      (inv) => inv.name.toLowerCase().trim() === it.name.toLowerCase().trim()
                    );
                    return (
                      <span
                        key={idx}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border shadow-2xs ${
                          foundInInv
                            ? 'bg-white text-slate-800 border-slate-200'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        <span>{foundInInv ? '🟢' : '🟡'}</span>
                        <span>{it.name}:</span>
                        <strong className="text-amber-700">{it.amount} {it.unit}</strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-slate-400 hover:text-red-600 font-bold ml-1 text-xs"
                          title="Xóa nguyên liệu này"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Chưa có định lượng. Hãy thêm các nguyên liệu dưới đây để hệ thống tự động trừ kho khi khách gọi món.
                </div>
              )}

              {/* Ô NHẬP NGUYÊN LIỆU KÈM AUTO-COMPLETE THÔNG MINH */}
              <div className="pt-2 border-t border-slate-200 relative">
                <div className="grid grid-cols-12 gap-1.5">
                  <div className="col-span-6 relative">
                    <input
                      type="text"
                      value={ingSearch}
                      onChange={(e) => {
                        setIngSearch(e.target.value);
                        setShowIngSuggestions(true);
                      }}
                      onFocus={() => setShowIngSuggestions(true)}
                      placeholder="Gõ tên (cà phê, sữa, đường, đá...)"
                      className="w-full p-2 text-xs border border-gray-300 rounded-xl font-semibold bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />

                    {/* DROPDOWN GỢI Ý THÔNG MINH TỪ KHO */}
                    {showIngSuggestions && ingSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-36 overflow-y-auto divide-y divide-slate-100">
                        {ingSuggestions.map((sug) => (
                          <div
                            key={sug.id}
                            onClick={() => {
                              setIngSearch(sug.name);
                              setIngUnit(sug.unit);
                              setShowIngSuggestions(false);
                            }}
                            className="p-2 text-xs hover:bg-amber-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800 truncate pr-2">{sug.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              Tồn: {sug.stock} {sug.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      step="any"
                      value={ingAmount}
                      onChange={(e) => setIngAmount(e.target.value)}
                      placeholder="SL (25)"
                      className="w-full p-2 text-xs border border-gray-300 rounded-xl font-bold text-amber-700 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-3 flex gap-1">
                    <input
                      type="text"
                      value={ingUnit}
                      onChange={(e) => setIngUnit(e.target.value)}
                      placeholder="ĐVT"
                      className="w-full p-2 text-xs border border-gray-300 rounded-xl font-bold text-center bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-2.5 rounded-xl transition shadow-xs shrink-0 cursor-pointer"
                      title="Thêm nguyên liệu này"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* THÔNG BÁO NẾU NGUYÊN LIỆU MỚI CHƯA CÓ TRONG KHO */}
                {ingSearch.trim() && !isIngInInventory && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      Nguyên liệu <strong>"{ingSearch}"</strong> chưa có trong kho! Món sẽ vào danh sách <strong>Chờ Nguyên Liệu</strong> và tạo nhắc nhở nhập kho.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* NÚT SUBMIT */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className={`flex-1 font-black py-3 rounded-xl shadow-md transition text-xs tracking-wider flex items-center justify-center gap-1.5 ${
                  editingDish
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {editingDish ? (
                  <>
                    <span>💾</span>
                    <span>CẬP NHẬT MÓN & LƯU DATABASE</span>
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    <span>LƯU CÔNG THỨC & THÊM VÀO MENU</span>
                  </>
                )}
              </button>

              {editingDish && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-xl text-xs transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CỘT PHẢI: DANH SÁCH MÓN ĂN & CÔNG THỨC (7 COLS) */}
      {/* ======================================================== */}
      <div className="md:col-span-7 bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between">
        <div>
          {/* HEADER DANH SÁCH */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b flex-wrap gap-2">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>☕ Danh Sách Công Thức Món ({filteredMenu.length}/{menu.length})</span>
            </h2>

            <div className="flex items-center gap-2">
              {onResetMenu && (
                <button
                  type="button"
                  onClick={onResetMenu}
                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-2xs"
                  title="Khôi phục lại 25 món cà phê, trà, nước uống, đồ ăn được khảo sát chuẩn"
                >
                  <span>🔄</span>
                  <span>Nạp 25 món chuẩn</span>
                </button>
              )}
              {/* Ô TÌM KIẾM MÓN */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm tên món..."
                className="text-xs border border-gray-300 px-3 py-1.5 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none min-w-[150px]"
              />
            </div>
          </div>

          {/* TAB LỌC DANH MỤC */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {['Tất cả', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* DANH SÁCH THẺ MÓN ĂN */}
          {filteredMenu.length === 0 ? (
            <div className="text-center py-16 text-gray-400 italic bg-slate-50 rounded-2xl border border-dashed border-gray-200">
              {menu.length === 0
                ? 'Chưa có món nào trong hệ thống. Vui lòng thêm món ở biểu mẫu bên trái!'
                : 'Không tìm thấy món phù hợp với từ khóa hoặc danh mục đã chọn.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[530px] overflow-y-auto pr-1">
              {filteredMenu.map((item) => {
                const isSelectedForEdit = editingDish?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectDishForEdit(item)}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between relative group cursor-pointer ${
                      isSelectedForEdit
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-400'
                        : 'border-gray-200 hover:border-amber-400 hover:shadow-md bg-white'
                    }`}
                  >
                    {/* NÚT XÓA MÓN */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDish(item.id);
                      }}
                      title="Xóa món này"
                      className="absolute top-2.5 right-2.5 bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition opacity-80 group-hover:opacity-100 hover:scale-110 z-10"
                    >
                      ✕
                    </button>

                    {/* THÔNG TIN MÓN */}
                    <div className="flex gap-3 items-center mb-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0 bg-slate-100"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="pr-5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category || 'Món'}
                          </span>
                          {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
                            item.ingredients.some((ing) => {
                              const ingName = (ing?.name || '').toLowerCase().trim();
                              const found = (inventory || []).find(
                                (inv) => (inv?.name || '').toLowerCase().trim() === ingName
                              );
                              return !found || found.stock <= 0;
                            }) ? (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                🟡 Chờ NL
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                🟢 Sẵn sàng
                              </span>
                            )
                          )}
                          {isSelectedForEdit && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white animate-pulse">
                              Đang sửa
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 text-sm truncate mt-0.5 group-hover:text-amber-700">
                          {item.name}
                        </h4>
                        <p className="text-amber-600 font-black text-xs mt-0.5">
                          {Number(item.price).toLocaleString()} VNĐ
                        </p>
                        {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
                          <div
                            className="text-[10px] text-slate-400 truncate mt-0.5"
                            title={item.ingredients.map((i) => `${i.amount}${i.unit || ''} ${i.name || ''}`).join(', ')}
                          >
                            📦 {item.ingredients.length} định lượng (
                            {item.ingredients.map((i) => `${i.amount}${i.unit || ''} ${(i?.name || '').split(' ')[0]}`).join(', ')})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HAI NÚT THAO TÁC DƯỚI CÙNG */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDishForEdit(item);
                        }}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          isSelectedForEdit
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span>✏️</span>
                        <span>Chỉnh Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingRecipeDish(item);
                        }}
                        className="py-1 px-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1"
                      >
                        <span>📝</span>
                        <span>Công Thức</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* POPUP XEM CHI TIẾT CÔNG THỨC */}
      {/* ======================================================== */}
      {viewingRecipeDish && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>📝 Công Thức:</span>
                <span className="text-amber-600">{viewingRecipeDish.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingRecipeDish(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3.5 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <img
                src={viewingRecipeDish.image}
                alt={viewingRecipeDish.name}
                className="w-16 h-16 object-cover rounded-xl border bg-white flex-shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-500">
                  {viewingRecipeDish.category || 'Món'}
                </span>
                <h4 className="font-extrabold text-slate-800 text-base">{viewingRecipeDish.name}</h4>
                <p className="text-amber-600 font-black text-sm">
                  {Number(viewingRecipeDish.price).toLocaleString()} VNĐ
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Hướng dẫn định lượng & pha chế:
              </label>
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl text-slate-800 text-xs whitespace-pre-line leading-relaxed font-mono">
                {viewingRecipeDish.recipe || 'Chưa có ghi chú công thức cho món này.'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleSelectDishForEdit(viewingRecipeDish);
                  setViewingRecipeDish(null);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                <span>✏️ Chỉnh Sửa Món Này</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingRecipeDish(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
