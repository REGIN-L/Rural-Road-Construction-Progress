import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor to attach JWT token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ruralconnect_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle authentication errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear invalid session if unauthenticated on protected route
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/admin') || currentPath.startsWith('/engineer') || currentPath.startsWith('/contractor')) {
                localStorage.removeItem('ruralconnect_token');
                localStorage.removeItem('ruralconnect_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
