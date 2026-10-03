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
    FileCheck,
    Trash2
} from 'lucide-react';
import { getProjects, addProgressUpdate } from '../services/projectService';
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
    const [modalType, setModalType] = useState(null); // 'progress' | 'expense' | null

    // Forms
    const [progressForm, setProgressForm] = useState({ progress: '', status: 'IN_PROGRESS', notes: '', isPublic: true });
    const [expenseForm, setExpenseForm] = useState({ category: 'Materials', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    const [submitting, setSubmitting] = useState(false);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const res = await getProjects();
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
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
            loadProjects();
            alert('Progress update logged successfully!');
        } catch (err) {
            alert('Failed to log progress update.');
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
            loadProjects();
            alert('Project expense recorded successfully!');
        } catch (err) {
            alert('Failed to log expense.');
        } finally {
            setSubmitting(false);
        }
    };

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
                        Telemetry portal for Assistant Engineer <strong>{user?.name}</strong> to log site updates and expenditure.
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
                        <Trash2 className="w-4 h-4 text-amber-600" /> Deletion Requests
                    </Link>
                </div>
            </div>

            {/* Projects List */}
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

                        {/* Action Buttons for Engineer */}
                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setSelectedProject(p); setModalType('progress'); setProgressForm({ progress: p.currentProgress, status: p.status === 'ON_TRACK' ? 'IN_PROGRESS' : p.status, notes: '', isPublic: true }); }}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                            >
                                <TrendingUp className="w-3.5 h-3.5" /> Log Progress
                            </button>

                            <button
                                onClick={() => { setSelectedProject(p); setModalType('expense'); }}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                            >
                                <Receipt className="w-3.5 h-3.5 text-amber-400" /> Log Expense
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                                >
                                    Save Milestone
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
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
