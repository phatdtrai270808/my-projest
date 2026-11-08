import { Router } from 'express';
import productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', (req, res) => productController.getAll(req, res));
router.get('/:id', (req, res) => productController.getById(req, res));
router.post('/upload-image', (req, res) => productController.uploadImage(req, res));
router.post('/', (req, res) => productController.create(req, res));
router.put('/:id', (req, res) => productController.update(req, res));
router.delete('/:id', (req, res) => productController.delete(req, res));

export default router;

