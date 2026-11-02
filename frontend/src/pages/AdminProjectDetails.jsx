import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FolderKanban,
    ArrowLeft,
    PlusCircle,
    Save,
    IndianRupee,
    Calendar,
    MapPin,
    HardHat,
    Eye,
    EyeOff,
    Clock,
    ShieldCheck,
    CheckCircle,
    FilePlus,
    TrendingUp,
    Receipt,
    Award,
    Trash2,
    Image as ImageIcon
} from 'lucide-react';
import { getProjectById, updateProject, addProgressUpdate, deleteProject } from '../services/projectService';
import { createExpense, getProjectExpenses } from '../services/expenseService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { states, districtsByState } from '../data/indiaLocations';

export default function AdminProjectDetails() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'progress' | 'expenses' | 'completion' | 'settings'

    // Forms
    const [progressForm, setProgressForm] = useState({
        progress: '',
        amountSpent: '',
        notes: '',
        isPublic: true
    });

    const [expenseForm, setExpenseForm] = useState({
        category: 'Materials',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [editForm, setEditForm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [projRes, expRes] = await Promise.all([
                getProjectById(id),
                getProjectExpenses(id)
            ]);
            setProject(projRes.data);
            setEditForm(projRes.data);
            setExpenses(expRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        if (!progressForm.progress || !progressForm.notes) {
            alert('Please enter progress percentage and milestone notes.');
            return;
        }
        try {
            setSubmitting(true);
            await addProgressUpdate(id, {
                progress: Number(progressForm.progress),
                amountSpent: progressForm.amountSpent ? Number(progressForm.amountSpent) : undefined,
                notes: progressForm.notes,
                isPublic: progressForm.isPublic
            });
            setProgressForm({ progress: '', amountSpent: '', notes: '', isPublic: true });
            loadData();
        } catch (err) {
            alert('Failed to log progress update.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.amount || !expenseForm.description) {
            alert('Please enter expense amount and description.');
            return;
        }
        try {
            setSubmitting(true);
            await createExpense({
                projectId: id,
                category: expenseForm.category,
                amount: Number(expenseForm.amount),
                description: expenseForm.description,
                date: expenseForm.date
            });
            setExpenseForm({ category: 'Materials', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (err) {
            alert('Failed to log project expense.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        if (!editForm?.state) {
            alert('Please select a state.');
            return;
        }
        if (!editForm?.district) {
            alert('Please select a district.');
            return;
        }
        try {
            setSubmitting(true);
            const res = await updateProject(id, editForm);
            setProject(res.data);
            alert('Project settings saved successfully!');
        } catch (err) {
            alert('Failed to save settings.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        try {
            setSubmitting(true);
            await deleteProject(id);
            alert('Project deleted successfully.');
            window.location.href = '/admin/projects';
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete project.');
            setDeleteConfirm(false);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading full administration telemetry for project..." />;
    if (!project) return <div className="p-6 text-slate-500">Project record not found.</div>;

    return (
        <div className="space-y-6">

            {/* Back Link */}
            <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-semibold">
                <ArrowLeft className="w-4 h-4" /> Back to Projects Directory
            </Link>

            {/* Header Info Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                                {project.projectId}
                            </span>
                            <StatusBadge status={project.status} />
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${project.isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                {project.isPublic ? 'Public View Enabled' : 'Private Project'}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk']">
                            {project.projectName}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{project.village}, {project.district}, {project.state}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('progress')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                        >
                            <TrendingUp className="w-3.5 h-3.5" /> + Update Progress
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-sm"
                        >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" /> + Log Expense
                        </button>
                    </div>
                </div>

                {/* Tabs Row */}
                <div className="flex border-b border-slate-200 text-xs font-bold space-x-6 overflow-x-auto">
                    {['overview', 'progress', 'expenses', 'completion', 'settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 capitalize transition-colors cursor-pointer border-b-2 whitespace-nowrap ${activeTab === tab
                                    ? 'border-emerald-600 text-emerald-700 font-extrabold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab === 'overview' && 'Project Overview'}
                            {tab === 'progress' && `Progress Timeline (${project.timeline?.length || 0})`}
                            {tab === 'expenses' && `Expense Registry (${expenses.length})`}
                            {tab === 'completion' && (
                                <span className={project.completion?.completionPercentage ? 'text-emerald-600' : ''}>
                                    Completion Evidence {project.completion?.completionPercentage ? '✓' : ''}
                                </span>
                            )}
                            {tab === 'settings' && 'Governance & Controls'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="custom-card p-6 space-y-4">
                        <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                            Construction Completion Progress
                        </h2>
                        <ProgressBar progress={project.currentProgress} size="lg" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                        <div className="custom-card p-4 space-y-1">
                            <span className="text-slate-400 font-medium">Road Length</span>
                            <div className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{project.roadLength} km</div>
                        </div>
                        <div className="custom-card p-4 space-y-1">
                            <span className="text-slate-400 font-medium">Sanctioned Budget</span>
                            <div className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">{formatCurrency(project.allocatedBudget)}</div>
                        </div>
                        <div className="custom-card p-4 space-y-1">
                            <span className="text-slate-400 font-medium">Total Amount Spent</span>
                            <div className="text-lg font-bold text-emerald-700 font-['Space_Grotesk']">{formatCurrency(project.amountSpent)}</div>
                        </div>
                        <div className="custom-card p-4 space-y-1">
                            <span className="text-slate-400 font-medium">Fund Utilization</span>
                            <div className="text-lg font-extrabold text-blue-600 font-['Space_Grotesk']">{project.fundUtilization}%</div>
                        </div>
                    </div>

                    {/* Latest Progress Photo */}
                    {(project.latestProgressPhoto || project.latestProgressUpdate?.photoUrl) && (
                        <div className="custom-card p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <ImageIcon className="w-4 h-4 text-blue-600" /> Latest Progress Photo
                            </div>
                            <img
                                src={project.latestProgressPhoto || project.latestProgressUpdate?.photoUrl}
                                alt="Latest progress"
                                className="w-full max-h-60 object-cover rounded-xl border border-slate-200 shadow-sm"
                            />
                            {project.latestProgressUpdate?.workDescription && (
                                <p className="text-xs text-slate-600 italic">{project.latestProgressUpdate.workDescription}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Progress Updates Form & History */}
            {activeTab === 'progress' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Form */}
                    <div className="lg:col-span-5 custom-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" /> Log Progress Milestone
                        </h3>

                        <form onSubmit={handleUpdateProgress} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Current Progress (%) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    placeholder="e.g. 75"
                                    value={progressForm.progress}
                                    onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Updated Amount Spent (Optional ₹)</label>
                                <input
                                    type="number"
                                    placeholder="Leave empty to keep current total"
                                    value={progressForm.amountSpent}
                                    onChange={(e) => setProgressForm({ ...progressForm, amountSpent: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Milestone Description & Work Notes *</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="e.g. Sub-base macadam course completed from km 3+000 to 6+500."
                                    value={progressForm.notes}
                                    onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                                <span className="font-semibold text-emerald-900">Make Update Publicly Visible</span>
                                <input
                                    type="checkbox"
                                    checked={progressForm.isPublic}
                                    onChange={(e) => setProgressForm({ ...progressForm, isPublic: e.target.checked })}
                                    className="w-4 h-4 accent-emerald-600"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                            >
                                Submit Milestone Record
                            </button>
                        </form>
                    </div>

                    {/* History */}
                    <div className="lg:col-span-7 custom-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                            Recorded Milestones History
                        </h3>

                        {project.timeline && project.timeline.length > 0 ? (
                            <div className="space-y-3">
                                {project.timeline.map((u, i) => (
                                    <div key={u._id || i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-emerald-800 font-bold">Progress: {u.progress || u.progressPercentage}%</span>
                                            <span className="text-[11px] text-slate-400">{formatDate(u.createdAt)}</span>
                                        </div>
                                        <p className="text-slate-700">{u.workDescription || u.notes}</p>
                                        {(u.contractorName || u.updatedBy?.name) && (
                                            <p className="text-[10px] text-slate-400">By: {u.contractorName || u.updatedBy?.name}</p>
                                        )}
                                        {(u.photoUrl || u.progressPhoto) && (
                                            <img
                                                src={u.photoUrl || u.progressPhoto}
                                                alt={`Progress photo at ${u.progress || u.progressPercentage}%`}
                                                className="w-full max-h-40 object-cover rounded-xl border border-slate-200 mt-1"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No progress milestones recorded yet.</p>
                        )}
                    </div>

                </div>
            )}

            {/* Tab 3: Expenses Registry */}
            {activeTab === 'expenses' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Form */}
                    <div className="lg:col-span-5 custom-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-600" /> Log Project Expenditure
                        </h3>

                        <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Expense Category *</label>
                                <select
                                    value={expenseForm.category}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                                >
                                    <option value="Materials">Materials (Aggregate, Bitumen, Steel, Cement)</option>
                                    <option value="Labour">Labour & Supervisory Wages</option>
                                    <option value="Equipment">Equipment Hire & Fuel</option>
                                    <option value="Transportation">Transportation & Haulage</option>
                                    <option value="Miscellaneous">Miscellaneous Site Expenses</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Amount (₹ INR) *</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="e.g. 450000"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Description / Bill Memo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Purchase of 500 bitumen drums for tar laying"
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Expense Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                            >
                                Save Expense Record
                            </button>
                        </form>
                    </div>

                    {/* Expenses Table */}
                    <div className="lg:col-span-7 custom-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                            Logged Expenses Breakdown
                        </h3>

                        {expenses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                                            <th className="pb-2">Category</th>
                                            <th className="pb-2">Description</th>
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2 text-right">Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expenses.map(exp => (
                                            <tr key={exp._id}>
                                                <td className="py-2.5 font-bold text-slate-800">{exp.category}</td>
                                                <td className="py-2.5 text-slate-600">{exp.description}</td>
                                                <td className="py-2.5 text-slate-400">{formatDate(exp.date)}</td>
                                                <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                                                    {formatCurrency(exp.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No project expenses logged yet.</p>
                        )}
                    </div>

                </div>
            )}

            {/* Tab 4: Completion Evidence */}
            {activeTab === 'completion' && (
                <div className="custom-card p-6 space-y-6">
                    <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        Contractor Completion Evidence
                    </h3>

                    {!project.completion?.completionPercentage ? (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-500">No completion evidence has been submitted yet.</p>
                            <p className="text-xs text-slate-400 mt-1">The assigned contractor must submit completion evidence through their Contractor Dashboard.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Completion Status Banner */}
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                                <div>
                                    <div className="text-base font-extrabold text-emerald-900 font-['Space_Grotesk']">
                                        {project.completion.completionPercentage === 100 ? 'PROJECT COMPLETED' : `${project.completion.completionPercentage}% PROGRESS RECORDED`}
                                    </div>
                                    <div className="text-xs text-emerald-700">Completion evidence submitted by contractor</div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="text-slate-400 font-medium">Completion %</div>
                                    <div className="text-xl font-extrabold text-emerald-700 font-['Space_Grotesk']">{project.completion.completionPercentage}%</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex items-center gap-1 text-slate-400 font-medium"><Calendar className="w-3.5 h-3.5" /> Completion Date</div>
                                    <div className="font-bold text-slate-800">{formatDate(project.completion.completionDate)}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex items-center gap-1 text-slate-400 font-medium"><Clock className="w-3.5 h-3.5" /> Submitted At</div>
                                    <div className="font-bold text-slate-800">{formatDate(project.completion.submittedAt)}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="text-slate-400 font-medium">Photo Evidence</div>
                                    <div className={`font-bold ${project.completion.completionImage ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {project.completion.completionImage ? '✓ Uploaded' : 'Not provided'}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {project.completion.completionDescription && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                    <div className="font-semibold text-slate-700">Completion Description</div>
                                    <p className="text-slate-700 leading-relaxed">{project.completion.completionDescription}</p>
                                </div>
                            )}

                            {/* Contractor Remarks */}
                            {project.completion.contractorRemarks && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs space-y-1">
                                    <div className="font-semibold text-blue-700">Contractor Remarks</div>
                                    <p className="text-blue-800 leading-relaxed">{project.completion.contractorRemarks}</p>
                                </div>
                            )}

                            {/* Completion Image */}
                            {project.completion.completionImage && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                                        Completion Photo Evidence
                                    </div>
                                    <img
                                        src={project.completion.completionImage}
                                        alt={`Completion evidence for ${project.projectName}`}
                                        className="w-full max-h-80 object-cover rounded-xl border border-slate-200 shadow-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 5: Governance Settings */}
            {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="custom-card p-6 space-y-6 text-xs max-w-2xl">
                    <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] border-b border-slate-100 pb-2">
                        Public Dashboard Visibility Controls
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">State *</label>
                                <select
                                    required
                                    value={editForm?.state || ''}
                                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value, district: '' })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                                >
                                    <option value="">Select State</option>
                                    {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">District *</label>
                                <select
                                    required
                                    value={editForm?.district || ''}
                                    disabled={!editForm?.state}
                                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none disabled:opacity-50"
                                >
                                    <option value="">Select District</option>
                                    {(districtsByState[editForm?.state] || []).map((district) => <option key={district} value={district}>{district}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <span className="font-bold text-slate-900 block">Show Project on Public Portal</span>
                                <span className="text-slate-500 text-[11px]">When disabled, citizens cannot see this project.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={editForm?.isPublic || false}
                                onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                                className="w-5 h-5 accent-emerald-600 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <span className="font-bold text-slate-900 block">Show Contractor Name to Public</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={editForm?.showContractor || false}
                                onChange={(e) => setEditForm({ ...editForm, showContractor: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <span className="font-bold text-slate-900 block">Show Financial Data to Public</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={editForm?.showFinancialData || false}
                                onChange={(e) => setEditForm({ ...editForm, showFinancialData: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> Save Governance Controls
                    </button>
                </form>
            )}

            {/* Admin: Danger Zone – Delete Project */}
            <div className="custom-card p-5 border-rose-200 bg-rose-50/50 space-y-3">
                <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-xs text-rose-700">Permanently delete this project and all related data. This action cannot be undone.</p>
                {deleteConfirm ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-rose-800">Are you absolutely sure?</span>
                        <button
                            onClick={handleDeleteProject}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer hover:bg-rose-700 disabled:opacity-50"
                        >
                            {submitting ? 'Deleting...' : 'Yes, Delete Project'}
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(false)}
                            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold text-xs cursor-pointer hover:bg-rose-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete This Project
                    </button>
                )}
            </div>

        </div>
    );
}
