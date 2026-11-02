import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, FolderKanban, Search, Plus, Trash2, X, AlertTriangle, Award, Clock, Camera } from 'lucide-react';
import { getProjects, requestProjectEdit, requestProjectDeletion } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyForm = {
    projectName: '',
    village: '',
    district: '',
    roadLength: '',
    allocatedBudget: '',
    expectedCompletion: '',
    description: '',
    reason: ''
};

export default function EngineerProjects() {
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    // Deletion request state
    const [deletionProject, setDeletionProject] = useState(null);
    const [deletionReason, setDeletionReason] = useState('');
    const [requestingDeletion, setRequestingDeletion] = useState(false);

    const loadProjects = async () => {
        const response = await getProjects();
        setProjects(response.data);
    };

    useEffect(() => {
        loadProjects().catch(() => {
            setMessage('Unable to load assigned projects.');
            setMessageType('error');
        }).finally(() => setLoading(false));
    }, []);

    const openEditRequestModal = (project) => {
        setSelectedProject(project);
        setForm({
            projectName: project.projectName || '',
            village: project.village || '',
            district: project.district || '',
            roadLength: project.roadLength || '',
            allocatedBudget: project.allocatedBudget || '',
            expectedCompletion: project.expectedCompletion ? project.expectedCompletion.split('T')[0] : '',
            description: project.description || '',
            reason: ''
        });
        setMessage('');
    };

    const handleRequestEdit = async (event) => {
        event.preventDefault();
        if (!selectedProject) return;
        if (!form.reason.trim()) {
            setMessage('A reason for the requested changes is required.');
            setMessageType('error');
            return;
        }

        try {
            setSaving(true);
            const requestedChanges = {
                projectName: form.projectName.trim(),
                village: form.village.trim(),
                district: form.district.trim(),
                description: form.description.trim()
            };

            if (form.roadLength !== '') requestedChanges.roadLength = Number(form.roadLength);
            if (form.allocatedBudget !== '') requestedChanges.allocatedBudget = Number(form.allocatedBudget);
            if (form.expectedCompletion) requestedChanges.expectedCompletion = form.expectedCompletion;

            await requestProjectEdit(selectedProject._id, {
                requestedChanges,
                reason: form.reason.trim()
            });

            setSelectedProject(null);
            setMessage(`Edit request for project ${selectedProject.projectId} submitted successfully to Administrator (Status: PENDING).`);
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to submit edit request.');
            setMessageType('error');
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
            setMessage(`Deletion request submitted to Administrator for project ${deletionProject.projectId} (Status: PENDING).`);
            setMessageType('success');
            setDeletionProject(null);
            setDeletionReason('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to submit deletion request.');
            setMessageType('error');
        } finally {
            setRequestingDeletion(false);
        }
    };

    const filteredProjects = projects.filter((project) =>
        `${project.projectId} ${project.projectName} ${project.village} ${project.district}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <LoadingSpinner text="Loading assigned project management records..." />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-amber-600" />
                        Rural Road Construction Projects
                    </h1>
                    <p className="text-xs text-slate-500">
                        View all department projects. Create projects directly or propose edits and deletions via administrative approval workflow.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/engineer/deletion-requests"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> My Change Requests
                    </Link>
                    <Link
                        to="/engineer/projects/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create New Project
                    </Link>
                </div>
            </div>

            {message && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    messageType === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                    <span>{message}</span>
                    <button onClick={() => setMessage('')} className="text-xs font-bold hover:underline cursor-pointer">✕</button>
                </div>
            )}

            <div className="custom-card p-4 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search assigned projects by ID, name, village, or district..."
                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {filteredProjects.map((project) => (
                    <article key={project._id} className="custom-card p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {project.projectId}
                            </span>
                            <StatusBadge status={project.status} />
                        </div>
                        <h2 className="font-bold text-slate-900 text-base">{project.projectName}</h2>
                        <p className="text-xs text-slate-500">{project.village}, {project.district} ({project.roadLength} km)</p>
                        <ProgressBar progress={project.currentProgress} showDetails={false} />
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Current Progress</span>
                            <strong className="text-emerald-700">{project.currentProgress}%</strong>
                        </div>

                        {project.completion?.completionPercentage === 100 && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                                <div className="flex items-center justify-between font-bold text-emerald-800">
                                    <span className="flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-emerald-600" /> 100% Work Completed
                                    </span>
                                    <span className="text-[10px] text-emerald-600 font-normal">
                                        {project.completion.completionDate ? new Date(project.completion.completionDate).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                {project.completion.completionDescription && (
                                    <p className="text-slate-600 text-[11px] line-clamp-1">{project.completion.completionDescription}</p>
                                )}
                                {project.completion.completionImage && (
                                    <div className="pt-1">
                                        <img
                                            src={project.completion.completionImage}
                                            alt="Completion evidence"
                                            className="w-full h-24 object-cover rounded-lg border border-emerald-100"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Latest Site Progress Photo (when in progress) */}
                        {project.completion?.completionPercentage !== 100 && (project.latestProgressPhoto || project.latestProgressUpdate?.photoUrl) && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                                <div className="flex items-center justify-between font-bold text-blue-900">
                                    <span className="flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5 text-blue-600" /> Latest Site Progress Photo
                                    </span>
                                    {project.latestProgressUpdate?.updatedAt && (
                                        <span className="text-[10px] text-blue-600 font-normal">
                                            {new Date(project.latestProgressUpdate.updatedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <img
                                    src={project.latestProgressPhoto || project.latestProgressUpdate?.photoUrl}
                                    alt="Latest progress photo"
                                    className="w-full h-24 object-cover rounded-lg border border-blue-100"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {project.latestProgressUpdate?.workDescription && (
                                    <p className="text-slate-600 text-[11px] line-clamp-1 italic">
                                        "{project.latestProgressUpdate.workDescription}"
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Engineer Permission Actions */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => openEditRequestModal(project)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                                <Edit3 className="w-4 h-4" /> Request Edit
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

            {/* Request Edit Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={handleRequestEdit} className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-amber-700">
                                <Edit3 className="w-5 h-5 shrink-0" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Request Changes for {selectedProject.projectId}
                                </h2>
                            </div>
                            <button type="button" onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                            <p className="font-bold">Engineer Project Change Request Workflow</p>
                            <p className="text-[11px] text-amber-800">
                                As an Engineer, proposed changes are submitted to the Administrator for approval with initial status <strong>PENDING</strong>. The changes take effect once approved.
                            </p>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                            <input
                                required
                                value={form.projectName}
                                onChange={(event) => setForm({ ...form, projectName: event.target.value })}
                                placeholder="Project name"
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Village *</label>
                                <input
                                    required
                                    value={form.village}
                                    onChange={(event) => setForm({ ...form, village: event.target.value })}
                                    placeholder="Village"
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">District *</label>
                                <input
                                    required
                                    value={form.district}
                                    onChange={(event) => setForm({ ...form, district: event.target.value })}
                                    placeholder="District"
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
                                    value={form.roadLength}
                                    onChange={(event) => setForm({ ...form, roadLength: event.target.value })}
                                    placeholder="e.g. 8.5"
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Allocated Budget (₹)</label>
                                <input
                                    type="number"
                                    value={form.allocatedBudget}
                                    onChange={(event) => setForm({ ...form, allocatedBudget: event.target.value })}
                                    placeholder="e.g. 5000000"
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Expected Completion Date</label>
                            <input
                                type="date"
                                value={form.expectedCompletion}
                                onChange={(event) => setForm({ ...form, expectedCompletion: event.target.value })}
                                className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Description / Scope</label>
                            <textarea
                                rows="3"
                                value={form.description}
                                onChange={(event) => setForm({ ...form, description: event.target.value })}
                                placeholder="Project description"
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
                                value={form.reason}
                                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                                placeholder="Explain why these changes are needed (e.g. alignment corrected by survey, revised budget sanctioned by PWD)..."
                                className="w-full border border-amber-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/40"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedProject(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !form.reason.trim()}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {saving ? 'Submitting...' : 'Submit Edit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Deletion Request Modal */}
            {deletionProject && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={handleRequestDeletion} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button type="button" onClick={() => setDeletionProject(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={requestingDeletion || !deletionReason.trim()}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {requestingDeletion ? 'Submitting...' : 'Submit Deletion Request'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
