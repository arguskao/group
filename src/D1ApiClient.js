/**
 * D1ApiClient - Client for interacting with the Cloudflare Worker API
 * Provides methods for creating, retrieving, and exporting survey responses
 */
export class D1ApiClient {
  /**
   * Create a new D1ApiClient instance
   * @param {string} baseUrl - The base URL of the API (e.g., 'https://api.example.com')
   * @param {Object} options - Configuration options
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.retryDelay - Delay between retries in milliseconds (default: 1000)
   * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
   */
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;
  }

  /**
   * Make an HTTP request with retry logic
   * @private
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async _fetchWithRetry(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Don't retry on client errors (4xx), only on server errors (5xx) or network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        // Server error - retry
        lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
      } catch (error) {
        lastError = error;

        // Don't retry on abort (timeout)
        if (error.name === 'AbortError') {
          throw new Error(`請求超時（${this.timeout}ms）`);
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < this.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
      }
    }

    // All retries failed
    throw new Error(`請求失敗，已重試 ${this.maxRetries} 次: ${lastError.message}`);
  }

  /**
   * Create a new response record
   * @param {{name: string, phone: string, region: string, occupation: string, timestamp: string}} data
   * @returns {Promise<{success: boolean, id?: number, error?: string, details?: Array}>}
   */
  async createResponse(data) {
    try {
      const response = await this._fetchWithRetry('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '提交失敗',
          details: result.details || [],
        };
      }

      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      console.error('createResponse error:', error);
      return {
        success: false,
        error: `網路錯誤: ${error.message}`,
      };
    }
  }

  /**
   * Get all response records
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getAllResponses() {
    try {
      const response = await this._fetchWithRetry('/api/responses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '取得資料失敗',
        };
      }

      return {
        success: true,
        data: result.data,
        count: result.count,
      };
    } catch (error) {
      console.error('getAllResponses error:', error);
      return {
        success: false,
        error: `網路錯誤: ${error.message}`,
      };
    }
  }

  /**
   * Export CSV file with password authentication
   * @param {string} password - Admin password for authentication
   * @returns {Promise<{success: boolean, blob?: Blob, filename?: string, error?: string}>}
   */
  async exportCSV(password) {
    try {
      const url = `${this.baseUrl}/api/export?password=${encodeURIComponent(password)}`;
      
      const response = await this._fetchWithRetry(`/api/export?password=${encodeURIComponent(password)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        // Try to parse JSON error response
        try {
          const result = await response.json();
          return {
            success: false,
            error: result.message || result.error || '匯出失敗',
          };
        } catch {
          return {
            success: false,
            error: `匯出失敗: ${response.status} ${response.statusText}`,
          };
        }
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'survey-responses.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get blob data
      const blob = await response.blob();

      return {
        success: true,
        blob,
        filename,
      };
    } catch (error) {
      console.error('exportCSV error:', error);
      return {
        success: false,
        error: `網路錯誤: ${error.message}`,
      };
    }
  }

  /**
   * Download CSV file to user's computer
   * @param {string} password - Admin password for authentication
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async downloadCSV(password) {
    const result = await this.exportCSV(password);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    try {
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
      };
    } catch (error) {
      console.error('downloadCSV error:', error);
      return {
        success: false,
        error: `下載失敗: ${error.message}`,
      };
    }
  }
}
