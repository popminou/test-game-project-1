export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}

export const API_ROUTES = {
  health: '/api/health',
} as const;
