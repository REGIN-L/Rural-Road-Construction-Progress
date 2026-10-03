import API from './api';

export const getExpenses = async () => {
    const res = await API.get('/expenses');
    return res.data;
};

export const createExpense = async (expenseData) => {
    const res = await API.post('/expenses', expenseData);
    return res.data;
};

export const getProjectExpenses = async (projectId) => {
    const res = await API.get(`/expenses/project/${projectId}`);
    return res.data;
};

export const deleteExpense = async (id) => {
    const res = await API.delete(`/expenses/${id}`);
    return res.data;
};
