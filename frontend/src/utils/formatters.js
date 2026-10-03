/**
 * Utility functions for currency formatting, date formatting, and status badges
 */

export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    const val = Number(amount);

    if (val >= 10000000) {
        return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
        return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const getStatusBadge = (status) => {
    switch (status) {
        case 'NOT_STARTED':
            return {
                label: 'NOT STARTED',
                bg: 'bg-slate-100 text-slate-700 border-slate-200',
                dot: 'bg-slate-500'
            };
        case 'IN_PROGRESS':
            return {
                label: 'IN PROGRESS',
                bg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                dot: 'bg-cyan-600'
            };
        case 'COMPLETED':
            return {
                label: 'COMPLETED',
                bg: 'bg-blue-100 text-blue-800 border-blue-200',
                dot: 'bg-blue-600'
            };
        case 'ON_TRACK':
            return {
                label: 'ON TRACK',
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                dot: 'bg-emerald-600'
            };
        case 'DELAYED':
            return {
                label: 'DELAYED',
                bg: 'bg-amber-100 text-amber-800 border-amber-200',
                dot: 'bg-amber-600'
            };
        case 'CRITICAL':
            return {
                label: 'CRITICAL',
                bg: 'bg-rose-100 text-rose-800 border-rose-200',
                dot: 'bg-rose-600'
            };
        default:
            return {
                label: status || 'PENDING',
                bg: 'bg-slate-100 text-slate-800 border-slate-200',
                dot: 'bg-slate-500'
            };
    }
};
