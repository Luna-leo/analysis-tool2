interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private token: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
    // APIが同じオリジンにある場合は相対パスを使用
    if (typeof window !== 'undefined' && !this.baseUrl) {
      this.baseUrl = '';
    }
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string | null): void {
    this.token = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  private async fetchWithRetry(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const {
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
      headers = {},
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const finalHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: finalHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Failed to fetch');
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    if (!response.ok) {
      return {
        error: {
          message: data?.message || `HTTP ${response.status}: ${response.statusText}`,
          code: data?.code,
          details: data?.details,
        },
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  }

  async get<T = any>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'GET',
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        status: 0,
      };
    }
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        status: 0,
      };
    }
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        status: 0,
      };
    }
  }

  async delete<T = any>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'DELETE',
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        status: 0,
      };
    }
  }

  // ファイルアップロード用
  async uploadFile<T = any>(
    endpoint: string,
    file: File | Blob,
    additionalData?: Record<string, any>,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const formData = new FormData();
    
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        method: 'POST',
        body: formData,
        headers: {
          ...options?.headers,
          // Content-Typeは自動設定されるため削除
          'Content-Type': undefined as any,
        },
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        status: 0,
      };
    }
  }

  // ストリーミングレスポンス用
  async *stream<T = any>(
    endpoint: string,
    options?: FetchOptions
  ): AsyncGenerator<T, void, unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              yield data as T;
            } catch (e) {
              console.error('Failed to parse streaming data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// シングルトンインスタンス
export const apiClient = new ApiClient();