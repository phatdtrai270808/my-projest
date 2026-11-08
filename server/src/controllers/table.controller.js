import tableService from '../services/table.service.js';

export class TableController {
  // GET /api/tables
  async getAll(req, res) {
    try {
      const tables = await tableService.getAllTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/tables/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const table = await tableService.getTableById(id);
      if (!table) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin bàn' });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/tables
  async create(req, res) {
    try {
      const { name, area } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Tên bàn không được để trống' });
      }
      const newTable = await tableService.createTable({ name, area });
      res.status(201).json(newTable);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/tables/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await tableService.updateTable(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/tables/merge - Gộp nhiều bàn thành một nhóm
  async mergeTables(req, res) {
    try {
      const { tableIds, groupId } = req.body;
      if (!Array.isArray(tableIds) || tableIds.length === 0) {
        return res.status(400).json({ error: 'Danh sách bàn cần gộp không hợp lệ' });
      }
      await tableService.updateManyTables(tableIds, { groupId, occupied: true });
      res.json({ success: true, message: 'Đã gộp các bàn thành công', groupId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/tables/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      await tableService.deleteTable(id);
      res.json({ success: true, message: 'Đã xóa bàn thành công' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TableController();

