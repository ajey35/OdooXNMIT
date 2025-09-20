import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) => {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data && { data }),
    ...(pagination && { pagination })
  };

  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  statusCode: number = 200
) => {
  return sendResponse(res, statusCode, message, data, pagination);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  return sendResponse(res, statusCode, message);
};
