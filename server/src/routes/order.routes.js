import { Router } from 'express';
import orderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', (req, res) => orderController.getAll(req, res));
router.get('/:id', (req, res) => orderController.getById(req, res));
router.post('/', (req, res) => orderController.create(req, res));

export default router;

