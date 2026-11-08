import staffService from '../services/staff.service.js';

export class StaffController {
  // GET /api/staff
  async getAll(req, res) {
    try {
      const staffList = await staffService.getAllStaff();
      res.json(staffList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/staff
  async create(req, res) {
    try {
      const { name, role, wagePerHour } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Tên nhân viên là bắt buộc' });
      }
      const newStaff = await staffService.createStaff({ name, role, wagePerHour });
      res.status(201).json(newStaff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/staff/shifts
  async getShiftLogs(req, res) {
    try {
      const logs = await staffService.getAllShiftLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/staff/shifts
  async createShiftLog(req, res) {
    try {
      const { staffId, shiftType, hours, tips } = req.body;
      if (!staffId) {
        return res.status(400).json({ error: 'Chưa chọn nhân viên làm ca' });
      }
      const newLog = await staffService.createShiftLog({ staffId, shiftType, hours, tips });
      res.status(201).json(newLog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new StaffController();

