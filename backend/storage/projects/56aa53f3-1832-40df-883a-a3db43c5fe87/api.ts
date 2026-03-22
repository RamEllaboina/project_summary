import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  signup: (userData: {
    name: string
    email: string
    password: string
    phone: string
    referralCode?: string
  }) => api.post('/auth/signup', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: { name?: string; phone?: string }) =>
    api.put('/auth/profile', userData),
}

export const paymentApi = {
  createOrder: (data: { amount: number; description?: string }) =>
    api.post('/payment/create-order', data),
  
  verifyPayment: (data: { orderId: string; paymentId: string; signature: string }) =>
    api.post('/payment/verify', data),
  
  getTransactions: (params?: {
    page?: number
    limit?: number
    status?: string
  }) => api.get('/payment/transactions', { params }),
  
  getTransactionDetails: (transactionId: string) =>
    api.get(`/payment/transactions/${transactionId}`),
  
  getStats: () => api.get('/payment/stats'),
}

export const referralApi = {
  getInfo: () => api.get('/referral/info'),
  
  getStats: () => api.get('/referral/stats'),
  
  validateCode: (referralCode: string) =>
    api.get(`/referral/validate/${referralCode}`),
}

export const userApi = {
  getDashboard: () => api.get('/user/dashboard'),
  
  getWalletBalance: () => api.get('/user/wallet/balance'),
  
  getWalletHistory: (params?: {
    page?: number
    limit?: number
    type?: string
    category?: string
  }) => api.get('/user/wallet/history', { params }),
  
  requestWithdrawal: (data: {
    amount: number
    bankDetails: {
      accountNumber: string
      ifscCode: string
      accountHolder: string
    }
  }) => api.post('/user/withdrawal/request', data),
  
  getEarningsReport: (params?: {
    startDate?: string
    endDate?: string
    groupBy?: string
  }) => api.get('/user/earnings/report', { params }),
}

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }) => api.get('/admin/users', { params }),
  
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  
  toggleUserStatus: (userId: string, isActive: boolean) =>
    api.put(`/admin/users/${userId}/status`, { isActive }),
  
  getTransactions: (params?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/admin/transactions', { params }),
  
  getReferrals: (params?: {
    page?: number
    limit?: number
    status?: string
    referrerId?: string
    startDate?: string
    endDate?: string
  }) => api.get('/admin/referrals', { params }),
  
  markReferralAsFraud: (referralId: string, reason: string) =>
    api.put(`/admin/referrals/${referralId}/fraud`, { reason }),
  
  getSystemLogs: (params?: {
    page?: number
    limit?: number
    level?: string
    startDate?: string
    endDate?: string
  }) => api.get('/admin/logs', { params }),
}

export default api
