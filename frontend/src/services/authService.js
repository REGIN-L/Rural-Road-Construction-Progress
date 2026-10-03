import API from './api';

export const loginUser = async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
        localStorage.setItem('ruralconnect_token', response.data.token);
        localStorage.setItem('ruralconnect_user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const registerUser = async (userData) => {
    const { adminSetupKey, ...registrationData } = userData;
    const response = await API.post('/auth/register', registrationData, {
        headers: adminSetupKey ? { 'x-admin-setup-key': adminSetupKey } : undefined
    });
    if (response.data.token) {
        localStorage.setItem('ruralconnect_token', response.data.token);
        localStorage.setItem('ruralconnect_user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('ruralconnect_token');
    localStorage.removeItem('ruralconnect_user');
};

export const getMe = async () => {
    const response = await API.get('/auth/me');
    return response.data;
};
