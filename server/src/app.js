import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống API` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Lỗi hệ thống nội bộ máy chủ', message: err.message });
});

export default app;

