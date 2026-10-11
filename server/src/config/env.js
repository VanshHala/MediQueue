import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
