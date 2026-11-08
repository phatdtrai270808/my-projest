import React, { useState } from 'react';
import { useNotification } from './CustomNotification';

export default function OrderHistory({ orders = [], onRePrint }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [filterDate, setFilterDate] = useState('TODAY');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { showSuccess } = useNotification();

  // Ngày hôm nay định dạng DDMMYYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  const todayStr = `${day}${month}${year}`;
  const todayDisplay = `${day}/${month}/${year}`;

  // Lọc danh sách hóa đơn
  const filteredOrders = orders.filter((order) => {
    // Lọc theo ngày
    if (filterDate === 'TODAY') {
      const matchDateStr = order.id && order.id.includes(todayStr);
      const matchCreatedAt = order.createdAt && order.createdAt.includes(todayDisplay);
      if (!matchDateStr && !matchCreatedAt) return false;
    }

    // Lọc theo hình thức thanh toán
    if (filterPayment !== 'ALL') {
      if (order.paymentMethod !== filterPayment) return false;
    }

    // Tìm kiếm từ khóa (Mã đơn hàng, tên bàn, nhân viên)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = order.id?.toLowerCase().includes(term);
      const matchTable = order.tableName?.toLowerCase().includes(term);
      const matchStaff = order.staffName?.toLowerCase().includes(term);
      const matchItems = order.items?.some((it) => it.name.toLowerCase().includes(term));
      if (!matchId && !matchTable && !matchStaff && !matchItems) return false;
    }

    return true;
  });

  // Tính toán số liệu thống kê doanh thu
  const stats = filteredOrders.reduce(
    (acc, order) => {
      acc.totalRevenue += order.total || 0;
      acc.totalCount += 1;
      if (order.paymentMethod === 'TRANSFER') {
        acc.transferRevenue += order.total || 0;
        acc.transferCount += 1;
      } else {
        acc.cashRevenue += order.total || 0;
        acc.cashCount += 1;
      }
      return acc;
    },
    { totalRevenue: 0, totalCount: 0, cashRevenue: 0, cashCount: 0, transferRevenue: 0, transferCount: 0 }
  );

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showSuccess(`Đã sao chép mã: ${code}`);
    }
  };

  const handlePrintAgain = (invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & CÁC THẺ DOANH THU TỔNG QUAN */}
      <div className="flex justify-between items-center pb-2 border-b flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span>📜 LỊCH SỬ HÓA ĐƠN & DOANH THU</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
              {filteredOrders.length} Đơn
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tra cứu mã đơn hàng, đối soát biến động số dư VietQR và in lại hóa đơn thu ngân.
          </p>
        </div>

        {/* Nút lọc nhanh ngày hôm nay / tất cả */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border text-xs">
          <button
            type="button"
            onClick={() => setFilterDate('TODAY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterDate === 'TODAY' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hôm nay ({todayDisplay})
          </button>
          <button
            type="button"
            onClick={() => setFilterDate('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filterDate === 'ALL' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả thời gian
          </button>
        </div>
      </div>

      {/* THỐNG KÊ DOANH THU (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng doanh thu */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-lg shadow-amber-900/10">
          <div className="text-xs font-bold uppercase opacity-90">Tổng Doanh Thu</div>
          <div className="text-2xl font-black mt-2">{stats.totalRevenue.toLocaleString()} VNĐ</div>
          <div className="text-xs opacity-90 mt-1">{stats.totalCount} hóa đơn đã xuất</div>
        </div>

        {/* Doanh thu Chuyển khoản VietQR */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-900/10">
          <div className="text-xs font-bold uppercase opacity-90 flex items-center justify-between">
            <span>Chuyển Khoản (VietQR)</span>
            <span>💳</span>
          </div>
          <div className="text-2xl font-black mt-2">{stats.transferRevenue.toLocaleString()} VNĐ</div>
          <div className="text-xs opacity-90 mt-1">{stats.transferCount} lượt chuyển khoản</div>
        </div>

        {/* Doanh thu Tiền mặt */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-900/10">
          <div className="text-xs font-bold uppercase opacity-90 flex items-center justify-between">
            <span>Tiền Mặt (Cash)</span>
            <span>💵</span>
          </div>
          <div className="text-2xl font-black mt-2">{stats.cashRevenue.toLocaleString()} VNĐ</div>
          <div className="text-xs opacity-90 mt-1">{stats.cashCount} lượt tiền mặt</div>
        </div>

        {/* Giá trị trung bình đơn */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-slate-800">
          <div className="text-xs font-bold uppercase text-slate-400">Trung Bình / Hóa Đơn</div>
          <div className="text-2xl font-black mt-2 text-slate-800">
            {stats.totalCount > 0 ? Math.round(stats.totalRevenue / stats.totalCount).toLocaleString() : 0} VNĐ
          </div>
          <div className="text-xs text-slate-400 mt-1">Chi tiêu trung bình của khách</div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC HÓA ĐƠN */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Tìm theo mã DH-..., tên bàn, nhân viên..."
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2.5 pl-8 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500">Hình thức:</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="text-xs border border-gray-300 rounded-xl px-3 py-2 font-medium bg-white focus:outline-none"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="TRANSFER">💳 Chuyển Khoản (VietQR)</option>
            <option value="CASH">💵 Tiền Mặt</option>
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH HÓA ĐƠN */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 italic">
            Chưa có hóa đơn nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b">
                  <th className="p-3.5">Mã Đơn Hàng</th>
                  <th className="p-3.5">Thời Gian</th>
                  <th className="p-3.5">Vị Trí Bàn</th>
                  <th className="p-3.5">Món Đã Gọi</th>
                  <th className="p-3.5">Tổng Tiền</th>
                  <th className="p-3.5">Hình Thức</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((order) => {
                  const isTransfer = order.paymentMethod === 'TRANSFER';
                  const totalItems = (order.items || []).reduce((sum, it) => sum + it.qty, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      {/* Cột Mã Đơn Hàng */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-extrabold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            {order.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(order.id)}
                            title="Sao chép mã đơn"
                            className="text-gray-400 hover:text-amber-600 text-xs p-1"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Thời gian */}
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {order.createdAt}
                      </td>

                      {/* Vị trí bàn */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{order.tableName}</span>
                        <div className="text-[10px] text-gray-400">Thu ngân: {order.staffName}</div>
                      </td>

                      {/* Chi tiết món */}
                      <td className="p-3.5 max-w-xs truncate">
                        <span className="font-bold text-slate-700">{totalItems} món: </span>
                        <span className="text-gray-500">
                          {order.items?.map((it) => `${it.name} (x${it.qty})`).join(', ')}
                        </span>
                        {order.orderNote && (
                          <div className="text-[10px] text-amber-700 italic truncate mt-0.5">
                            Note: {order.orderNote}
                          </div>
                        )}
                      </td>

                      {/* Tổng tiền */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-black text-sm text-amber-700">
                          {order.total?.toLocaleString()} VNĐ
                        </span>
                        {order.discountAmount > 0 && (
                          <div className="text-[10px] text-red-500">
                            -{(order.discountAmount).toLocaleString()}đ (giảm giá)
                          </div>
                        )}
                      </td>

                      {/* Hình thức */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isTransfer ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            💳 Chuyển Khoản
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            💵 Tiền Mặt
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                            title="Xem chi tiết đơn hàng"
                          >
                            👁️ Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintAgain(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-sm"
                            title="In lại hóa đơn K80"
                          >
                            🖨️ In Lại
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP CHI TIẾT & IN LẠI HÓA ĐƠN K80 */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 text-slate-800 font-mono text-xs">
            <div className="text-center border-b pb-3 mb-3">
              <h2 className="font-extrabold text-base tracking-wider uppercase">CA PHÊ TIẾN PHÁT</h2>
              <p className="text-[11px] text-gray-500">ĐC: Tiên Sơn núi vip pro</p>
              <p className="text-[11px] text-gray-500">Hotline: 0905292193</p>
              <h3 className="font-bold text-sm uppercase mt-2">HÓA ĐƠN THANH TOÁN</h3>
              <div className="mt-1.5 inline-block bg-amber-50 text-amber-900 px-3 py-1 rounded-xl font-black text-xs tracking-wider border border-amber-300 shadow-sm font-mono">
                MÃ ĐƠN: {selectedInvoice.id}
              </div>
            </div>

            <div className="space-y-1 mb-3 text-[11px]">
              <div><strong>Vị trí:</strong> {selectedInvoice.tableName}</div>
              <div><strong>Thu ngân:</strong> {selectedInvoice.staffName}</div>
              <div><strong>Thời gian:</strong> {selectedInvoice.createdAt}</div>
              {selectedInvoice.orderNote && (
                <div className="bg-amber-50 p-1.5 rounded border border-amber-200 font-sans italic text-amber-900">
                  📌 Ghi chú: {selectedInvoice.orderNote}
                </div>
              )}
            </div>

            <div className="border-t border-b py-2 mb-3 space-y-2">
              {selectedInvoice.items?.map((item, idx) => (
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
                <span>{selectedInvoice.subTotal?.toLocaleString()} VNĐ</span>
              </div>
              {selectedInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Giảm giá:</span>
                  <span>-{selectedInvoice.discountAmount?.toLocaleString()} VNĐ</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Thuế VAT (10%):</span>
                <span>+{selectedInvoice.vat?.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-amber-700 pt-1 border-t">
                <span>TỔNG TIỀN:</span>
                <span>{selectedInvoice.total?.toLocaleString()} VNĐ</span>
              </div>
              <div className="text-[10px] text-gray-500 pt-1">
                Hình thức: {selectedInvoice.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}
              </div>
            </div>

            {selectedInvoice.paymentMethod === 'TRANSFER' && (
              <div className="text-center my-3 py-2.5 border-b border-dashed border-gray-300 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200">
                <p className="font-sans text-[10px] text-gray-500 font-bold mb-1 uppercase">
                  Mã VietQR đã thanh toán
                </p>
                <img
                  src={`https://img.vietqr.io/image/MB-0358311551-compact2.png?amount=${Math.round(selectedInvoice.total)}&addInfo=${encodeURIComponent(selectedInvoice.id)}&accountName=${encodeURIComponent('DOAN TIEN PHAT')}`}
                  alt="VietQR Hóa đơn"
                  className="w-32 mx-auto rounded-xl border p-1 bg-white shadow-sm"
                />
                <div className="font-sans text-[10px] text-slate-700 mt-2 space-y-0.5">
                  <p className="font-bold">MBBank - STK: 0358311551</p>
                  <p className="font-bold uppercase text-slate-900">DOAN TIEN PHAT</p>
                  <p className="text-[9px] text-gray-500">Nội dung CK: <strong>{selectedInvoice.id}</strong></p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                🖨️ In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

