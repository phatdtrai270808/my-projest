import prisma from '../lib/prisma.js';

export class StaffService {
  // Lấy danh sách nhân viên
  async getAllStaff() {
    return await prisma.staff.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Thêm nhân viên
  async createStaff({ name, role, wagePerHour }) {
    return await prisma.staff.create({
      data: {
        name,
        role: role || 'Phục vụ',
        wagePerHour: Number(wagePerHour) || 25000,
      },
    });
  }

  // Lấy danh sách nhật ký ca làm
  async getAllShiftLogs() {
    return await prisma.shiftLog.findMany({
      include: { staff: true },
      orderBy: { date: 'desc' },
    });
  }

  // Ghi nhận ca làm (chấm công)
  async createShiftLog({ staffId, shiftType, hours, tips }) {
    return await prisma.shiftLog.create({
      data: {
        staffId,
        shiftType: shiftType || 'Sáng',
        hours: Number(hours) || 4,
        tips: Number(tips) || 0,
      },
      include: { staff: true },
    });
  }
}

export default new StaffService();

