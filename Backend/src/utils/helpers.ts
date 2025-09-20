import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const generateRefreshToken = (payload: { id: string; email: string; role: string }): string => {
  const secret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const generateOrderNumber = (prefix: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export const calculateTax = (amount: number, taxRate: number, method: 'PERCENTAGE' | 'FIXED_VALUE'): number => {
  if (method === 'PERCENTAGE') {
    return (amount * taxRate) / 100;
  }
  return taxRate;
};

export const calculateTotal = (subtotal: number, taxAmount: number): number => {
  return subtotal + taxAmount;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const generatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    offset,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};
