import prisma from '../lib/prisma.js';

export class OrderService {
  // Lấy danh sách lịch sử hóa đơn kèm chi tiết món và nhân viên
  async getAllOrders() {
    return await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        staff: true,
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  // Tra cứu hóa đơn theo mã đơn (DH-001-08112026)
  async getOrderById(id) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        staff: true,
        table: true,
      },
    });
  }

  // Xử lý thanh toán và lưu đơn hàng bằng Database Transaction an toàn
  async createOrder(orderPayload) {
    const {
      id, // Mã đơn: VD DH-001-08112026
      tableId,
      staffId,
      subTotal,
      discount,
      vat,
      total,
      paymentMethod,
      orderNote,
      items = [], // Mảng món [{ productId, qty, price, itemNote, name, category }]
    } = orderPayload;

    return await prisma.$transaction(async (tx) => {
      // 1. Đảm bảo các sản phẩm tồn tại trong DB (nếu có món thêm mới từ FE thì tự động tạo)
      for (const item of items) {
        if (item.productId) {
          await tx.product.upsert({
            where: { id: String(item.productId) },
            update: {},
            create: {
              id: String(item.productId),
              name: item.name || `Món ${item.productId}`,
              price: Number(item.price) || 0,
              category: item.category || 'Khác',
            },
          });
        }
      }

      // 2. Tạo bản ghi đơn hàng Order kèm theo danh sách OrderItems
      const createdOrder = await tx.order.create({
        data: {
          id,
          ...(tableId ? { tableId } : {}),
          ...(staffId ? { staffId } : {}),
          subTotal: Number(subTotal) || 0,
          discount: Number(discount) || 0,
          vat: Number(vat) || 0,
          total: Number(total) || 0,
          paymentMethod: paymentMethod || 'CASH',
          orderNote: orderNote || '',
          items: {
            create: items.map((it) => ({
              productId: String(it.productId),
              qty: Number(it.qty) || 1,
              price: Number(it.price) || 0,
              itemNote: it.itemNote || '',
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          staff: true,
          table: true,
        },
      });

      // 3. Nếu đơn hàng gắn với bàn, tự động chuyển bàn về trạng thái RẢNH (Trống)
      if (tableId) {
        const targetTable = await tx.table.findUnique({ where: { id: tableId } });
        if (targetTable) {
          // Nếu bàn này nằm trong nhóm gộp, giải phóng cả nhóm
          if (targetTable.groupId) {
            await tx.table.updateMany({
              where: { groupId: targetTable.groupId },
              data: { occupied: false, groupId: null },
            });
          } else {
            await tx.table.update({
              where: { id: tableId },
              data: { occupied: false, groupId: null },
            });
          }
        }
      }

      return createdOrder;
    });
  }
}

export default new OrderService();

