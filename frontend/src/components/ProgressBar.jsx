import React from 'react';

export default function ProgressBar({ progress, showDetails = true, size = 'md' }) {
    const percent = Math.min(100, Math.max(0, Number(progress) || 0));
    const remaining = 100 - percent;

    const heightClass = size === 'lg' ? 'h-4' : size === 'sm' ? 'h-2' : 'h-3';

    // Dynamic bar color based on progress
    const getBarColor = (val) => {
        if (val >= 100) return 'bg-blue-600';
        if (val >= 70) return 'bg-emerald-600';
        if (val >= 40) return 'bg-emerald-500';
        return 'bg-amber-500';
    };

    return (
        <div className="space-y-1.5 w-full">
            <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
                <div
                    className={`${getBarColor(percent)} h-full rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            {showDetails && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                    <span className="text-emerald-700 font-semibold">{percent}% Completed</span>
                    <span className="text-slate-400">{remaining}% Remaining</span>
                </div>
            )}
        </div>
    );
}
