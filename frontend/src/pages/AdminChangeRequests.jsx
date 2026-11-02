import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    XCircle,
    Trash2,
    Edit3,
    ArrowLeft,
    Calendar,
    User,
    Eye,
    AlertTriangle,
    Search,
    FolderKanban,
    Check,
    X,
    ArrowRight
} from 'lucide-react';
import {
    getEditRequests,
    approveEditRequest,
    rejectEditRequest,
    getDeletionRequests,
    approveDeletionRequest,
    rejectDeletionRequest
} from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function AdminChangeRequests() {
    const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'deletion'
    const [statusFilter, setStatusFilter] = useState('Pending'); // 'All' | 'Pending' | 'Approved' | 'Rejected'
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [editRequests, setEditRequests] = useState([]);
    const [deletionRequests, setDeletionRequests] = useState([]);

    // Modal state for Edit Request Review
    const [viewEditModal, setViewEditModal] = useState(null);
    const [adminComment, setAdminComment] = useState('');

    // Modal state for Deletion Request Review
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
    const [rejectDeleteModal, setRejectDeleteModal] = useState(null);
    const [rejectDeleteReason, setRejectDeleteReason] = useState('');

    const [actionLoading, setActionLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [editRes, delRes] = await Promise.all([
                getEditRequests().catch(() => ({ data: [] })),
                getDeletionRequests().catch(() => ({ data: [] }))
            ]);
            setEditRequests(editRes.data || []);
            setDeletionRequests(delRes.data || []);
        } catch (err) {
            console.error(err);
            setAlertMsg({ type: 'error', text: 'Failed to load project change requests.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter logic
    const filteredEditRequests = editRequests.filter(r => {
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.projectCode || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.requestedBy?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const filteredDeletionRequests = deletionRequests.filter(r => {
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        const matchesSearch =
            (r.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.requestedBy?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Counts
    const pendingEditCount = editRequests.filter(r => r.status === 'Pending').length;
    const pendingDelCount = deletionRequests.filter(r => r.status === 'Pending').length;

    // Approve Edit Request
    const handleApproveEdit = async (reqItem) => {
        try {
            setActionLoading(true);
            await approveEditRequest(reqItem._id, adminComment);
            setAlertMsg({
                type: 'success',
                text: `Edit request for "${reqItem.projectName}" approved! The actual Project in MongoDB has been updated.`
            });
            setViewEditModal(null);
            setAdminComment('');
            loadData();
        } catch (err) {
            setAlertMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to approve edit request.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Reject Edit Request
    const handleRejectEdit = async (reqItem) => {
        try {
            setActionLoading(true);
            await rejectEditRequest(reqItem._id, adminComment);
            setAlertMsg({
                type: 'success',
                text: `Edit request for "${reqItem.projectName}" has been rejected. Project remains unchanged.`
            });
            setViewEditModal(null);
            setAdminComment('');
            loadData();
        } catch (err) {
            setAlertMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to reject edit request.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Approve Deletion Request
    const handleConfirmApproveDelete = async () => {
        if (!deleteConfirmModal) return;
        try {
            setActionLoading(true);
            await approveDeletionRequest(deleteConfirmModal._id);
            setAlertMsg({
                type: 'success',
                text: `Project "${deleteConfirmModal.projectName}" has been permanently deleted from MongoDB.`
            });
            setDeleteConfirmModal(null);
            loadData();
        } catch (err) {
            setAlertMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to approve project deletion.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Reject Deletion Request
    const handleConfirmRejectDelete = async (e) => {
        e.preventDefault();
        if (!rejectDeleteModal) return;
        try {
            setActionLoading(true);
            await rejectDeletionRequest(rejectDeleteModal._id, rejectDeleteReason);
            setAlertMsg({
                type: 'success',
                text: `Deletion request for "${rejectDeleteModal.projectName}" has been rejected. Project remains active.`
            });
            setRejectDeleteModal(null);
            setRejectDeleteReason('');
            loadData();
        } catch (err) {
            setAlertMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to reject deletion request.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <LoadingSpinner text="Fetching project change requests for Admin approval..." />;

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link to="/admin/dashboard" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Project Change Requests
                    </h1>
                    <p className="text-xs text-slate-500">
                        Review, inspect differences, approve or reject project modifications and deletion requests submitted by Field Engineers.
                    </p>
                </div>
            </div>

            {/* Notification alert */}
            {alertMsg && (
                <div className={`p-4 rounded-xl text-xs flex items-center justify-between font-medium ${
                    alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    <span>{alertMsg.text}</span>
                    <button onClick={() => setAlertMsg(null)} className="text-xs font-bold hover:underline cursor-pointer">Dismiss</button>
                </div>
            )}

            {/* Tabs Bar: Edit Requests & Deletion Requests */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            activeTab === 'edit'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Requests</span>
                        {pendingEditCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'edit' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {pendingEditCount} pending
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('deletion')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            activeTab === 'deletion'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Deletion Requests</span>
                        {pendingDelCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'deletion' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'}`}>
                                {pendingDelCount} pending
                            </span>
                        )}
                    </button>
                </div>

                {/* Status Badges Filter */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                                statusFilter === status ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="custom-card p-3 flex items-center gap-2 w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'edit' ? 'edit' : 'deletion'} requests by project or engineer...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                />
            </div>

            {/* ========================================== */}
            {/* 1. EDIT REQUESTS LIST                      */}
            {/* ========================================== */}
            {activeTab === 'edit' && (
                <div className="space-y-4">
                    {filteredEditRequests.length === 0 ? (
                        <div className="custom-card p-12 text-center text-slate-500 space-y-2">
                            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-bold text-slate-700">No project edit requests found.</p>
                            <p className="text-xs">There are no edit requests matching the current status filter.</p>
                        </div>
                    ) : (
                        filteredEditRequests.map((reqItem) => {
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
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                    Submitted by: <strong>{reqItem.requestedBy?.name || 'Engineer'}</strong>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatDate(reqItem.createdAt)}
                                                </span>
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

                                    {/* Reason */}
                                    <div className="text-xs">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Engineer's Reason for Edit:</span>
                                        <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 italic">
                                            "{reqItem.reason}"
                                        </p>
                                    </div>

                                    {/* Summary of proposed changes */}
                                    <div className="text-xs space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Proposed Changes:</span>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {reqItem.requestedChanges && Object.entries(reqItem.requestedChanges).map(([k, v]) => (
                                                <span key={k} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded-lg font-mono text-[11px]">
                                                    <strong className="capitalize">{k}:</strong> {String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reviewed Audit Details */}
                                    {!isPending && (
                                        <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span><strong>Decision:</strong> <strong className={isApproved ? 'text-emerald-700' : 'text-rose-700'}>{reqItem.status}</strong> by {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                                <span><strong>Reviewed Date:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                            </div>
                                            {reqItem.adminComment && (
                                                <p className="text-slate-700 mt-1"><strong>Admin Comment:</strong> "{reqItem.adminComment}"</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setViewEditModal(reqItem);
                                                setAdminComment(reqItem.adminComment || '');
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
                                        >
                                            <Eye className="w-4 h-4" /> {isPending ? 'Inspect & Review Changes' : 'View Proposed Values'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* 2. DELETION REQUESTS LIST                  */}
            {/* ========================================== */}
            {activeTab === 'deletion' && (
                <div className="space-y-4">
                    {filteredDeletionRequests.length === 0 ? (
                        <div className="custom-card p-12 text-center text-slate-500 space-y-2">
                            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-bold text-slate-700">No project deletion requests found.</p>
                            <p className="text-xs">There are no deletion requests matching the current status filter.</p>
                        </div>
                    ) : (
                        filteredDeletionRequests.map((reqItem) => {
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

                                    {/* Reason */}
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Deletion Reason Given:</span>
                                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                                            "{reqItem.reason}"
                                        </p>
                                    </div>

                                    {/* Reviewed audit info */}
                                    {!isPending && (
                                        <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span><strong>Decision:</strong> <strong className={isApproved ? 'text-emerald-700' : 'text-rose-700'}>{reqItem.status}</strong> by {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                                <span><strong>Reviewed Date:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                            </div>
                                            {reqItem.adminResponse && (
                                                <p className="mt-1"><strong>Admin Remarks:</strong> "{reqItem.adminResponse}"</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Pending Actions */}
                                    {isPending && (
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setRejectDeleteModal(reqItem);
                                                    setRejectDeleteReason('');
                                                }}
                                                disabled={actionLoading}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject Request
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmModal(reqItem)}
                                                disabled={actionLoading}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" /> Approve & Delete Project
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: View Proposed Changes & Approve/Reject Edit Request                */}
            {/* Shows Current Values vs Proposed Values, clearly indicating what changes */}
            {/* ========================================================================= */}
            {viewEditModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-amber-600" />
                                    Review Proposed Changes: {viewEditModal.projectName}
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Requested by <strong>{viewEditModal.requestedBy?.name}</strong> on {formatDate(viewEditModal.createdAt)}
                                </p>
                            </div>
                            <button type="button" onClick={() => setViewEditModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Stated Reason */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                            <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">Engineer's Stated Reason:</span>
                            <p className="mt-0.5 italic">"{viewEditModal.reason}"</p>
                        </div>

                        {/* Comparison Table: Current vs Proposed */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-900 text-xs">Side-by-Side Comparison of Changes</h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                            <th className="p-3">Field</th>
                                            <th className="p-3">Current Project Value</th>
                                            <th className="p-3">Proposed Value</th>
                                            <th className="p-3 text-center">Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {viewEditModal.requestedChanges && Object.entries(viewEditModal.requestedChanges).map(([field, proposedVal]) => {
                                            const currentVal = viewEditModal.projectId ? viewEditModal.projectId[field] : undefined;
                                            const isChanged = String(currentVal ?? '') !== String(proposedVal ?? '');

                                            return (
                                                <tr key={field} className={isChanged ? 'bg-amber-50/40' : ''}>
                                                    <td className="p-3 font-semibold text-slate-800 capitalize font-mono">
                                                        {field}
                                                    </td>
                                                    <td className="p-3 text-slate-600">
                                                        {currentVal !== undefined ? String(currentVal) : <span className="text-slate-400 italic">Not set</span>}
                                                    </td>
                                                    <td className="p-3 font-bold text-amber-900">
                                                        {String(proposedVal)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {isChanged ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                Modified
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                                                Unchanged
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Admin comment input */}
                        {viewEditModal.status === 'Pending' && (
                            <div className="space-y-1 pt-2">
                                <label className="block font-semibold text-slate-700">
                                    Admin Response / Comment (Optional for approval, recommended for rejection):
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Enter any guidance, approval remarks, or rejection grounds..."
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                                />
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setViewEditModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Close
                            </button>

                            {viewEditModal.status === 'Pending' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleRejectEdit(viewEditModal)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer disabled:opacity-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Reject Edit
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleApproveEdit(viewEditModal)}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        <Check className="w-4 h-4" /> Approve & Apply to MongoDB
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: Require confirmation before approving deletion                     */}
            {/* ========================================================================= */}
            {deleteConfirmModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                                Confirm Project Deletion
                            </h3>
                        </div>

                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                            <p className="font-bold">Project: {deleteConfirmModal.projectName}</p>
                            <p className="text-[11px]">
                                This action will <strong>permanently delete</strong> this project document from the MongoDB Project collection, along with its associated progress records and completions.
                            </p>
                        </div>

                        <div className="text-slate-600">
                            <strong>Engineer's Deletion Reason:</strong>
                            <p className="mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                "{deleteConfirmModal.reason}"
                            </p>
                        </div>

                        <p className="text-slate-500 text-[11px]">
                            The deletion request itself will remain in the database marked as <strong>APPROVED</strong> for auditability.
                        </p>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmApproveDelete}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {actionLoading ? 'Deleting...' : 'Yes, Delete Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: Reject Deletion Request                                            */}
            {/* ========================================================================= */}
            {rejectDeleteModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <form onSubmit={handleConfirmRejectDelete} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2 text-rose-600">
                                <XCircle className="w-5 h-5" /> Reject Deletion Request
                            </h3>
                            <button type="button" onClick={() => setRejectDeleteModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-slate-600">
                            You are rejecting the deletion request for <strong>{rejectDeleteModal.projectName}</strong>. The project will remain active in all dashboards.
                        </p>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Optional Admin Response / Rejection Reason:</label>
                            <textarea
                                rows="3"
                                placeholder="Explain why deletion was denied..."
                                value={rejectDeleteReason}
                                onChange={(e) => setRejectDeleteReason(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRejectDeleteModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-colors"
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
