import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FolderKanban,
    PlusCircle,
    Eye,
    Edit3,
    Trash2,
    EyeOff,
    Search,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { getProjects, deleteProject, updateProject } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadProjects = async () => {
        try {
            setLoading(true);
            const res = await getProjects();
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to load projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete project "${name}"? This action cannot be undone.`)) {
            try {
                await deleteProject(id);
                setProjects(projects.filter(p => p._id !== id));
            } catch (err) {
                alert('Failed to delete project.');
            }
        }
    };

    const handleTogglePublic = async (p) => {
        try {
            const updated = await updateProject(p._id, { isPublic: !p.isPublic });
            setProjects(projects.map(item => item._id === p._id ? updated.data : item));
        } catch (err) {
            alert('Failed to update public visibility status.');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.projectName.toLowerCase().includes(search.toLowerCase()) ||
        p.projectId.toLowerCase().includes(search.toLowerCase()) ||
        p.village.toLowerCase().includes(search.toLowerCase()) ||
        p.district.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-emerald-600" />
                        Rural Road Projects Management
                    </h1>
                    <p className="text-xs text-slate-500">
                        Create, edit, assign engineers, update financial data, and manage public dashboard visibility.
                    </p>
                </div>

                <Link
                    to="/admin/projects/create"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                    <PlusCircle className="w-4 h-4" /> Create New Project
                </Link>
            </div>

            {/* Search Input Box */}
            <div className="custom-card p-4 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Filter by Project ID, Road Title, Village, or District..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-medium"
                />
            </div>

            {/* Projects Management Table */}
            {loading ? (
                <LoadingSpinner text="Fetching projects table from MongoDB database..." />
            ) : (
                <div className="custom-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="p-3.5">ID</th>
                                    <th className="p-3.5">Project Name & Location</th>
                                    <th className="p-3.5">Length</th>
                                    <th className="p-3.5">Progress</th>
                                    <th className="p-3.5">Allocated / Spent</th>
                                    <th className="p-3.5">Dates</th>
                                    <th className="p-3.5">Status</th>
                                    <th className="p-3.5 text-center">Public Visibility</th>
                                    <th className="p-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredProjects.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 font-mono font-bold text-emerald-800">
                                            {p.projectId}
                                        </td>
                                        <td className="p-3.5 space-y-0.5 max-w-xs">
                                            <Link to={`/admin/projects/${p._id}`} className="font-bold text-slate-900 hover:text-emerald-700 block truncate">
                                                {p.projectName}
                                            </Link>
                                            <span className="text-[11px] text-slate-400 block truncate">
                                                {p.village}, {p.district}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-semibold text-slate-800">
                                            {p.roadLength} km
                                        </td>
                                        <td className="p-3.5 min-w-[120px]">
                                            <ProgressBar progress={p.currentProgress} size="sm" showDetails={false} />
                                            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">{p.currentProgress}%</span>
                                        </td>
                                        <td className="p-3.5 text-slate-800 font-mono">
                                            <div className="font-bold">{formatCurrency(p.allocatedBudget)}</div>
                                            <div className="text-[10px] text-emerald-700">Spent: {formatCurrency(p.amountSpent)}</div>
                                        </td>
                                        <td className="p-3.5 text-slate-500 text-[11px]">
                                            <div>Start: {formatDate(p.startDate)}</div>
                                            <div>End: {formatDate(p.expectedCompletion)}</div>
                                        </td>
                                        <td className="p-3.5">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <button
                                                onClick={() => handleTogglePublic(p)}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors border ${p.isPublic
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {p.isPublic ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                                                {p.isPublic ? 'Public ON' : 'Private OFF'}
                                            </button>
                                        </td>
                                        <td className="p-3.5 text-right space-x-1">
                                            <Link
                                                to={`/admin/projects/${p._id}`}
                                                className="p-1.5 inline-block rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                                title="View Full Admin Telemetry"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(p._id, p.projectName)}
                                                className="p-1.5 inline-block rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                                title="Delete Project"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}
