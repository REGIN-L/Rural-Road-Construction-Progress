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
    Search,
    Edit3
} from 'lucide-react';
import { getDeletionRequests, getEditRequests } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function EngineerDeletionRequests() {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'edit' | 'deletion'
    const [deletionRequests, setDeletionRequests] = useState([]);
    const [editRequests, setEditRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const loadRequests = async () => {
        try {
            setLoading(true);
            const [delRes, editRes] = await Promise.all([
                getDeletionRequests().catch(() => ({ data: [] })),
                getEditRequests().catch(() => ({ data: [] }))
            ]);
            setDeletionRequests(delRes.data || []);
            setEditRequests(editRes.data || []);
        } catch (err) {
            console.error('Failed to load change requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredDel = deletionRequests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const filteredEdit = editRequests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.projectCode || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return <LoadingSpinner text="Fetching your project change requests..." />;

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                    <Link to="/engineer/dashboard" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineer Dashboard
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        My Project Change Requests
                    </h1>
                    <p className="text-xs text-slate-500">
                        Track the status and Admin decision for Edit and Deletion requests you submitted.
                    </p>
                </div>
            </div>

            {/* Filter & Subtabs Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All ({filteredEdit.length + filteredDel.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'edit' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Requests ({filteredEdit.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('deletion')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'deletion' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Deletion Requests ({filteredDel.length})
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="custom-card p-2 flex items-center gap-2 flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search requests..."
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
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    filter === status ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {/* EDIT REQUESTS */}
                {(activeTab === 'all' || activeTab === 'edit') && filteredEdit.map((reqItem) => {
                    const isPending = reqItem.status === 'Pending';
                    const isApproved = reqItem.status === 'Approved';
                    const isRejected = reqItem.status === 'Rejected';

                    return (
                        <article
                            key={reqItem._id}
                            className="custom-card p-5 space-y-4 border-l-4"
                            style={{ borderLeftColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444' }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                                            {reqItem.projectCode || reqItem.projectId?.projectId || 'PROJECT'}
                                        </span>
                                        <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                                            {reqItem.projectName}
                                        </h2>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold uppercase">
                                            Edit Request
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Submitted: {formatDate(reqItem.createdAt)}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}>
                                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                        {isApproved && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                        {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                        {reqItem.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your Stated Reason:</span>
                                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                    "{reqItem.reason}"
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Proposed Field Changes:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                    {reqItem.requestedChanges && Object.entries(reqItem.requestedChanges).map(([k, v]) => (
                                        <div key={k} className="p-2 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px]">
                                            <span className="text-slate-400 capitalize block">{k}:</span>
                                            <strong className="text-slate-800">{String(v)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!isPending && (
                                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span><strong>Reviewed by:</strong> {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                        <span><strong>Reviewed on:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                    </div>
                                    {reqItem.adminComment && (
                                        <p className="mt-1"><strong>Admin Comment:</strong> {reqItem.adminComment}</p>
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}

                {/* DELETION REQUESTS */}
                {(activeTab === 'all' || activeTab === 'deletion') && filteredDel.map((reqItem) => {
                    const isPending = reqItem.status === 'Pending';
                    const isApproved = reqItem.status === 'Approved';
                    const isRejected = reqItem.status === 'Rejected';

                    return (
                        <article
                            key={reqItem._id}
                            className="custom-card p-5 space-y-4 border-l-4"
                            style={{ borderLeftColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444' }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                                            {reqItem.projectName}
                                        </h2>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold uppercase">
                                            Deletion Request
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Submitted: {formatDate(reqItem.createdAt)}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        isPending ? 'bg-amber-50 text-amber-800 border border-amber-200' : isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}>
                                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                        {isApproved && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                        {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                        {reqItem.status.toUpperCase()}
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

                {filteredEdit.length === 0 && filteredDel.length === 0 && (
                    <div className="custom-card p-12 text-center text-slate-500 space-y-2">
                        <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No change requests found.</p>
                        <p className="text-xs">You have no requests matching this filter.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
