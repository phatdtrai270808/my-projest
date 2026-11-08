import { Router } from 'express';
import tableRoutes from './table.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import staffRoutes from './staff.routes.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Health Check API
router.get('/health', async (req, res) => {
  try {
    const [tableCount, productCount, orderCount] = await Promise.all([
      prisma.table.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    res.json({
      status: 'OK',
      architecture: 'MVC 3-Tier (Routes - Controllers - Services)',
      database: 'Supabase PostgreSQL via Prisma ORM',
      stats: {
        tables: tableCount,
        products: productCount,
        orders: orderCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Gắn các module route
router.use('/tables', tableRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/staff', staffRoutes);

export default router;

