import React, { useState, useRef } from 'react';

// Danh sách các logo mẫu gợi ý sẵn theo phong cách F&B
const PRESET_LOGOS = [
  {
    id: 'preset-1',
    label: 'Cà Phê Phin',
    icon: '☕',
    bgColor: 'bg-amber-950',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    desc: 'Cà phê truyền thống',
  },
  {
    id: 'preset-2',
    label: 'Highlands Đỏ',
    icon: '🛎️',
    bgColor: 'bg-[#8B181B]',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    desc: 'Chuỗi tự phục vụ QSR',
  },
  {
    id: 'preset-3',
    label: 'Trà Sữa Trân Châu',
    icon: '🧋',
    bgColor: 'bg-emerald-950',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-300',
    desc: 'Trà sữa & Ăn vặt',
  },
  {
    id: 'preset-4',
    label: 'Take Away Cup',
    icon: '🥤',
    bgColor: 'bg-sky-950',
    borderColor: 'border-sky-400',
    textColor: 'text-sky-300',
    desc: 'Mang đi & Giao hàng',
  },
  {
    id: 'preset-5',
    label: 'Freeze Đá Xay',
    icon: '🍧',
    bgColor: 'bg-purple-950',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-300',
    desc: 'Đá xay & Sinh tố',
  },
  {
    id: 'preset-6',
    label: 'Cafe & Bánh Ngọt',
    icon: '🥐',
    bgColor: 'bg-amber-900',
    borderColor: 'border-orange-400',
    textColor: 'text-amber-200',
    desc: 'Tiệm bánh & Cà phê',
  },
  {
    id: 'preset-7',
    label: 'Trà Hoa & Trái Cây',
    icon: '🍹',
    bgColor: 'bg-rose-950',
    borderColor: 'border-rose-400',
    textColor: 'text-rose-300',
    desc: 'Trà trái cây nhiệt đới',
  },
  {
    id: 'preset-8',
    label: 'Logo Chữ (Initials)',
    icon: 'CF',
    bgColor: 'bg-slate-900',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-400',
    desc: 'Viết tắt tên thương hiệu',
    isText: true,
  },
];

