import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Coffee POS Backend (MVC 3-Tier) is running!`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database: Supabase PostgreSQL via Prisma`);
  console.log('====================================================');
});
