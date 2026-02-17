import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ApiResponse {
  private static createResponse<T>(
    success: boolean,
    message: string,
    data?: T,
    statusCode: number = 200,
    errors?: string[],
    meta?: any
  ): ApiResponseData<T> {
    return {
      success,
      message,
      data,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };
  }

  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Operation successful',
    statusCode: number = 200,
    meta?: any
  ): void {
    const response = this.createResponse(true, message, data, statusCode, undefined, meta);
    res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully',
    meta?: any
  ): void {
    this.success(res, data, message, 201, meta);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errors?: string[]
  ): void {
    const response = this.createResponse(false, message, undefined, 400, errors);
    res.status(400).json(response);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): void {
    const response = this.createResponse(false, message, undefined, 401);
    res.status(401).json(response);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): void {
    const response = this.createResponse(false, message, undefined, 403);
    res.status(403).json(response);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    const response = this.createResponse(false, message, undefined, 404);
    res.status(404).json(response);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    errors?: string[]
  ): void {
    const response = this.createResponse(false, message, undefined, 409, errors);
    res.status(409).json(response);
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors?: any[]
  ): void {
    const response = this.createResponse(false, message, undefined, 422, errors);
    res.status(422).json(response);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests'
  ): void {
    const response = this.createResponse(false, message, undefined, 429);
    res.status(429).json(response);
  }

  static internalError(
    res: Response,
    message: string = 'Internal server error',
    errors?: string[]
  ): void {
    const response = this.createResponse(false, message, undefined, 500, errors);
    res.status(500).json(response);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service unavailable'
  ): void {
    const response = this.createResponse(false, message, undefined, 503);
    res.status(503).json(response);
  }

  static withPagination<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Data retrieved successfully'
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    this.success(res, data, message, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  }
}