export default function ShopLogoModal({
  isOpen,
  onClose,
  shopInfo,
  onSaveShopInfo,
  onResetShopInfo,
}) {
  if (!isOpen) return null;

  // Local state chỉnh sửa
  const [formData, setFormData] = useState({
    name: shopInfo?.name || 'Tiến Phát Café',
    subTitle: shopInfo?.subTitle || 'Hệ thống POS Thu ngân',
    logoType: shopInfo?.logoType || 'preset', // 'preset' | 'image' | 'text'
    logoUrl: shopInfo?.logoUrl || '',
    logoText: shopInfo?.logoText || 'CF',
    presetId: shopInfo?.presetId || 'preset-8',
    address: shopInfo?.address || 'Tiên Sơn núi vip pro',
    hotline: shopInfo?.hotline || '0905.292.193',
  });

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const fileInputRef = useRef(null);

  // Xử lý upload ảnh từ máy tính (nén và chuyển sang Base64 an toàn cho localStorage)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, SVG)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén ảnh về kích thước tối đa 256x256 để không làm đầy LocalStorage
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/png', 0.85);

        setFormData((prev) => ({
          ...prev,
          logoType: 'image',
          logoUrl: compressedBase64,
        }));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      logoType: preset.isText ? 'text' : 'preset',
      presetId: preset.id,
      logoText: preset.icon,
      logoUrl: '',
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên quán!');
      return;
    }
    onSaveShopInfo(formData);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về Logo & Thông tin quán mặc định không?')) {
      onResetShopInfo();
      onClose();
    }
  };

  // Tìm preset hiện tại
  const currentPreset = PRESET_LOGOS.find((p) => p.id === formData.presetId) || PRESET_LOGOS[7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🖼️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Cập Nhật Logo & Thông Tin Quán
              </h2>
              <p className="text-[11px] text-slate-300">
                Tùy chỉnh nhận diện thương hiệu hiển thị trên Menu, Sidebar, Topbar và Hóa đơn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* NỘI DUNG MODAL */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* KHU VỰC PREVIEW THỜI GIAN THỰC (LIVE PREVIEW) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              👀 Xem Trước Hiển Thị Logo (Live Preview)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Xem trên nền tối Sidebar */}
              <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-inner">
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-500 overflow-hidden bg-amber-950 flex items-center justify-center font-black text-amber-400 text-base shadow-md flex-shrink-0">
                  {formData.logoType === 'image' && formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{formData.logoText || 'CF'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-400 truncate uppercase">
                    {formData.name || 'Tên Quán'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {formData.subTitle || 'Hệ thống POS Thu ngân'}
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                    Nền Sidebar
                  </span>
                </div>
              </div>

              {/* Xem trên nền sáng Topbar & Hóa đơn */}
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-600 overflow-hidden bg-amber-50 flex items-center justify-center font-black text-amber-900 text-base shadow-2xs flex-shrink-0">
                  {formData.logoType === 'image' && formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{formData.logoText || 'CF'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate uppercase">
                    {formData.name || 'Tên Quán'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {formData.address || 'Địa chỉ quán'}
                  </div>
                  <span className="text-[9px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-300">
                    Nền Sáng & Hóa Đơn
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CHỌN CÁCH ĐỔI LOGO (3 TABS) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-700">Chọn nguồn Logo:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  📁 Tải Ảnh Lên
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preset')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'preset'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  ☕ Logo Mẫu Có Sẵn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'url'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🔗 Dán Link Ảnh (URL)
                </button>
              </div>
            </div>

            {/* TAB 1: TẢI ẢNH TỪ MÁY TÍNH */}
            {activeTab === 'upload' && (
              <div className="space-y-3 animate-fadeIn">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-400 hover:border-amber-600 bg-amber-50/40 hover:bg-amber-50 p-6 rounded-2xl text-center cursor-pointer transition space-y-2"
                >
                  <div className="text-3xl">📤</div>
                  <div className="font-extrabold text-amber-950 text-xs">
                    Nhấp vào đây để chọn tệp ảnh Logo từ máy tính của bạn
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hỗ trợ định dạng PNG, JPG, WEBP, SVG • Tối ưu tự động không làm nặng bộ nhớ
                  </div>
                </div>
                {formData.logoType === 'image' && formData.logoUrl && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-300 text-xs font-bold">
                    <span>✅ Đã tải ảnh lên thành công</span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '', logoType: 'preset' }))}
                      className="text-red-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHỌN LOGO MẪU CÓ SẴN */}
            {activeTab === 'preset' && (
              <div className="space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected =
                      formData.logoType !== 'image' &&
                      (formData.presetId === preset.id || formData.logoText === preset.icon);

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${preset.bgColor} ${preset.borderColor} border-2 flex items-center justify-center text-lg font-black ${preset.textColor} shadow-xs`}
                        >
                          {preset.icon}
                        </div>
                        <div className="font-extrabold text-[11px] text-slate-800 truncate w-full">
                          {preset.label}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate w-full">
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Nếu chọn Logo chữ viết tắt, cho phép gõ chữ viết tắt */}
                <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-600">
                    Chữ viết tắt hiển thị (1 - 3 ký tự):
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.logoText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        logoText: e.target.value.toUpperCase(),
                        logoType: 'text',
                      }))
                    }
                    className="w-24 px-3 py-1.5 text-center font-black uppercase rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-slate-800"
                    placeholder="VD: CF"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: DÁN ĐƯỜNG LINK ẢNH (URL) */}
            {activeTab === 'url' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-600">
                  Nhập đường link trực tiếp tới ảnh Logo (URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.logoType === 'image' ? formData.logoUrl : ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        logoType: 'image',
                        logoUrl: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/logo-cafe.png"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.logoUrl) {
                        setFormData((prev) => ({ ...prev, logoType: 'image' }));
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* KHU VỰC CHỈNH SỬA THÔNG TIN QUÁN (TÊN QUÁN, ĐỊA CHỈ, HOTLINE) */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <span>☕</span>
              <span>Thông Tin Nhận Diện Quán</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tên Thương Hiệu Quán (*):
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Tiến Phát Café"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Khẩu hiệu / Phụ đề:
                </label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subTitle: e.target.value }))}
                  placeholder="Hệ thống POS Thu ngân"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Địa Chỉ Quán:
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Tiên Sơn núi vip pro"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Số Điện Thoại Hotline:
                </label>
                <input
                  type="text"
                  value={formData.hotline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hotline: e.target.value }))}
                  placeholder="0905.292.193"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-400 outline-hidden bg-white text-xs text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-700 font-bold hover:underline transition cursor-pointer"
          >
            Khôi phục mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Lưu Logo & Thông Tin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
