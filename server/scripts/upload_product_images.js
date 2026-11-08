import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import prisma from '../src/lib/prisma.js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://uronprxoepcxjogydqcr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Danh sách ảnh mẫu chất lượng cao cho 11 món trong quán
const PRODUCT_IMAGES = [
  {
    id: 'CF1',
    fileName: 'cf1_ca_phe_den_da.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
    name: 'Cà Phê Đen Đá',
  },
  {
    id: 'CF2',
    fileName: 'cf2_ca_phe_sua_da.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    name: 'Cà Phê Sữa Đá',
  },
  {
    id: 'CF3',
    fileName: 'cf3_bac_xiu_sai_gon.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80',
    name: 'Bạc Xỉu Sài Gòn',
  },
  {
    id: 'CF4',
    fileName: 'cf4_ca_phe_muoi.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
    name: 'Cà Phê Muối',
  },
  {
    id: 'TR1',
    fileName: 'tr1_tra_dao_cam_sa.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    name: 'Trà Đào Cam Sả',
  },
  {
    id: 'TR2',
    fileName: 'tr2_tra_vai_hoa_hong.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    name: 'Trà Vải Hoa Hồng',
  },
  {
    id: 'TR3',
    fileName: 'tr3_tra_mang_cau.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop&q=80',
    name: 'Trà Mãng Cầu',
  },
  {
    id: 'DX1',
    fileName: 'dx1_matcha_da_xay.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    name: 'Matcha Đá Xay',
  },
  {
    id: 'DX2',
    fileName: 'dx2_cacao_da_xay.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    name: 'Cacao Đá Xay',
  },
  {
    id: 'BN1',
    fileName: 'bn1_croissant_bo_toi.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    name: 'Bánh Croissant Bơ Tỏi',
  },
  {
    id: 'BN2',
    fileName: 'bn2_tiramisu.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
    name: 'Bánh Tiramisu',
  },
];

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ LỖI: Chưa có mã API Key (VITE_SUPABASE_ANON_KEY hoặc SUPABASE_SERVICE_ROLE_KEY) trong file .env');
    console.error('👉 Vui lòng mở Supabase Dashboard -> Project Settings -> API và copy mã "anon public" hoặc "service_role" dán vào .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const BUCKET_NAME = 'Product_img';

  console.log(`🚀 Bắt đầu quá trình tải và đổ ảnh vào bucket "${BUCKET_NAME}"...`);

  for (const item of PRODUCT_IMAGES) {
    try {
      console.log(`\n⏳ Đang xử lý: [${item.id}] ${item.name}...`);
      
      // 1. Tải ảnh từ nguồn
      const imgRes = await fetch(item.sourceUrl);
      if (!imgRes.ok) {
        throw new Error(`Không tải được ảnh từ ${item.sourceUrl}`);
      }
      const buffer = await imgRes.arrayBuffer();

      // 2. Upload file nhị phân vào Supabase Storage bucket
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(item.fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // 3. Lấy URL công khai (Public URL) từ Supabase Storage
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(item.fileName);

      const publicUrl = publicData.publicUrl;
      console.log(`   ✅ Đã tải lên bucket: ${publicUrl}`);

      // 4. Cập nhật URL ảnh mới vào Database PostgreSQL (Bảng Product)
      await prisma.product.upsert({
        where: { id: item.id },
        update: { image: publicUrl },
        create: {
          id: item.id,
          name: item.name,
          price: 25000,
          category: 'Khác',
          image: publicUrl,
        },
      });

      console.log(`   🗄️ Đã cập nhật database cho món: ${item.name}`);
    } catch (err) {
      console.error(`   ❌ Lỗi khi xử lý ${item.name}:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 ĐÃ HOÀN TẤT ĐỔ ẢNH VÀO BUCKET Product_img VÀ ĐỒNG BỘ DATABASE!');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi chính:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

