import axios from 'axios';

const API_BASE_URL = '/api'; // Vite proxy handles this to localhost:3000
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. The server took too long to respond.';
    } else if (error.code === 'ECONNREFUSED') {
      error.message = 'Cannot connect to the backend server. Please ensure the backend is running.';
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      switch (status) {
        case 400:
          error.message = 'Bad request. Please check your input.';
          break;
        case 401:
          error.message = 'Unauthorized. Please log in.';
          break;
        case 403:
          error.message = 'Forbidden. You do not have permission to access this resource.';
          break;
        case 404:
          error.message = 'Resource not found.';
          break;
        case 500:
          error.message = 'Internal server error. Please try again later.';
          break;
        case 502:
          error.message = 'Bad gateway. The backend service is unavailable.';
          break;
        case 503:
          error.message = 'Service unavailable. The server is temporarily down.';
          break;
        default:
          error.message = `Server error: ${status}`;
      }
    } else if (error.request) {
      // Request made but no response received
      error.message = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

export const api = {
    uploadProject: async (files, onProgress) => {
        const formData = new FormData();
        
        // Handle both single file and array of files
        if (Array.isArray(files)) {
            files.forEach(file => {
                formData.append('project', file);
            });
        } else {
            formData.append('project', files);
        }

        try {
            console.log('[API] Uploading project...');
            const response = await axiosInstance.post(`${API_BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                },
                timeout: 300000, // 5 minutes for large uploads
            });
            console.log('[API] Upload response:', response.data);
            return response.data;
        } catch (error) {
            console.error('[API] Upload project error:', error);
            throw new Error(`Failed to upload project: ${error.message}`);
        }
    },

    getProjectStatus: async (projectId) => {
        try {
            console.log(`[API] Getting status for: ${projectId}`);
            const response = await axiosInstance.get(`${API_BASE_URL}/status/${projectId}`);
            console.log('[API] Status response:', response.data);
            
            // Ensure consistent response format
            if (response.data) {
                // If status is nested in data, flatten it
                if (response.data.data) {
                    return response.data.data;
                }
                return response.data;
            }
            return response;
        } catch (error) {
            console.error('[API] Get project status error:', error);
            throw new Error(`Failed to get project status: ${error.message}`);
        }
    },

    getProjectReport: async (projectId) => {
        try {
            console.log(`[API] Getting report for: ${projectId}`);
            const response = await axiosInstance.get(`${API_BASE_URL}/report/${projectId}`);
            console.log('[API] Report response:', response.data);
            
            // Ensure consistent response format
            if (response.data) {
                if (response.data.data) {
                    return response.data.data;
                }
                return response.data;
            }
            return response;
        } catch (error) {
            console.error('[API] Get project report error:', error);
            throw new Error(`Failed to get project report: ${error.message}`);
        }
    },

    healthCheck: async () => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/health`);
            return response.data;
        } catch (error) {
            console.error('[API] Health check error:', error);
            throw new Error(`Backend health check failed: ${error.message}`);
        }
    },

    // New method to check if backend is ready
    checkBackendStatus: async () => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/health`, { timeout: 5000 });
            return { status: 'healthy', data: response.data };
        } catch (error) {
            console.error('[API] Backend status check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    },

    // New method to poll status with better error handling
    pollStatus: async (projectId, maxAttempts = 60, interval = 2000) => {
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    attempts++;
                    console.log(`[API] Polling status attempt ${attempts}/${maxAttempts}`);
                    
                    const statusData = await api.getProjectStatus(projectId);
                    console.log('[API] Poll status data:', statusData);
                    
                    // Check if completed
                    if (statusData.status === 'completed') {
                        console.log('[API] ✅ Analysis completed!');
                        resolve(statusData);
                        return;
                    }
                    
                    // Check if failed
                    if (statusData.status === 'failed') {
                        console.log('[API] ❌ Analysis failed');
                        reject(new Error(statusData.error?.message || 'Analysis failed'));
                        return;
                    }
                    
                    // If not completed and not failed, continue polling
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(new Error(`Status polling timed out after ${maxAttempts} attempts`));
                    }
                } catch (error) {
                    console.error('[API] Poll error:', error);
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(error);
                    }
                }
            };
            
            poll();
        });
    }
};

export default api;