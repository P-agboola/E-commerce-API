export interface ApiResponseOptions<T> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export class ApiResponse<T> {
  data?: T;
  message: string;
  statusCode: number;

  constructor(options: ApiResponseOptions<T>) {
    this.data = options.data;
    this.message = options.message || 'Success';
    this.statusCode = options.statusCode || 200;
  }

  static success<T>(data?: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse<T>({
      data,
      message,
      statusCode: 200,
    });
  }

  static error(message = 'Error', statusCode = 400): ApiResponse<null> {
    return new ApiResponse<null>({
      message,
      statusCode,
    });
  }
}
