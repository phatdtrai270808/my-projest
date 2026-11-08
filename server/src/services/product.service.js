import prisma from '../lib/prisma.js';

// Hàm tự động tải file ảnh Base64 lên Supabase Storage bucket 'Product_img'
async function uploadBase64ToStorage(base64Data, prefix = 'product') {
  if (!base64Data || !base64Data.startsWith('data:')) {
    return base64Data; // Nếu đã là URL thông thường thì giữ nguyên
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uronprxoepcxjogydqcr.supabase.co';
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    // Nếu chưa có key Supabase trong .env, lưu tạm chuỗi base64 vào DB
    return base64Data;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const contentType = matches ? matches[1] : 'image/jpeg';
    const base64String = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(base64String, 'base64');

    const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanPrefix}_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('Product_img')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('⚠️ Lỗi upload lên Supabase Storage bucket Product_img:', error.message);
      return base64Data;
    }

    const { data: publicData } = supabase.storage
      .from('Product_img')
      .getPublicUrl(fileName);

    console.log(`✅ Đã đổ file ảnh thật vào Supabase Storage: ${publicData.publicUrl}`);
    return publicData.publicUrl;
  } catch (err) {
    console.warn('⚠️ Lỗi khi gửi file lên Supabase Storage:', err.message);
    return base64Data;
  }
}

export class ProductService {
  // Lấy toàn bộ thực đơn
  async getAllProducts() {
    return await prisma.product.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  // Lấy chi tiết món theo ID
  async getProductById(id) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });
  }

  // Thêm món mới vào thực đơn
  async createProduct({ name, price, category, image, recipe }) {
    let finalImageUrl = image;
    if (image && image.startsWith('data:')) {
      finalImageUrl = await uploadBase64ToStorage(image, name || 'new_dish');
    }

    return await prisma.product.create({
      data: {
        name,
        price: Number(price) || 0,
        category: category || 'Khác',
        image: finalImageUrl || null,
        recipe: recipe || null,
      },
    });
  }

  // Cập nhật thông tin món (Sử dụng upsert để đảm bảo dù món tạo từ local vẫn được lưu vào DB)
  async updateProduct(id, updateData) {
    const { name, price, category, image, recipe } = updateData;

    let finalImageUrl = image;
    if (image && image.startsWith('data:')) {
      finalImageUrl = await uploadBase64ToStorage(image, id || name || 'dish');
    }

    return await prisma.product.upsert({
      where: { id: String(id) },
      update: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category !== undefined && { category }),
        ...(image !== undefined && { image: finalImageUrl }),
        ...(recipe !== undefined && { recipe }),
      },
      create: {
        id: String(id),
        name: name || 'Món mới',
        price: Number(price) || 0,
        category: category || 'Khác',
        image: finalImageUrl || null,
        recipe: recipe || null,
      },
    });
  }

  // Xóa món khỏi thực đơn (Không báo lỗi nếu món chưa có trong DB)
  async deleteProduct(id) {
    const existing = await prisma.product.findUnique({ where: { id: String(id) } });
    if (existing) {
      return await prisma.product.delete({
        where: { id: String(id) },
      });
    }
    return { success: true, message: 'Món không tồn tại trong DB hoặc đã bị xóa' };
  }

  // Tải ảnh Base64 lên Supabase Storage bucket 'Product_img'
  async uploadImage(base64Data, fileName, productId = null) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uronprxoepcxjogydqcr.supabase.co';
    const supabaseKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY;

    if (!supabaseKey) {
      throw new Error('Chưa cấu hình Supabase API Key (VITE_SUPABASE_ANON_KEY hoặc SUPABASE_SERVICE_ROLE_KEY) trong .env');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Xử lý chuỗi Base64 DataURL thành binary buffer
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const contentType = matches ? matches[1] : 'image/jpeg';
    const base64String = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(base64String, 'base64');

    const cleanFileName = fileName || `prod_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('Product_img')
      .upload(cleanFileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('Product_img')
      .getPublicUrl(cleanFileName);

    const publicUrl = publicData.publicUrl;

    if (productId) {
      await prisma.product.update({
        where: { id: productId },
        data: { image: publicUrl },
      });
    }

    return { publicUrl, fileName: cleanFileName };
  }
}

export default new ProductService();

