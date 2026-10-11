import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'ff6469da6157fe118ba73514e409b21e1428ab110da5238347e364a8f61d8f94';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
