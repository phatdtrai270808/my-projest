import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_TABLES = [
  { id: 'T1', name: 'Bàn 1-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T2', name: 'Bàn 2-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T3', name: 'Bàn 3-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T4', name: 'Bàn 4-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T5', name: 'Bàn 5-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'T6', name: 'Bàn 6-Phòng thường', area: 'Phòng thường', occupied: false, groupId: null },
  { id: 'L1', name: 'Bàn 1-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L2', name: 'Bàn 2-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L3', name: 'Bàn 3-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
  { id: 'L4', name: 'Bàn 4-Phòng lạnh', area: 'Phòng lạnh', occupied: false, groupId: null },
];

const INITIAL_STAFF = [
  { id: 'NV1', name: 'Tiến Phát', role: 'Quản lý', wagePerHour: 30000 },
  { id: 'NV2', name: 'Ng Thư', role: 'Thu ngân', wagePerHour: 25000 },
  { id: 'NV3', name: 'Thanh Hà', role: 'Pha chế', wagePerHour: 28000 },
];

const INITIAL_PRODUCTS = [
  { id: 'CF1', name: 'Cà Phê Đen Đá', price: 20000, category: 'Cà Phê' },
  { id: 'CF2', name: 'Cà Phê Sữa Đá', price: 25000, category: 'Cà Phê' },
  { id: 'CF3', name: 'Bạc Xỉu Sài Gòn', price: 29000, category: 'Cà Phê' },
  { id: 'CF4', name: 'Cà Phê Muối', price: 32000, category: 'Cà Phê' },
  { id: 'TR1', name: 'Trà Đào Cam Sả', price: 35000, category: 'Trà Trái Cây' },
  { id: 'TR2', name: 'Trà Vải Hoa Hồng', price: 35000, category: 'Trà Trái Cây' },
  { id: 'TR3', name: 'Trà Mãng Cầu', price: 38000, category: 'Trà Trái Cây' },
  { id: 'DX1', name: 'Matcha Đá Xay', price: 42000, category: 'Đá Xay' },
  { id: 'DX2', name: 'Cacao Đá Xay', price: 40000, category: 'Đá Xay' },
  { id: 'BN1', name: 'Bánh Croissant Bơ Tỏi', price: 28000, category: 'Bánh Ngọt' },
  { id: 'BN2', name: 'Bánh Tiramisu', price: 35000, category: 'Bánh Ngọt' },
];

async function main() {
  console.log('🌱 Đang khởi tạo dữ liệu mẫu cho quán cafe...');

  // 1. Seed Bàn
  for (const t of INITIAL_TABLES) {
    await prisma.table.upsert({
      where: { id: t.id },
      update: { name: t.name, area: t.area },
      create: t,
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${INITIAL_TABLES.length} bàn.`);

  // 2. Seed Nhân viên
  for (const s of INITIAL_STAFF) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: { name: s.name, role: s.role, wagePerHour: s.wagePerHour },
      create: s,
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${INITIAL_STAFF.length} nhân viên.`);

  // 3. Seed Thực đơn món ăn
  for (const p of INITIAL_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price, category: p.category },
      create: p,
    });
  }
  console.log(`✅ Đã tạo/cập nhật ${INITIAL_PRODUCTS.length} món trong thực đơn.`);

  console.log('🎉 Seed dữ liệu vào Supabase PostgreSQL thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

