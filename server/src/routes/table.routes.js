import { Router } from 'express';
import tableController from '../controllers/table.controller.js';

const router = Router();

router.get('/', (req, res) => tableController.getAll(req, res));
router.get('/:id', (req, res) => tableController.getById(req, res));
router.post('/', (req, res) => tableController.create(req, res));
router.put('/:id', (req, res) => tableController.update(req, res));
router.post('/merge', (req, res) => tableController.mergeTables(req, res));
router.delete('/:id', (req, res) => tableController.delete(req, res));

export default router;

