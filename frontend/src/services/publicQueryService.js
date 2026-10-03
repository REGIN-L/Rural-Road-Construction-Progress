import API from './api';

// Submit query (Public)
export const createPublicQuery = async (queryData) => {
    const res = await API.post('/public-queries', queryData);
    return res.data;
};

// Get queries (Admin sees all; Public tracks by queryId)
export const getPublicQueries = async (params) => {
    const res = await API.get('/public-queries', { params });
    return res.data;
};

// Get single query by ID / queryId
export const getPublicQueryById = async (id) => {
    const res = await API.get(`/public-queries/${id}`);
    return res.data;
};

// Admin status update
export const updatePublicQueryStatus = async (id, status, adminResponse) => {
    const res = await API.put(`/public-queries/${id}/status`, { status, adminResponse });
    return res.data;
};

// Admin response
export const respondToPublicQuery = async (id, adminResponse, status) => {
    const res = await API.put(`/public-queries/${id}/response`, { adminResponse, status });
    return res.data;
};
