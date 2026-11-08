import React, { useState } from 'react';
import { useNotification } from './CustomNotification';

export default function ShiftManagement({ staffList, shiftLogs, onAddShiftLog }) {
  const [selectedStaff, setSelectedStaff] = useState(staffList[0]?.id || '');
  const [activeShift, setActiveShift] = useState(null);
  const [actualCash, setActualCash] = useState(0);

  const { showSuccess, showWarning } = useNotification();

  const handleStartShift = () => {
    if (activeShift) {
      showWarning('Đã có ca làm việc đang mở!');
      return;
    }
    const staffObj = staffList.find((s) => s.id === selectedStaff);
    setActiveShift({
      staffName: staffObj?.name || 'Chưa rõ',
      startTime: new Date().toLocaleTimeString('vi-VN'),
    });
    showSuccess(`Đã mở ca làm việc thành công cho nhân viên: ${staffObj?.name || 'Nhân viên'}`);
  };

  const handleCloseShift = () => {
    if (!activeShift) {
      showWarning('Hiện chưa có ca làm việc nào để chốt!');
      return;
    }

    const systemCash = 500000;
    const discrepancy = actualCash - systemCash;

    const newLog = {
      id: Date.now(),
      staffName: activeShift.staffName,
      time: `${activeShift.startTime} - ${new Date().toLocaleTimeString('vi-VN')}`,
      transferRevenue: 1200000,
      systemCash,
      actualCash: Number(actualCash),
      discrepancy,
      status: discrepancy === 0 ? 'Khớp' : discrepancy < 0 ? 'Thâm hụt' : 'Dư',
    };

    onAddShiftLog(newLog);
    setActiveShift(null);
    setActualCash(0);
    showSuccess('Chốt ca làm việc và lưu sổ nhật ký thành công!');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border">
          <h3 className="font-bold text-lg mb-3">1. Chấm Công Vào Ca</h3>
          <div className="flex gap-2 mb-4">
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="border p-2 rounded flex-1"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={handleStartShift}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-700"
            >
              VÀO CA
            </button>
          </div>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>🟢 Nhân viên đang trong ca: <strong className="text-green-600">{activeShift ? activeShift.staffName : 'Chưa có'}</strong></p>
            <p>Giờ mở ca: <span>{activeShift ? activeShift.startTime : '--:--'}</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border">
          <h3 className="font-bold text-lg mb-3">2. Chốt Ca & Đối Soát Tiền Mặt</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Tiền mặt thực tế trong két (VNĐ):</label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                placeholder="Nhập số tiền mặt đếm được"
              />
            </div>
            <button
              onClick={handleCloseShift}
              className="w-full bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700"
            >
              CHỐT CA LÀM VIỆC
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="font-bold text-lg mb-3">📜 Lịch Sử Chốt Ca</h3>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2">Nhân Viên</th>
              <th className="p-2">Khung Giờ</th>
              <th className="p-2">Doanh Thu CK</th>
              <th className="p-2">Tiền Mặt Tính</th>
              <th className="p-2">Tiền Thực Trong Két</th>
              <th className="p-2">Chênh Lệch</th>
              <th className="p-2">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {shiftLogs.length === 0 ? (
              <tr><td colSpan="7" className="p-3 text-center text-gray-400">Chưa có lịch sử chốt ca nào...</td></tr>
            ) : (
              shiftLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{log.staffName}</td>
                  <td className="p-2">{log.time}</td>
                  <td className="p-2">{log.transferRevenue.toLocaleString()} VNĐ</td>
                  <td className="p-2">{log.systemCash.toLocaleString()} VNĐ</td>
                  <td className="p-2">{log.actualCash.toLocaleString()} VNĐ</td>
                  <td className={`p-2 font-bold ${log.discrepancy < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {log.discrepancy.toLocaleString()} VNĐ
                  </td>
                  <td className="p-2"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200">{log.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}