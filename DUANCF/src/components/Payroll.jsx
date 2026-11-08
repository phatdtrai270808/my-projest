import React from 'react';

export default function Payroll({ staffList }) {
  const payrollData = staffList.map((staff) => {
    const hours = 40;
    const baseSalary = hours * staff.hourlyRate;
    const sales = 5000000;
    const commission = sales * 0.02;
    const penalty = 10000;
    const netSalary = baseSalary + commission - penalty;

    return {
      ...staff,
      hours,
      baseSalary,
      sales,
      commission,
      penalty,
      netSalary,
    };
  });

  return (
    <div className="p-4">
      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-amber-800">💵 BẢNG TÍNH LƯƠNG NHÂN VIÊN</h3>
          <p className="text-xs text-gray-500">Tự động tính lương giờ, hoa hồng doanh số và trừ hao hụt két từ ca làm việc</p>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-amber-50 text-amber-900 border-b">
              <th className="p-2">Tên Nhân Viên</th>
              <th className="p-2">Số Giờ (h)</th>
              <th className="p-2">Lương/Giờ</th>
              <th className="p-2">Tiền Lương Giờ</th>
              <th className="p-2">Doanh Số Phục Vụ</th>
              <th className="p-2">Hoa Hồng (2%)</th>
              <th className="p-2">Trừ Hao Hụt Két</th>
              <th className="p-2 font-bold">TỔNG THỰC LĨNH</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-semibold">{item.name}</td>
                <td className="p-2">{item.hours}</td>
                <td className="p-2">{item.hourlyRate.toLocaleString()} VNĐ</td>
                <td className="p-2">{item.baseSalary.toLocaleString()} VNĐ</td>
                <td className="p-2">{item.sales.toLocaleString()} VNĐ</td>
                <td className="p-2 text-green-600">+{item.commission.toLocaleString()} VNĐ</td>
                <td className="p-2 text-red-500">-{item.penalty.toLocaleString()} VNĐ</td>
                <td className="p-2 font-bold text-amber-700 text-base">{item.netSalary.toLocaleString()} VNĐ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}