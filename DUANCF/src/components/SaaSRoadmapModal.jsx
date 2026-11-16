import React, { useState } from 'react';

export default function SaaSRoadmapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 flex items-center justify-center text-8xl font-black pointer-events-none">
            💼
          </div>
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-300/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
              <span>🚀 BẢN KẾ HOẠCH KINH DOANH & THƯƠNG MẠI HÓA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Chiến Lược Phát Triển Thị Trường Phần Mềm SaaS Quản Lý F&B
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Nền tảng Quản trị Quán Cà Phê Đa Năng: Chuẩn hóa cho cả mô hình Tự Phục Vụ (Highlands) và Phục Vụ Tại Bàn truyền thống.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition z-10 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Nội dung Modal cuộn được */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* PHẦN 1: TỔNG QUAN NỀN TẢNG DUAL-ENGINE */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2">
            <h3 className="font-black text-amber-950 text-sm flex items-center gap-2">
              <span>💎</span>
              <span>1. LỢI THẾ CẠNH TRANH CỐT LÕI (CORE COMPETITIVE ADVANTAGE)</span>
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Các phần mềm hiện nay (như KiotViet, CukCuk, iPOS) thường tách rời hoặc cấu hình rất phức tạp khi đổi từ quán có bàn sang chuỗi tự phục vụ. Nền tảng của chúng tôi sở hữu kiến trúc <b>Dual-Engine</b> độc nhất:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="font-extrabold text-[#8B181B] text-xs flex items-center gap-1.5">
                  <span>🛎️</span>
                  <span>Gói Highlands QSR (Tự phục vụ):</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Đánh vào các chuỗi take-away, quán giới trẻ, trà sữa, cafe văn phòng cần tốc độ xoay đơn cao, thẻ rung thông minh, màn KDS Barista và màn Tivi gọi số.
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="font-extrabold text-amber-800 text-xs flex items-center gap-1.5">
                  <span>☕</span>
                  <span>Gói Cafe Sân Vườn (Tại bàn):</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Đánh vào quán cafe diện tích rộng, sân vườn, gia đình có nhiều phòng/khu vực cần quản lý sơ đồ bàn, gộp bàn và đặt bàn trước.
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 2: CHÍNH SÁCH ĐÓNG GÓI VÀ BẢNG GIÁ (PRICING TIERS) */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <span>🏷️</span>
              <span>2. CHIẾN LƯỢC ĐÓNG GÓI SẢN PHẨM & ĐỊNH GIÁ (SAAS PRICING MODEL)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Gói 1: Starter */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Gói Khởi Nghiệp</div>
                  <div className="text-lg font-black text-slate-800 mt-0.5">TRADITIONAL BASIC</div>
                  <div className="text-xl font-black text-amber-600 mt-2">
                    99.000đ <span className="text-xs font-medium text-slate-500">/tháng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Dành cho quán cafe nhỏ, quán gia đình 1 điểm bán.</p>
                  <ul className="text-xs space-y-1.5 text-slate-600 mt-3 pt-3 border-t">
                    <li>✓ Sơ đồ bàn truyền thống & gộp bàn</li>
                    <li>✓ Quản lý menu & công thức</li>
                    <li>✓ Báo cáo doanh thu cơ bản</li>
                  </ul>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-bold bg-slate-200/50 py-1.5 rounded-lg">
                  Thuê bao theo năm: 990.000đ/năm
                </div>
              </div>

              {/* Gói 2: Pro Chain */}
              <div className="border-2 border-[#8B181B] rounded-2xl p-4 bg-red-50/40 space-y-3 flex flex-col justify-between relative shadow-md">
                <span className="absolute -top-2.5 right-4 bg-[#8B181B] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                  BÁN CHẠY NHẤT
                </span>
                <div>
                  <div className="text-xs font-black text-[#8B181B] uppercase tracking-wider">Gói Chuỗi Tự Phục Vụ</div>
                  <div className="text-lg font-black text-[#8B181B] mt-0.5">HIGHLANDS SMART QSR</div>
                  <div className="text-xl font-black text-[#8B181B] mt-2">
                    199.000đ <span className="text-xs font-medium text-slate-500">/tháng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Dành cho quán hiện đại, chuỗi take-away, trà sen, freeze.</p>
                  <ul className="text-xs space-y-1.5 text-slate-700 mt-3 pt-3 border-t font-medium">
                    <li>✓ Khay quản lý 24-30 thẻ rung điện tử</li>
                    <li>✓ Màn hình Barista KDS có chuông ding-dong</li>
                    <li>✓ Màn hình Tivi gọi số Fullscreen ngoài quầy</li>
                    <li>✓ Quản lý kho định lượng & hao hụt tự động</li>
                  </ul>
                </div>
                <div className="text-[10px] text-center text-[#8B181B] font-black bg-red-100/70 py-1.5 rounded-lg">
                  Thuê bao theo năm: 1.990.000đ/năm
                </div>
              </div>

              {/* Gói 3: Enterprise */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Gói Toàn Diện</div>
                  <div className="text-lg font-black text-slate-800 mt-0.5">ALL-IN-ONE ENTERPRISE</div>
                  <div className="text-xl font-black text-slate-800 mt-2">
                    299.000đ <span className="text-xs font-medium text-slate-500">/tháng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Mở khóa công tắc gạt đa năng chuyển đổi cả 2 mô hình.</p>
                  <ul className="text-xs space-y-1.5 text-slate-600 mt-3 pt-3 border-t">
                    <li>✓ Mở trọn vẹn cả 2 mô hình theo mùa vụ</li>
                    <li>✓ Phân quyền nâng cao, chấm công & bảng lương</li>
                    <li>✓ Báo cáo tài chính chuyên sâu & giờ vàng</li>
                    <li>✓ Hỗ trợ kỹ thuật 24/7 & backup đám mây</li>
                  </ul>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-bold bg-slate-200/50 py-1.5 rounded-lg">
                  Thuê bao trọn đời: 4.900.000đ (1 lần)
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 3: LỘ TRÌNH PHÁT TRIỂN THỊ TRƯỜNG 4 GIAI ĐOẠN (ROADMAP) */}
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <span>🗺️</span>
              <span>3. KẾ HOẠCH TRIỂN KHAI THỊ TRƯỜNG (GO-TO-MARKET ROADMAP)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[10px]">
                  GIAI ĐOẠN 1 (0-3 THÁNG)
                </span>
                <div className="font-extrabold text-xs text-slate-800">Thử Nghiệm & Hoàn Thiện</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cài đặt thử nghiệm tại 3-5 quán cafe thực tế trong khu vực để thu thập phản hồi của thu ngân, thợ pha chế và tối ưu quy trình.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[10px]">
                  GIAI ĐOẠN 2 (3-6 THÁNG)
                </span>
                <div className="font-extrabold text-xs text-slate-800">Tiếp Cận Khách Hàng</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Quảng bá trong các hội nhóm F&B (Cộng đồng chủ quán cafe), tiếp cận các quán mới khai trương với chương trình tặng 1 tháng dùng thử miễn phí.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-black text-[10px]">
                  GIAI ĐOẠN 3 (6-12 THÁNG)
                </span>
                <div className="font-extrabold text-xs text-slate-800">Hợp Tác Phần Cứng</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hợp tác với các đơn vị cung cấp máy in bill, thiết bị thẻ rung và máy POS Sunmi/iMin để bán trọn gói "Phần mềm + Phần cứng" giá ưu đãi.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                  GIAI ĐOẠN 4 (NĂM THỨ 2)
                </span>
                <div className="font-extrabold text-xs text-slate-800">Mở Rộng Hệ Sinh Thái</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tích hợp tính năng QR Order trực tiếp tại bàn bằng điện thoại khách, chương trình thành viên tích điểm CRM và kết nối app giao hàng Grab/ShopeeFood.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-slate-500">
            💡 <i>Gợi ý: Mở popup này trong buổi thuyết trình để trình chiếu bản kế hoạch thị trường trước hội đồng.</i>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs shadow-md transition"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
}

