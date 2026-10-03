import API from './api';

// Public endpoints (no auth required)
export const getPublicProjects = async () => {
    const res = await API.get('/public/projects');
    return res.data;
};

export const getPublicProjectById = async (id) => {
    const res = await API.get(`/public/projects/${id}`);
    return res.data;
};

export const searchPublicProjects = async (params) => {
    const res = await API.get('/public/projects/search', { params });
    return res.data;
};

export const getPublicStats = async () => {
    const res = await API.get('/public/stats');
    return res.data;
};

// Authenticated endpoints
export const getProjects = async () => {
    const res = await API.get('/projects');
    return res.data;
};

export const getProjectById = async (id) => {
    const res = await API.get(`/projects/${id}`);
    return res.data;
};

export const createProject = async (projectData) => {
    const res = await API.post('/projects', projectData);
    return res.data;
};

export const updateProject = async (id, projectData) => {
    const res = await API.put(`/projects/${id}`, projectData);
    return res.data;
};

export const deleteProject = async (id) => {
    const res = await API.delete(`/projects/${id}`);
    return res.data;
};

export const addProgressUpdate = async (projectId, updateData) => {
    const res = await API.post(`/projects/${projectId}/progress`, updateData);
    return res.data;
};

// Contractor Completion
export const submitProjectCompletion = async (projectId, completionData) => {
    const res = await API.post(`/projects/${projectId}/completion`, completionData);
    return res.data;
};

export const getProjectCompletion = async (projectId) => {
    const res = await API.get(`/projects/${projectId}/completion`);
    return res.data;
};

// Deletion Requests
export const requestProjectDeletion = async (projectId, reason) => {
    const res = await API.post(`/projects/${projectId}/deletion-request`, { reason });
    return res.data;
};

export const getDeletionRequests = async () => {
    const res = await API.get('/deletion-requests');
    return res.data;
};

export const approveDeletionRequest = async (id) => {
    const res = await API.put(`/deletion-requests/${id}/approve`);
    return res.data;
};

export const rejectDeletionRequest = async (id, adminResponse) => {
    const res = await API.put(`/deletion-requests/${id}/reject`, { adminResponse });
    return res.data;
};

// Image Upload
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

export const getDashboardStats = async () => {
    const res = await API.get('/dashboard/stats');
    return res.data;
};

// ─── Public Query (Citizen) API functions ───────────────────────────────────

// Public – submit a new citizen query (no auth)
export const submitPublicQuery = async (queryData) => {
    const res = await API.post('/public-queries', queryData);
    return res.data;
};

// Public – get all queries (with optional filters) or search by queryId
export const getPublicQueries = async (params = {}) => {
    const res = await API.get('/public-queries', { params });
    return res.data;
};

// Public – fetch a single query by MongoDB id or queryId string
export const getPublicQueryById = async (id) => {
    const res = await API.get(`/public-queries/${id}`);
    return res.data;
};

// Admin – update the status of a public query
export const updatePublicQueryStatus = async (id, status, adminResponse) => {
    const res = await API.put(`/public-queries/${id}/status`, { status, adminResponse });
    return res.data;
};

// Admin – save an admin response to a public query
export const respondToPublicQuery = async (id, adminResponse, status) => {
    const res = await API.put(`/public-queries/${id}/response`, { adminResponse, status });
    return res.data;
};
