export const JWT_SECRET =
  process.env.SECRET || Math.random().toString(36).substring(2, 15);
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const ENV = process.env.NODE_ENV || 'development';
