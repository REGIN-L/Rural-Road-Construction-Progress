import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, FolderKanban, Search, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { getProjects, updateProject, requestProjectDeletion } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyForm = { projectName: '', village: '', district: '', currentProgress: 0, description: '' };

export default function EngineerProjects() {
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Deletion request state
    const [deletionProject, setDeletionProject] = useState(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [requestingDeletion, setRequestingDeletion] = useState(false);

    const loadProjects = async () => {
        const response = await getProjects();
        setProjects(response.data);
    };

    useEffect(() => {
        loadProjects().catch(() => setMessage('Unable to load assigned projects.')).finally(() => setLoading(false));
    }, []);

    const openEditor = (project) => {
        setSelectedProject(project);
        setForm({
            projectName: project.projectName,
            village: project.village,
            district: project.district,
            currentProgress: project.currentProgress,
            description: project.description || ''
        });
        setMessage('');
    };

    const saveChanges = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            const response = await updateProject(selectedProject._id, {
                projectName: form.projectName,
                village: form.village,
                district: form.district,
                currentProgress: Number(form.currentProgress),
                description: form.description
            });
            setProjects(projects.map((project) => project._id === selectedProject._id ? response.data : project));
            setSelectedProject(null);
            setMessage('Project information updated successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Project update failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleRequestDeletion = async (e) => {
        e.preventDefault();
        if (!deletionProject || !deletionReason.trim()) return;
        try {
            setRequestingDeletion(true);
            await requestProjectDeletion(deletionProject._id, deletionReason.trim());
            setMessage(`Deletion request submitted to Administrator for project ${deletionProject.projectId}.`);
            setDeletionProject(null);
            setDeletionReason('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to submit deletion request.');
        } finally {
            setRequestingDeletion(false);
        }
    };

    const filteredProjects = projects.filter((project) => `${project.projectId} ${project.projectName} ${project.village} ${project.district}`.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <LoadingSpinner text="Loading assigned project management records..." />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-amber-600" />
                        Assigned Project Management
                    </h1>
                    <p className="text-xs text-slate-500">
                        Create and update projects assigned to you. Deletion requires administrative approval.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/engineer/projects/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create New Project
                    </Link>
                </div>
            </div>

            {message && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{message}</div>}

            <div className="custom-card p-4 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assigned projects by ID, name, village, or district..." className="w-full bg-transparent text-xs text-slate-900 focus:outline-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {filteredProjects.map((project) => (
                    <article key={project._id} className="custom-card p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{project.projectId}</span>
                            <StatusBadge status={project.status} />
                        </div>
                        <h2 className="font-bold text-slate-900 text-base">{project.projectName}</h2>
                        <p className="text-xs text-slate-500">{project.village}, {project.district} ({project.roadLength} km)</p>
                        <ProgressBar progress={project.currentProgress} showDetails={false} />
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Current Progress</span>
                            <strong className="text-emerald-700">{project.currentProgress}%</strong>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => openEditor(project)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Info
                            </button>
                            <button
                                onClick={() => { setDeletionProject(project); setDeletionReason(''); }}
                                className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Request project deletion"
                            >
                                <Trash2 className="w-4 h-4" /> Request Deletion
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            {/* Edit Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={saveChanges} className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">Edit {selectedProject.projectId}</h2>
                            <button type="button" onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <input required value={form.projectName} onChange={(event) => setForm({ ...form, projectName: event.target.value })} placeholder="Project name" className="w-full border border-slate-200 rounded-xl p-3" />
                        <div className="grid grid-cols-2 gap-3">
                            <input required value={form.village} onChange={(event) => setForm({ ...form, village: event.target.value })} placeholder="Village" className="w-full border border-slate-200 rounded-xl p-3" />
                            <input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="District" className="w-full border border-slate-200 rounded-xl p-3" />
                        </div>
                        <label className="block font-semibold">Current progress (%)
                            <input type="number" min="0" max="100" required value={form.currentProgress} onChange={(event) => setForm({ ...form, currentProgress: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-3" />
                        </label>
                        <textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Project description" className="w-full border border-slate-200 rounded-xl p-3" />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setSelectedProject(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                            <button disabled={saving} className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Deletion Request Modal */}
            {deletionProject && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={handleRequestDeletion} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <h2 className="text-base font-bold text-slate-900">Request Project Deletion</h2>
                            </div>
                            <button type="button" onClick={() => setDeletionProject(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                            <p className="font-bold">Project: {deletionProject.projectId} – {deletionProject.projectName}</p>
                            <p className="text-[11px] mt-1 text-amber-700">Deletion requests must be reviewed and approved by an Administrator before the project is removed.</p>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Reason for Deletion <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows="3"
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Explain why this project should be deleted (e.g. duplicate entry, cancelled by PWD, incorrect data)..."
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setDeletionProject(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={requestingDeletion || !deletionReason.trim()}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {requestingDeletion ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
