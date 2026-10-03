import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    FolderKanban,
    User,
    ArrowLeft,
    Calendar,
    MessageSquare,
    Search
} from 'lucide-react';
import { getDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function AdminDeletionRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [rejectModal, setRejectModal] = useState(null); // request being rejected
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await getDeletionRequests();
            setRequests(res.data || []);
        } catch (err) {
            console.error('Failed to load deletion requests:', err);
            setAlertMsg({ type: 'error', text: 'Failed to load project deletion requests.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (reqItem) => {
        if (!window.confirm(`Are you sure you want to approve deletion of project "${reqItem.projectName}"? This will permanently delete the project from active records.`)) {
            return;
        }

        try {
            setActionLoading(true);
            await approveDeletionRequest(reqItem._id);
            setAlertMsg({ type: 'success', text: `Project "${reqItem.projectName}" has been permanently deleted.` });
            loadRequests();
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to approve deletion request.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectModal) return;

        try {
            setActionLoading(true);
            await rejectDeletionRequest(rejectModal._id, rejectReason);
            setAlertMsg({ type: 'success', text: `Deletion request for "${rejectModal.projectName}" has been rejected. The project remains active.` });
            setRejectModal(null);
            setRejectReason('');
            loadRequests();
        } catch (err) {
            setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reject deletion request.' });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.requestedBy?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return <LoadingSpinner text="Fetching project deletion requests..." />;

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link to="/admin/dashboard" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-rose-600" />
                        Project Deletion Requests Management
                    </h1>
                    <p className="text-xs text-slate-500">
                        Review, approve or reject project deletion requests submitted by Field Engineers.
                    </p>
                </div>
            </div>

            {/* Notification alert */}
            {alertMsg && (
                <div className={`p-4 rounded-xl text-xs flex items-center justify-between font-medium ${alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                    <span>{alertMsg.text}</span>
                    <button onClick={() => setAlertMsg(null)} className="text-xs font-bold hover:underline cursor-pointer">Dismiss</button>
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="custom-card p-2.5 flex items-center gap-2 w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by project name or engineer..."
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
                    <p className="font-bold text-slate-700">No project deletion requests found.</p>
                    <p className="text-xs">There are no requests matching the current filter.</p>
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
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-blue-600" />
                                                <strong>{reqItem.requestedBy?.name || 'Engineer'}</strong> ({reqItem.requestedByRole || 'ENGINEER'})
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {formatDate(reqItem.createdAt)}
                                            </span>
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

                                {/* Reason */}
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Deletion Reason Given:</span>
                                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                        "{reqItem.reason}"
                                    </p>
                                </div>

                                {/* Review details if reviewed */}
                                {!isPending && (
                                    <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span><strong>Reviewed by:</strong> {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                            <span><strong>Reviewed date:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                        </div>
                                        {reqItem.adminResponse && (
                                            <p className="mt-1"><strong>Admin Remarks:</strong> {reqItem.adminResponse}</p>
                                        )}
                                    </div>
                                )}

                                {/* Pending Action Buttons */}
                                {isPending && (
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setRejectModal(reqItem)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject Request
                                        </button>
                                        <button
                                            onClick={() => handleApprove(reqItem)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" /> Approve & Delete Project
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleRejectSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-600" /> Reject Deletion Request
                            </h2>
                            <button type="button" onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
                        </div>

                        <p className="text-slate-600">
                            You are rejecting the deletion request for <strong>{rejectModal.projectName}</strong>. The project will remain active.
                        </p>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Optional Admin Response / Reason for Rejection:</label>
                            <textarea
                                rows="3"
                                placeholder="e.g. Work is still underway under phase 2; project cannot be deleted."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}
