import prisma from '../lib/prisma.js';

export class TableService {
  // Lấy toàn bộ danh sách bàn
  async getAllTables() {
    return await prisma.table.findMany({
      orderBy: [
        { area: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  // Lấy chi tiết 1 bàn
  async getTableById(id) {
    return await prisma.table.findUnique({
      where: { id },
    });
  }

  // Tạo bàn mới
  async createTable({ name, area }) {
    return await prisma.table.create({
      data: {
        name,
        area: area || 'Phòng thường',
        occupied: false,
        groupId: null,
      },
    });
  }

  // Cập nhật thông tin/trạng thái bàn (Bận/Rảnh, Gộp nhóm, Đặt bàn trước)
  async updateTable(id, updateData) {
    const {
      name,
      area,
      occupied,
      groupId,
      isReserved,
      reservedName,
      reservedPhone,
      reservedTime,
      reservedNote,
    } = updateData;

    return await prisma.table.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(area !== undefined && { area }),
        ...(occupied !== undefined && { occupied }),
        ...(groupId !== undefined && { groupId }),
        ...(isReserved !== undefined && { isReserved }),
        ...(reservedName !== undefined && { reservedName }),
        ...(reservedPhone !== undefined && { reservedPhone }),
        ...(reservedTime !== undefined && { reservedTime }),
        ...(reservedNote !== undefined && { reservedNote }),
      },
    });
  }

  // Cập nhật trạng thái nhiều bàn (dùng cho gộp bàn hoặc giải tán nhóm)
  async updateManyTables(tableIds, data) {
    return await prisma.table.updateMany({
      where: { id: { in: tableIds } },
      data,
    });
  }

  // Xóa bàn
  async deleteTable(id) {
    return await prisma.table.delete({
      where: { id },
    });
  }
}

export default new TableService();

