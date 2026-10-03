import React from 'react';
import { getStatusBadge } from '../utils/formatters';

export default function StatusBadge({ status }) {
    const badge = getStatusBadge(status);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
        </span>
    );
}
