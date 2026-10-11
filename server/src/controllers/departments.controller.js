import { query } from '../config/db.js';
import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters')
});

// GET /api/departments
export const getDepartments = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT d.id, d.name, COUNT(doc.id)::int AS doctor_count
      FROM departments d
      LEFT JOIN doctors doc ON d.id = doc.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
    `);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/departments (admin)
export const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { rows } = await query(
      `INSERT INTO departments (name) VALUES ($1) RETURNING id, name`,
      [name.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists.'
      });
    }
    next(error);
  }
};

// DELETE /api/departments/:id (admin)
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await query(`DELETE FROM departments WHERE id = $1`, [id]);

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
