import { Router } from 'express';
import staffController from '../controllers/staff.controller.js';

const router = Router();

router.get('/', (req, res) => staffController.getAll(req, res));
router.post('/', (req, res) => staffController.create(req, res));
router.get('/shifts', (req, res) => staffController.getShiftLogs(req, res));
router.post('/shifts', (req, res) => staffController.createShiftLog(req, res));

export default router;

