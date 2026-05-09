import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token and Language to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('agrisen_token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    const lang = localStorage.getItem('agrisen_lang') || 'en'
    config.headers['Accept-Language'] = lang

    return config
})

// Handle 401 unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('agrisen_token')
            localStorage.removeItem('agrisen_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp', data)
export const resendOtp = (data) => api.post('/auth/resend-otp', data)
export const googleAuth = (data) => api.post('/auth/google', data)
export const logoutUser = () => api.post('/auth/logout')

// Prediction
export const predict = (data) => api.post('/predict', data)
export const predictRegion = (data) => api.post('/predict_region', data)
export const predictFertilizer = (data) => api.post('/api/predict/fertilizer', data)

// History
export const getHistory = () => api.get('/history')

// Regions
export const getRegions = () => api.get('/regions')

// AI Chatbot
export const sendChatMessage = (data) => api.post('/api/ai/chat', data)

export default api
