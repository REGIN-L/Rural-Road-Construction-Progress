import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HardHat,
    TrendingUp,
    Receipt,
    MapPin,
    Calendar,
    IndianRupee,
    PlusCircle,
    Trash2,
    Award,
    Edit3,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Filter,
    Camera
} from 'lucide-react';
import {
    getProjects,
    addProgressUpdate,
    requestProjectEdit,
    requestProjectDeletion,
    getEditRequests,
    getDeletionRequests
} from '../services/projectService';
import { createExpense } from '../services/expenseService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

export default function EngineerDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedProject, setSelectedProject] = useState(null);
    const [modalType, setModalType] = useState(null); // 'progress' | 'expense' | 'request-edit' | 'request-delete' | null

    // Forms
    const [progressForm, setProgressForm] = useState({ progress: '', status: 'IN_PROGRESS', notes: '', isPublic: true });
    const [expenseForm, setExpenseForm] = useState({ category: 'Materials', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    const [editForm, setEditForm] = useState({ projectName: '', village: '', district: '', roadLength: '', allocatedBudget: '', expectedCompletion: '', description: '', reason: '' });
    const [deletionReason, setDeletionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);

    // Change Requests State
    const [editRequests, setEditRequests] = useState([]);
    const [deletionRequests, setDeletionRequests] = useState([]);
    const [requestTab, setRequestTab] = useState('all'); // 'all' | 'edit' | 'deletion'
    const [requestFilter, setRequestFilter] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Rejected'

    const loadProjectsAndRequests = async () => {
        try {
            setLoading(true);
            const [projRes, editRes, delRes] = await Promise.all([
                getProjects(),
                getEditRequests().catch(() => ({ data: [] })),
                getDeletionRequests().catch(() => ({ data: [] }))
            ]);
            setProjects(projRes.data || []);
            setEditRequests(editRes.data || []);
            setDeletionRequests(delRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjectsAndRequests();
    }, []);

    const handleUpdateProgressSubmit = async (e) => {
        e.preventDefault();
        if (!progressForm.progress || !progressForm.notes) return;
        try {
            setSubmitting(true);
            await addProgressUpdate(selectedProject._id, {
                progress: Number(progressForm.progress),
                status: progressForm.status,
                notes: progressForm.notes,
                isPublic: progressForm.isPublic
            });
            setModalType(null);
            setProgressForm({ progress: '', status: 'IN_PROGRESS', notes: '', isPublic: true });
            loadProjectsAndRequests();
            setFeedbackMsg({ type: 'success', text: 'Progress update logged successfully!' });
        } catch (err) {
            setFeedbackMsg({ type: 'error', text: 'Failed to log progress update.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        if (!expenseForm.amount || !expenseForm.description) return;
        try {
            setSubmitting(true);
            await createExpense({
                projectId: selectedProject._id,
                category: expenseForm.category,
                amount: Number(expenseForm.amount),
                description: expenseForm.description,
                date: expenseForm.date
            });
            setModalType(null);
            setExpenseForm({ category: 'Materials', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            loadProjectsAndRequests();
            setFeedbackMsg({ type: 'success', text: 'Project expense recorded successfully!' });
        } catch (err) {
            setFeedbackMsg({ type: 'error', text: 'Failed to log expense.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.reason.trim()) {
            setFeedbackMsg({ type: 'error', text: 'Please specify the reason for the requested changes.' });
            return;
        }

        try {
            setSubmitting(true);
            const requestedChanges = {
                projectName: editForm.projectName.trim(),
                village: editForm.village.trim(),
                district: editForm.district.trim(),
                description: editForm.description.trim()
            };
            if (editForm.roadLength !== '') requestedChanges.roadLength = Number(editForm.roadLength);
            if (editForm.allocatedBudget !== '') requestedChanges.allocatedBudget = Number(editForm.allocatedBudget);
            if (editForm.expectedCompletion) requestedChanges.expectedCompletion = editForm.expectedCompletion;

            await requestProjectEdit(selectedProject._id, {
                requestedChanges,
                reason: editForm.reason.trim()
            });

            setModalType(null);
            setEditForm({ projectName: '', village: '', district: '', roadLength: '', allocatedBudget: '', expectedCompletion: '', description: '', reason: '' });
            loadProjectsAndRequests();
            setFeedbackMsg({
                type: 'success',
                text: `Edit request for ${selectedProject.projectId} submitted to Administrator (Status: PENDING).`
            });
        } catch (err) {
            setFeedbackMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to submit edit request.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestDeletionSubmit = async (e) => {
        e.preventDefault();
        if (!deletionReason.trim()) return;

        try {
            setSubmitting(true);
            await requestProjectDeletion(selectedProject._id, deletionReason.trim());
            setModalType(null);
            setDeletionReason('');
            loadProjectsAndRequests();
            setFeedbackMsg({
                type: 'success',
                text: `Deletion request for project ${selectedProject.projectId} submitted to Administrator (Status: PENDING).`
            });
        } catch (err) {
            setFeedbackMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to submit deletion request.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (p) => {
        setSelectedProject(p);
        setEditForm({
            projectName: p.projectName || '',
            village: p.village || '',
            district: p.district || '',
            roadLength: p.roadLength || '',
            allocatedBudget: p.allocatedBudget || '',
            expectedCompletion: p.expectedCompletion ? p.expectedCompletion.split('T')[0] : '',
            description: p.description || '',
            reason: ''
        });
        setModalType('request-edit');
    };

    const openDeleteModal = (p) => {
        setSelectedProject(p);
        setDeletionReason('');
        setModalType('request-delete');
    };

    // Filtered change requests for status area
    const filteredEditRequests = editRequests.filter(r => requestFilter === 'All' || r.status === requestFilter);
    const filteredDelRequests = deletionRequests.filter(r => requestFilter === 'All' || r.status === requestFilter);

    if (loading) return <LoadingSpinner text="Fetching assigned engineering telemetry from server..." />;

    return (
        <div className="space-y-6">

            {/* Banner Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-amber-600" />
                        Field Engineer Progress &amp; Expense Portal
                    </h1>
                    <p className="text-xs text-slate-500">
                        Telemetry portal for Assistant Engineer <strong>{user?.name}</strong> to log site updates, expenditures, and manage change requests.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/engineer/projects/create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                        <PlusCircle className="w-4 h-4" /> Create Project
                    </Link>
                    <Link
                        to="/engineer/deletion-requests"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                        <Clock className="w-4 h-4 text-amber-600" /> Change Requests
                    </Link>
                </div>
            </div>

            {/* Notification message */}
            {feedbackMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                    <span>{feedbackMsg.text}</span>
                    <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold hover:underline cursor-pointer">✕</button>
                </div>
            )}

            {/* Projects Section Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                        Assigned Road Projects ({projects.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                        Log progress, record site expenditures, or request project modifications.
                    </p>
                </div>
            </div>

            {/* Projects List with 4 actions: [Log Progress], [Log Expense], [Request Edit], [Request Deletion] */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((p) => (
                    <div key={p._id} className="custom-card p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded border border-amber-200">
                                    {p.projectId}
                                </span>
                                <StatusBadge status={p.status} />
                            </div>

                            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                                {p.projectName}
                            </h3>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                <span>{p.village}, {p.district} ({p.roadLength} km)</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-600 font-medium">
                                <span>Progress</span>
                                <span className="font-bold text-emerald-700">{p.currentProgress}%</span>
                            </div>
                            <ProgressBar progress={p.currentProgress} showDetails={false} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                            <div>
                                <span className="text-slate-400 text-[10px] block">Allocated</span>
                                <span className="font-bold text-slate-800">{formatCurrency(p.allocatedBudget)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block">Spent</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(p.amountSpent)}</span>
                            </div>
                        </div>

                        {/* Completion Evidence (if submitted) */}
                        {p.completion?.completionPercentage && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5" /> Completion Evidence
                                    </span>
                                    <span className="font-extrabold text-emerald-700">{p.completion.completionPercentage}%</span>
                                </div>
                                {p.completion.completionDate && (
                                    <p className="text-emerald-700 text-[11px]">
                                        Completed: <strong>{formatDate(p.completion.completionDate)}</strong>
                                    </p>
                                )}
                                {p.completion.completionDescription && (
                                    <p className="text-slate-600 text-[11px] line-clamp-2">{p.completion.completionDescription}</p>
                                )}
                                {p.completion.completionImage && (
                                    <img
                                        src={p.completion.completionImage}
                                        alt="Completion"
                                        className="w-full h-24 object-cover rounded-lg border border-emerald-200"
                                    />
                                )}
                            </div>
                        )}

                        {/* Latest Site Progress Photo (when in progress) */}
                        {!p.completion?.completionPercentage && (p.latestProgressPhoto || p.latestProgressUpdate?.photoUrl) && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5 text-blue-600" /> Latest Site Photo
                                    </span>
                                    {p.latestProgressUpdate?.updatedAt && (
                                        <span className="text-[10px] text-blue-600">{formatDate(p.latestProgressUpdate.updatedAt)}</span>
                                    )}
                                </div>
                                <img
                                    src={p.latestProgressPhoto || p.latestProgressUpdate?.photoUrl}
                                    alt="Latest Progress"
                                    className="w-full h-24 object-cover rounded-lg border border-blue-200"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {p.latestProgressUpdate?.workDescription && (
                                    <p className="text-slate-600 text-[11px] line-clamp-2 italic">"{p.latestProgressUpdate.workDescription}"</p>
                                )}
                            </div>
                        )}

                        {/* 4 Clear Actions for Engineer */}
                        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold">
                            <button
                                onClick={() => { setSelectedProject(p); setModalType('progress'); setProgressForm({ progress: p.currentProgress, status: p.status === 'ON_TRACK' ? 'IN_PROGRESS' : p.status, notes: '', isPublic: true }); }}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
                            >
                                <TrendingUp className="w-3.5 h-3.5" /> Log Progress
                            </button>

                            <button
                                onClick={() => { setSelectedProject(p); setModalType('expense'); }}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors"
                            >
                                <Receipt className="w-3.5 h-3.5 text-amber-400" /> Log Expense
                            </button>

                            <button
                                onClick={() => openEditModal(p)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition-colors"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Request Edit
                            </button>

                            <button
                                onClick={() => openDeleteModal(p)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Request Deletion
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================================================== */}
            {/* REQUEST STATUS AREA: Pending | Approved | Rejected  */}
            {/* ================================================== */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            My Project Change Requests Status
                        </h2>
                        <p className="text-xs text-slate-500">
                            Auditable workflow tracking for Edit and Deletion requests submitted to Administrator.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Filter Buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setRequestFilter(status)}
                                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                        requestFilter === status ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subtabs for request types */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
                    <button
                        onClick={() => setRequestTab('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            requestTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        All Requests ({filteredEditRequests.length + filteredDelRequests.length})
                    </button>
                    <button
                        onClick={() => setRequestTab('edit')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            requestTab === 'edit' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Requests ({filteredEditRequests.length})
                    </button>
                    <button
                        onClick={() => setRequestTab('deletion')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            requestTab === 'deletion' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Deletion Requests ({filteredDelRequests.length})
                    </button>
                </div>

                {/* Request Cards Grid */}
                <div className="space-y-4">
                    {/* EDIT REQUESTS */}
                    {(requestTab === 'all' || requestTab === 'edit') && filteredEditRequests.map((reqItem) => {
                        const isPending = reqItem.status === 'Pending';
                        const isApproved = reqItem.status === 'Approved';
                        const isRejected = reqItem.status === 'Rejected';

                        return (
                            <div
                                key={reqItem._id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 border-l-4 text-xs"
                                style={{ borderLeftColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444' }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            {reqItem.projectCode || reqItem.projectId?.projectId || 'PROJECT'}
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">
                                            {reqItem.projectName}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold uppercase">
                                            Edit Request
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {formatDate(reqItem.createdAt)}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                            isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {isPending && <Clock className="w-3 h-3" />}
                                            {isApproved && <CheckCircle className="w-3 h-3" />}
                                            {isRejected && <XCircle className="w-3 h-3" />}
                                            {reqItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Requested Changes Details */}
                                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">Requested Field Changes:</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                                        {reqItem.requestedChanges && Object.entries(reqItem.requestedChanges).map(([key, val]) => (
                                            <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <span className="text-slate-400 block font-medium capitalize">{key}:</span>
                                                <strong className="text-slate-800 font-mono">{String(val)}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stated Reason */}
                                <div className="text-[11px] text-slate-600">
                                    <strong>Engineer's Reason:</strong> <span className="italic">"{reqItem.reason}"</span>
                                </div>

                                {/* Admin Decision / Feedback */}
                                {!isPending && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span><strong>Admin Decision:</strong> <strong className={isApproved ? 'text-emerald-700' : 'text-rose-700'}>{reqItem.status}</strong> by {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                            <span><strong>Decision Date:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                        </div>
                                        {reqItem.adminComment && (
                                            <p className="text-slate-700"><strong>Admin Remarks:</strong> "{reqItem.adminComment}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* DELETION REQUESTS */}
                    {(requestTab === 'all' || requestTab === 'deletion') && filteredDelRequests.map((reqItem) => {
                        const isPending = reqItem.status === 'Pending';
                        const isApproved = reqItem.status === 'Approved';
                        const isRejected = reqItem.status === 'Rejected';

                        return (
                            <div
                                key={reqItem._id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 border-l-4 text-xs"
                                style={{ borderLeftColor: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444' }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-sm">
                                            {reqItem.projectName}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold uppercase">
                                            Deletion Request
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {formatDate(reqItem.createdAt)}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                            isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {isPending && <Clock className="w-3 h-3" />}
                                            {isApproved && <CheckCircle className="w-3 h-3" />}
                                            {isRejected && <XCircle className="w-3 h-3" />}
                                            {reqItem.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-slate-200 italic">
                                    <strong>Stated Deletion Reason:</strong> "{reqItem.reason}"
                                </div>

                                {!isPending && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span><strong>Reviewed by:</strong> {reqItem.reviewedBy?.name || 'Administrator'}</span>
                                            <span><strong>Reviewed Date:</strong> {formatDate(reqItem.reviewedAt)}</span>
                                        </div>
                                        {reqItem.adminResponse && (
                                            <p className="text-slate-700"><strong>Admin Comment:</strong> "{reqItem.adminResponse}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredEditRequests.length === 0 && filteredDelRequests.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No project change requests found matching filter "{requestFilter}".
                        </div>
                    )}
                </div>
            </section>

            {/* Progress Modal */}
            {modalType === 'progress' && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="custom-card max-w-md w-full p-6 bg-white space-y-4 text-xs">
                        <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                            Log Progress Update – {selectedProject.projectId}
                        </h3>

                        <form onSubmit={handleUpdateProgressSubmit} className="space-y-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Updated Construction Progress (%) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={progressForm.progress}
                                    onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Project Status *</label>
                                <select
                                    required
                                    value={progressForm.status}
                                    onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
                                >
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DELAYED">Delayed</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Field Milestone Notes *</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Describe recent road compaction, asphalt overlay, or culvert work..."
                                    value={progressForm.notes}
                                    onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <span className="font-semibold text-emerald-900">Make Progress Update Public</span>
                                <input
                                    type="checkbox"
                                    checked={progressForm.isPublic}
                                    onChange={(e) => setProgressForm({ ...progressForm, isPublic: e.target.checked })}
                                    className="w-4 h-4 accent-emerald-600"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Milestone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {modalType === 'expense' && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="custom-card max-w-md w-full p-6 bg-white space-y-4 text-xs">
                        <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                            Record Site Expense – {selectedProject.projectId}
                        </h3>

                        <form onSubmit={handleExpenseSubmit} className="space-y-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                                <select
                                    value={expenseForm.category}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                                >
                                    <option value="Materials">Materials</option>
                                    <option value="Labour">Labour</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Transportation">Transportation</option>
                                    <option value="Miscellaneous">Miscellaneous</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Amount Spent (₹ INR) *</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="e.g. 150000"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Description / Bill Particulars *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Diesel fuel supply for excavator compactor"
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Edit Modal */}
            {modalType === 'request-edit' && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleRequestEditSubmit} className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-amber-600" />
                                Request Edit for {selectedProject.projectId}
                            </h3>
                            <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                            <p className="font-bold">Engineer Change Request Protocol</p>
                            <p className="text-[11px] text-amber-800">
                                Proposed changes will be submitted with status <strong>PENDING</strong> for Administrator review.
                            </p>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                            <input
                                required
                                value={editForm.projectName}
                                onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Village *</label>
                                <input
                                    required
                                    value={editForm.village}
                                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">District *</label>
                                <input
                                    required
                                    value={editForm.district}
                                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Road Length (km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={editForm.roadLength}
                                    onChange={(e) => setEditForm({ ...editForm, roadLength: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Allocated Budget (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.allocatedBudget}
                                    onChange={(e) => setEditForm({ ...editForm, allocatedBudget: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Expected Completion</label>
                            <input
                                type="date"
                                value={editForm.expectedCompletion}
                                onChange={(e) => setEditForm({ ...editForm, expectedCompletion: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Description</label>
                            <textarea
                                rows="3"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-800 mb-1">
                                Reason for Change Request <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows="3"
                                value={editForm.reason}
                                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                placeholder="Explain why these changes are requested..."
                                className="w-full border border-amber-300 rounded-xl p-3 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !editForm.reason.trim()}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Edit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Request Deletion Modal */}
            {modalType === 'request-delete' && selectedProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleRequestDeletionSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="w-5 h-5" /> Request Deletion for {selectedProject.projectId}
                            </h3>
                            <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                            <p className="font-bold">{selectedProject.projectName}</p>
                            <p className="text-[11px] mt-1 text-amber-700">Deletion requests require Administrator approval before any project record is removed.</p>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Deletion Reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows="3"
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Explain why this project should be deleted..."
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !deletionReason.trim()}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Deletion Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}
