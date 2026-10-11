import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { query } from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please log in.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }

    // Fetch user from database to ensure fresh state and role
    const { rows } = await query(
      `SELECT id, name, email, phone, age, gender, blood_group, role,
              latitude, longitude, city, is_donor, last_donation_date, created_at
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
};
