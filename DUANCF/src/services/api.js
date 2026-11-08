// Service kết nối API giữa Frontend React và Backend Node.js / Prisma / Supabase (MVC Architecture)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 1. Kiểm tra trạng thái Backend
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // timeout 2s
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, data };
  } catch {
    return { online: false };
  }
}

// 2. Lấy danh sách bàn từ Supabase
export async function apiGetTables() {
  const res = await fetch(`${API_BASE}/tables`);
  if (!res.ok) throw new Error('Không thể tải danh sách bàn từ máy chủ');
  return res.json();
}

// 3. Tạo bàn mới vào Supabase
export async function apiCreateTable(tableData) {
  const res = await fetch(`${API_BASE}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tableData),
  });
  if (!res.ok) throw new Error('Lỗi khi thêm bàn mới');
  return res.json();
}

// 4. Cập nhật trạng thái bàn (Bận/Rảnh, Gộp bàn)
export async function apiUpdateTable(id, updates) {
  const res = await fetch(`${API_BASE}/tables/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật bàn');
  return res.json();
}

// 5. Gộp nhiều bàn
export async function apiMergeTables(tableIds, groupId) {
  const res = await fetch(`${API_BASE}/tables/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableIds, groupId }),
  });
  if (!res.ok) throw new Error('Lỗi khi gộp bàn trên máy chủ');
  return res.json();
}

// 6. Xóa bàn khỏi Supabase
export async function apiDeleteTable(id) {
  const res = await fetch(`${API_BASE}/tables/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Lỗi khi xóa bàn');
  return res.json();
}

// 7. Lấy thực đơn món từ Supabase
export async function apiGetProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Không thể tải thực đơn từ máy chủ');
  return res.json();
}

// 8. Thêm món mới vào thực đơn Supabase
export async function apiCreateProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Lỗi khi thêm món ăn');
  return res.json();
}

// 8.1. Cập nhật món ăn trong thực đơn Supabase
export async function apiUpdateProduct(id, productData) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật món ăn');
  return res.json();
}

// 9. Xóa món khỏi thực đơn Supabase
export async function apiDeleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Lỗi khi xóa món ăn');
  return res.json();
}

// 10. Lấy danh sách hóa đơn từ Supabase
export async function apiGetOrders() {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Không thể tải lịch sử đơn hàng');
  return res.json();
}

// 11. Tạo và lưu hóa đơn mới (vào Supabase PostgreSQL)
export async function apiCreateOrder(orderData) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Lỗi khi lưu đơn hàng lên hệ thống');
  return res.json();
}

// 12. Lấy danh sách nhân viên từ Supabase
export async function apiGetStaff() {
  const res = await fetch(`${API_BASE}/staff`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân viên');
  return res.json();
}
