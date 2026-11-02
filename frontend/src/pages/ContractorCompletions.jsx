import React, { useEffect, useState } from 'react';
import { Award, MapPin, Calendar, CheckCircle, Image as ImageIcon, Clock, AlertCircle } from 'lucide-react';
import { getProjects } from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

export default function ContractorCompletions() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getProjects()
            .then(res => {
                // Show all projects, those with completion evidence first
                const sorted = [...res.data].sort((a, b) => {
                    const aHas = a.completion?.completionPercentage ? 1 : 0;
                    const bHas = b.completion?.completionPercentage ? 1 : 0;
                    return bHas - aHas;
                });
                setProjects(sorted);
            })
            .catch(() => setError('Unable to load completion records.'))
            .finally(() => setLoading(false));
    }, []);

    const completedProjects = projects.filter(p => p.completion?.completionPercentage);
    const pendingProjects = projects.filter(p => !p.completion?.completionPercentage);

    if (loading) return <LoadingSpinner text="Loading completion records..." />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Completion Updates
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    View completion evidence you've submitted for projects. {completedProjects.length} of {projects.length} project(s) have completion records.
                </p>
            </div>

            {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

            {/* Submitted Completions */}
            {completedProjects.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-700 font-['Space_Grotesk'] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Completion Evidence Submitted ({completedProjects.length})
                    </h2>
                    {completedProjects.map(project => (
                        <div key={project._id} className="custom-card p-5 space-y-4 border-l-4 border-l-emerald-500">
                            {/* Project Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                        {project.projectId}
                                    </span>
                                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                        ✓ Evidence Submitted
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">{project.projectName}</h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                    {project.village}, {project.district}
                                </div>
                            </div>

                            {/* Completion Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                                    <div className="text-emerald-700 font-medium">Completion %</div>
                                    <div className="text-xl font-extrabold text-emerald-800 font-['Space_Grotesk']">
                                        {project.completion.completionPercentage}%
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                                        <Calendar className="w-3.5 h-3.5" /> Completion Date
                                    </div>
                                    <div className="font-bold text-slate-800">{formatDate(project.completion.completionDate)}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                                        <Clock className="w-3.5 h-3.5" /> Submitted At
                                    </div>
                                    <div className="font-bold text-slate-800">{formatDate(project.completion.submittedAt)}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-slate-400 font-medium">Photo Evidence</div>
                                    <div className={`font-bold ${project.completion.completionImage ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {project.completion.completionImage ? '✓ Uploaded' : 'Not provided'}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {project.completion.completionDescription && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                    <div className="text-slate-400 font-medium mb-1">Completion Description</div>
                                    <p className="text-slate-700 leading-relaxed">{project.completion.completionDescription}</p>
                                </div>
                            )}

                            {/* Contractor Remarks */}
                            {project.completion.contractorRemarks && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs">
                                    <div className="text-blue-700 font-medium mb-1">Your Remarks</div>
                                    <p className="text-blue-800">{project.completion.contractorRemarks}</p>
                                </div>
                            )}

                            {/* Completion Image */}
                            {project.completion.completionImage && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                                        Completion Photo Evidence
                                    </div>
                                    <img
                                        src={project.completion.completionImage}
                                        alt={`Completion evidence for ${project.projectName}`}
                                        className="w-full max-h-72 object-cover rounded-xl border border-slate-200 shadow-sm"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Projects without completion */}
            {pendingProjects.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-700 font-['Space_Grotesk'] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Awaiting Completion Submission ({pendingProjects.length})
                    </h2>
                    {pendingProjects.map(project => (
                        <div key={project._id} className="custom-card p-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                        {project.projectId}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">{project.projectName}</h3>
                                <p className="text-xs text-slate-400">{project.village}, {project.district} — {project.currentProgress}% progress</p>
                            </div>
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold shrink-0">
                                No Evidence Yet
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {projects.length === 0 && !error && (
                <div className="custom-card p-8 text-center text-slate-400 text-sm italic">
                    No projects are currently assigned to you.
                </div>
            )}
        </div>
    );
}
