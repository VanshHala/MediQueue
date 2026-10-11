import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

// Zod schemas for validation
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  age: z.coerce.number().int().min(1, 'Age must be greater than 0').max(125, 'Invalid age'),
  gender: z.string().optional().default('Not Specified'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  role: z.enum(['patient', 'doctor', 'receptionist', 'admin']).optional().default('patient'),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  city: z.string().optional().nullable().default('Ahmedabad'),
  is_donor: z.boolean().optional().default(false),
  last_donation_date: z.string().optional().nullable()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  age: z.coerce.number().int().min(1).max(125).optional(),
  gender: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  city: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  is_donor: z.boolean().optional(),
  last_donation_date: z.string().optional().nullable()
});

// Generate JWT token helper
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      age,
      gender,
      blood_group,
      role = 'patient',
      latitude = null,
      longitude = null,
      city = 'Ahmedabad',
      is_donor = false,
      last_donation_date = null
    } = req.body;

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into PostgreSQL
    const insertQuery = `
      INSERT INTO users (
        name, email, password_hash, phone, age, gender, blood_group,
        role, latitude, longitude, city, is_donor, last_donation_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, email, phone, age, gender, blood_group, role,
                latitude, longitude, city, is_donor, last_donation_date, created_at
    `;

    const { rows } = await query(insertQuery, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      phone.trim(),
      age,
      gender,
      blood_group,
      role,
      latitude,
      longitude,
      city,
      is_donor,
      last_donation_date || null
    ]);

    const user = rows[0];
    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user by email
    const { rows } = await query(
      `SELECT id, name, email, password_hash, phone, age, gender, blood_group,
              role, latitude, longitude, city, is_donor, last_donation_date, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Strip password hash from returned object
    delete user.password_hash;

    // Check if user is a doctor and attach doctor details (e.g., room_no, department_id, doctor_id)
    if (user.role === 'doctor') {
      const docRes = await query(
        `SELECT d.id AS doctor_id, d.room_no, d.avg_consult_minutes, d.shift_start, d.shift_end, d.status,
                dep.name AS department_name
         FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.user_id = $1`,
        [user.id]
      );
      if (docRes.rows.length > 0) {
        user.doctor_details = docRes.rows[0];
      }
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = { ...req.user };

    // Attach doctor details if applicable
    if (user.role === 'doctor') {
      const docRes = await query(
        `SELECT d.id AS doctor_id, d.room_no, d.avg_consult_minutes, d.shift_start, d.shift_end, d.status,
                dep.name AS department_name, dep.id AS department_id
         FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.user_id = $1`,
        [user.id]
      );
      if (docRes.rows.length > 0) {
        user.doctor_details = docRes.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name = req.user.name,
      phone = req.user.phone,
      age = req.user.age,
      gender = req.user.gender,
      blood_group = req.user.blood_group,
      city = req.user.city,
      latitude = req.user.latitude,
      longitude = req.user.longitude,
      is_donor = req.user.is_donor,
      last_donation_date = req.user.last_donation_date
    } = req.body;

    const { rows } = await query(
      `UPDATE users
       SET name = $1, phone = $2, age = $3, gender = $4, blood_group = $5,
           city = $6, latitude = $7, longitude = $8, is_donor = $9, last_donation_date = $10
       WHERE id = $11
       RETURNING id, name, email, phone, age, gender, blood_group, role,
                 latitude, longitude, city, is_donor, last_donation_date, created_at`,
      [name, phone, age, gender, blood_group, city, latitude, longitude, is_donor, last_donation_date || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
