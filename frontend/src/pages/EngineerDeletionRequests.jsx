import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    FolderKanban,
    ArrowLeft,
    Calendar,
    Search
} from 'lucide-react';
import { getDeletionRequests } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function EngineerDeletionRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await getDeletionRequests();
            setRequests(res.data || []);
        } catch (err) {
            console.error('Failed to load deletion requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return <LoadingSpinner text="Fetching your project deletion requests..." />;

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                    <Link to="/engineer/dashboard" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineer Dashboard
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-amber-600" />
                        My Project Deletion Requests
                    </h1>
                    <p className="text-xs text-slate-500">
                        Track the status of project deletion requests submitted to the Administrator.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="custom-card p-2.5 flex items-center gap-2 w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by project name or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${filter === status ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
                <div className="custom-card p-12 text-center text-slate-500 space-y-2">
                    <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No deletion requests found.</p>
                    <p className="text-xs">You have not submitted any project deletion requests matching this filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((reqItem) => {
                        const isPending = reqItem.status === 'Pending';
                        const isApproved = reqItem.status === 'Approved';
                        const isRejected = reqItem.status === 'Rejected';

                        return (
                            <article key={reqItem._id} className="custom-card p-5 space-y-4 border-l-4 border-l-slate-400" style={{ borderLeftColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                                            {reqItem.projectName}
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Submitted on: {formatDate(reqItem.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                            {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                            {isApproved && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                            {reqItem.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your Stated Reason:</span>
                                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                        "{reqItem.reason}"
                                    </p>
                                </div>

                                {!isPending && (
                                    <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span><strong>Reviewed by:</strong> {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                            <span><strong>Reviewed on:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                        </div>
                                        {reqItem.adminResponse && (
                                            <p className="mt-1"><strong>Admin Response:</strong> {reqItem.adminResponse}</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
