import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, MapPin, Upload, Award, CheckCircle, X } from 'lucide-react';
import { addProgressUpdate, getProjects, submitProjectCompletion, uploadImage } from '../services/projectService';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

export default function ContractorDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [modalType, setModalType] = useState(null); // 'progress' | 'completion'
    const [progress, setProgress] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // Completion form state
    const [completionForm, setCompletionForm] = useState({
        completionPercentage: '100',
        completionDate: new Date().toISOString().split('T')[0],
        completionDescription: '',
        completionImage: '',
        contractorRemarks: ''
    });
    const [imageUploading, setImageUploading] = useState(false);

    const loadProjects = async () => {
        const response = await getProjects();
        setProjects(response.data);
    };

    useEffect(() => {
        loadProjects().catch(() => setMessage('Unable to load projects.')).finally(() => setLoading(false));
    }, []);

    const openModal = (project, type) => {
        setSelectedProject(project);
        setModalType(type);
        setProgress(String(project.currentProgress));
        setNotes('');
        setMessage('');
        setCompletionForm({
            completionPercentage: '100',
            completionDate: new Date().toISOString().split('T')[0],
            completionDescription: '',
            completionImage: '',
            contractorRemarks: ''
        });
    };

    const closeModal = () => {
        setSelectedProject(null);
        setModalType(null);
    };

    const submitProgress = async (event) => {
        event.preventDefault();
        if (!selectedProject || !progress || !notes) return;
        try {
            setSubmitting(true);
            await addProgressUpdate(selectedProject._id, {
                progress: Number(progress),
                notes,
                isPublic: true
            });
            await loadProjects();
            closeModal();
            setMessage('Work progress uploaded successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Progress upload failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setImageUploading(true);
            const res = await uploadImage(file);
            setCompletionForm(prev => ({ ...prev, completionImage: res.data?.url || res.url || '' }));
        } catch (err) {
            setMessage('Image upload failed. Please try again.');
        } finally {
            setImageUploading(false);
        }
    };

    const submitCompletion = async (event) => {
        event.preventDefault();
        if (!selectedProject) return;
        const perc = Number(completionForm.completionPercentage);
        if (perc === 100 && !completionForm.completionImage) {
            setMessage('A completion image is required when submitting 100% completion.');
            return;
        }
        try {
            setSubmitting(true);
            await submitProjectCompletion(selectedProject._id, {
                ...completionForm,
                completionPercentage: perc
            });
            await loadProjects();
            closeModal();
            setMessage(`Completion evidence submitted for project ${selectedProject.projectId}.`);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Completion submission failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading contractor project information..." />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                    <BriefcaseBusiness className="w-5 h-5 text-blue-600" />
                    Contractor Project Dashboard
                </h1>
                <p className="text-xs text-slate-500">
                    Upload verified work progress or submit completion evidence for {user?.name}. Financial administration remains restricted.
                </p>
            </div>

            {message && <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                    <article key={project._id} className="custom-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-2.5 py-1 rounded border border-blue-200">
                                {project.projectId}
                            </span>
                            <StatusBadge status={project.status} />
                        </div>
                        <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">{project.projectName}</h2>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            {project.village}, {project.district} ({project.roadLength} km)
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-600 font-medium">
                                <span>Progress</span>
                                <strong className="text-emerald-700">{project.currentProgress}%</strong>
                            </div>
                            <ProgressBar progress={project.currentProgress} showDetails={false} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                            <div>
                                <span className="text-slate-400 text-[10px] block">Allocated</span>
                                <span className="font-bold text-slate-800">{formatCurrency(project.allocatedBudget)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block">Spent</span>
                                <span className="font-bold text-emerald-700">{formatCurrency(project.amountSpent)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openModal(project, 'progress')}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                                <Upload className="w-4 h-4" /> Update Progress
                            </button>
                            {project.currentProgress < 100 && (
                                <button
                                    onClick={() => openModal(project, 'completion')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <Award className="w-4 h-4" /> Submit Completion
                                </button>
                            )}
                            {project.currentProgress >= 100 && (
                                <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                    <CheckCircle className="w-4 h-4" /> Completed
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            {/* Progress Modal */}
            {selectedProject && modalType === 'progress' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={submitProgress} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">Upload Progress: {selectedProject.projectId}</h2>
                            <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Current progress (%)</label>
                            <input type="number" min="0" max="100" required value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3" />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Work notes</label>
                            <textarea required rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe completed work, materials, and site conditions" className="w-full border border-slate-200 rounded-xl p-3" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 cursor-pointer">{submitting ? 'Uploading...' : 'Submit Progress'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Completion Modal */}
            {selectedProject && modalType === 'completion' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
                    <form onSubmit={submitCompletion} className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Submit Completion Evidence</h2>
                                <p className="text-slate-500 text-[11px]">Project: {selectedProject.projectId} — {selectedProject.projectName}</p>
                            </div>
                            <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Completion % <span className="text-rose-500">*</span></label>
                                <input type="number" min="0" max="100" required value={completionForm.completionPercentage} onChange={(e) => setCompletionForm(f => ({ ...f, completionPercentage: e.target.value }))} className="w-full border border-slate-200 rounded-xl p-3" />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Completion Date <span className="text-rose-500">*</span></label>
                                <input type="date" required value={completionForm.completionDate} onChange={(e) => setCompletionForm(f => ({ ...f, completionDate: e.target.value }))} className="w-full border border-slate-200 rounded-xl p-3" />
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Work Description <span className="text-rose-500">*</span></label>
                            <textarea required rows="3" value={completionForm.completionDescription} onChange={(e) => setCompletionForm(f => ({ ...f, completionDescription: e.target.value }))} placeholder="Describe the completed work in detail..." className="w-full border border-slate-200 rounded-xl p-3" />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                                Completion Image {Number(completionForm.completionPercentage) === 100 && <span className="text-rose-500">* (Required for 100%)</span>}
                            </label>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border border-slate-200 rounded-xl p-2" />
                            {imageUploading && <p className="text-blue-600 text-[10px] mt-1">Uploading image...</p>}
                            {completionForm.completionImage && <p className="text-emerald-600 text-[10px] mt-1">✓ Image uploaded</p>}
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Contractor Remarks</label>
                            <textarea rows="2" value={completionForm.contractorRemarks} onChange={(e) => setCompletionForm(f => ({ ...f, contractorRemarks: e.target.value }))} placeholder="Any additional remarks..." className="w-full border border-slate-200 rounded-xl p-3" />
                        </div>
                        {message && <p className="text-rose-600 text-[11px] font-medium">{message}</p>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                            <button type="submit" disabled={submitting || imageUploading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50 cursor-pointer">{submitting ? 'Submitting...' : 'Submit Completion'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

